/**
 * Single or multiple image picker with preview & remove.
 * Emits File[] via onChange plus optional existing image URLs to keep.
 */
import { UploadCloud, X, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ImageUploaderProps {
  multiple?: boolean;
  value?: File[];
  onChange: (files: File[]) => void;
  existing?: { id?: string | number; url: string }[];
  onRemoveExisting?: (id: string | number | undefined, index: number) => void;
  maxSizeMB?: number;
  accept?: string;
  label?: string;
}

export function ImageUploader({
  multiple,
  value = [],
  onChange,
  existing = [],
  onRemoveExisting,
  maxSizeMB = 5,
  accept = "image/*",
  label,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const arr = Array.from(files);
    for (const f of arr) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`"${f.name}" exceeds ${maxSizeMB}MB limit`);
        return;
      }
    }
    onChange(multiple ? [...value, ...arr] : arr.slice(0, 1));
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-foreground/40",
          drag && "border-foreground/60 bg-muted/40",
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">Click to upload</span> or drag & drop
        </div>
        <div className="text-xs text-muted-foreground">
          PNG, JPG, WEBP up to {maxSizeMB}MB {multiple && "· multiple allowed"}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {(existing.length > 0 || value.length > 0) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {existing.map((img, idx) => (
            <PreviewTile
              key={`e-${img.id ?? idx}`}
              src={img.url}
              onRemove={onRemoveExisting ? () => onRemoveExisting(img.id, idx) : undefined}
              badge="Saved"
            />
          ))}
          {value.map((f, idx) => (
            <PreviewTile
              key={`n-${f.name}-${idx}`}
              src={URL.createObjectURL(f)}
              onRemove={() => onChange(value.filter((_, i) => i !== idx))}
              badge="New"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewTile({
  src,
  onRemove,
  badge,
}: {
  src: string;
  onRemove?: () => void;
  badge?: string;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
      {badge && (
        <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
          aria-label="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
