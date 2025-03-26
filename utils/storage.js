import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'SlateDB',
  version: 1.0,
  storeName: 'documents',
  description: 'Storage for Slate Editor'
});

// Create separate instances for different types of data
const documentStore = localforage.createInstance({
  name: 'SlateDB',
  storeName: 'documents'
});

const settingsStore = localforage.createInstance({
  name: 'SlateDB',
  storeName: 'settings'
});

const filesStore = localforage.createInstance({
  name: 'SlateDB',
  storeName: 'files'
});

// Initialize stores
Promise.all([
  documentStore.ready(),
  settingsStore.ready(),
  filesStore.ready()
]).catch(err => {
  console.error('Error initializing storage:', err);
});

export const storage = {
  async saveDocument(id, content) {
    try {
      if (!id || !content) {
        console.warn('Invalid document data:', { id, content });
        return;
      }
      await documentStore.setItem(id, content);
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },

  async getDocument(id) {
    try {
      const content = await documentStore.getItem(id);
      return content || null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  },

  async deleteDocument(id) {
    try {
      await documentStore.removeItem(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Settings storage
  async saveSetting(key, value) {
    try {
      await settingsStore.setItem(key, value);
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  },

  async getSetting(key) {
    try {
      const value = await settingsStore.getItem(key);
      return value || null;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  },

  // Files list storage
  async saveFiles(files) {
    try {
      // Ensure files is serializable by converting to plain objects
      const serializableFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));

      // Store as an object instead of direct array
      const filesData = {
        files: serializableFiles,
        updatedAt: new Date().toISOString()
      };

      await filesStore.setItem('files', filesData);
    } catch (error) {
      console.error('Error saving files:', error);
      throw error;
    }
  },

  async getFiles() {
    try {
      const filesData = await filesStore.getItem('files');
      return filesData?.files || [];
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  }
}; 