/** QR / metin girisinden arkadas kodunu temizler (buyuk harf, alfanumerik). */
export function normalizeFriendCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function isValidFriendCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}
