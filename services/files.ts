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
export async function uploadFileByParts(file: File, { batchSize, partSize = DEFAULT_PART_SIZE, onProgress }: UploadFileByPartsOptions = {}) {
  const initRes = await fetch("/api/upload/init", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
    }),
  });
  if (!initRes.ok) {
    throw new Error("Failed to initialize multipart upload");
  }
  const { uploadId } = await initRes.json();

  const uploadPartJobs: (() => Promise<void>)[] = [];
  const partSizeInMB = partSize * 1024 * 1024; 
  const totalParts = Math.ceil(file.size / partSizeInMB);
  const partResults: { PartNumber: number; ETag: string }[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    uploadPartJobs.push(async () => {
      const part = file.slice((partNumber - 1) * partSizeInMB, partNumber * partSizeInMB);

      const presignedRes = await fetch("/api/upload/get-presigned-url", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          uploadId,
          partNumber,
        }),
      });
      if (!presignedRes.ok) {
        throw new Error("Failed to get presigned url");
      }
      const { url } = await presignedRes.json();

      const uploadRes = await fetch(url, {
        method: "PUT",
        body: part,
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload part");
      }

      partResults.push({
        PartNumber: partNumber,
        ETag: uploadRes.headers.get("Etag")!,
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

  const completeRes = await fetch("/api/upload/complete", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      uploadId,
      // parts must be sorted by part number
      parts: partResults.sort((a, b) => a.PartNumber - b.PartNumber),
    }),
  });
  if (!completeRes.ok) {
    throw new Error("Failed to complete multipart upload");
  }
  onProgress?.(100);
}
