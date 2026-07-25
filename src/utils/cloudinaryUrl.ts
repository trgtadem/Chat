/**
 * Cloudinary delivery URL transform helper.
 * https://res.cloudinary.com/<cloud>/image/upload/v123/folder/id.jpg
 * → insert transforms after /upload/
 */
export function cloudinaryTransform(
  url: string | undefined | null,
  transform: string
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  // Avoid double-transform
  if (url.includes(`/upload/${transform}/`)) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
}

export function avatarUrl(url?: string | null): string {
  return cloudinaryTransform(url, 'w_120,h_120,c_fill,q_auto,f_auto');
}

export function chatThumbUrl(url?: string | null): string {
  return cloudinaryTransform(url, 'w_480,c_limit,q_auto,f_auto');
}

export function videoPosterUrl(url?: string | null): string {
  if (!url) return '';
  // Video delivery → jpg frame
  if (url.includes('/video/upload/')) {
    return cloudinaryTransform(
      url.replace('/video/upload/', '/video/upload/').replace(/\.[a-z0-9]+$/i, '.jpg'),
      'so_0,w_480,c_limit,q_auto,f_jpg'
    );
  }
  return cloudinaryTransform(url, 'w_480,c_limit,q_auto,f_auto');
}
