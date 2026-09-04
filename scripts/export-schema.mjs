/**
 * Generate `schema/manifest.schema.json` at the repo root from the zod source
 * in `web/lib/manifest.ts`. There is exactly one definition of the data
 * contract (§5); the Python studio validates against this generated artifact
 * rather than a hand-kept copy.
 *
 *   node scripts/export-schema.mjs        # write
 *   node scripts/export-schema.mjs --check  # fail if the committed file is stale
 *
 * Run with plain node: Node's built-in type stripping loads the .ts source.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { Manifest } from "../lib/manifest.ts";

// NOTE: §10-S2 named `zod-to-json-schema`, but that package reads zod 3
// internals and silently emits `{}` for a zod 4 schema — it would have handed
// the studio an empty contract. zod 4 ships the conversion itself, so no
// dependency is needed at all.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const outDir = join(repoRoot, "schema");
const outFile = join(outDir, "manifest.schema.json");

const schema = {
  $id: "https://github.com/aliceagent/hunan-lantern-town/schema/manifest.schema.json",
  title: "Lantern River Town manifest",
  description:
    "Generated from web/lib/manifest.ts by web/scripts/export-schema.mjs — do not edit by hand.",
  // draft-7: the widest support in Python's `jsonschema`, which S4 uses.
  ...z.toJSONSchema(Manifest, { target: "draft-7", io: "input" }),
};

const json = JSON.stringify(schema, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
  if (current !== json) {
    console.error(`${outFile} is out of date — run: node scripts/export-schema.mjs`);
    process.exit(1);
  }
  console.log(`${outFile} is up to date`);
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, json);
  console.log(`wrote ${outFile} (${json.length} bytes)`);
}
