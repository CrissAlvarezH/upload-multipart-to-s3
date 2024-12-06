export async function uploadFileByParts(file: File) {
  const partSize = 5 * 1024 * 1024; // 5MB
  const totalParts = Math.ceil(file.size / partSize);

  const initRes = await fetch("/api/upload/init", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
    }),
  });

  const { uploadId } = await initRes.json();

  const uploadPromises = [];

  const partResults: { PartNumber: number; ETag: string }[] = [];
  for (let i = 0; i < totalParts; i++) {
    const part = file.slice(i * partSize, (i + 1) * partSize);

    uploadPromises.push(
      new Promise(async (resolve, reject) => {
        const res = await fetch("/api/upload/get-presigned-url", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filename: file.name,
            uploadId,
            partNumber: i + 1,
          }),
        });

        const { url } = await res.json();

        const uploadRes = await fetch(url, {
          method: "PUT",
          body: part,
        });

        if (!uploadRes.ok) {
          console.error("failed to upload part", uploadRes);
          reject(new Error("Failed to upload part"));
        } else {
          partResults.push({
            PartNumber: i + 1,
            ETag: uploadRes.headers.get("Etag")!,
          });
          resolve(void 0);
        }
      })
    );
  }

  await Promise.all(uploadPromises);

  await fetch("/api/upload/complete", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      uploadId,
      parts: partResults.sort((a, b) => a.PartNumber - b.PartNumber), // parts must be sorted by part number
    }),
  });
}
