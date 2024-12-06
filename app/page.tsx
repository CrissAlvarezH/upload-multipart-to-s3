"use client";

import { useState, useRef } from "react";
import { uploadFileByParts } from "./services/files";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    uploadFileByParts(file).finally(() => {
      setIsUploading(false);
    });
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-black">Upload File to S3</h1>
      <UploadFileButton onUpload={handleUpload} isUploading={isUploading} />
    </div>
  );
}

function UploadFileButton({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
      setError(null);
    } else {
      setError("No file selected");
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {error && <p className="text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={handleUpload}
        className="bg-black text-white px-4 py-2 rounded-md"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload file"}
      </button>
    </>
  );
}
