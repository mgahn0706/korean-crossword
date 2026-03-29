import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sourceRoot = resolve(projectRoot, "node_modules", "pdfjs-dist");
const targetRoot = resolve(projectRoot, "public", "pdfjs");

const directories = ["cmaps", "standard_fonts"];

mkdirSync(targetRoot, { recursive: true });

for (const directory of directories) {
  const source = resolve(sourceRoot, directory);
  const target = resolve(targetRoot, directory);

  if (!existsSync(source)) {
    throw new Error(`Missing pdfjs asset directory: ${source}`);
  }

  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

console.log("PDF.js assets synced to public/pdfjs");
