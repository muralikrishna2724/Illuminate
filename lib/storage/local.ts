import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageError, type ObjectStorage, type StoredObject } from "./types";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Filesystem provider for local development. Files are written OUTSIDE
 * `public/`, so they are never served statically; they can only be read via
 * the authenticated admin screenshot route.
 */
export class LocalObjectStorage implements ObjectStorage {
  readonly name = "local";
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = path.resolve(/* turbopackIgnore: true */ process.cwd(), rootDir);
  }

  private resolveKey(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) {
      throw new StorageError("Invalid storage key");
    }
    return full;
  }

  async upload(key: string, body: Uint8Array): Promise<void> {
    const full = this.resolveKey(key);
    try {
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, body, { flag: "wx" });
    } catch (error) {
      throw new StorageError("Local upload failed", { cause: error });
    }
  }

  async download(key: string): Promise<StoredObject | null> {
    const full = this.resolveKey(key);
    try {
      const body = await readFile(full);
      return {
        body: new Uint8Array(body),
        contentType: CONTENT_TYPES[path.extname(full).toLowerCase()] ?? "application/octet-stream",
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw new StorageError("Local download failed", { cause: error });
    }
  }

  async remove(key: string): Promise<void> {
    const full = this.resolveKey(key);
    await rm(full, { force: true });
  }
}
