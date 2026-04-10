import { Message, User } from './index';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
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
