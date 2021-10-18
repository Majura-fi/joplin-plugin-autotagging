import joplin from 'api';
import { logger } from './logging';
import { setupPanel } from './panel-batch-tagging/background';

import { setupSettings } from './settings';
import { autoTagCurrentNote } from './tags';


joplin.plugins.register({
  onStart: async () => {
    logger.Info('Plugin started.');

    logger.Info('Registering workspace.onNoteChanged.');
    await joplin.workspace.onNoteChange(() => {
      logger.Info('Note changed.');
      autoTagCurrentNote();
    });
    
    await setupSettings();
    await setupPanel();
  },
});
