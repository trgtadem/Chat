export type User = {
  uid: string;
  email: string;
  lastSeen: any; // Firestore ServerTimestamp
  online: boolean;
};

export type Message = {
  id: string;
  chatId: string;
  text: string;
  senderId: string;
  createdAt: any; // Firestore ServerTimestamp
  read: boolean;
};
