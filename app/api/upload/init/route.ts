import { getMultipartUploadId } from "@/services/aws";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  const { filename } = await request.json();

  const uploadId = await getMultipartUploadId(
    process.env.AWS_BUCKET_NAME!,
    filename
  );

  return NextResponse.json({ uploadId });
}
