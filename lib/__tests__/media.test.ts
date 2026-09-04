import { describe, expect, it } from "vitest";
import { bufferedProgress, clipUrl, stillUrl } from "../media";

describe("stillUrl / clipUrl", () => {
  it("uses errata paths under mediaBase", () => {
    expect(stillUrl("/placeholder", "aaaa000000000001", "jpg")).toBe(
      "/placeholder/frames/aaaa000000000001.jpg",
    );
    expect(clipUrl("/placeholder", "aaaa00000000c001")).toBe(
      "/placeholder/clips/aaaa00000000c001.mp4",
    );
  });
});

describe("bufferedProgress", () => {
  it("is 0 with empty buffer or bad duration", () => {
    const empty = { length: 0, start: () => 0, end: () => 0 };
    expect(bufferedProgress(empty, 6)).toBe(0);
    expect(bufferedProgress({ length: 1, start: () => 0, end: () => 3 }, 0)).toBe(0);
  });

  it("is monotone 0→1 from buffered end / duration", () => {
    expect(bufferedProgress({ length: 1, start: () => 0, end: () => 3 }, 6)).toBe(0.5);
    expect(bufferedProgress({ length: 1, start: () => 0, end: () => 6 }, 6)).toBe(1);
    expect(bufferedProgress({ length: 1, start: () => 0, end: () => 9 }, 6)).toBe(1);
  });
});
