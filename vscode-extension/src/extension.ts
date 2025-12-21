import * as vscode from 'vscode';
import { MarkdownWysiwygProvider } from './MarkdownWysiwygProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown WYSIWYG extension activated');

  // Register custom editor provider
  const provider = new MarkdownWysiwygProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'markdownWysiwyg.editor',
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );

  // Register command to open as text
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownWysiwyg.openAsText', () => {
      const uri = vscode.window.activeTextEditor?.document.uri;
      if (uri) {
        vscode.commands.executeCommand('vscode.openWith', uri, 'default');
      }
    })
  );
}

export function deactivate() {}
