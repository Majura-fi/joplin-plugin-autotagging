import joplin from 'api';
import { MenuItemLocation } from 'api/types';
import { NoteInterface, PaginationResult, PanelMessage, TagInterface } from 'src/interfaces';
import { logger } from 'src/logging';
import { autoTagNote, removeTags } from 'src/tags';

const batchState = {
  notesCount: 0,
  notesProcessedCount: 0,
  completed: false,
  cancelPending: false,
  running: false,
  updatedNotes: [],
}


/**
 * Setups panel.
 */
export async function setupPanel(): Promise<void> {
  logger.Info('Creating a panel for batch autotagging.');
  const panelHandle = await joplin.views.panels.create('batch-tag-panel');
  await joplin.views.panels.show(panelHandle, false);

  logger.Info('Setting HTML and scripts/styles for the panel.');
  await joplin.views.panels.setHtml(panelHandle, getPanelTemplate());
  await joplin.views.panels.addScript(panelHandle, './panel-batch-tagging/panel.css');
  await joplin.views.panels.addScript(panelHandle, './panel-batch-tagging/panel.js');

  logger.Info('Registering show/hide-command for the panel.');
  await joplin.commands.register({
    name: 'showBatchTaggingPanel',
    label: 'Show/Hide batch auto-tagging panel',
    execute: async () => {
      const isVisible = await joplin.views.panels.visible(panelHandle);
      await joplin.views.panels.show(panelHandle, !isVisible);
    },
  });

  await joplin.views.menuItems.create('batch-autotagging-button', 'showBatchTaggingPanel', MenuItemLocation.Tools);

  logger.Info('Registering onMessage listener for the panel.');
  joplin.views.panels.onMessage(panelHandle, async (message: PanelMessage) => {
    if (message.name === 'poll') {
      return {
        progress: batchState.notesCount ? ((batchState.notesProcessedCount / batchState.notesCount) * 100) : 0,
        completed: batchState.completed,
        updatedNotes: batchState.updatedNotes,
      };
    }

    if (message.name === 'stop-auto-tagging') {
      batchState.cancelPending = true;
      return {};
    }

    if (message.name === 'start-auto-tagging') {
      batchState.cancelPending = false;
      doAutotagging();
      return {};
    }

    if (message.name === 'logging-enabled') {
      return logger.isEnabled();
    }

    if (message.name === 'open-note') {
      logger.Info('Opening note with id', message.data);
      joplin.commands.execute('openNote', message.data);
      return {};
    }

    if (message.name === 'remove-tag-from-note') {
      const tag = message.data.tag as TagInterface;
      const note = message.data.note as NoteInterface;
      logger.Info(`Removing "${tag.title}" tag from the post ${note.id}`);
      removeTags(note.id, [tag]);
      return {};
    }

    logger.Warn('Unknown message:', message);
    return {};
  });
}


/**
 * Processes all notes and autotags them and updates processed notes counter.
 */
async function doAutotagging(): Promise<void> {
  if (batchState.running) {
    logger.Warn('Attempted to start another autotagging batch process!');
    return;
  }

  const startTime = new Date();
  logger.Info('Started batch autotagging.', startTime.toLocaleString());

  let page = 1;
  let notes: PaginationResult<NoteInterface> = { has_more: false, items: [] };
  batchState.completed = false;

  batchState.notesCount = await countNotes();
  batchState.notesProcessedCount = 0;
  const updatedNotes = [];
  
  do {
    if (batchState.cancelPending) {
      logger.Info('Cancel pending - Breaking the main loop.')
      break;
    }

    notes = await joplin.data.get(['notes'], {
      fields: ['id','title','body'],
      order_by: 'created_time',
      limit: 100,
      page,
    });

    for (let note of notes.items) {
      if (batchState.cancelPending) {
        logger.Info('Cancel pending - Breaking the inner loop.');
        break;
      }

      const addedTags = await autoTagNote(note);
      
      if (addedTags.length > 0) {
        updatedNotes.push({ note, addedTags });
      }

      batchState.notesProcessedCount += 1;
    }

    logger.Info(`Processed ${batchState.notesProcessedCount}/${batchState.notesCount} (${batchState.notesCount ? ((batchState.notesProcessedCount/batchState.notesCount) * 100) : 0}%)`);
    page += 1;
  } while (notes.has_more);

  batchState.updatedNotes = updatedNotes;
  batchState.running = false;
  batchState.completed = true;

  const endingTime = new Date();
  logger.Info('Completed batch autotagging.', endingTime.toLocaleString());
  logger.Info(`Total time for ${batchState.notesCount} notes: ${(endingTime.getTime() - startTime.getTime()) / 1000} seconds`);
}


/**
 * Sleeps for given milliseconds.
 * @param timeMS Sleep time in milliseconds.
 */
function sleep(timeMS: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMS);
  });
}


/**
 * Counts all notes.
 * @returns Returns count of notes.
 */
async function countNotes(): Promise<number> {
  let notes: PaginationResult<NoteInterface>;
  let page = 1;
  let total = 0;

  do {
    notes = await joplin.data.get(['notes'], {
      fields: ['id','title','body'],
      order_by: 'created_time',
      limit: 100,
      page,
    });
    total += notes.items.length;
    page += 1;
  } while (notes.has_more);

  logger.Info(`Counted total of ${total} notes`);
  return total;
}


/**
 * Creates HTML string template for the batch autotagging panel.
 * @returns Returns HTML string.
 */
function getPanelTemplate(): string {
  return `
    <h1>Batch Tagging</h1>
    
    <div class="container">
      <button id="start">Autotag all notes</button>
      <button id="stop" style="display: none;">Stop</button>
      
      <div id="progress-bar-container" style="display: none;">
      <span id="progress-value">0%</span>
      <div id="progress-bar"></div>
      </div>

      <h2 id="processing-header" style="display: none;">Processing...</h2>
    </div>

    <div id="results-container" style="display: none;">
      <h2>Batch autotagging results</h2>
      <div id="result-lists-container"></div>
    </div>
  `;
}
