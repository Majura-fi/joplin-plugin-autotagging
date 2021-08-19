import joplin from 'api';
import { logger } from './logging';
import { SettingKeys } from './settings';
import { TagInterface, PaginationResult, WordDictionary, NoteInterface } from './types';
import { caseSensitiveKey, formRegex, matchAll, parseWordList } from './utils';


/**
 * Scans current note and adds tags based on user specified keywords.
 */
export async function autoTagCurrentNote() {
  const note: NoteInterface = await joplin.workspace.selectedNote();
  
  if (!note) {
    logger.Info('No note selected. Cancelling auto tagging.');
    return;
  }
  
  const listSeparator = await joplin.settings.value(SettingKeys.tagListSeparator);
  const pairSeparator = await joplin.settings.value(SettingKeys.tagPairSeparator);
  logger.Info('List separator:', listSeparator);
  logger.Info('Pair separator:', pairSeparator);

  logger.Info('Loading full match words dictionary.');
  // Parse word:tag dictionary for full match words.
  const fullMatchWordsDic: WordDictionary = parseWordList(
    await joplin.settings.value(SettingKeys.fullMatchWords), 
    listSeparator, 
    pairSeparator,
  );

  logger.Info('Scanning for full match words.');
  // Use the dictionary to search for keywords and produce tags-list.
  let tagsToAdd = findTagsToAdd(
    note.body,
    fullMatchWordsDic, 
    await joplin.settings.value(SettingKeys.caseSensitiveFullMatch),
    true,
  );

  logger.Info('Loading partial match words dictionary.');
  // Parse word:tag dictionary for partial match words.
  const partialMatchWordsDic: WordDictionary = parseWordList(
    await joplin.settings.value(SettingKeys.partialMatchWords), 
    listSeparator, 
    pairSeparator,
  );

  logger.Info('Scanning for partial match words.');
  // Use the dictionary to search for keywords and produce tags-list.
  tagsToAdd = tagsToAdd.concat(findTagsToAdd(
    note.body,
    partialMatchWordsDic, 
    await joplin.settings.value(SettingKeys.caseSensitivePartialMatch),
    false,
  ));
  
  if (!tagsToAdd.length) {
    logger.Info('No tags to add. Nothing to do.');
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
  
  if (createMissingTags && newTags.length) {
    logger.Info(`Creating ${newTags.length} new tags.`);

    for (const tag of newTags) {
      const createdTag = await createTag(tag);
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
  logger.Info('Attempting to find tags to add.');

  // Do nothing if we don't have populated dictionary.
  if (!Object.keys(dictionary).length) {
    logger.Info('Cannot search for tags. The dictionary was empty.');
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
  tagsToAdd = [...new Set(tagsToAdd.filter((tag) => !!tag))];

  logger.Info(`Found ${tagsToAdd.length} tags to add.`);
  return tagsToAdd;
}


/**
 * Creates a new tag.
 * 
 * @param tag Tag title.
 * @returns Returns the created tag.
 */
export async function createTag(tag: string): Promise<TagInterface> {
  logger.Info('Creating tag:', tag);
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
  logger.Info(`Setting ${tags.length} tags to note ${noteId}.`);

  for (let tag of tags) {
    await joplin.data.post(['tags', tag.id, 'notes'], null, { id: noteId });
    logger.Info('Added tag:', tag.title);
  }
}


/**
 * Returns all tags that currently exists.
 * 
 * @returns List of tags.
 */
export async function getAllTags(): Promise<TagInterface[]> {
  logger.Info('Collecting all tags.');

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

  logger.Info(`Collected ${allTags.length} tags.`);
  return allTags;
}
