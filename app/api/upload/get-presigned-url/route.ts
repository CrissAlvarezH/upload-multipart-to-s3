import { NextResponse } from "next/server";
import { getPresignedUrlByPart } from "@/services/aws";

export async function POST(request: Request) {
  const { filename, uploadId, partNumber } = await request.json();

  const url = await getPresignedUrlByPart(
    process.env.AWS_BUCKET_NAME!,
    filename,
    uploadId,
    partNumber
  );

  return NextResponse.json({ url });
}
