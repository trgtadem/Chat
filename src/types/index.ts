export type User = {
  id: string;
  uid?: string;
  email: string;
  name: string;
  surname: string;
  avatar: string;
  about?: string;
  lastSeen: any;
  online: boolean;
  lastActive?: any;
  pushToken?: string;
  friendCode?: string;
  privacy?: {
    showOnline: boolean;
    showReadReceipts: boolean;
  };
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

export type MessageType = 'text' | 'image' | 'audio' | 'file' | 'video';

export type Message = {
  id: string;
  chatId: string;
  text?: string;
  senderId: string;
  createdAt: any;
  status?: 'sent' | 'delivered' | 'read';
  deliveredAt?: any;
  readAt?: any;
  type: MessageType;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  videoUrl?: string;
  fileName?: string;
  fileType?: string;
  replyTo?: Message;
  /** Herkes icin soft delete */
  isDeleted?: boolean;
  /** Yalnizca bu uid'ler icin gizle */
  deletedFor?: string[];
  forwarded?: boolean;
  forwardedFrom?: string;
  cloudinaryDeleteToken?: string | null;
  /** uid -> emoji */
  reactions?: Record<string, string>;
  editedAt?: any;
};

export type BlockedUser = {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: any;
  user?: User;
};

export type WallpaperOption = {
  id: string;
  type: 'color' | 'gradient' | 'pattern' | 'image';
  value: string;
  gradient?: string[];
  pattern?: string;
  patternColor?: string;
  preview?: string;
  name?: string;
};

export type ThemeMode = 'system' | 'light' | 'dark' | 'amoled';

export type ThemeSettings = {
  mode: ThemeMode;
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

/** Grup ozeti (Home listesi) */
export type GroupSummary = {
  id: string;
  name: string;
  avatar?: string;
  memberIds: string[];
  createdBy: string;
  updatedAt?: any;
  lastMessage?: any;
};

export type GroupMember = {
  uid: string;
  role: 'admin' | 'member';
  name: string;
  surname: string;
  avatar: string;
  joinedAt: any;
};

/** 24s durum */
export type StatusItem = {
  id: string;
  uid: string;
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  createdAt: any;
  expiresAt: any;
  viewedBy?: string[];
  authorName?: string;
  authorAvatar?: string;
};
