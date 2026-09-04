import { beforeEach, describe, expect, it } from "vitest";
import { initialState, type PlayerState } from "../engine";
import { parseManifest } from "../manifest";
import {
  MUTE_KEY,
  SAVE_KEY,
  clearSave,
  loadMuted,
  loadSave,
  saveState,
  type StorageLike,
} from "../save";
import { richFixture } from "./fixtures";

const manifest = parseManifest(richFixture());

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

class HostileStorage implements StorageLike {
  getItem(): string {
    throw new Error("blocked");
  }
  setItem(): void {
    throw new Error("quota exceeded");
  }
  removeItem(): void {
    throw new Error("blocked");
  }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

const fresh = initialState(manifest);

describe("loadSave", () => {
  it("returns a fresh start when nothing is stored", () => {
    expect(loadSave(manifest, storage)).toEqual(fresh);
  });

  it("round-trips a saved state", () => {
    const state: PlayerState = {
      currentFrame: "bbbb000000000002",
      moves: 3,
      visitedLocations: ["arched-moon-bridge", "riverside-steps"],
      muted: true,
    };
    saveState(state, storage);
    expect(loadSave(manifest, storage)).toEqual(state);
  });

  it("writes under the versioned key from §6", () => {
    saveState(fresh, storage);
    expect(storage.getItem(SAVE_KEY)).toContain('"v":1');
    expect([...storage.map.keys()].sort()).toEqual([MUTE_KEY, SAVE_KEY].sort());
  });

  it("falls back to a fresh start on corrupt JSON", () => {
    storage.setItem(SAVE_KEY, "{not json at all");
    expect(loadSave(manifest, storage)).toEqual(fresh);
  });

  it("falls back to a fresh start on a wrong-shaped payload", () => {
    for (const junk of [
      "null",
      "42",
      '"a string"',
      "[]",
      '{"currentFrame":"bbbb000000000001"}',
      '{"v":1,"currentFrame":"bbbb000000000001","moves":"lots","visitedLocations":[]}',
      '{"v":1,"currentFrame":"bbbb000000000001","moves":-1,"visitedLocations":[]}',
      '{"v":1,"currentFrame":"bbbb000000000001","moves":1,"visitedLocations":[7]}',
    ]) {
      storage.setItem(SAVE_KEY, junk);
      expect(loadSave(manifest, storage), junk).toEqual(fresh);
    }
  });

  it("falls back to a fresh start on a save from a future version", () => {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ v: 2, currentFrame: "bbbb000000000002", moves: 9, visitedLocations: [] }),
    );
    expect(loadSave(manifest, storage)).toEqual(fresh);
  });

  it("falls back to a fresh start when the saved frame is gone from this manifest", () => {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ v: 1, currentFrame: "0123456789abcdef", moves: 4, visitedLocations: [] }),
    );
    expect(loadSave(manifest, storage)).toEqual(fresh);
  });

  it("keeps the mute preference even when the story save is discarded", () => {
    storage.setItem(SAVE_KEY, "corrupt");
    storage.setItem(MUTE_KEY, "1");
    expect(loadSave(manifest, storage).muted).toBe(true);
  });
});

describe("clearSave", () => {
  it("forgets the story but keeps mute (§6.9 reset)", () => {
    saveState({ ...fresh, currentFrame: "bbbb000000000002", moves: 5, muted: true }, storage);
    clearSave(storage);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(loadMuted(storage)).toBe(true);
    expect(loadSave(manifest, storage)).toEqual({ ...fresh, muted: true });
  });
});

describe("storage that is absent or hostile", () => {
  it("treats no storage (SSR) as a fresh start and never throws", () => {
    expect(loadSave(manifest, null)).toEqual(fresh);
    expect(() => saveState(fresh, null)).not.toThrow();
    expect(() => clearSave(null)).not.toThrow();
    expect(loadMuted(null)).toBe(false);
  });

  it("survives a browser that throws on every storage call", () => {
    const hostile = new HostileStorage();
    expect(loadSave(manifest, hostile)).toEqual(fresh);
    expect(() => saveState(fresh, hostile)).not.toThrow();
    expect(() => clearSave(hostile)).not.toThrow();
    expect(loadMuted(hostile)).toBe(false);
  });
});
