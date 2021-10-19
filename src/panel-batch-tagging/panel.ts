import { PollReply } from 'src/interfaces';

declare const webviewApi: {
  postMessage(message: any): Promise<any>;
};

const progressBar = document.getElementById('progress-bar');
const progressValue = document.getElementById('progress-value');
const progressContainer = document.getElementById('progress-bar-container');
const processingHeader = document.getElementById('processing-header');
const startBtn = document.getElementById('start') as HTMLButtonElement;
const stopBtn = document.getElementById('stop') as HTMLButtonElement;

startBtn.addEventListener('click', (evt) => {
  evt.preventDefault();

  if (startBtn.disabled) {
    return;
  }

  console.info('Clicked start!');

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


/**
 * Polls information from the background script.
 * If returning data indicates that the progress is completed, 
 * then stops polling.
 */
function poll(): void {
  webviewApi.postMessage({ name: 'poll' })
    .then((data: PollReply) => {
      console.log('Poll reply', data);

      if (typeof data.progress === 'number') {
        updateProgress(data.progress);
      }

      if (data.completed) {
        progressContainer.style.display = 'none';
        processingHeader.style.display = 'none';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
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
