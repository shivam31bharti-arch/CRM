import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_MEDIA_BYTES,
  MAX_USER_MEDIA_BYTES,
  MAX_USER_MEDIA_OBJECTS,
  areMediaReferencesOwnedBy,
  buildMediaObjectPath,
  buildStorageReference,
  hasValidMediaSignature,
  isOwnedStorageReference,
  parseStorageReference,
  removedStorageReferences,
  resolvePublishableMediaUrls,
  selectUnreferencedStorageReferences,
  validatePlatformMedia,
  validateStorageQuota,
  validateMediaUpload
} from "../lib/media-storage";
import { parseMediaMultipart } from "../lib/media-multipart";
import { readMetaGraphApiVersion } from "../lib/social/meta-config";
import { readSupabaseStorageConfig } from "../lib/supabase-storage-config";
import { postSchema } from "../lib/validations/posts";

const validPost = {
  body: "A useful update",
  platform: "TWITTER",
  status: "DRAFT",
  scheduledAt: null,
  socialAccountId: "account-1",
  isRecurring: false
};

test("post media rejects insecure external URLs", () => {
  const result = postSchema.safeParse({
    ...validPost,
    mediaUrls: ["http://cdn.example.com/photo.jpg"]
  });

  assert.equal(result.success, false);
});

test("post media accepts durable storage references", () => {
  const result = postSchema.safeParse({
    ...validPost,
    mediaUrls: ["supabase-storage://social-media/users/user-1/photo.jpg"]
  });

  assert.equal(result.success, true);
});

test("media upload validation uses an exact allowlist and byte limit", () => {
  assert.deepEqual(validateMediaUpload({ type: "image/jpeg", size: MAX_MEDIA_BYTES }), {
    extension: "jpg",
    mediaKind: "image"
  });
  assert.deepEqual(validateMediaUpload({ type: "video/mp4", size: 100 }), {
    extension: "mp4",
    mediaKind: "video"
  });
  assert.throws(() => validateMediaUpload({ type: "image/svg+xml", size: 100 }), /type/i);
  assert.throws(
    () => validateMediaUpload({ type: "application/octet-stream", size: 100 }),
    /type/i
  );
  assert.throws(() => validateMediaUpload({ type: "image/png", size: 0 }), /empty/i);
  assert.throws(
    () => validateMediaUpload({ type: "image/png", size: MAX_MEDIA_BYTES + 1 }),
    /4 MB/i
  );
});

test("media signatures must match their claimed MIME type", () => {
  assert.equal(
    hasValidMediaSignature(
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png"
    ),
    true
  );
  assert.equal(
    hasValidMediaSignature(new TextEncoder().encode("<svg><script/></svg>"), "image/png"),
    false
  );
  assert.equal(
    hasValidMediaSignature(
      Uint8Array.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
      "video/mp4"
    ),
    true
  );
});

test("storage references round-trip without an expiring URL", () => {
  const objectPath = buildMediaObjectPath("user/../one", "fixed-id", "image/png");
  assert.equal(objectPath, "users/user%2F..%2Fone/fixed-id.png");

  const reference = buildStorageReference("social-media", objectPath);
  assert.equal(reference, "supabase-storage://social-media/users/user%2F..%2Fone/fixed-id.png");
  assert.deepEqual(parseStorageReference(reference), {
    bucket: "social-media",
    objectPath
  });
  assert.equal(isOwnedStorageReference(reference, "user/../one", "social-media"), true);
  assert.equal(isOwnedStorageReference(reference, "another-user", "social-media"), false);
});

test("stored media references cannot cross user boundaries", () => {
  const own = "supabase-storage://social-media/users/user-1/photo.jpg";
  const anotherUsers = "supabase-storage://social-media/users/user-2/photo.jpg";

  assert.equal(
    areMediaReferencesOwnedBy(
      ["https://legacy.example.com/photo.jpg", own],
      "user-1",
      "social-media"
    ),
    true
  );
  assert.equal(areMediaReferencesOwnedBy([anotherUsers], "user-1", "social-media"), false);
  assert.equal(
    areMediaReferencesOwnedBy(
      ["supabase-storage://other-bucket/users/user-1/photo.jpg"],
      "user-1",
      "social-media"
    ),
    false
  );
});

test("publish resolution signs stored objects and retains legacy HTTPS URLs", async () => {
  const reference = "supabase-storage://social-media/users/user-1/photo.jpg";
  const calls: Array<{ bucket: string; objectPath: string; expiresIn: number }> = [];

  const result = await resolvePublishableMediaUrls(
    ["https://legacy.example.com/photo.jpg", reference],
    {
      configuredBucket: "social-media",
      expiresIn: 900,
      createSignedUrl: async (bucket, objectPath, expiresIn) => {
        calls.push({ bucket, objectPath, expiresIn });
        return `https://storage.example.com/signed/${objectPath}`;
      }
    }
  );

  assert.deepEqual(result, [
    "https://legacy.example.com/photo.jpg",
    "https://storage.example.com/signed/users/user-1/photo.jpg"
  ]);
  assert.deepEqual(calls, [
    { bucket: "social-media", objectPath: "users/user-1/photo.jpg", expiresIn: 900 }
  ]);
});

test("publish resolution refuses unknown buckets and insecure URLs", async () => {
  const options = {
    configuredBucket: "social-media",
    expiresIn: 900,
    createSignedUrl: async () => "https://storage.example.com/signed"
  };

  await assert.rejects(
    resolvePublishableMediaUrls(
      ["supabase-storage://another-bucket/users/user-1/photo.jpg"],
      options
    ),
    /bucket/i
  );
  await assert.rejects(
    resolvePublishableMediaUrls(["http://legacy.example.com/photo.jpg"], options),
    /HTTPS/i
  );
});

test("storage configuration requires private server credentials", () => {
  assert.deepEqual(
    readSupabaseStorageConfig({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
      SUPABASE_STORAGE_BUCKET: "social-media"
    }),
    {
      url: "https://project.supabase.co",
      serviceRoleKey: "server-secret",
      bucket: "social-media"
    }
  );
  assert.throws(() => readSupabaseStorageConfig({}), /SUPABASE_URL/);
  assert.throws(
    () =>
      readSupabaseStorageConfig({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "",
        SUPABASE_STORAGE_BUCKET: "social-media"
      }),
    /SUPABASE_SERVICE_ROLE_KEY/
  );
});

test("streaming multipart parser accepts one bounded file", async () => {
  const form = new FormData();
  form.set(
    "file",
    new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], "photo.jpg", {
      type: "image/jpeg"
    })
  );
  const parsed = await parseMediaMultipart(
    new Request("http://localhost/api/media", {
      method: "POST",
      body: form
    })
  );

  assert.equal(parsed.name, "photo.jpg");
  assert.equal(parsed.type, "image/jpeg");
  assert.equal(parsed.size, 4);
  assert.deepEqual(parsed.bytes, Uint8Array.from([0xff, 0xd8, 0xff, 0x00]));
});

test("streaming multipart parser rejects extra fields and chunked oversized bodies", async () => {
  const withField = new FormData();
  withField.set("note", "unexpected");
  withField.set("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }));
  await assert.rejects(
    parseMediaMultipart(
      new Request("http://localhost/api/media", { method: "POST", body: withField })
    ),
    /exactly one file/i
  );

  const boundary = "boundary";
  await assert.rejects(
    parseMediaMultipart(
      new Request("http://localhost/api/media", {
        method: "POST",
        headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
        body: new Uint8Array(MAX_MEDIA_BYTES + 300_000),
        duplex: "half"
      } as RequestInit & { duplex: "half" })
    ),
    /too large/i
  );
});

test("streaming multipart parser enforces the file limit below the total request cap", async () => {
  const form = new FormData();
  form.set(
    "file",
    new File([new Uint8Array(MAX_MEDIA_BYTES + 1)], "large.jpg", { type: "image/jpeg" })
  );
  await assert.rejects(
    parseMediaMultipart(new Request("http://localhost/api/media", { method: "POST", body: form })),
    /file is too large/i
  );
});

test("storage quota enforces object and byte caps and fails closed on bad metadata", () => {
  validateStorageQuota([{ size: MAX_USER_MEDIA_BYTES - MAX_MEDIA_BYTES }], MAX_MEDIA_BYTES);
  assert.throws(
    () =>
      validateStorageQuota(
        Array.from({ length: MAX_USER_MEDIA_OBJECTS }, () => ({ size: 1 })),
        1
      ),
    /object/i
  );
  assert.throws(() => validateStorageQuota([{ size: MAX_USER_MEDIA_BYTES }], 1), /quota/i);
  assert.throws(() => validateStorageQuota([{ size: undefined }], 1), /metadata/i);
});

test("removed storage references are unique and ignore retained or external media", () => {
  const first = "supabase-storage://social-media/users/user-1/first.jpg";
  const second = "supabase-storage://social-media/users/user-1/second.png";
  assert.deepEqual(
    removedStorageReferences([first, second, first, "https://cdn.example.com/a.jpg"], [second]),
    [first]
  );
});

test("cleanup policy excludes shared references and fails closed on lookup errors", async () => {
  const unused = "supabase-storage://social-media/users/user-1/unused.jpg";
  const shared = "supabase-storage://social-media/users/user-1/shared.jpg";
  assert.deepEqual(
    await selectUnreferencedStorageReferences([unused, shared], async (reference) =>
      reference === shared ? 2 : 0
    ),
    [unused]
  );
  await assert.rejects(
    selectUnreferencedStorageReferences([unused], async () => {
      throw new Error("database unavailable");
    }),
    /database unavailable/
  );
});

test("platform media validation matches implemented provider support", () => {
  const jpeg = "supabase-storage://social-media/users/user-1/photo.jpg";
  const png = "supabase-storage://social-media/users/user-1/photo.png";
  const video = "supabase-storage://social-media/users/user-1/clip.mp4";
  const external = "https://cdn.example.com/photo.jpg";

  assert.doesNotThrow(() => validatePlatformMedia("TWITTER", [jpeg, video, external]));
  assert.throws(() => validatePlatformMedia("TWITTER", [jpeg, png, video, external, jpeg]), /4/);
  assert.doesNotThrow(() => validatePlatformMedia("FACEBOOK", [external]));
  assert.doesNotThrow(() => validatePlatformMedia("FACEBOOK", [png]));
  assert.throws(() => validatePlatformMedia("FACEBOOK", [video]), /image/i);
  assert.doesNotThrow(() => validatePlatformMedia("INSTAGRAM", [jpeg]));
  assert.doesNotThrow(() => validatePlatformMedia("INSTAGRAM", [external]));
  assert.throws(() => validatePlatformMedia("INSTAGRAM", [png]), /JPEG/i);
  assert.throws(() => validatePlatformMedia("INSTAGRAM", [video]), /JPEG/i);
  assert.throws(() => validatePlatformMedia("LINKEDIN", [jpeg]), /does not support media/i);
});

test("post schema authoritatively rejects unsupported provider media", () => {
  assert.equal(
    postSchema.safeParse({
      ...validPost,
      platform: "LINKEDIN",
      mediaUrls: ["https://cdn.example.com/photo.jpg"]
    }).success,
    false
  );
  assert.equal(
    postSchema.safeParse({
      ...validPost,
      platform: "INSTAGRAM",
      mediaUrls: ["supabase-storage://social-media/users/user-1/photo.png"]
    }).success,
    false
  );
});

test("Meta Graph API version is operator configured and validated", () => {
  assert.equal(readMetaGraphApiVersion({ META_GRAPH_API_VERSION: "v25.0" }), "v25.0");
  assert.throws(() => readMetaGraphApiVersion({}), /META_GRAPH_API_VERSION/);
  assert.throws(() => readMetaGraphApiVersion({ META_GRAPH_API_VERSION: "latest" }), /vNN.N/);
});
