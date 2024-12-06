import { completeMultipartUpload } from "@/app/services/aws";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

export async function POST(request: Request) {
  const body = await request.json();

  await completeMultipartUpload(
    process.env.AWS_BUCKET_NAME!,
    body.filename,
    body.uploadId,
    body.parts
  );

  return NextResponse.json({ success: true });
}
