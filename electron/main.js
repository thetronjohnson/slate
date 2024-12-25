const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron')
const fs = require('fs').promises
const fsSync = require('fs')
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

// Register secure custom protocol
app.whenReady().then(() => {
  protocol.registerFileProtocol('workspace', (request, callback) => {
    try {
      const workspace = store.get('workspace')
      if (!workspace) {
        throw new Error('No workspace selected')
      }

      const url = request.url.replace('workspace://', '')
      const decodedUrl = decodeURIComponent(url)
      const relativePath = decodedUrl
        .replace(/^\//, '')
        .replace(/\\/g, '/')
      
      const filePath = path.join(workspace, relativePath)
      
      console.log('Protocol handler:', {
        requestUrl: request.url,
        decodedUrl,
        relativePath,
        filePath
      })

      // Verify the file is within workspace
      if (!filePath.startsWith(workspace)) {
        throw new Error('Access denied: File outside workspace')
      }

      callback({ path: filePath })
    } catch (error) {
      console.error('Workspace protocol error:', error)
      callback({ error: -2 })
    }
  })

  // Register protocol as secure and bypassing CSP
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'workspace',
      privileges: {
        standard: true,
        supportFetchAPI: true,
        secure: true,
        bypassCSP: true,
        corsEnabled: true,
        stream: true
      }
    }
  ])
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    backgroundColor: '#ffffff'
  })

  // In development, load from local server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/client/index.html'))
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

// Update the select-workspace handler
ipcMain.handle('select-workspace', async () => {
  try {
    const result = await dialog.showOpenDialog(workspaceDialogOptions)
    
    if (!result.canceled && result.filePaths.length > 0) {
      const workspace = result.filePaths[0]
      await ensureDirectoryExists(workspace)
      store.set('workspace', workspace)
      
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

// Register the change-workspace handler
ipcMain.handle('change-workspace', async () => {
  try {
    const result = await dialog.showOpenDialog(workspaceDialogOptions)
    
    if (!result.canceled && result.filePaths.length > 0) {
      const workspace = result.filePaths[0]
      await ensureDirectoryExists(workspace)
      store.set('workspace', workspace)
      
      if (mainWindow) {
        mainWindow.webContents.send('workspace-changed', workspace)
      }
      
      return { success: true, path: workspace }
    }
    return { success: false, path: null }
  } catch (error) {
    console.error('Error changing workspace:', error)
    return { success: false, path: null, error: error.message }
  }
})

// Add this helper function
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath)
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Separate the dialog options for reuse
const workspaceDialogOptions = {
  properties: ['openDirectory', 'createDirectory'],
  title: 'Choose or Create Workspace Folder',
  buttonLabel: 'Choose Folder',
  message: 'Select an existing folder or create a new one for your workspace',
  promptToCreate: true,
}

// File operations
ipcMain.handle('get-files', async (event, workspace) => {
  const files = await fs.readdir(workspace, { withFileTypes: true })
  return files
    .filter(file => !file.name.startsWith('.') && file.name.endsWith('.md'))
    .map(file => ({
      name: file.name,
      path: path.join(workspace, file.name)
    }))
})

ipcMain.handle('read-file', async (event, filePath) => {
  const content = await fs.readFile(filePath, 'utf-8')
  return content
})

ipcMain.handle('save-file', async (event, { path, content }) => {
  // If content is Buffer, write as binary, otherwise as utf-8
  await fs.writeFile(path, content, content instanceof Buffer ? undefined : 'utf-8')
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
    const files = await Promise.all(items
      // Filter out hidden files/folders (starting with .)
      .filter(item => !item.name.startsWith('.'))
      .map(async item => {
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

// Add image handling
ipcMain.handle('save-image', async (event, file) => {
  try {
    const imagesDir = path.join(app.getPath('userData'), 'images')
    await fs.mkdir(imagesDir, { recursive: true })
    
    const filename = `image-${Date.now()}.${file.name?.split('.').pop() || 'png'}`
    const imagePath = path.join(imagesDir, filename)
    
    await fs.writeFile(imagePath, file.buffer)
    
    // Return the full file path
    return `file://${imagePath}`
  } catch (error) {
    console.error('Error saving image:', error)
    throw error
  }
})

// Add image reading handler
ipcMain.handle('get-image', async (event, imagePath) => {
  try {
    const buffer = await fs.readFile(imagePath)
    return buffer
  } catch (error) {
    console.error('Error reading image:', error)
    throw error
  }
})

// Add PDF export handler
ipcMain.handle('export-pdf', async (event, { content, workspace, filename }) => {
  try {
    // Create a hidden window for PDF generation
    const pdfWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    // Load content into the window
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            pre {
              background: #f1f1f1;
              padding: 10px;
              border-radius: 4px;
            }
            img {
              max-width: 100%;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)}`)

    // Generate PDF
    const pdfPath = path.join(workspace, `${filename}.pdf`)
    const data = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      margin: {
        top: 36,
        bottom: 36,
        left: 36,
        right: 36
      }
    })

    // Save PDF
    await fs.writeFile(pdfPath, data)

    // Clean up
    pdfWindow.close()

    return { success: true, path: pdfPath }
  } catch (error) {
    console.error('Error exporting PDF:', error)
    return { success: false, error: error.message }
  }
})

// Add permission check helper
async function checkFilePermissions(filePath) {
  try {
    await fs.access(filePath, fsSync.constants.R_OK)
    return true
  } catch (error) {
    console.error(`Permission error for ${filePath}:`, error)
    return false
  }
}

// Add image read handler with permission check
ipcMain.handle('check-image-access', async (event, imagePath) => {
  try {
    console.log('Checking image access for:', imagePath)
    
    // Check if file exists first
    try {
      await fs.access(imagePath)
    } catch (error) {
      console.error('File does not exist:', imagePath)
      return {
        exists: false,
        readable: false,
        error: 'File not found'
      }
    }
    
    const hasPermission = await checkFilePermissions(imagePath)
    console.log('Has permission:', hasPermission)
    
    if (!hasPermission) {
      throw new Error('No read permission')
    }
    
    const stats = await fs.stat(imagePath)
    return {
      exists: true,
      readable: true,
      size: stats.size
    }
  } catch (error) {
    console.error('Image access error:', error)
    return {
      exists: false,
      readable: false,
      error: error.message
    }
  }
})

// Add file selection dialog handler
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(options)
    return result
  } catch (error) {
    console.error('Error showing open dialog:', error)
    throw error
  }
})