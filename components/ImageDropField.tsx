"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-6 cursor-zoom-out"
      >
        <motion.img
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          src={src}
          alt="Trade chart (expanded)"
          className="max-h-[90vh] max-w-[90vw] rounded-lg border border-base-border object-contain cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-base-panel2 border border-base-border text-lg hover:bg-base-panel"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

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
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError("");
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG, WEBP, or GIF images are allowed.");
      return;
    }
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("Image is too large (max 4MB).");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      onChange(dataUrl);
    } catch {
      setError("Couldn't read that image.");
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
      <>
        <img
          src={value}
          alt="Trade chart"
          onClick={() => setExpanded(true)}
          className="max-h-56 rounded-lg border border-base-border hover:opacity-90 transition-opacity cursor-zoom-in"
        />
        {expanded && <Lightbox src={value} onClose={() => setExpanded(false)} />}
      </>
    );
  }

  if (value) {
    return (
      <div className="relative inline-block group">
        <img
          src={value}
          alt="Trade chart"
          onClick={() => setExpanded(true)}
          className="max-h-56 rounded-lg border border-base-border cursor-zoom-in"
        />
        {expanded && <Lightbox src={value} onClose={() => setExpanded(false)} />}
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
