import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = walk(root).filter((path) => extname(path).toLowerCase() === ".html");
const broken = [];

for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  assert.doesNotMatch(html, /\uFFFD/u, `${path} contains invalid UTF-8`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/gu)) {
    const value = match[1];
    if (!value || /^(?:https?:|mailto:|tel:|#)/u.test(value)) continue;
    const relative = value.split(/[?#]/u, 1)[0];
    if (!relative) continue;
    const target = resolve(dirname(path), relative);
    const candidate = value.endsWith("/") ? join(target, "index.html") : target;
    if (!existsSync(candidate)) broken.push(`${path}: ${value}`);
  }
}

const feed = JSON.parse(readFileSync(join(root, "articles", "feed.json"), "utf8"));
assert.equal(feed.schemaVersion, "stageone-articles-v1");
assert.ok(Array.isArray(feed.items));
assert.equal(new Set(feed.items.map((item) => item.contentId)).size, feed.items.length);
assert.equal(new Set(feed.items.map((item) => item.href)).size, feed.items.length);
assert.equal(feed.items.every((item) => /^\.\/[a-z0-9][a-z0-9-]{2,100}\/$/u.test(item.href)), true);

const articleScript = readFileSync(join(root, "articles", "articles.js"), "utf8");
assert.doesNotMatch(articleScript, /\.innerHTML\s*=/u, "article list must not inject feed content through innerHTML");
assert.equal(broken.length, 0, `Broken local links:\n${broken.join("\n")}`);

process.stdout.write(`Site validation PASS: ${htmlFiles.length} HTML files, article feed and local links checked.\n`);

function walk(directory) {
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(path));
    else if (entry.isFile() && statSync(path).size <= 5_000_000) output.push(path);
  }
  return output;
}
