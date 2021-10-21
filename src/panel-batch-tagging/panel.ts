import { NoteInterface, PollReply, TagInterface, UpdatedNote } from 'src/interfaces';
import { Logger } from 'src/logging';

declare const webviewApi: {
  postMessage(message: any): Promise<any>;
};

const logger = new Logger();

const progressBar = document.getElementById('progress-bar');
const progressValue = document.getElementById('progress-value');
const progressContainer = document.getElementById('progress-bar-container');
const processingHeader = document.getElementById('processing-header');
const startBtn = document.getElementById('start') as HTMLButtonElement;
const stopBtn = document.getElementById('stop') as HTMLButtonElement;
const resultListsContainer = document.querySelector('#result-lists-container');
const resultsContainer = document.querySelector('#results-container') as HTMLDivElement;

init();

function init(): void {
  // Update logging state.
  webviewApi
  .postMessage({ name: 'logging-enabled' })
  .then((val) => logger.enableDebug(val));

  startBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
  
    if (startBtn.disabled) {
      return;
    }
  
    logger.Info('Clicked start!');
  
    progressContainer.style.display = 'block';
    processingHeader.style.display = 'block';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.textContent = 'Stop';
    
    updateProgress(0);
    webviewApi.postMessage({ name: 'start-auto-tagging' });
    poll();
  });
  
  stopBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    stopBtn.textContent = 'Stopping!';
    webviewApi.postMessage({ name: 'stop-auto-tagging' });
  });
}


/**
 * Polls information from the background script.
 * If returning data indicates that the progress is completed, 
 * then stops polling.
 */
function poll(): void {
  webviewApi.postMessage({ name: 'poll' })
    .then((data: PollReply) => {
      if (typeof data.progress === 'number') {
        updateProgress(data.progress);
      }

      if (data.completed) {
        progressContainer.style.display = 'none';
        processingHeader.style.display = 'none';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        resultsContainer.style.display = 'block';
        handleResults(data.updatedNotes);
      } else {
        setTimeout(poll, 250);
      }
    });
}


/**
 * Updates the progress bar.
 * @param progress Percentage [0, 100]
 */
function updateProgress(progress: number): void {
  // Clamp value.
  progress = Math.max(0, Math.min(100, progress));

  progressBar.style.width = progress + '%';
  progressValue.textContent = Math.round(progress) + '%';
}


/**
 * Generates a list of batch autotagging results.
 * @param modifiedNotes All notes that were modified.
 */
function handleResults(modifiedNotes: UpdatedNote[]) {
  const currentRunCount = document.querySelectorAll('.result-list').length + 1;
  const h3 = document.createElement('h3');
  h3.textContent = '#' + currentRunCount;
  h3.classList.add('run-counter');

  const list = document.createElement('ul') as HTMLUListElement;
  list.classList.add('result-list');

  if (modifiedNotes.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No tags were added.';
    list.append(li);
  }

  modifiedNotes.forEach((noteInfo) => {
    const li = document.createElement('li');
    li.dataset.noteId = noteInfo.note.id;
    li.classList.add('note-item');
    
    const tagList = document.createElement('ul');
    tagList.classList.add('tag-list');

    const noteLink = createNoteLink(noteInfo);
    const tagEls = createNoteTags(noteInfo);
    tagEls.forEach(t => tagList.append(t));

    li.append(noteLink);
    li.append(tagList);
    list.append(li);
  });

  resultListsContainer.prepend(list);
  resultListsContainer.prepend(h3);
}


/**
 * Creates a html element for an updated note.
 * The returned element has a click listener, which causes 
 * Joplin to open the note.
 * @param noteInfo Updated note info
 * @returns Returns a html element.
 */
function createNoteLink(noteInfo: UpdatedNote): HTMLAnchorElement {
  const el = document.createElement('a') as HTMLAnchorElement;
  el.textContent = noteInfo.note.title;
  el.classList.add('note-link');

  el.addEventListener('click', () => {
    logger.Info('Clicked note title with id', noteInfo.note.id);
    openNote(noteInfo.note.id);
  });

  return el;
}


/**
 * Creates html elements for the added tags.
 * Each element has a click listener, which causes tag to be removed
 * from the parent note.
 * @param noteInfo Updated note info with added tags.
 * @returns Returns list of html elements.
 */
function createNoteTags(noteInfo: UpdatedNote): HTMLSpanElement[] {
  return noteInfo.addedTags.map((tag: TagInterface) => {
    const span = document.createElement('span') as HTMLSpanElement;
    span.classList.add('tag');
    span.title = 'Remove this tag from the note';
    span.textContent = tag.title;
    span.dataset.tagId = tag.id;

    span.addEventListener('click', () => removeTagFromNote(noteInfo.note, tag));
    return span;
  });
}


/**
 * Sends a message to the background script to remove a tag from a note.
 * 
 * If the note has no more added tags, this will also remove it from the
 * result list.
 * @param note Target note.
 * @param tag Target tag.
 */
function removeTagFromNote(note: NoteInterface, tag: TagInterface): void {
  webviewApi.postMessage({ 
    name: 'remove-tag-from-note', 
    data: { note, tag },
  });

  const noteEl = document.querySelector(`.note-item[data-note-id="${note.id}"]`);
  const tagEl = noteEl.querySelector(`.tag[data-tag-id="${tag.id}"]`);
  tagEl.remove();
  
  if (noteEl.querySelectorAll('.tag').length === 0) {
    noteEl.remove();
  }
}


/**
 * Sends a message to the background script to open a note.
 * @param id Target note.
 */
function openNote(id: string): void {
  logger.Info('Sending message to open note with id', id);
  webviewApi.postMessage({ name: 'open-note', data: id });
}
