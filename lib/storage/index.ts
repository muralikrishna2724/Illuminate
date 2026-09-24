import "server-only";
import { getServerEnv } from "@/lib/env";
import { LocalObjectStorage } from "./local";
import { SupabaseObjectStorage } from "./supabase";
import type { ObjectStorage } from "./types";

let instance: ObjectStorage | null = null;

export function getStorage(): ObjectStorage {
  if (instance) return instance;
  const env = getServerEnv();
  switch (env.STORAGE_PROVIDER) {
    case "supabase":
      instance = new SupabaseObjectStorage(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, env.SUPABASE_STORAGE_BUCKET);
      break;
    case "local":
      instance = new LocalObjectStorage(env.LOCAL_STORAGE_DIR);
      break;
  }
  return instance;
}

export { paymentScreenshotKey, StorageError } from "./types";
export type { ObjectStorage, StoredObject } from "./types";
