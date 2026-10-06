import { get, put, del, BlobNotFoundError } from "@vercel/blob";

const ACCESS = "private" as const;

function blobEnabled() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

async function streamToText(stream: ReadableStream<Uint8Array>) {
  return await new Response(stream).text();
}

export async function readBlobJson<T>(pathname: string): Promise<T | null> {
  if (!blobEnabled()) return null;

  try {
    const result = await get(pathname, { access: ACCESS, useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    return JSON.parse(await streamToText(result.stream)) as T;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

export async function writeBlobJson(pathname: string, value: unknown) {
  if (!blobEnabled()) {
    throw new Error("Blob storage is not configured");
  }

  await put(pathname, JSON.stringify(value), {
    access: ACCESS,
    allowOverwrite: true,
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
    contentType: "application/json; charset=utf-8",
  });
}

export async function deleteBlobJson(pathname: string) {
  if (!blobEnabled()) return;

  await del(pathname).catch((error) => {
    if (error instanceof BlobNotFoundError) return;
    throw error;
  });
}
