/**
 * Cloudinary medya yukleme/silme (unsigned upload + fetch).
 * Not: `cloudinary` npm SDK client-side unsigned upload icin gerekli degil.
 *
 * Silme: delete_token varsa delete_by_token; token yoksa no-op.
 * return_delete_token form alanina EKLENMEMELI — unsigned request'te 400 verir;
 * preset tarafinda acik olmali.
 */
export type CloudinaryUploadResult = {
  url: string;
  deleteToken?: string;
};

const CLOUD_NAME = 'dhrtxb1ou';
const UPLOAD_PRESET = 'my_app';

function sanitizeFileName(name: string, fallbackExt: string): string {
  const cleaned = name.replace(/[^\w.\-]+/g, '_');
  if (cleaned.includes('.')) return cleaned;
  return `${cleaned || 'upload'}.${fallbackExt}`;
}

function endpointFor(resourceType: 'image' | 'video' | 'auto' | 'raw'): string {
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
}

export async function uploadToCloudinary(
  uri: string,
  fileName = 'upload.jpg',
  fileType = 'image/jpeg',
  resourceType: 'image' | 'video' | 'auto' | 'raw' = 'image'
): Promise<CloudinaryUploadResult> {
  const ext =
    resourceType === 'video'
      ? 'mp4'
      : resourceType === 'raw'
        ? 'bin'
        : fileType.includes('png')
          ? 'png'
          : 'jpg';

  const safeName = sanitizeFileName(fileName || `upload.${ext}`, ext);

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: fileType || 'application/octet-stream',
    name: safeName,
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  // return_delete_token / resource_type BODY'de olmamali (unsigned 400)

  const url = endpointFor(resourceType === 'auto' ? 'auto' : resourceType);
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* non-json */
  }

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      data?.error ||
      raw?.slice?.(0, 200) ||
      `HTTP ${response.status}`;
    console.error('Cloudinary upload failed:', response.status, msg);
    throw new Error(typeof msg === 'string' ? msg : 'Upload failed');
  }

  if (!data?.secure_url) {
    console.error('Cloudinary upload: secure_url yok', data);
    throw new Error('Upload URL yok');
  }

  return {
    url: data.secure_url as string,
    deleteToken: typeof data.delete_token === 'string' ? data.delete_token : undefined,
  };
}

/** Cloudinary'den gercek silme (delete_token ile). Token yoksa no-op. */
export async function deleteFromCloudinary(
  _fileUrl: string,
  deleteToken?: string | null
): Promise<void> {
  if (!deleteToken) {
    console.warn('Cloudinary silme atlandi: delete_token yok (eski medya)');
    return;
  }
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: deleteToken }),
      }
    );
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('Cloudinary silme basarisiz:', response.status, body);
      return;
    }
    console.log('Cloudinary medya silindi');
  } catch (error) {
    console.error('Cloudinary silme hatasi:', error);
  }
}
