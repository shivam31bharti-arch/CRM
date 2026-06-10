// Unit tests for password helpers and role checks.
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("auth helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("Demo1234!");
    expect(hash).not.toBe("Demo1234!");
    await expect(verifyPassword("Demo1234!", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
