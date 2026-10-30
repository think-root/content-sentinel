import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from './storage';

const createMemoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe('storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips values as strings', () => {
    storage.set('dashboardItemsPerPage', 25);
    storage.set('postsShowFilters', true);
    expect(storage.get('dashboardItemsPerPage')).toBe('25');
    expect(storage.get('postsShowFilters')).toBe('true');

    storage.remove('dashboardItemsPerPage');
    expect(storage.get('dashboardItemsPerPage')).toBeNull();
  });

  it('reads integers with a fallback for missing or invalid values', () => {
    expect(storage.getInt('dashboardItemsPerPage', 10)).toBe(10);
    storage.set('dashboardItemsPerPage', 0);
    expect(storage.getInt('dashboardItemsPerPage', 10)).toBe(0);
    storage.set('dashboardItemsPerPage', 'abc');
    expect(storage.getInt('dashboardItemsPerPage', 10)).toBe(10);
  });

  it('survives an unavailable localStorage', () => {
    const fail = () => {
      throw new Error('SecurityError');
    };
    vi.stubGlobal('localStorage', { getItem: fail, setItem: fail, removeItem: fail });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(storage.get('theme')).toBeNull();
    expect(storage.getInt('dashboardItemsPerPage', 10)).toBe(10);
    expect(() => storage.set('theme', 'dark')).not.toThrow();
    expect(() => storage.remove('theme')).not.toThrow();
  });
});
