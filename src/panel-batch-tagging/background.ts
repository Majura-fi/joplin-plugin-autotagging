import joplin from 'api';
import { notesPaging, PanelMessage } from 'src/interfaces';
import { autoTagNote } from 'src/tags';

let notesCount = 0;
let notesProcessedCount = 0;
let completed = false;
let cancelPending = false;
let running = false;


/**
 * Setups panel.
 */
export async function setupPanel(): Promise<void> {
  console.info('Creating a panel for batch autotagging.');
  const panelHandle = await joplin.views.panels.create('batch-tag-panel');

  console.info('Setting HTML and scripts/styles for the panel.');
  await joplin.views.panels.setHtml(panelHandle, getPanelTemplate());
  await joplin.views.panels.addScript(panelHandle, './panel-batch-tagging/panel.css');
  await joplin.views.panels.addScript(panelHandle, './panel-batch-tagging/panel.js');

  console.info('Registering show/hide-command for the panel.');
  await joplin.commands.register({
    name: 'showBatchTaggingPanel',
    label: 'Show/Hide batch tagging view',
    execute: async () => {
      const isVisible = await joplin.views.panels.visible(panelHandle);
      await joplin.views.panels.show(panelHandle, !isVisible);
    },
  });

  console.info('Registering onMessage listener for the panel.');
  joplin.views.panels.onMessage(panelHandle, async (message: PanelMessage) => {
    if (message.name === 'poll') {
      return {
        progress: notesCount ? ((notesProcessedCount / notesCount) * 100) : 0,
        completed,
      };
    }

    if (message.name === 'stop-auto-tagging') {
      cancelPending = true;
      return {};
    }

    if (message.name === 'start-auto-tagging') {
      cancelPending = false;
      doAutotagging();
      return {};
    }

    console.info('Unknown message:', message);
    return {};
  });
}


/**
 * Processes all notes and autotags them and updates processed notes counter.
 */
async function doAutotagging(): Promise<void> {
  if (running) {
    console.warn('Attempted to start another autotagging batch process!');
    return;
  }

  const startTime = new Date();
  console.info('Started batch autotagging.', startTime.toLocaleString());

  let page = 1;
  let notes: notesPaging = { has_more: false, items: [] };
  completed = false;

  notesCount = await countNotes();
  notesProcessedCount = 0;
  
  do {
    if (cancelPending) {
      console.info('Cancel pending - Breaking the main loop.')
      break;
    }

    notes = await joplin.data.get(['notes'], {
      fields: ['id','title','body'],
      order_by: 'created_time',
      limit: 100,
      page,
    });

    for (let note of notes.items) {
      if (cancelPending) {
        console.info('Cancel pending - Breaking the inner loop.');
        break;
      }

      // await autoTagNote(note);
      await sleep(2000);
      notesProcessedCount += 1;
    }

    console.info(`Processed ${notesProcessedCount}/${notesCount} (${notesCount ? ((notesProcessedCount/notesCount) * 100) : 0}%)`);
    page += 1;
  } while (notes.has_more);

  completed = true;
  running = false;

  const endingTime = new Date();
  console.info('Completed batch autotagging.', endingTime.toLocaleString());
  console.info(`Total time for ${notesCount} notes: ${(endingTime.getTime() - startTime.getTime()) / 1000} seconds`);
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
  let notes: notesPaging;
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

  console.info(`Counted total of ${total} notes`);
  return total;
}


/**
 * Creates HTML string template for the batch autotagging panel.
 * @returns Returns HTML string.
 */
function getPanelTemplate(): string {
  return `
    <h1>Batch Tagging</h1>
    <h2 id="processing-header" style="display: none;">Processing...</h2>

    <button id="start">Autotag all notes</button>
    <button id="stop" style="display: none;">Stop</button>

    <div id="progress-bar-container" style="display: none;">
      <span id="progress-value">0%</span>
      <div id="progress-bar"></div>
    </div>
  `;
}
