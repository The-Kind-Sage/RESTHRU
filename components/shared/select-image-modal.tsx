"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, ImageIcon, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";

export type LibraryImage = { url: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  library: LibraryImage[];
  onSelect: (url: string) => void;
};

export default function SelectImageModal({ open, onOpenChange, library, onSelect }: Props) {
  const [tab, setTab] = useState("library");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "menu");
      if (url) {
        onSelect(url);
        onOpenChange(false);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [onSelect, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library"><ImageIcon className="h-4 w-4 mr-2" />Library</TabsTrigger>
            <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="mt-4">
            {library.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No images in library.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {library.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => { onSelect(img.url); onOpenChange(false); }}
                    className="group relative aspect-square rounded-md overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all"
                  >
                    <Image src={img.url} alt={img.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Check className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <span className="text-xs text-white truncate block">{img.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Click to upload an image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP — max 5MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "Choose File"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
