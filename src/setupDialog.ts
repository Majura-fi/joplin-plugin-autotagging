import { Settings, StoredWord } from './interfaces';
import { Logger } from './logging';

const logger = new Logger();
let rowCount = 0;
let settings: Settings = null;
init();

function init() {
  logger.Info('Initializing settings dialog.');
  readSettings();
  setupUI();
  setupTester();
}

function readSettings() {
  const element: HTMLInputElement = document.getElementById('settings-input') as HTMLInputElement;

  if (!element || !element.value) {
    throw new Error('Failed to get settings!');
  }

  const jsonStr = atob(element.value);
  settings = JSON.parse(jsonStr);
}

function setupUI() {
  (document.getElementById('create-missing-tags') as HTMLInputElement).checked = settings.createMissingTags;
  (document.getElementById('debug-enabled-cb') as HTMLInputElement).checked = settings.debugEnabled;
  (document.getElementById('tag-separator') as HTMLInputElement).value = settings.tagPairSeparator;

  const table = document.querySelector('#table > tbody');
  
  logger.Info('Generating rows for stored words.');
  for(const word of settings.storedWords) {
    table.appendChild(createNewRow(word));
  }
  
  logger.Info('Generating one empty row.');
  table.appendChild(createNewRow());
}

function onInputKeyPress(evt: Event) {
  logger.Info('Key pressed inside a field.');

  const input = evt.target as Element;
  const row = input.parentElement.parentElement;
  const table = row.parentElement;

  const isLastChild = !row.nextElementSibling;
  if (!isLastChild) {
    logger.Info('Cannot make new rows. Event did not come from the last row.');
    return;
  }

  table.append(createNewRow());
}

function onDelete(evt: Event) {
  evt.preventDefault();
  evt.stopPropagation();

  logger.Info('Delete button pressed');
  const row = findParentWithClass(evt.target as HTMLElement, 'word-row');

  const isLastChild = !row.nextElementSibling;
  if (isLastChild) {
    logger.Info('Cannot delete last row.');
  } else {
    row.remove();
  }
}

function findParentWithClass(el: HTMLElement, clss: string): HTMLElement {
  let current = el.parentElement;
  
  while (current && !current.classList.contains(clss)) {
    current = current.parentElement;
  }

  return current;
}

function createNewRow(word?: StoredWord): Element {
  logger.Info('Creating a new row.');
  rowCount += 1;

  const rowEl = document.createElement('tr');
  rowEl.classList.add('word-row');

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

function setupTester(): void {
  const ruleEl = document.getElementById('regex-tester-rule') as HTMLInputElement;
  const caseEl = document.getElementById('regex-tester-case') as HTMLInputElement;
  const targetEl = document.getElementById('regex-tester-target') as HTMLInputElement;
  const errorEl = document.getElementById('regex-tester-error') as HTMLInputElement;

  ruleEl.addEventListener('keyup', testRegex);
  targetEl.addEventListener('keyup', testRegex);
  caseEl.addEventListener('click', testRegex);

  function testRegex(): void {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    ruleEl.style.backgroundColor = null;
    targetEl.style.backgroundColor = null;

    if (!ruleEl.value || !targetEl.value) {
      return;
    }

    try {
      const re = new RegExp(ruleEl.value, caseEl.checked ? '' : 'i');
      const isMatch = re.test(targetEl.value);  
      
      ruleEl.style.backgroundColor = isMatch ? "#7edc7e" : "#dc7e7e";
      targetEl.style.backgroundColor = isMatch ? "#7edc7e" : "#dc7e7e";
    } catch (err) {
      errorEl.style.display = 'block';
      errorEl.textContent = err.message;
    }
  }
}
