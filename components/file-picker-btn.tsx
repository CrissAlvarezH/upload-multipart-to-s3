import { useState } from "react";
import { useRef } from "react";

export function FilePickerButton({
  onSelectFile,
}: {
  onSelectFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelectFile(file);
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
        className="font-semibold bg-black text-white px-4 py-2 rounded-md"
      >
        Select file
      </button>
    </>
  );
}