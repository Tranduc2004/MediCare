import { useState, useRef } from "react";
import { FileImage, Loader2, X, Upload } from "lucide-react";

interface ImagePreviewUploadProps {
  onUpload: (file: File) => Promise<void>;
  imageUrl?: string;
  accept?: string;
  label: string;
  loading?: boolean;
  previewUrl?: string;
  onClearPreview?: () => void;
}

export default function ImagePreviewUpload({
  onUpload,
  imageUrl,
  accept = "image/*",
  label,
  loading = false,
  previewUrl,
  onClearPreview,
}: ImagePreviewUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);

    // Clear input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = async () => {
    if (!localPreviewUrl) return;

    // Convert local preview URL back to File
    const response = await fetch(localPreviewUrl);
    const blob = await response.blob();
    const file = new File([blob], "image.jpg", { type: "image/jpeg" });

    try {
      await onUpload(file);
      // Clear preview after successful upload
      setLocalPreviewUrl(null);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleClearPreview = () => {
    setLocalPreviewUrl(null);
    if (onClearPreview) onClearPreview();
  };

  // Show either the local preview or the uploaded image
  const displayUrl = localPreviewUrl || previewUrl || imageUrl;

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <label className="flex-1 relative">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={loading}
        />
        <div
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50 ${
            loading ? "opacity-50" : ""
          }`}
        >
          <FileImage className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600">
            {imageUrl ? `Thay đổi ${label}` : `Tải lên ${label}`}
          </span>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </label>

      {/* Preview */}
      {displayUrl && (
        <div className="relative">
          <img
            src={displayUrl}
            alt="Preview"
            className="max-h-48 rounded-lg border border-slate-200"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {localPreviewUrl && (
              <button
                onClick={handleUploadClick}
                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                <Upload className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleClearPreview}
              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
