const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs').promises
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // Makes it look more native on macOS
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#ffffff'
  })

  // In development, load from local server
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000')
    win.webContents.openDevTools()
  } else {
    // In production, load the built files
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle file operations
ipcMain.handle('save-file', async (event, { content, title }) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Markdown File',
    defaultPath: title || 'Untitled',
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (filePath) {
    await fs.writeFile(filePath, content)
    return true
  }
  return false
}) 