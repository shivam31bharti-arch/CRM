export function readSupabaseStorageConfig(
  env: Partial<
    Record<"SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "SUPABASE_STORAGE_BUCKET", string>
  >
) {
  const url = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!url) throw new Error("SUPABASE_URL is required for media storage.");
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-side media storage.");
  }
  if (!bucket) throw new Error("SUPABASE_STORAGE_BUCKET is required for media storage.");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL must be a valid HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:") throw new Error("SUPABASE_URL must use HTTPS.");
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(bucket)) {
    throw new Error("SUPABASE_STORAGE_BUCKET is invalid.");
  }
  return { url, serviceRoleKey, bucket };
}
