import assert from "node:assert/strict";
import test from "node:test";

type ImportModule = {
  RequestBodyTooLargeError?: new () => Error;
  prepareContactImportRows?: (
    rows: Array<{
      rowNumber: number;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      company?: string | null;
    }>,
    existing: Array<{
      id: string;
      emailNormalized?: string | null;
      phoneNormalized?: string | null;
    }>
  ) => {
    accepted: Array<Record<string, unknown>>;
    duplicates: Array<Record<string, unknown>>;
  };
  readTextBodyWithLimit?: (
    body: ReadableStream<Uint8Array> | null,
    maximumBytes: number
  ) => Promise<string>;
};

async function loadImportModule(): Promise<ImportModule> {
  const modulePath = "../lib/domain/contacts/import";
  return import(modulePath).catch(() => ({}));
}

test("separates existing and within-file duplicate contacts from accepted rows", async () => {
  const { prepareContactImportRows } = await loadImportModule();

  assert.equal(
    typeof prepareContactImportRows,
    "function",
    "prepareContactImportRows is not implemented"
  );
  const result = prepareContactImportRows?.(
    [
      {
        rowNumber: 2,
        firstName: "Existing",
        lastName: "Email",
        email: " EXISTING@example.com "
      },
      { rowNumber: 3, firstName: "First", lastName: "Phone", phone: "+1 (555) 100-2000" },
      { rowNumber: 4, firstName: "Same", lastName: "Phone", phone: "+15551002000" },
      { rowNumber: 5, firstName: "No", lastName: "Identity", email: "", phone: "" }
    ],
    [{ id: "contact-1", emailNormalized: "existing@example.com", phoneNormalized: null }]
  );

  assert.deepEqual(
    result?.accepted.map((row) => row.rowNumber),
    [3, 5]
  );
  assert.deepEqual(result?.duplicates, [
    {
      rowNumber: 2,
      reasons: ["EMAIL"],
      matchingContactIds: ["contact-1"],
      matchingRowNumbers: []
    },
    {
      rowNumber: 4,
      reasons: ["PHONE"],
      matchingContactIds: [],
      matchingRowNumbers: [3]
    }
  ]);
});

test("adds clean display and normalized identity fields to accepted import rows", async () => {
  const { prepareContactImportRows } = await loadImportModule();

  assert.equal(typeof prepareContactImportRows, "function");
  const result = prepareContactImportRows?.(
    [
      {
        rowNumber: 2,
        firstName: "Ada",
        lastName: "Lovelace",
        email: " Ada@Example.com ",
        phone: " +44 20 1234 5678 ",
        company: " Analytical Engines "
      }
    ],
    []
  );

  assert.deepEqual(result?.accepted, [
    {
      rowNumber: 2,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "Ada@Example.com",
      emailNormalized: "ada@example.com",
      phone: "+44 20 1234 5678",
      phoneNormalized: "+442012345678",
      company: "Analytical Engines"
    }
  ]);
  assert.deepEqual(result?.duplicates, []);
});

test("streams CSV request bodies and aborts immediately above the byte limit", async () => {
  const { readTextBodyWithLimit, RequestBodyTooLargeError } = await loadImportModule();
  assert.equal(typeof readTextBodyWithLimit, "function");
  assert.equal(typeof RequestBodyTooLargeError, "function");

  const encoder = new TextEncoder();
  const accepted = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("first"));
      controller.enqueue(encoder.encode("second"));
      controller.close();
    }
  });
  assert.equal(await readTextBodyWithLimit?.(accepted, 11), "firstsecond");

  let cancelled = false;
  const oversized = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("12345"));
      controller.enqueue(encoder.encode("6"));
    },
    cancel() {
      cancelled = true;
    }
  });
  await assert.rejects(
    () => readTextBodyWithLimit!(oversized, 5),
    (error) => error instanceof RequestBodyTooLargeError!
  );
  assert.equal(cancelled, true);
});
