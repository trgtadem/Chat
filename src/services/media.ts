/**
 * Cloudinary medya yukleme/silme.
 * Silme: upload sirasinda alinan delete_token ile delete_by_token (API secret gerekmez).
 */
export type CloudinaryUploadResult = {
  url: string;
  deleteToken?: string;
};

export async function uploadToCloudinary(
  uri: string,
  fileName = 'upload.jpg',
  fileType = 'image/jpeg',
  resourceType: 'image' | 'video' | 'auto' = 'image'
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: fileType,
    name: fileName,
  } as any);
  formData.append('upload_preset', 'my_app');
  formData.append('resource_type', resourceType);
  formData.append('return_delete_token', '1');

  const response = await fetch('https://api.cloudinary.com/v1_1/dhrtxb1ou/auto/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
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
    const response = await fetch('https://api.cloudinary.com/v1_1/dhrtxb1ou/delete_by_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: deleteToken }),
    });
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
