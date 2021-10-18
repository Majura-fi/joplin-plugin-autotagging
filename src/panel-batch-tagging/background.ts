import joplin from 'api';

interface PanelMessage {
  name: string;
  data: any;
}

export async function setupPanel(): Promise<void> {
  const panelHandle = await joplin.views.panels.create('batch-tag-panel');
  await joplin.views.panels.setHtml(panelHandle, getPanelTemplate());
  await joplin.views.panels.addScript(panelHandle, './panel-batch-tagging/panel.css');
  await joplin.views.panels.addScript(panelHandle, './panel-batch-tagging/panel.js');
  await joplin.commands.register({
    name: 'showBatchTaggingPanel',
    label: 'Show/Hide batch tagging view',
    execute: async () => {
      const isVisible = await joplin.views.panels.visible(panelHandle);
      await joplin.views.panels.show(panelHandle, !isVisible);
    },
  });

  joplin.views.panels.onMessage(panelHandle, async (message: PanelMessage) => {

  });
}

function getPanelTemplate(): string {
  return `
    <h1>Panel works!</h1>
  `;
}
