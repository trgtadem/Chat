/**
 * Cloudinary medya yukleme — tum ekranlar bu servisi kullanir.
 */
export async function uploadToCloudinary(
  uri: string,
  fileName = 'upload.jpg',
  fileType = 'image/jpeg',
  resourceType: 'image' | 'video' | 'auto' = 'image'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: fileType,
    name: fileName,
  } as any);
  formData.append('upload_preset', 'my_app');
  formData.append('resource_type', resourceType);

  const response = await fetch('https://api.cloudinary.com/v1_1/dhrtxb1ou/auto/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.secure_url as string;
}

/** Silme istegi (gercek silme Cloud Function ile yapilmali). */
export async function deleteFromCloudinary(fileUrl: string): Promise<void> {
  try {
    const parts = fileUrl.split('/');
    const fileNameWithExtension = parts[parts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0];
    console.log(`Media deletion requested for public_id: ${publicId}`);
  } catch (error) {
    console.error('Error during media cleanup:', error);
  }
}
