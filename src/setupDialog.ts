import { Settings, StoredWord } from './interfaces';
import { logger } from './logging';

let rowCount = 0;
let settings: Settings = null;
init();

async function init() {
  logger.Info('Initializing settings dialog.');
  readSettings();
  setupUI();
}

function readSettings() {
  const element: HTMLInputElement = document.getElementById('settings-input') as HTMLInputElement;

  if (!element || !element.value) {
    throw new Error('Failed to get settings!');
  }

  const jsonStr = atob(element.value);
  settings = JSON.parse(jsonStr);
}

async function setupUI() {
  (document.getElementById('create-missing-tags') as HTMLInputElement).checked = settings.createMissingTags;
  (document.getElementById('debug-enabled-cb') as HTMLInputElement).checked = settings.debugEnabled;
  (document.getElementById('tag-separator') as HTMLInputElement).value = settings.tagPairSeparator;
  const table = document.getElementById('table');
  
  logger.Debug('Generating rows for stored words.');
  for(const word of settings.storedWords) {
    table.appendChild(createNewRow(word));
  }
  
  logger.Debug('Generating one empty row.');
  table.appendChild(createNewRow());
}

function onInputKeyPress(evt: Event) {
  logger.Info('Key pressed inside a field.');

  const input = evt.target as Element;
  const row = input.parentElement.parentElement;
  const table = row.parentElement;

  const isLastChild = !row.nextElementSibling;
  if (!isLastChild) {
    logger.Debug('Cannot make new rows. Event did not come from the last row.');
    return;
  }

  table.append(createNewRow());
}

function onDelete(evt: Event) {
  logger.Debug('Delete button pressed');
  const row = (evt.target as Element).parentElement.parentElement;

  const isLastChild = !row.nextElementSibling;
  if (!isLastChild) {
    logger.Debug('Cannot delete last row.');
    row.remove();
  }
}

function createNewRow(word?: StoredWord): Element {
  logger.Debug('Creating a new row.');
  rowCount += 1;

  const rowEl = document.createElement('tr');

  const wordCell = document.createElement('td');
  const wordField = document.createElement('input');
  wordField.classList.add('word-field');
  wordField.name = 'word_' + rowCount;
  wordField.type = 'text';
  wordField.value = word?.word || '';
  wordField.addEventListener('keypress', (evt) => onInputKeyPress(evt));
  wordCell.append(wordField);
  rowEl.append(wordCell);

  const tagsCell = document.createElement('td');
  const tagsField = document.createElement('input');
  tagsField.classList.add('tags-field');
  tagsField.name = 'tags_' + rowCount;
  tagsField.type = 'text';
  tagsField.value = word?.tags.join(settings.tagPairSeparator) || '';
  tagsField.addEventListener('keypress', (evt) => onInputKeyPress(evt));
  tagsCell.append(tagsField);
  rowEl.append(tagsCell);

  const caseSensitiveCell = document.createElement('td');
  caseSensitiveCell.classList.add('align-center');
  const caseSensitiveField = document.createElement('input');
  caseSensitiveField.name = 'caseSensitive_' + rowCount;
  caseSensitiveField.type = 'checkbox';
  caseSensitiveField.checked = !!word?.caseSensitive;
  caseSensitiveCell.append(caseSensitiveField);
  rowEl.append(caseSensitiveCell);

  const trashSpan = document.createElement('span');
  trashSpan.classList.add('fas');
  trashSpan.classList.add('fa-trash-can');
  trashSpan.textContent = '🗑';

  const deleteCell = document.createElement('td');
  const deleteBtn = document.createElement('button');
  deleteBtn.addEventListener('click', (evt) => onDelete(evt));
  deleteBtn.append(trashSpan);
  deleteCell.append(deleteBtn);
  rowEl.append(deleteCell);

  return rowEl;
}
