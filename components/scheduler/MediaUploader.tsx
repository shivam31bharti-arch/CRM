"use client";

import { useRef, useState } from "react";
import { Link2, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_MEGABYTES,
  getPlatformMediaPolicy,
  parseStorageReference
} from "@/lib/media-storage";

type UploadResponse = {
  reference: string;
  file: { name: string; type: string; size: number };
};

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

export function MediaUploader({
  urls,
  platform,
  onChange,
  onBusyChange
}: {
  urls: string[];
  platform: "TWITTER" | "LINKEDIN" | "INSTAGRAM" | "FACEBOOK";
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const policy = getPlatformMediaPolicy(platform)!;
  const fileInput = useRef<HTMLInputElement>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  function setOperationBusy(value: boolean) {
    setBusy(value);
    onBusyChange?.(value);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setMessage("");

    const available = policy.maxItems - urls.length;
    if (available <= 0) {
      setError(
        `${platform} supports ${policy.maxItems || "no"} media ${policy.maxItems === 1 ? "item" : "items"}.`
      );
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    const selected = Array.from(files);
    if (selected.length > available) {
      setError(`Choose ${available} or fewer files for the remaining media slots.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    const tooLarge = selected.find((file) => file.size > MAX_MEDIA_BYTES);
    if (tooLarge) {
      setError(`${tooLarge.name} is larger than ${MAX_MEDIA_MEGABYTES} MB.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    const unsupported = selected.find((file) => !policy.acceptedTypes.includes(file.type as never));
    if (unsupported) {
      setError(`${unsupported.name} is not supported for ${platform}. ${policy.help}.`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setOperationBusy(true);
    let next = [...urls];
    try {
      for (const [index, file] of selected.entries()) {
        setMessage(`Uploading ${index + 1} of ${selected.length}: ${file.name}`);
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/media", { method: "POST", body: form });
        if (!response.ok) throw new Error(await responseError(response, `${file.name} failed.`));
        const result = (await response.json()) as UploadResponse;
        next = [...next, result.reference];
        onChange(next);
      }
      setMessage(`${selected.length} media ${selected.length === 1 ? "item" : "items"} uploaded.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media upload failed.");
      setMessage("");
    } finally {
      setOperationBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addExternalUrl() {
    setError("");
    setMessage("");
    if (!policy.allowExternalUrls) {
      setError(`${policy.help}.`);
      return;
    }
    if (urls.length >= policy.maxItems) {
      setError(`${platform} supports at most ${policy.maxItems} media item.`);
      return;
    }

    try {
      const parsed = new URL(externalUrl.trim());
      if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
        throw new Error();
      }
      onChange([...urls, parsed.toString()]);
      setExternalUrl("");
      setMessage("External HTTPS media link added.");
    } catch {
      setError("Enter a complete HTTPS media URL without embedded credentials.");
    }
  }

  async function removeMedia(index: number) {
    const reference = urls[index];
    if (!reference) return;
    setError("");
    setMessage("");
    const stored = parseStorageReference(reference);

    if (stored) {
      setRemoving(index);
      setOperationBusy(true);
      try {
        const response = await fetch("/api/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference })
        });
        if (!response.ok) throw new Error(await responseError(response, "Media removal failed."));
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : "Media removal failed.");
        return;
      } finally {
        setRemoving(null);
        setOperationBusy(false);
      }
    }

    onChange(urls.filter((_, itemIndex) => itemIndex !== index));
    setMessage("Media item removed.");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-dashed bg-slate-50 p-4">
        <label htmlFor="post-media-files" className="text-sm font-semibold text-slate-900">
          Upload media for {platform === "TWITTER" ? "X / Twitter" : platform.toLowerCase()}
        </label>
        <p id="post-media-help" className="mt-1 text-xs text-slate-500">
          {policy.help}. Maximum {MAX_MEDIA_MEGABYTES} MB per file.
        </p>
        <Input
          ref={fileInput}
          id="post-media-files"
          className="mt-3 h-auto cursor-pointer py-2 file:mr-3 file:rounded file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm file:font-semibold"
          type="file"
          multiple={policy.maxItems > 1}
          accept={policy.acceptedTypes.join(",")}
          aria-describedby="post-media-help post-media-status"
          disabled={busy || policy.maxItems === 0 || urls.length >= policy.maxItems}
          onChange={(event) => void uploadFiles(event.target.files)}
        />
      </div>

      <div className="flex gap-2">
        <Input
          type="url"
          inputMode="url"
          aria-label="External HTTPS media URL"
          placeholder="https://cdn.example.com/media.jpg"
          value={externalUrl}
          disabled={busy || !policy.allowExternalUrls || urls.length >= policy.maxItems}
          onChange={(event) => setExternalUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addExternalUrl();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={
            busy ||
            !policy.allowExternalUrls ||
            !externalUrl.trim() ||
            urls.length >= policy.maxItems
          }
          onClick={addExternalUrl}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Add link
        </Button>
      </div>

      {urls.length > policy.maxItems ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          Remove {urls.length - policy.maxItems} media{" "}
          {urls.length - policy.maxItems === 1 ? "item" : "items"} before using this platform.
        </p>
      ) : null}

      {urls.length ? (
        <ul className="space-y-2" aria-label="Attached media">
          {urls.map((reference, index) => {
            const stored = parseStorageReference(reference);
            const isRemoving = removing === index;
            return (
              <li
                key={`${reference}-${index}`}
                className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2"
              >
                <span className="min-w-0 text-sm text-slate-700">
                  <span className="block font-medium text-slate-900">
                    {stored ? `Uploaded media ${index + 1}` : `External media ${index + 1}`}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {stored ? stored.objectPath.split("/").at(-1) : reference}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0"
                  aria-label={`Remove media item ${index + 1}`}
                  disabled={busy || isRemoving}
                  onClick={() => void removeMedia(index)}
                >
                  {isRemoving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div id="post-media-status" className="min-h-5 text-xs" aria-live="polite">
        {busy ? (
          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {message || "Working on media…"}
          </span>
        ) : error ? (
          <span className="font-medium text-red-700" role="alert">
            {error}
          </span>
        ) : (
          <span className="text-slate-500">{message}</span>
        )}
      </div>
    </div>
  );
}
