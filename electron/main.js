const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs').promises
const path = require('path')
const Store = require('electron-store')

// Initialize store with some defaults
const store = new Store({
  defaults: {
    workspace: null
  },
  schema: {
    workspace: {
      type: 'string',
      nullable: true
    }
  }
})

// Declare mainWindow in the global scope
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#ffffff'
  })

  // In development, load from local server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle window close
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.webContents.send('window-close-triggered')
  })

  return mainWindow
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

// Workspace operations
ipcMain.handle('get-workspace', () => {
  return store.get('workspace')
})

ipcMain.handle('select-workspace', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      const workspace = result.filePaths[0]
      store.set('workspace', workspace)
      // Emit workspace change event to all windows
      if (mainWindow) {
        mainWindow.webContents.send('workspace-changed', workspace)
      }
      return { success: true, path: workspace }
    }
    return { success: false, path: null }
  } catch (error) {
    console.error('Error selecting workspace:', error)
    return { success: false, path: null, error: error.message }
  }
})

// File operations
ipcMain.handle('get-files', async (event, workspace) => {
  const files = await fs.readdir(workspace)
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      name: file,
      path: path.join(workspace, file)
    }))
})

ipcMain.handle('read-file', async (event, filePath) => {
  const content = await fs.readFile(filePath, 'utf-8')
  return content
})

ipcMain.handle('save-file', async (event, { path, content }) => {
  await fs.writeFile(path, content, 'utf-8')
  return true
})

ipcMain.handle('rename-file', async (event, { oldPath, newPath }) => {
  try {
    if (!oldPath || !newPath) {
      throw new Error('Invalid path parameters')
    }
    await fs.rename(oldPath, newPath)
    return true
  } catch (error) {
    console.error('Error renaming file:', error)
    return false
  }
})

// Add save dialog handler
ipcMain.handle('show-save-dialog', async (event, options) => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Unsaved Changes',
    message: options.message,
    detail: options.detail
  })
  return response === 0 // Return true if "Save" was clicked
})

// Listen for close confirmation
ipcMain.on('can-close', () => {
  if (mainWindow) {
    mainWindow.destroy()
  }
})

// Create folder
ipcMain.handle('create-folder', async (event, folderPath) => {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    return true
  } catch (error) {
    return false
  }
})

// Get folder structure
ipcMain.handle('get-folder-structure', async (event, workspace) => {
  async function getFiles(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(items.map(async item => {
      const path = `${dir}/${item.name}`
      if (item.isDirectory()) {
        const children = await getFiles(path)
        return {
          name: item.name,
          path,
          type: 'folder',
          children
        }
      }
      return {
        name: item.name,
        path,
        type: item.name.endsWith('.md') ? 'markdown' : 'file'
      }
    }))
    return files.filter(file => file.type === 'folder' || file.type === 'markdown')
  }
  
  return await getFiles(workspace)
})

// Add delete file handler
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath)
    return true
  } catch (error) {
    return false
  }
})

// Add message box handler for delete confirmation
ipcMain.handle('show-message-box', async (event, options) => {
  return await dialog.showMessageBox({
    type: options.type,
    buttons: options.buttons,
    defaultId: options.defaultId,
    cancelId: options.cancelId,
    title: options.title,
    message: options.message,
    detail: options.detail
  })
})

// Fix the get-file-stats handler
ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    // Use fs directly since we imported fs.promises at the top
    const stats = await fs.stat(filePath)
    return {
      mtime: stats.mtime.toISOString(), // Convert to ISO string for safe transmission
      birthtime: stats.birthtime.toISOString(),
      size: stats.size
    }
  } catch (error) {
    console.error('Error getting file stats:', error)
    throw error // Throw error to handle it in the renderer
  }
}) 