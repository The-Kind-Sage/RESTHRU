'use server';

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const LIBRARY_FILE = join(process.cwd(), 'public', 'uploads', '_library.json');

export type LibraryEntry = { url: string; name: string; folder: string; createdAt: string };

async function ensureDir() {
  try {
    await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true });
  } catch {}
}

export async function getLibrary(): Promise<LibraryEntry[]> {
  try {
    await ensureDir();
    const data = await readFile(LIBRARY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function addToLibrary(entry: Omit<LibraryEntry, 'createdAt'>): Promise<LibraryEntry> {
  const library = await getLibrary();
  // Avoid duplicates by URL
  if (library.some((e) => e.url === entry.url)) {
    return { ...entry, createdAt: '' };
  }
  const newEntry: LibraryEntry = { ...entry, createdAt: new Date().toISOString() };
  library.push(newEntry);
  await ensureDir();
  await writeFile(LIBRARY_FILE, JSON.stringify(library, null, 2));
  return newEntry;
}

export async function removeFromLibrary(url: string): Promise<boolean> {
  const library = await getLibrary();
  const filtered = library.filter((e) => e.url !== url);
  if (filtered.length === library.length) return false;
  await ensureDir();
  await writeFile(LIBRARY_FILE, JSON.stringify(filtered, null, 2));
  return true;
}
