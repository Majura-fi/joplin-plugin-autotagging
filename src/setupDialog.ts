import { Settings, StoredWord } from './interfaces';
import { logger } from './logging';

let rowCount = 0;
let settings: Settings = JSON.parse(atob((document.getElementById('settings-input') as HTMLInputElement).value));
init();

async function init() {
  logger.Info('Initializing settings dialog.');
  setupUI();
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

  const wordField = document.createElement('input');
  wordField.classList.add('word-field');
  wordField.name = 'word_' + rowCount;
  wordField.type = 'text';
  wordField.value = word?.word || '';
  wordField.addEventListener('keypress', (evt) => onInputKeyPress(evt));

  const tagsField = document.createElement('input');
  tagsField.classList.add('tags-field');
  tagsField.name = 'tags_' + rowCount;
  tagsField.type = 'text';
  tagsField.value = word?.tags.join(settings.tagPairSeparator) || '';
  tagsField.addEventListener('keypress', (evt) => onInputKeyPress(evt));

  const trashSpan = document.createElement('span');
  trashSpan.classList.add('fas');
  trashSpan.classList.add('fa-trash-can');
  trashSpan.textContent = '🗑';

  const deleteBtn = document.createElement('button');
  deleteBtn.addEventListener('click', (evt) => onDelete(evt));

  const tagsCell = document.createElement('td');
  const wordCell = document.createElement('td');
  const partialMatchCell = document.createElement('td');
  const caseSensitiveCell = document.createElement('td');
  const rowEl = document.createElement('tr');

  wordCell.append(wordField);
  tagsCell.append(tagsField);
  deleteBtn.append(trashSpan);
  rowEl.append(wordCell);
  rowEl.append(tagsCell);
  rowEl.append(partialMatchCell);
  rowEl.append(caseSensitiveCell);
  rowEl.append(deleteBtn);
  return rowEl;
}
