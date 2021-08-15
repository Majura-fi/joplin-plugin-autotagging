import joplin from 'api';

import { setupSettings } from './settings';
import { autoTagCurrentNote } from './tags';


joplin.plugins.register({
  onStart: async function() {
    await joplin.workspace.onNoteChange(() => autoTagCurrentNote());
    await setupSettings();
  },
});
