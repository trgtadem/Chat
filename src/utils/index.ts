export const getChatId = (user1Id: string, user2Id: string) => {
  const sortedIds = [user1Id, user2Id].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Kolay okunur, karistirilabilir karakterler (0/O, 1/I/L) cikarilmis alfabe
const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** 8 haneli, okunur bir arkadas kodu uretir (or. "K7QMPX2R"). */
export const generateFriendCode = (length = 8): string => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += FRIEND_CODE_ALPHABET[Math.floor(Math.random() * FRIEND_CODE_ALPHABET.length)];
  }
  return code;
};

export const formatTime = (timestamp: any) => {
  try {
    if (!timestamp) return '';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Format time error:', error);
    return '';
  }
};

export const formatLastSeen = (timestamp: any) => {
  try {
    if (!timestamp) return '';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Bugün ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} ${timeStr}`;
    }
  } catch (error) {
    console.error('Format last seen error:', error);
    return '';
  }
};
