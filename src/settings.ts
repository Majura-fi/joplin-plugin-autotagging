import joplin from 'api';
import { ChangeEvent } from 'api/JoplinSettings';
import { DialogResult, MenuItemLocation, SettingItem, SettingItemType } from 'api/types';

import { LogLevel } from 'simplr-logger';
import { Settings, StoredWord } from './interfaces';

import { logger } from './logging';

export enum SettingKeys {
  createMissingTags = 'createMissingTags',
  tagPairSeparator = 'tagPairSeparator',
  debugEnabled = 'debugEnabled',
  storedWords = 'storedWords',
};

let setupDialog: string = null;

export async function collectSettings(): Promise<Settings> {
  const res = {
    createMissingTags: await joplin.settings.value(SettingKeys.createMissingTags) || true,
    tagPairSeparator: await joplin.settings.value(SettingKeys.tagPairSeparator) || ':',
    debugEnabled: await joplin.settings.value(SettingKeys.debugEnabled) || false,
    storedWords: JSON.parse(await joplin.settings.value(SettingKeys.storedWords) || '[]'),
  };

  return res;
}

export async function buildSettingsDialog(): Promise<string> {
  const settings = await collectSettings();

  return await joplin.views.dialogs.setHtml(setupDialog, `
    <input id="settings-input" type="hidden" value="${btoa(JSON.stringify(settings))}">
    <form name="settings">

      <div class="setting">
        <label class="label block" for="tag-separator">Tag separator</label>
        <input class="short-input" type="text" name="tagSeparator" id="tag-separator">
      </div>

      <div class="setting">
        <input type="checkbox" id="create-missing-tags" name="createMissingTags" class="checkbox">
        <label for="create-missing-tags" class="label">Create missing tags</label>
      </div>

      <div class="setting">
        <input type="checkbox" id="debug-enabled-cb" name="debugEnabled" class="checkbox">
        <label for="debug-enabled-cb" class="label">Enable debug output</label>
      </div>
      
      <label class="label">
        Target words support <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet" target="_blank">regex rules</a>.
      </label>

      <table id="table" style="width:340px;">
        <tr>
          <th>Target word</th>
          <th>Tags</th>
          <th></th>
        </tr>
      </table>

    </form>
  `);
}

export async function showSetupDialog() {
  logger.Info('Opening settings dialog.');
  const result = await joplin.views.dialogs.open(setupDialog);
  logger.Debug('Dialog result:', result);
  await storeSettings(result);
}

async function storeSettings(result: DialogResult) {
  if (result.id !== 'ok') {
    logger.Info('User pressed "cancel" on settings dialog.');
    return;
  }

  logger.Info('User pressed "ok" on settings dialog.');

  let words: StoredWord[] = [];
  const tagSeparator = result.formData.settings.tagSeparator;

  Object
    .keys(result.formData.settings)
    .filter(key => key.startsWith('word_'))
    .forEach(key => {
      const index = key.split('_')[1];
      const word = result.formData.settings[key];
      const tags = result.formData.settings['tags_' + index]
        .split(tagSeparator)
        .map((tag: string) => tag.trim())
        .filter((tag: string) => !!tag);

      words.push({ word, tags });
    });

  await joplin.settings.setValue(SettingKeys.createMissingTags, result.formData.settings.createMissingTags === 'on');
  await joplin.settings.setValue(SettingKeys.debugEnabled, result.formData.settings.debugEnabled === 'on');
  await joplin.settings.setValue(SettingKeys.tagPairSeparator, tagSeparator);
  await joplin.settings.setValue(SettingKeys.storedWords, JSON.stringify(words));
}

export async function setupSettings() {
  logger.Info('Registering command.');
  await joplin.commands.register({
    name: 'openSetupDialog',
    label: 'Open auto tagging setup',
    execute: async () => showSetupDialog(),
  });

  logger.Info('Creating settings dialog.');
  setupDialog = await joplin.views.dialogs.create('setupDialog');
  await joplin.views.dialogs.addScript(setupDialog, 'setupDialog.js');
  await joplin.views.dialogs.addScript(setupDialog, 'setupDialog.css');

  logger.Info('Creating menu item.');
  await joplin.views.menuItems.create('autotagging', 'openSetupDialog', MenuItemLocation.Tools);
  
  logger.Info('Registering section.');
  await joplin.settings.registerSection('tagging', {
    label: 'Auto Tagging',
    iconName: 'fas fa-tags',
  });
  
  const settings: Record<string, SettingItem> = {};

  settings[SettingKeys.tagPairSeparator] = {
    value: ':',
    type: SettingItemType.String,
    section: 'tagging',
    public: false,
    label: 'Tag:Word pair separator',
    description: 'Separator character for word:tag pair.',
  };

  settings[SettingKeys.createMissingTags] = {
    value: true,
    type: SettingItemType.Bool,
    section: 'tagging',
    public: false,
    label: 'Create missing tags',
    description: 'Creates missing tags when adding them to notes.',
  };

  settings[SettingKeys.debugEnabled] = {
    value: true,
    type: SettingItemType.Bool,
    section: 'tagging',
    public: false,
    label: 'Enable debug messages',
    description: 'Generates debug messages to developer console.',
  };

  settings[SettingKeys.storedWords] = {
    value: '[]',
    type: SettingItemType.String,
    section: 'tagging',
    public: false,
    label: 'Stored target words',
    description: 'Holds all target words with their own match settings.',
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
