import { Message, StatusItem, User } from './index';

export type RootStackParamList = {
  Auth: undefined;
  Home: { forwardingMessage?: Message } | undefined;
  Chat: {
    user: User;
    friend: User;
    forwardingMessage?: Message;
    focusMessageId?: string;
  };
  Profile: {
    user: User;
  };
  Settings: undefined;
  EditProfile: undefined;
  AddFriend: undefined;
  ScanFriendQR: undefined;
  Themes: undefined;
  Security: undefined;
  Privacy: undefined;
  BlockedUsers: undefined;
  About: undefined;
  StarredMessages: {
    friend: User;
  };
  ChatWallpaper: {
    friend: User;
  };
  SharedMedia: {
    friend: User;
    messages: Message[];
  };
  CreateGroup: undefined;
  GroupChat: {
    groupId: string;
    groupName: string;
  };
  Call: {
    friend: User;
    isVideo: boolean;
    isIncoming?: boolean;
    callId?: string;
  };
  StatusCompose: undefined;
  StatusViewer: {
    statuses: StatusItem[];
    startIndex?: number;
  };
};
