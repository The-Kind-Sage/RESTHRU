import { supabase } from '@/lib/supabase';

const BUCKET = 'uploads';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file     The File object to upload
 * @param folder   Sub-folder inside the bucket, e.g. 'logos', 'avatars', 'menu-items', 'covers'
 * @returns        Public URL string, or null on failure
 */
export async function uploadImage(file: File, folder: string): Promise<string | null> {
  if (!supabase) return null;

  const ext = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
