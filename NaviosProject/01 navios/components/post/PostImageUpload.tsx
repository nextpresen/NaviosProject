"use client";

import { useState } from "react";

type Props = {
  onFileSelect: (file: File | null) => void;
};

export function PostImageUpload({ onFileSelect }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileSelect(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div>
      <label htmlFor="image" className="mb-1 block text-sm font-medium text-slate-700">
        画像 (任意)
      </label>
      <input
        id="image"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <p className="mt-1 text-xs text-slate-500">
        対応形式: JPG / PNG / WEBP、最大5MB
      </p>
      {preview && (
        <img
          src={preview}
          alt="プレビュー"
          className="mt-2 h-32 w-32 rounded-lg object-cover"
        />
      )}
    </div>
  );
}
