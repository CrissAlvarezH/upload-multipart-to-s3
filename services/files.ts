type UploadFileByPartsOptions = {
  batchSize?: number;
  partSize?: number;
  onProgress?: (progress: number) => void;
};

export const DEFAULT_PART_SIZE = 5;

/**
 * Upload a file by parts to S3.
 * @param file - The file to upload.
 * @param options - The options for the upload.
 * @param options.batchSize - The batch size for the upload. Defaults to the number of parts.
 * @param options.partSize - The size of each part to upload. Defaults to 5MB.
 * @param options.onProgress - A callback function that will be called with the progress of the upload.
 */
export async function uploadFileByParts(
  file: File,
  { batchSize, partSize = DEFAULT_PART_SIZE, onProgress }: UploadFileByPartsOptions = {}
) {
  const uploadId = await initUpload(file.name);

  const uploadPartJobs: (() => Promise<void>)[] = [];
  const partSizeInMB = partSize * 1024 * 1024; 
  const totalParts = Math.ceil(file.size / partSizeInMB);
  const partResults: { PartNumber: number; ETag: string }[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    uploadPartJobs.push(async () => {
      const part = file.slice((partNumber - 1) * partSizeInMB, partNumber * partSizeInMB);

      const url = await getPresignedUrl(file.name, uploadId, partNumber);

      const etag = await uploadPart(url, part);

      partResults.push({
        PartNumber: partNumber,
        ETag: etag,
      });

      // We don't want to show 100% progress because is missing the call to /complete
      const progress = Math.min(99, Math.floor(partResults.length / totalParts * 100));
      onProgress?.(progress);
    });
  }

  const batchLength = batchSize ?? uploadPartJobs.length;
  for (let i = 0; i < uploadPartJobs.length; i += batchLength) {
    const batch = uploadPartJobs.slice(i, i + batchLength);
    await Promise.all(batch.map(job => job()));
  }

  await completeUpload(file.name, uploadId, partResults);
  onProgress?.(100);
}

async function initUpload(filename: string) {
  const res = await fetch("/api/upload/init", {
    method: "POST",
    body: JSON.stringify({
      filename,
    }),
  });

  if (!res.ok) 
    throw new Error("Failed to initialize multipart upload");

  const { uploadId } = await res.json();
  return uploadId;
}

async function getPresignedUrl(
  filename: string,
  uploadId: string,
  partNumber: number
) {
  const res = await fetch("/api/upload/get-presigned-url", {
    method: "POST",
    body: JSON.stringify({
      filename,
      uploadId,
      partNumber,
    }),
  });

  if (!res.ok) 
    throw new Error("Failed to get presigned url");

  const { url } = await res.json();
  return url;
}

async function uploadPart(presigned_url: string, part: Blob) {
  const res = await fetch(presigned_url, {
    method: "PUT",
    body: part,
  });
  if (!res.ok) throw new Error("Failed to upload part");
  return res.headers.get("Etag")!;
}

async function completeUpload(
  filename: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  const res = await fetch("/api/upload/complete", {
    method: "POST",
    body: JSON.stringify({
      filename,
      uploadId,
      parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    }),
  });

  if (!res.ok) throw new Error("Failed to complete multipart upload");
}
