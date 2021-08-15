import joplin from 'api';
import { SettingKeys } from './settings';
import { TagInterface, PaginationResult, WordDictionary, NoteInterface } from './types';
import { caseSensitiveKey, formRegex, matchAll, parseWordList } from './utils';


/**
 * Scans current note and adds tags based on user specified keywords.
 */
export async function autoTagCurrentNote() {
  const note: NoteInterface = await joplin.workspace.selectedNote();
  
  if (!note) {
    return;
  }
  
  const listSeparator = await joplin.settings.value(SettingKeys.tagListSeparator);
  const pairSeparator = await joplin.settings.value(SettingKeys.tagPairSeparator);

  // Parse word:tag dictionary for full match words.
  const fullMatchWordsDic: WordDictionary = parseWordList(
    await joplin.settings.value(SettingKeys.fullMatchWords), 
    listSeparator, 
    pairSeparator,
  );

  // Use the dictionary to search for keywords and produce tags-list.
  let tagsToAdd = findTagsToAdd(
    note.body,
    fullMatchWordsDic, 
    await joplin.settings.value(SettingKeys.caseSensitiveFullMatch),
    true,
  );

  // Parse word:tag dictionary for partial match words.
  const partialMatchWordsDic: WordDictionary = parseWordList(
    await joplin.settings.value(SettingKeys.partialMatchWords), 
    listSeparator, 
    pairSeparator,
  );

  // Use the dictionary to search for keywords and produce tags-list.
  tagsToAdd = tagsToAdd.concat(findTagsToAdd(
    note.body,
    partialMatchWordsDic, 
    await joplin.settings.value(SettingKeys.caseSensitivePartialMatch),
    false,
  ));
  
  if (!tagsToAdd.length) {
    return;
  }

  const createMissingTags = await joplin.settings.value(SettingKeys.createMissingTags);
  const tagObjs = await getActualTagObjects(tagsToAdd, createMissingTags);
  
  await setTags(note.id, tagObjs);
}


/**
 * Gets actual tag objects. If any tag is missing, it is created.
 * @param tagsArr List of tags strings.
 * @returns Returns list of real tag objects.
 */
export async function getActualTagObjects(tagsArr: string[], createMissingTags: boolean) {
  const allTags = await getAllTags();
  const newTags = tagsArr.filter((tag) => !!!allTags.find((atag) => tag === atag.title));
  
  if (createMissingTags) {
    for (const tag of newTags) {
      const createdTag = await createTag(tag)
      allTags.push(createdTag);
    }
  }

  return allTags.filter((tagObj) => !!tagsArr.find((tagStr) => tagStr === tagObj.title));
}


/**
 * Scans given body for target words and returns list of tags.
 * 
 * @param body Target text body
 * @param dictionary Word:Tag dictionary
 * @param caseSensitive Case sensitive search
 * @param fullWord Full word search
 * @returns List of tags
 */
export function findTagsToAdd(body: string, dictionary: WordDictionary, caseSensitive: boolean, fullWord: boolean): string[] {
  // Do nothing if we don't have populated dictionary.
  if (!Object.keys(dictionary).length) {
    return [];
  }
  
  let regex = formRegex(dictionary, caseSensitive, fullWord);
  let matchedWords = matchAll(regex, body, caseSensitive);
  let tagsToAdd = [];

  // Add tags
  matchedWords.forEach((word) => {
    word = caseSensitiveKey(dictionary, word, caseSensitive);
    tagsToAdd = tagsToAdd.concat(dictionary[word]);
  });
  
  // Clear empty and duplicate tags
  return [...new Set(tagsToAdd.filter((tag) => !!tag))];
}


/**
 * Returns all tags for given note id.
 * 
 * @param noteId Target note id.
 * @returns List of tags.
 */
export async function getNoteTags(noteId: string): Promise<TagInterface[]> {
  let allTags = [];
  let pageNum = 1;

  while (true) {
    const tagsInfo: PaginationResult<TagInterface> = await joplin.data.get(['notes', noteId, 'tags'], {
      fields: 'id, title',
      limit: 20,
      page: pageNum++,
    });

    allTags = allTags.concat(tagsInfo.items);

    if (!tagsInfo.has_more) {
      break;
    }
  }

  return allTags;
}


/**
 * Checks if tag exists.
 * 
 * @param tag Tag title to search.
 * @returns Returns the tag. Returns null if tag was not found.
 */
export async function tagExists(tag: string): Promise<TagInterface | null> {
  const results = await joplin.data.get(['search'], { query: tag, type: 'tag' });
  
  if (results && results.items.length > 0) {
    return results.items[0];
  }

  return null;
}


/**
 * Creates a new tag.
 * 
 * @param tag Tag title.
 * @returns Returns the created tag.
 */
export async function createTag(tag: string): Promise<TagInterface> {
  return await joplin.data.post(['tags'], null, { title: tag });
}


/**
 * Sets tags for the given note id. If the tag already exists on the note,
 * no duplicate tags will be added.
 * 
 * @param noteId Target note id.
 * @param tags List of tags to insert.
 */
export async function setTags(noteId: string, tags: TagInterface[]) {  
  for (let tag of tags) {
    await joplin.data.post(['tags', tag.id, 'notes'], null, { id: noteId });
  }
}


/**
 * Returns all tags that currently exists.
 * 
 * @returns List of tags.
 */
export async function getAllTags(): Promise<TagInterface[]> {
  let allTags = [];
  let page = 1;
  
  while (true) {
    const tagsInfo: PaginationResult<TagInterface> = await joplin.data.get(['tags'], { 
      fields: 'id, title', 
      limit: 20, 
      page: page++ 
    });

    allTags = [...allTags, ...tagsInfo.items];

    if (!tagsInfo.has_more) {
      break;
    }
  }

  return allTags;
}
