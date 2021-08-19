import { logger } from './logging';

function init() {
  const table = document.querySelector('#table');
  table.append(createNewRow());
  console.log('Initialized!');
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
  logger.Info('Delete button pressed');
  const row = (evt.target as Element).parentElement.parentElement;

  const isLastChild = !row.nextElementSibling;
  if (!isLastChild) {
    logger.Info('Cannot delete last row.');
    row.remove();
  }
}

function createNewRow(): Element {
  logger.Info('Creating a new row.');

  const wordField = document.createElement('input');
  wordField.classList.add('word-field');
  wordField.type = 'text';
  wordField.addEventListener('keypress', (evt) => onInputKeyPress(evt));

  const tagsField = document.createElement('input');
  tagsField.classList.add('tags-field');
  tagsField.type = 'text';
  tagsField.addEventListener('keypress', (evt) => onInputKeyPress(evt));

  const partialMatchCb = document.createElement('input');
  partialMatchCb.classList.add('match-type-field');
  partialMatchCb.type = 'checkbox';

  const caseSensitiveCb = document.createElement('input');
  caseSensitiveCb.classList.add('match-type-field');
  caseSensitiveCb.type = 'checkbox';
  
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
  const row = document.createElement('tr');

  wordCell.append(wordField);
  tagsCell.append(tagsField);
  deleteBtn.append(trashSpan);
  partialMatchCell.append(partialMatchCb);
  caseSensitiveCell.append(caseSensitiveCb);
  row.append(wordCell);
  row.append(tagsCell);
  row.append(partialMatchCell);
  row.append(caseSensitiveCell);
  row.append(deleteBtn);
  return row;
}

init();
