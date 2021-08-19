import joplin from 'api';
import { ChangeEvent } from 'api/JoplinSettings';
import { MenuItemLocation, SettingItemType } from 'api/types';

import { LogLevel } from 'simplr-logger';

import { logger } from './logging';

export enum SettingKeys {
  caseSensitiveFullMatch = 'caseSensitiveFullMatch',
  caseSensitivePartialMatch = 'caseSensitivePartialMatch',
  createMissingTags = 'createMissingTags',
  fullMatchWords = 'fullMatchWords',
  partialMatchWords = 'partialMatchWords',
  tagListSeparator = 'tagListSeparator',
  tagPairSeparator = 'tagPairSeparator',
  debugEnabled = 'debugEnabled',
}

export async function setupSettings() {
  logger.Info('Registering section.');
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

  logger.Info('Registering settings.');
  await joplin.settings.registerSettings(settings);

  logger.Info('Registering settings.onChange.');
  await joplin.settings.onChange(async (evt: ChangeEvent) => {
    if (evt.keys.includes('debug')) {
      const debugEnabled = await joplin.settings.value(SettingKeys.debugEnabled);
      const logLevel = debugEnabled ? LogLevel.Trace : LogLevel.None;
      logger.Info('Debug setting changed to', debugEnabled);
      logger.UpdateConfiguration(builder => builder.SetDefaultLogLevel(logLevel).Build());
    }
  });
}
