import { completeMultipartUpload } from "@/services/aws";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

export async function POST(request: Request) {
  const { filename, uploadId, parts } = await request.json();

  const res = await completeMultipartUpload(
    process.env.AWS_BUCKET_NAME!,
    filename,
    uploadId,
    parts
  );

  return NextResponse.json({ success: true, aws_response: res });
}
