/**
 * File storage abstraction (resume uploads).
 *
 * Mirrors the data-layer pattern: features call `storage.save(file)` and never
 * care where bytes land. The LocalStorage adapter writes to /public/uploads for
 * local dev. For serverless deployment, add a BlobStorage adapter (Vercel Blob
 * or S3) and select it via STORAGE_DRIVER — no feature code changes.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SavedFile {
  url: string;
  name: string;
  size: number;
}

export interface FileStorage {
  save(file: File): Promise<SavedFile>;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = [".pdf", ".doc", ".docx"];

function assertValid(file: File) {
  if (file.size > MAX_BYTES) throw new Error("Resume must be under 10 MB.");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.includes(ext)) throw new Error("Resume must be a PDF or Word document.");
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
}

class LocalStorage implements FileStorage {
  async save(file: File): Promise<SavedFile> {
    assertValid(file);
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}-${safeName(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), bytes);
    return { url: `/uploads/${filename}`, name: file.name, size: file.size };
  }
}

function createStorage(): FileStorage {
  // Phase: deploy → switch on process.env.STORAGE_DRIVER ("blob") here.
  return new LocalStorage();
}

export const storage: FileStorage = createStorage();
