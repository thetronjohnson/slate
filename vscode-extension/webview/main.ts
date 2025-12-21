import { createApp } from 'vue';
import Editor from './Editor.vue';

// Get VSCode API
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

const app = createApp(Editor, {
  vscode
});

app.mount('#app');
