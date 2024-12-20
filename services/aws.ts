import "server-only";

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  // },
  });
}

export async function getMultipartUploadId(bucket: string, filename: string) {
  const rs = await getS3Client().send(
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
    getS3Client(),
    new UploadPartCommand({
      Bucket: bucket,
      Key: filename,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 15 * 60 } // 15 minutes
  );
}

export async function completeMultipartUpload(
  bucket: string,
  filename: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
) {
  return await getS3Client().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: filename,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}
