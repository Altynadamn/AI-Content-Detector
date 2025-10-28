// chrome.d.ts
interface Window {
  chrome?: {
    storage?: {
      local: {
        get: (key: string | string[]) => Promise<any>;
        set: (items: { [key: string]: any }) => Promise<void>;
        remove: (key: string | string[]) => Promise<void>;
      };
    };
  };
}

declare const chrome: {
  storage: {
    local: {
      get: (key: string | string[]) => Promise<any>;
      set: (items: { [key: string]: any }) => Promise<void>;
      remove: (key: string | string[]) => Promise<void>;
    };
  };
} | undefined;