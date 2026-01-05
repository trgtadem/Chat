export type User = {
  id: string;
  uid?: string;
  email: string;
  name: string;
  surname: string;
  avatar: string;
  about?: string;
  lastSeen: any; // Firestore ServerTimestamp
  online: boolean;
  pushToken?: string;
};

export type Message = {
  id: string;
  chatId: string;
  text?: string;
  senderId: string;
  createdAt: any; // Firestore ServerTimestamp
  status?: 'sent' | 'read';
  type: 'text' | 'image' | 'audio' | 'file';
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  replyTo?: Message;
  isDeleted?: boolean;
};
