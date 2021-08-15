import joplin from 'api';
import { SettingItemType } from 'api/types';

export enum SettingKeys {
  caseSensitiveFullMatch = 'caseSensitiveFullMatch',
  caseSensitivePartialMatch = 'caseSensitivePartialMatch',
  createMissingTags = 'createMissingTags',
  fullMatchWords = 'fullMatchWords',
  partialMatchWords = 'partialMatchWords',
  tagListSeparator = 'tagListSeparator',
  tagPairSeparator = 'tagPairSeparator',
}

export async function setupSettings() {
  await joplin.settings.registerSection('tagging', {
    label: 'Auto Tagging',
    iconName: 'fas fa-tags',
  });
  
  const settings = {};

  settings[SettingKeys.tagListSeparator] = {
    value: ',',
    type: SettingItemType.String,
    section: 'tagging',
    public: true,
    label: 'List separator',
    description: 'Separator character for the lists.'
  };

  settings[SettingKeys.tagPairSeparator] = {
    value: ':',
    type: SettingItemType.String,
    section: 'tagging',
    public: true,
    label: 'Tag:Word pair separator',
    description: 'Separator character for word:tag pair.'
  };

  settings[SettingKeys.fullMatchWords] = {
    value: '',
    type: SettingItemType.String,
    section: 'tagging',
    public: true,
    label: 'Full match words',
    description: 'Words listed here will be fully matched.\nOne word can have multiple tags: word1:tag1:tag2:tag3 word2:tag4:tag5 word3:tag6'
  };

  settings[SettingKeys.partialMatchWords] = {
    value: '',
    type: SettingItemType.String,
    section: 'tagging',
    public: true,
    label: 'Partial match words',
    description: 'Words listed here will be partially matched.\nOne word can have multiple tags: word1:tag1:tag2:tag3 word2:tag4:tag5 word3:tag6'
  };

  settings[SettingKeys.caseSensitiveFullMatch] = {
    value: false,
    type: SettingItemType.Bool,
    section: 'tagging',
    public: true,
    label: 'Case sensitive matching (full)',
    description: 'Full matches must have maching case.'
  };

  settings[SettingKeys.caseSensitivePartialMatch] = {
    value: false,
    type: SettingItemType.Bool,
    section: 'tagging',
    public: true,
    label: 'Case sensitive matching (partial)',
    description: 'Partial matches must have maching case.'
  };

  settings[SettingKeys.createMissingTags] = {
    value: true,
    type: SettingItemType.Bool,
    section: 'tagging',
    public: true,
    label: 'Create missing tags',
    description: 'Creates missing tags when adding them to notes.'
  };

  await joplin.settings.registerSettings(settings);
}
