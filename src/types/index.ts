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
  /** Benzersiz arkadas kodu (paylasilarak arkadas eklemek icin) */
  friendCode?: string;
};

/** Arkadaslik istegi (users/{toUid}/friendRequests/{fromUid}) */
export type FriendRequest = {
  fromUid: string;
  toUid: string;
  fromUser: {
    name: string;
    surname: string;
    avatar: string;
    friendCode?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
};

/** Denormalize arkadas kaydi (users/{uid}/friends/{friendUid}) */
export type Friend = {
  id: string;
  name: string;
  surname: string;
  avatar: string;
  since: any;
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
  fileType?: string;
  replyTo?: Message;
  isDeleted?: boolean;
  forwarded?: boolean;
  forwardedFrom?: string;
};

export type BlockedUser = {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: any;
  user?: User;
};

export type Session = {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  ip?: string;
  location?: string;
  lastActive: any;
  isCurrent: boolean;
};

export type WallpaperOption = {
  id: string;
  type: 'color' | 'gradient' | 'pattern' | 'image';
  /** color: hex; image: url; pattern: taban renk hex */
  value: string;
  /** gradient tipi icin renk duraklari */
  gradient?: string[];
  /** pattern tipi icin desen anahtari (ChatBackground'da cizilir) */
  pattern?: string;
  /** pattern desen rengi (opsiyonel) */
  patternColor?: string;
  preview?: string;
  name?: string;
};

export type ThemeMode = 'system' | 'light' | 'dark' | 'amoled';

export type ThemeSettings = {
  /** Gorunum modu */
  mode: ThemeMode;
  /** Vurgu (accent) rengi - hex */
  accentColor: string;
  chatBubbleStyle: 'default' | 'minimal' | 'rounded';
  fontSize: 'small' | 'medium' | 'large';
  globalWallpaper?: WallpaperOption;
};

export type ChatSettings = {
  chatId: string;
  wallpaper?: WallpaperOption;
  muted: boolean;
  mutedUntil?: any;
  customNotificationSound?: string;
};

export type SharedMedia = {
  images: Message[];
  files: Message[];
  links: Message[];
};
