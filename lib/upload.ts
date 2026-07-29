'use server';

import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { addToLibrary } from './actions/image-library';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

async function ensureDir(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch {}
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uploadImage(file: File, folder: string): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = sanitizeFilename(file.name);
    const filename = `${safeName}.${ext}`;

    const folderPath = join(UPLOAD_DIR, folder);
    await ensureDir(folderPath);

    const filePath = join(folderPath, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${folder}/${filename}`;

    // Persist to image library so it shows in the Library tab
    await addToLibrary({ url, name: safeName, folder });

    return url;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const filePath = join(process.cwd(), 'public', publicId);
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
