import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// In-Memory LocalStorage Mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

const localStorageMock = createLocalStorageMock();
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// In-Memory IndexedDB Mock for Unit Tests
class MockIDBRequest {
  result: any = null;
  error: any = null;
  onsuccess: any = null;
  onerror: any = null;
  triggerSuccess(result?: any) {
    if (result !== undefined) this.result = result;
    if (this.onsuccess) this.onsuccess({ target: this });
  }
  triggerError(err: any) {
    this.error = err;
    if (this.onerror) this.onerror({ target: this });
  }
}

class MockIDBOpenRequest extends MockIDBRequest {
  onupgradeneeded: any = null;
  onblocked: any = null;
}

const inMemoryIDBStores: Record<string, Record<string, any>> = {};

class MockObjectStore {
  name: string;
  keyPath: string;
  constructor(name: string, keyPath: string = "submissionId") {
    this.name = name;
    this.keyPath = keyPath;
    if (!inMemoryIDBStores[name]) inMemoryIDBStores[name] = {};
  }
  put(value: any) {
    const req = new MockIDBRequest();
    const key = value[this.keyPath];
    inMemoryIDBStores[this.name][key] = value;
    setTimeout(() => req.triggerSuccess(key), 0);
    return req;
  }
  get(key: string) {
    const req = new MockIDBRequest();
    const result = inMemoryIDBStores[this.name][key] || null;
    setTimeout(() => req.triggerSuccess(result), 0);
    return req;
  }
  delete(key: string) {
    const req = new MockIDBRequest();
    delete inMemoryIDBStores[this.name][key];
    setTimeout(() => req.triggerSuccess(), 0);
    return req;
  }
  getAll() {
    const req = new MockIDBRequest();
    const results = Object.values(inMemoryIDBStores[this.name] || {});
    setTimeout(() => req.triggerSuccess(results), 0);
    return req;
  }
  clear() {
    const req = new MockIDBRequest();
    inMemoryIDBStores[this.name] = {};
    setTimeout(() => req.triggerSuccess(), 0);
    return req;
  }
}

class MockIDBTransaction {
  storeNames: string[];
  mode: string;
  oncomplete: any = null;
  onerror: any = null;
  constructor(storeNames: string[], mode: string) {
    this.storeNames = storeNames;
    this.mode = mode;
    setTimeout(() => {
      if (this.oncomplete) this.oncomplete({ target: this });
    }, 5);
  }
  objectStore(name: string) {
    return new MockObjectStore(name);
  }
}

class MockIDBDatabase {
  name: string;
  version: number;
  objectStoreNames = {
    contains: (name: string) => !!inMemoryIDBStores[name],
  };
  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
  }
  createObjectStore(name: string, options?: { keyPath: string }) {
    if (!inMemoryIDBStores[name]) inMemoryIDBStores[name] = {};
    return new MockObjectStore(name, options?.keyPath);
  }
  transaction(storeNames: string | string[], mode: string = "readonly") {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(names, mode);
  }
  close() {}
}

const mockIndexedDB = {
  open: (name: string, version: number = 1) => {
    const req = new MockIDBOpenRequest();
    const db = new MockIDBDatabase(name, version);
    setTimeout(() => {
      if (req.onupgradeneeded) {
        req.onupgradeneeded({ target: { result: db } });
      }
      req.result = db;
      if (req.onsuccess) {
        req.onsuccess({ target: req });
      }
    }, 0);
    return req;
  },
  deleteDatabase: () => {
    const req = new MockIDBRequest();
    setTimeout(() => req.triggerSuccess(), 0);
    return req;
  },
};

Object.defineProperty(window, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
  configurable: true,
});

// In-Memory BroadcastChannel Mock
const broadcastChannels: Record<string, Set<any>> = {};

class MockBroadcastChannel {
  name: string;
  onmessage: any = null;
  private listeners: Set<any> = new Set();

  constructor(name: string) {
    this.name = name;
    if (!broadcastChannels[name]) {
      broadcastChannels[name] = new Set();
    }
    broadcastChannels[name].add(this);
  }

  postMessage(message: any) {
    const channels = broadcastChannels[this.name];
    if (channels) {
      channels.forEach((ch) => {
        if (ch !== this) {
          if (ch.onmessage) {
            ch.onmessage({ data: message });
          }
          ch.listeners.forEach((listener: any) => listener({ data: message }));
        }
      });
    }
  }

  addEventListener(type: string, listener: any) {
    if (type === "message") {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type: string, listener: any) {
    if (type === "message") {
      this.listeners.delete(listener);
    }
  }

  close() {
    if (broadcastChannels[this.name]) {
      broadcastChannels[this.name].delete(this);
    }
    this.listeners.clear();
  }
}

Object.defineProperty(window, "BroadcastChannel", {
  value: MockBroadcastChannel,
  writable: true,
  configurable: true,
});
