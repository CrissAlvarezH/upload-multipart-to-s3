"use client";

import { useState } from "react";
import { uploadFileByParts } from "../services/files";
import { BackspaceIcon, CloudDone, Spinner, UploadIcon } from "@/components/icons";
import { formatFileSize } from "@/lib/files";
import { FilePickerButton } from "@/components/file-picker-btn";


export default function Home() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadBatchSize, setUploadBatchSize] = useState<number>();
  const [uploadPartSize, setUploadPartSize] = useState<number>();

  const handleSelectFile = (file: File) => {
    setFiles([...files, { file }]);
  };

  const handleRemoveFile = (file: UploadFile) => {
    setFiles(files.filter(f => f.file.name !== file.file.name));
  };

  const handleUploadSuccess = (file: UploadFile) => {
    setFiles(files.map(f => f.file.name !== file.file.name ? f : { ...f, isUploaded: true }));
  };

  const handleUploadError = (file: UploadFile, error: Error) => {
    setFiles(files.map(f => f.file.name !== file.file.name ? f : { ...f, uploadError: error }));
  };

  return (
    <div>
      <h1 className="text-xl text-center shadow text-gray-800 border-b p-3 font-bold">Upload File to S3</h1>

      <div className="flex justify-center px-4">

        <div className="flex w-full items-start max-w-4xl py-5 gap-4">

          <div className="flex-1 bg-gray-100 rounded-lg p-4 space-y-2">
            <h1 className="text-xl font-bold text-gray-800">Configurations</h1>
            <div>
              <p className="text-sm text-gray-500">Batch size (simultaneous uploads)</p>
              <input
                type="number"
                value={uploadBatchSize?.toString() || ""}
                placeholder="Empty for unlimited"
                className="border border-gray-300 rounded-md p-2 w-full"
                onChange={(e) => setUploadBatchSize(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">Part size (MB)</p>
              <input
                type="number"
                value={uploadPartSize?.toString() || ""}
                placeholder="Default 5MB"
                className="border border-gray-300 rounded-md p-2 w-full"
                onChange={(e) => setUploadPartSize(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="flex-[2]">
            <FilePickerButton
              className="w-full"
              onSelectFile={handleSelectFile}
            />

            {files.length === 0 && (
              <p className="text-gray-500 py-10 text-center">No files selected</p>
            )}

            <div className="flex flex-col gap-4 pt-4">
              {files.map((file) => (
                <UploadFileItem
                  key={file.file.name}
                  file={file}
                  uploadConfig={{ batchSize: uploadBatchSize, partSize: uploadPartSize }}
                  onRemove={() => handleRemoveFile(file)}
                  onUploadSuccess={() => handleUploadSuccess(file)}
                  onUploadError={(error) => handleUploadError(file, error)}
                />
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

type UploadFile = {
  file: File;
  uploadError?: Error | null;
  isUploaded?: boolean;
}

type UploadFileItemProps = {
  file: UploadFile;
  uploadConfig?: {
    batchSize?: number;
    partSize?: number;
  };
  onRemove: () => void;
  onUploadSuccess: () => void;
  onUploadError: (error: Error) => void;
}

function UploadFileItem({ file, uploadConfig, onRemove, onUploadSuccess, onUploadError }: UploadFileItemProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (file: UploadFile) => {
    setIsUploading(true);

    uploadFileByParts(file.file, {
      batchSize: uploadConfig?.batchSize,
      partSize: uploadConfig?.partSize,
      onProgress: setUploadProgress
    })
      .then(() => {
        onUploadSuccess();
      })
      .catch((error) => {
        onUploadError(error);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <div className="bg-white shadow-md rounded-lg py-4 px-6 border flex items-center justify-between gap-10 min-w-[300px]">
      <div>
        <p className="font-medium text-gray-800 truncate">{file.file.name}</p>
        <p className="text-gray-500 text-sm">{formatFileSize(file.file.size)}</p>
      </div>

      {file.uploadError && (
        <p className="text-red-500 text-sm max-w-56">
          Error: {file.uploadError.message}
        </p>
      )}

      <div className="flex gap-0.5">

        {file.isUploaded ? (
          <div className="p-2">
            <CloudDone className="fill-green-600" />
          </div>
        ) : (
          <>
            <button
              className="hover:bg-gray-100 rounded-md p-2 transition-colors"
              onClick={() => handleUpload(file)}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex items-center gap-1">
                  <p className="text-sm text-blue-600">{uploadProgress}%</p>
                  <Spinner className="fill-blue-600" />
                </div>
              ) : (
                <UploadIcon className="fill-blue-600" />
              )}
            </button>

            <button
              className="p-2 hover:bg-red-50 hover:fill-red-600 disabled:opacity-50 rounded-md transition-colors"
              onClick={onRemove}
              disabled={isUploading}
            >
              <BackspaceIcon className="fill-red-600" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
