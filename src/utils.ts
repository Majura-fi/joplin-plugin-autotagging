import { WordDictionary } from './types';


/**
 * Forms from search words a regex rule.
 * 
 * `((word1|word2|word3))`
 * 
 * @param dictionary Word:Tag dictionary
 * @param caseSensitive Case sensitive search
 * @returns Regex rule
 */
export function formRegex(dictionary: object, caseSensitive: boolean, fullWord: boolean): RegExp {
  const keys = Object.keys(dictionary);
  
  if (!keys.length) {
    throw new Error('Dictionary is empty!');
  }
  
  const nonWordChar = fullWord ? '[\s\/\\\]\'!"#¤%&()=?@£$€{[}´` ^¨~*:.,<>|€]' : '';  
  const wordsString = keys.map((word) => word.replace('|', '\|')).join('|');
  const reStr = nonWordChar + '(' + wordsString + ')' + nonWordChar + '.*?$';
  return new RegExp(reStr, caseSensitive ? 'g' : 'gi');
}


/**
 * Collects all words matched by pattern. The result contains no duplicates.
 * 
 * @param pattern Word pattern
 * @param haystack Text body
 * @param caseSensitive Case sensitive search
 * @returns List of words (no duplicates)
 */
export function matchAll(
  pattern: RegExp, 
  haystack: string, 
  caseSensitive: boolean,
): string[] {
  const words = {};
  const regex = new RegExp(pattern, caseSensitive ? 'g' : 'ig');
  
  // Can't find target words, if they are at the 
  // beginning or at the end of a line.
  haystack = haystack.replace(/[\r\n]/g, ' ');

  // If for some reason we go infinite loop, have a way out.
  let counter = 5000;
  let match = regex.exec(haystack);

  while (match) {
    if (counter-- < 0) {
      console.error('Infinite loop detected!');
      console.error('Pattern:', pattern);
      console.error('Case Sensitive:', caseSensitive);
      throw new Error('Something caused an infinite loop. Please report this issue!');
    }

    words[match[1]] = true;
    match = regex.exec(haystack);
  }

  return Object.keys(words);
}


/**
 * Finds keys from object, allowing to search mixed case keys.
 * @param object Target object.
 * @param searchKey Target object key.
 * @param sensitive Case sensitive search.
 * @returns Valid key for the object, or null if nothing was found.
 */
export function caseSensitiveKey(object: object, searchKey: string, sensitive: boolean): string {
  if (sensitive) {
    return searchKey;
  }

  return Object.keys(object).find(key => key.toUpperCase() === searchKey.toUpperCase());
}


/**
 * Parses word:tag string list into dictionary.
 * 
 * @param str Target string list.
 * @param listSeparator List separator.
 * @param pairSeparator Pair separator.
 * @returns Returns word:tag dictionary.
 */
export function parseWordList(str: string, listSeparator: string, pairSeparator: string): WordDictionary {  
  const collectedTags = {};
  (str || '')
    .split(listSeparator)
    .forEach((pairStr) => {
      const tags = pairStr.split(pairSeparator).map((tag) => tag.trim());
      const word = tags.splice(0, 1)[0];

      if (!!!word || !tags.length) {
        return;
      }

      collectedTags[word] = tags;
    });

  return collectedTags;
}
