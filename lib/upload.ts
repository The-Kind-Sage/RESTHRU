'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function uploadImage(file: File, folder: string): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads', folder);
    const filepath = path.join(dir, filename);

    await mkdir(dir, { recursive: true });
    await writeFile(filepath, buffer);

    return `/uploads/${folder}/${filename}`;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}
