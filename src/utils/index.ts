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

export async function sendPushNotification(pushToken: string, title: string, body: string) {
  if (!pushToken) {
    console.warn('Push token is empty, skipping notification');
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Push notification failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
}