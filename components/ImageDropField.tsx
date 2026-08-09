"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ImageDropField({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (url: string) => void;
  readOnly?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
      } else {
        onChange(data.url);
      }
    } catch {
      setError("Upload failed.");
    }
    setUploading(false);
  }, [onChange]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
      if (item) {
        const file = item.getAsFile();
        if (file) upload(file);
      }
    },
    [upload]
  );

  if (readOnly) {
    if (!value) return <span className="text-base-muted text-sm">—</span>;
    return (
      <a href={value} target="_blank" rel="noreferrer">
        <img src={value} alt="Trade chart" className="max-h-56 rounded-lg border border-base-border hover:opacity-90 transition-opacity" />
      </a>
    );
  }

  if (value) {
    return (
      <div className="relative inline-block group">
        <img src={value} alt="Trade chart" className="max-h-56 rounded-lg border border-base-border" />
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs bg-base-bg/80 border border-base-border rounded-md px-2 py-1 hover:bg-base-panel2"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs bg-base-bg/80 border border-base-border rounded-md px-2 py-1 hover:bg-pill-red-bg/20 text-pill-red-bg"
          >
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
        whileHover={{ scale: 1.005 }}
        className={`cursor-pointer border-2 border-dashed rounded-xl px-4 py-6 text-center text-sm transition-colors outline-none ${
          dragOver ? "border-accent bg-accent/10" : "border-base-border hover:border-accent/50 text-base-muted"
        }`}
      >
        {uploading ? "Uploading..." : "Click to browse or drag & drop — click here then Ctrl+V to paste"}
      </motion.div>
      {error && <p className="text-xs text-pill-red-bg mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </div>
  );
}
