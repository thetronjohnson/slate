import localforage from 'localforage';
import { ref } from 'vue';

export function useStorage() {
  const isReady = ref(false);

  // Initialize stores
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

  // Initialize storage
  async function initStorage() {
    try {
      await Promise.all([
        documentStore.ready(),
        settingsStore.ready(),
        filesStore.ready()
      ]);
      isReady.value = true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }

  const storage = {
    async saveDocument(id, content) {
      if (!isReady.value) await initStorage();
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
      if (!isReady.value) await initStorage();
      try {
        const content = await documentStore.getItem(id);
        return content || null;
      } catch (error) {
        console.error('Error getting document:', error);
        throw error;
      }
    },

    async deleteDocument(id) {
      if (!isReady.value) await initStorage();
      try {
        await documentStore.removeItem(id);
      } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
      }
    },

    async saveSetting(key, value) {
      if (!isReady.value) await initStorage();
      try {
        await settingsStore.setItem(key, value);
      } catch (error) {
        console.error('Error saving setting:', error);
        throw error;
      }
    },

    async getSetting(key) {
      if (!isReady.value) await initStorage();
      try {
        const value = await settingsStore.getItem(key);
        return value || null;
      } catch (error) {
        console.error('Error getting setting:', error);
        throw error;
      }
    },

    async saveFiles(files) {
      if (!isReady.value) await initStorage();
      try {
        const serializableFiles = files.map(file => ({
          id: file.id,
          name: file.name,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }));

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
      if (!isReady.value) await initStorage();
      try {
        const filesData = await filesStore.getItem('files');
        return filesData?.files || [];
      } catch (error) {
        console.error('Error getting files:', error);
        throw error;
      }
    }
  };

  return {
    storage,
    isReady,
    initStorage
  };
} 