#!/usr/bin/env node
// Usage: node scripts/smoke.mjs [baseUrl]
// Smoke-tests the manifest and media endpoints of a running server.

const base = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");

let failures = 0;
let mediaUrlCount = 0;

function log(url, status, extra = "") {
  console.log(`${status} ${url}${extra ? " " + extra : ""}`);
}

async function checkMedia(url, requireRangeSupport) {
  mediaUrlCount++;
  let res;
  try {
    res = await fetch(url, { headers: { Range: "bytes=0-1" } });
  } catch (err) {
    console.log(`ERR  ${url} ${err.message}`);
    failures++;
    return;
  }

  const ok = res.status === 200 || res.status === 206;
  if (!ok) {
    log(url, res.status, "(expected 200 or 206)");
    failures++;
    return;
  }

  if (requireRangeSupport) {
    const rangeOk = res.status === 206 || res.headers.get("accept-ranges") === "bytes";
    if (!rangeOk) {
      log(url, res.status, "(missing range support)");
      failures++;
      return;
    }
  }

  log(url, res.status);
}

async function main() {
  const manifestUrl = `${base}/manifest.json`;
  let manifestRes;
  try {
    manifestRes = await fetch(manifestUrl);
  } catch (err) {
    console.log(`ERR  ${manifestUrl} ${err.message}`);
    console.log("SMOKE FAILED (1)");
    process.exit(1);
  }

  if (manifestRes.status !== 200) {
    log(manifestUrl, manifestRes.status, "(expected 200)");
    console.log("SMOKE FAILED (1)");
    process.exit(1);
  }
  log(manifestUrl, manifestRes.status);

  const manifest = await manifestRes.json();
  const meta = manifest && manifest.meta;

  if (!meta || meta.start?.frame !== "daf1a2609185d63d") {
    console.log(
      `ERR  meta.start.frame is ${JSON.stringify(meta?.start?.frame)}, expected "daf1a2609185d63d"`
    );
    failures++;
  }

  if (!meta || meta.mediaBase !== "/media") {
    console.log(`ERR  meta.mediaBase is ${JSON.stringify(meta?.mediaBase)}, expected "/media"`);
    failures++;
  }

  const clips = manifest.clips || {};
  const frames = manifest.frames || {};

  for (const id of Object.keys(clips)) {
    await checkMedia(`${base}/media/clips/${id}.mp4`, true);
  }

  for (const hash of Object.keys(frames)) {
    await checkMedia(`${base}/media/frames/${hash}.jpg`, false);
  }

  if (failures > 0) {
    console.log(`SMOKE FAILED (${failures})`);
    process.exit(1);
  }

  console.log(`SMOKE OK — ${mediaUrlCount} media urls`);
  process.exit(0);
}

main();
