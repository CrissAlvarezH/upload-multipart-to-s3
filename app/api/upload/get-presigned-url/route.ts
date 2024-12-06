import { NextResponse } from "next/server";
import { getPresignedUrlByPart } from "@/app/services/aws";

export async function POST(request: Request) {
  const body = await request.json();

  const url = await getPresignedUrlByPart(
    process.env.AWS_BUCKET_NAME!,
    body.filename,
    body.uploadId,
    body.partNumber
  );

  return NextResponse.json({ url });
}
