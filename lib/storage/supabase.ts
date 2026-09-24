import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { StorageError, type ObjectStorage, type StoredObject } from "./types";

/**
 * Supabase Storage provider. Uses the service-role key, so it must only ever
 * run on the server. The bucket must be PRIVATE (see README).
 */
export class SupabaseObjectStorage implements ObjectStorage {
  readonly name = "supabase";
  private readonly client: SupabaseClient;

  constructor(
    url: string,
    serviceRoleKey: string,
    private readonly bucket: string,
  ) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async upload(key: string, body: Uint8Array, contentType: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).upload(key, body, {
      contentType,
      upsert: false,
      cacheControl: "0",
    });
    if (error) throw new StorageError(`Supabase upload failed: ${error.message}`, { cause: error });
  }

  async download(key: string): Promise<StoredObject | null> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) {
      if (error && /not.?found/i.test(error.message)) return null;
      if (!error) return null;
      throw new StorageError(`Supabase download failed: ${error.message}`, { cause: error });
    }
    return { body: new Uint8Array(await data.arrayBuffer()), contentType: data.type || "application/octet-stream" };
  }

  async remove(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) throw new StorageError(`Supabase remove failed: ${error.message}`, { cause: error });
  }

  async createSignedUrl(key: string, expiresInSeconds: number): Promise<string | null> {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(key, expiresInSeconds);
    if (error) throw new StorageError(`Supabase signed URL failed: ${error.message}`, { cause: error });
    return data?.signedUrl ?? null;
  }
}
