export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: Date | null;
  createdAt?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  timestamp: Date;
  read?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
  unreadCount?: number;
}

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: Date;
  user?: User;
}

export interface Session {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  ip?: string;
  location?: string;
  lastActive: Date;
  isCurrent: boolean;
}

export interface WallpaperOption {
  id: string;
  type: 'color' | 'gradient' | 'image';
  value: string;
  preview?: string;
  name?: string;
}

export interface ThemeSettings {
  appearance: 'dark' | 'light' | 'system';
  chatBubbleStyle: 'default' | 'minimal' | 'rounded';
  fontSize: 'small' | 'medium' | 'large';
  globalWallpaper?: WallpaperOption;
}

export interface ChatSettings {
  chatId: string;
  wallpaper?: WallpaperOption;
  muted: boolean;
  mutedUntil?: Date | null;
  customNotificationSound?: string;
}

export interface SharedMedia {
  images: Message[];
  files: Message[];
  links: Message[];
}
