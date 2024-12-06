import "server-only";

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  // },
});

export async function getMultipartUploadId(bucket: string, filename: string) {
  console.log("get multipart upload id", bucket, filename);
  const rs = await s3Client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: filename,
    })
  );

  return rs.UploadId;
}

export async function getPresignedUrlByPart(
  bucket: string,
  filename: string,
  uploadId: string,
  partNumber: number
) {
  return await getSignedUrl(
    s3Client,
    new UploadPartCommand({
      Bucket: bucket,
      Key: filename,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 60 * 60 * 24 }
  );
}

export async function completeMultipartUpload(
  bucket: string,
  filename: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  const rs = await s3Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: filename,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}
