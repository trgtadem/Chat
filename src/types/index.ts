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
  type: 'color' | 'gradient' | 'image';
  value: string;
  preview?: string;
  name?: string;
};

export type ThemeSettings = {
  appearance: 'dark' | 'light' | 'system';
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
