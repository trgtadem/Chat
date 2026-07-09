import { Message, User } from './index';

export type RootStackParamList = {
  Auth: undefined;
  Home: { forwardingMessage?: Message } | undefined;
  Chat: {
    user: User;
    friend: User;
    forwardingMessage?: Message;
  };
  Profile: {
    user: User;
  };
  Settings: undefined;
  EditProfile: undefined;
  AddFriend: undefined;
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
};
