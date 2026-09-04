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

  it("round-trips a saved state, trail included", () => {
    const state: PlayerState = {
      currentFrame: "bbbb000000000002",
      moves: 3,
      visitedLocations: ["arched-moon-bridge", "riverside-steps"],
      trail: [
        { frame: "bbbb000000000001", clip: null, location: "arched-moon-bridge" },
        { frame: "bbbb000000000002", clip: "cccc000000000001", location: "riverside-steps" },
      ],
      muted: true,
    };
    saveState(state, storage);
    expect(loadSave(manifest, storage)).toEqual(state);
  });

  it("writes under the versioned key from §6", () => {
    saveState(fresh, storage);
    expect(storage.getItem(SAVE_KEY)).toContain('"v":2');
    expect([...storage.map.keys()].sort()).toEqual([MUTE_KEY, SAVE_KEY].sort());
  });

  it("still loads a v1 save, rebuilding the trail as the current still", () => {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: 1,
        currentFrame: "bbbb000000000002",
        moves: 3,
        visitedLocations: ["arched-moon-bridge", "riverside-steps"],
      }),
    );
    expect(loadSave(manifest, storage)).toEqual({
      currentFrame: "bbbb000000000002",
      moves: 3,
      visitedLocations: ["arched-moon-bridge", "riverside-steps"],
      trail: [{ frame: "bbbb000000000002", clip: null, location: "riverside-steps" }],
      muted: false,
    });
  });

  it("repairs a stale trail (frame pruned, or not ending at currentFrame) instead of dumping the save", () => {
    for (const trail of [
      // a step whose frame this manifest no longer carries
      [
        { frame: "dddd000000000009", clip: null, location: "arched-moon-bridge" },
        { frame: "bbbb000000000002", clip: "cccc000000000001", location: "riverside-steps" },
      ],
      // a trail that does not end where the player stands
      [{ frame: "bbbb000000000001", clip: null, location: "arched-moon-bridge" }],
      // no trail at all
      [],
    ]) {
      storage.setItem(
        SAVE_KEY,
        JSON.stringify({
          v: 2,
          currentFrame: "bbbb000000000002",
          moves: 3,
          visitedLocations: ["arched-moon-bridge", "riverside-steps"],
          trail,
        }),
      );
      expect(loadSave(manifest, storage).trail, JSON.stringify(trail)).toEqual([
        { frame: "bbbb000000000002", clip: null, location: "riverside-steps" },
      ]);
      expect(loadSave(manifest, storage).moves).toBe(3);
    }
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
      JSON.stringify({
        v: 3,
        currentFrame: "bbbb000000000002",
        moves: 9,
        visitedLocations: [],
        trail: [{ frame: "bbbb000000000002", clip: null, location: "riverside-steps" }],
      }),
    );
    expect(loadSave(manifest, storage)).toEqual(fresh);
  });

  it("falls back to a fresh start on a v2 payload with a malformed trail", () => {
    for (const trail of ["not-a-list", [{ frame: 7 }], [{ frame: "bbbb000000000002" }]]) {
      storage.setItem(
        SAVE_KEY,
        JSON.stringify({ v: 2, currentFrame: "bbbb000000000002", moves: 1, visitedLocations: [], trail }),
      );
      expect(loadSave(manifest, storage), JSON.stringify(trail)).toEqual(fresh);
    }
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
