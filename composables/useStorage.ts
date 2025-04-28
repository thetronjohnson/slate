import localforage from 'localforage';

// Define interfaces for document types

interface SlateFile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface FilesData {
  files: SlateFile[];
  updatedAt: string;
}

// Define the storage interface
interface StorageInterface {
  saveDocument(id: string, content: string): Promise<void>;
  getDocument(id: string): Promise<string | null>;
  deleteDocument(id: string): Promise<void>;
  saveSetting<T>(key: string, value: T): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  saveFiles(files: SlateFile[]): Promise<void>;
  getFiles(): Promise<SlateFile[]>;
}

// Define the return type of the useStorage function
interface StorageReturn {
  storage: StorageInterface;
  isReady: Ref<boolean>;
  initStorage: () => Promise<void>;
}

export function useStorage(): StorageReturn {
  const isReady = ref<boolean>(false);

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
  async function initStorage(): Promise<void> {
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

  const storage: StorageInterface = {
    async saveDocument(id: string, content: string): Promise<void> {
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

    async getDocument(id: string): Promise<string | null> {
      if (!isReady.value) await initStorage();
      try {
        const content = await documentStore.getItem<string>(id);
        return content || null;
      } catch (error) {
        console.error('Error getting document:', error);
        throw error;
      }
    },

    async deleteDocument(id: string): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        await documentStore.removeItem(id);
      } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
      }
    },

    async saveSetting<T>(key: string, value: T): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        await settingsStore.setItem(key, value);
      } catch (error) {
        console.error('Error saving setting:', error);
        throw error;
      }
    },

    async getSetting<T>(key: string): Promise<T | null> {
      if (!isReady.value) await initStorage();
      try {
        const value = await settingsStore.getItem<T>(key);
        return value || null;
      } catch (error) {
        console.error('Error getting setting:', error);
        throw error;
      }
    },

    async saveFiles(files: SlateFile[]): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        const serializableFiles: SlateFile[] = files.map(file => ({
          id: file.id,
          name: file.name,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }));

        const filesData: FilesData = {
          files: serializableFiles,
          updatedAt: new Date().toISOString()
        };

        await filesStore.setItem('files', filesData);
      } catch (error) {
        console.error('Error saving files:', error);
        throw error;
      }
    },

    async getFiles(): Promise<SlateFile[]> {
      if (!isReady.value) await initStorage();
      try {
        const filesData = await filesStore.getItem<FilesData>('files');
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
