"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Loader2, Check, ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type LibraryImage = { url: string; name: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Named images (existing dishes) shown as a labelled catalog in the Library tab. */
  library?: LibraryImage[];
  /** Called with the chosen image URL. */
  onSelect: (url: string) => void;
  /** Cloudinary folder to upload into. */
  folder?: string;
}

export default function SelectImageModal({
  open,
  onOpenChange,
  library = [],
  onSelect,
  folder = "menu-items",
}: Props) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? library.filter((i) => i.name.toLowerCase().includes(q)) : library;
  }, [library, query]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be under 2 MB");
        return;
      }
      setUploading(true);
      try {
        const url = await uploadImage(file, folder);
        if (!url) {
          toast.error("Upload failed");
          return;
        }
        onSelect(url);
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err?.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, onSelect, onOpenChange]
  );

  const pick = (url: string) => {
    setSelected(url);
    onSelect(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-center text-xl">Select Image</DialogTitle>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground px-6">
          Select a photo for the dish. Upload a new one or reuse an image from your library.
        </p>

        {/* Tabs + search */}
        <div className="flex items-end justify-between gap-4 px-6 mt-4 border-b">
          <div className="flex items-center gap-6">
            {(["library", "upload"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "pb-2 text-sm font-medium transition-colors -mb-px border-b-2",
                  tab === t
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "library" ? "Library" : "Upload Photo"}
              </button>
            ))}
          </div>
          {tab === "library" && library.length > 0 && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="pl-9 w-56"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[420px] max-h-[60vh] overflow-y-auto">
          {tab === "library" ? (
            library.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-3 opacity-40" />
                <p className="font-medium">No images in your library yet</p>
                <p className="text-sm">Switch to “Upload Photo” to add one.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-24">
                No images match “{query}”.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {filtered.map((img) => (
                  <button
                    key={img.url}
                    onClick={() => pick(img.url)}
                    className={cn(
                      "group rounded-xl border p-3 flex flex-col items-center gap-2 transition-all hover:shadow-sm",
                      selected === img.url
                        ? "border-primary ring-2 ring-primary/25 bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <div className="relative w-full h-20 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.name} className="max-h-full max-w-full object-contain" />
                      {selected === img.url && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center truncate w-full">{img.name}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-28 cursor-pointer transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="w-14 h-14 rounded-full border flex items-center justify-center text-muted-foreground">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <p className="font-medium text-muted-foreground">
                {uploading ? "Uploading…" : "Drag 'n' drop a file here, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground">One image, up to 2 MB</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t">
          <Button
            variant="destructive"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
