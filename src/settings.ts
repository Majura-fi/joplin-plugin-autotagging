import joplin from 'api';
import { ChangeEvent } from 'api/JoplinSettings';
import { DialogResult, MenuItemLocation, SettingItem, SettingItemType } from 'api/types';

import { Settings, SettingsForm, StoredWord } from './interfaces';
import { logger } from './logging';

export enum SettingKeys {
  createMissingTags = 'createMissingTags',
  tagPairSeparator = 'tagPairSeparator',
  debugEnabled = 'debugEnabled',
  storedWords = 'storedWords',
};

let setupDialog: string = null;

export async function collectSettings(): Promise<Settings> {
  const res: Settings = {
    createMissingTags: !!(await joplin.settings.value(SettingKeys.createMissingTags)),
    tagPairSeparator: await joplin.settings.value(SettingKeys.tagPairSeparator) || ':',
    debugEnabled: !!(await joplin.settings.value(SettingKeys.debugEnabled)),
    storedWords: JSON.parse(await joplin.settings.value(SettingKeys.storedWords) || '[]'),
  };

  return res;
}

export async function buildSettingsDialog(): Promise<string> {
  logger.Info('Building settings dialog.');
  const settings = await collectSettings();
  const templateStr = `
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
      
      <table id="table" style="width:340px;">
        <tbody>
          <tr>
            <th>
              Target word<br/>
              <span class="small-hint">(Supports <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet" target="_blank">regex</a>)</span>
            </th>
            <th>Tags</th>
            <th>Case sensitive</th>
            <th></th>
          </tr>
        </tbody>
      </table>

    </form>
  `;
  logger.Info('Template:', templateStr);

  return await joplin.views.dialogs.setHtml(setupDialog, templateStr);
}

export async function showSetupDialog() {
  logger.Info('Opening settings dialog.');
  await buildSettingsDialog();
  const result = await joplin.views.dialogs.open(setupDialog);
  logger.Info('Dialog result:', result);
  await storeSettings(result);
}

async function storeSettings(result: DialogResult) {
  if (result.id !== 'ok') {
    logger.Info('User pressed "cancel" on settings dialog.');
    return;
  }

  logger.Info('User pressed "ok" on settings dialog.');

  let settingsForm: SettingsForm = {
    createMissingTags: 'off',
    tagSeparator: ':',
    debugEnabled: 'off',
  };

  settingsForm = Object.assign(settingsForm, result.formData.settings);

  let words: StoredWord[] = [];
  const tagSeparator = settingsForm.tagSeparator;

  Object
    .keys(settingsForm)
    .filter(key => key.startsWith('word_'))
    .forEach(key => {
      const index = key.split('_')[1];
      const word = settingsForm[key].trim();

      if (!word) {
        return;
      }

      const caseSensitive: boolean = settingsForm['caseSensitive_' + index] === 'on';
      const tags: string[] = settingsForm['tags_' + index]
        .split(tagSeparator)
        .map((tag: string) => tag.trim())
        .filter((tag: string) => !!tag);

      if (tags.length > 0) {
        words.push({ word, tags, caseSensitive });
      }
    });

  await joplin.settings.setValue(SettingKeys.createMissingTags, settingsForm.createMissingTags === 'on');
  await joplin.settings.setValue(SettingKeys.debugEnabled, settingsForm.debugEnabled === 'on');
  await joplin.settings.setValue(SettingKeys.tagPairSeparator, tagSeparator);
  await joplin.settings.setValue(SettingKeys.storedWords, JSON.stringify(words));
}

export async function setupSettings() {  
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
    value: false,
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

  logger.Info('Registering section.');
  await joplin.settings.registerSection('tagging', {
    label: 'Auto Tagging',
    iconName: 'fas fa-tags',
  });

  logger.Info('Registering settings.');
  await joplin.settings.registerSettings(settings);

  const debugEnabled = await joplin.settings.value(SettingKeys.debugEnabled);
  logger.enableDebug(debugEnabled);

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
  
  logger.Info('Registering settings.onChange.');
  await joplin.settings.onChange(async (evt: ChangeEvent) => {
    if (evt.keys.includes(SettingKeys.debugEnabled)) {
      const debugEnabled = await joplin.settings.value(SettingKeys.debugEnabled);
      logger.enableDebug(debugEnabled);
    }
  });
}
