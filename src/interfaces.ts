export interface notesQuery {
  fields?: string[];
  order_by?: string;
  order_dir?: string;
  limit?: number;
  page?: number;
}

export interface notesPaging {
  items: any[];
  has_more: boolean;
}

export interface PollReply {
  progress: number;
  completed: boolean;
}

export interface PanelMessage {
  name: string;
  data: any;
}

export interface StoredWord {
  word: string;
  caseSensitive: boolean;
  tags: string[];
}

export interface Settings {
  createMissingTags: boolean;
  tagPairSeparator: string;
  debugEnabled: boolean;
  storedWords: StoredWord[];
}

export interface SettingsForm {
  createMissingTags?: 'on' | 'off';
  tagSeparator?: string;
  debugEnabled?: 'on' | 'off';
  word_1?: string;
  tags_1?: string;
  caseSensitive_1?: 'on' | 'off';
}

/**
 * Collection of word:tags pairs.
 */
 export interface WordDictionary {
  [key: string]: string[];
}

/**
 * A Joplin note.
 */
export interface NoteInterface {
  altitude: string;
  application_data: string;
  author: string;
  body: string;
  conflict_original_id: string;
  created_time: number;
  encryption_applied: number;
  encryption_cipher_text: string;
  id: string;
  is_conflict: number;
  is_shared: number;
  is_todo: number;
  latitude: string;
  longitude: string;
  markup_language: number;
  order: number;
  parent_id: string;
  share_id: string;
  source: string;
  source_application: string;
  source_url: string;
  title: string;
  todo_completed: number;
  todo_due: number;
  type_: number;
  updated_time: number;
  user_created_time: number;
  user_updated_time: number;
}

/**
 * A Joplin tag.
 */
export interface TagInterface {
  /** The tag id. */
  id: string;

  /** The tag title. */
  title: string;
  
  /** When the tag was created. */
  created_time: number;
  
  /** When the tag was last updated. */
  updated_time: number;
  
  /** When the tag was created. It may differ from created_time as it can be manually set by the user. */
  user_created_time: number;
  
  /** When the tag was last updated. It may differ from updated_time as it can be manually set by the user. */
  user_updated_time: number;
  
  encryption_cipher_text: string;
  encryption_applied: number;
  is_shared: number;
  parent_id: string;
}

/**
 * Result set for paginated search.
 */
export interface PaginationResult<T> {
  items: T[];
  has_more: boolean;
}

export interface WordRowInterface {
  word: string;
  tags: string;
  partialMatch: boolean;
  caseSensitive: boolean;
}
