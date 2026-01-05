# Migration Guide: Manual Navigation → React Navigation

## What Changed?

The app previously used manual state management for navigation (`activeScreen` state in App.tsx). Now it uses **React Navigation's Native Stack Navigator** for proper navigation management.

## Breaking Changes

### Before (Old Code):
```typescript
// Old App.tsx
const [activeScreen, setActiveScreen] = useState<"AUTH" | "HOME" | "CHAT">("AUTH");
const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

// Manual navigation via state
if (activeScreen === "AUTH") render(<AuthScreen />)
if (activeScreen === "HOME") render(<HomeScreen onSelectChat={() => setActiveScreen("CHAT")} />)
if (activeScreen === "CHAT") render(<ChatScreen onBack={() => setActiveScreen("HOME")} />)
```

### After (New Code):
```typescript
// New App.tsx with React Navigation
<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Auth" component={AuthScreen} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
</NavigationContainer>
```

## Component Signature Changes

### HomeScreen
**Before:**
```typescript
export function HomeScreen({ 
  currentUser, 
  onSelectChat,    // ← Callback
  onLogout 
})
```

**After:**
```typescript
export function HomeScreen({ 
  currentUser, 
  onLogout,
  navigation     // ← Navigation prop (React Navigation)
})
```

**Navigation Usage:**
```typescript
// Before: onSelectChat(friend)
// After:
navigation.navigate('Chat', { user: currentUser, friend })
```

### ChatScreen
**Before:**
```typescript
export function ChatScreen({ 
  user, 
  friend, 
  onBack   // ← Callback
})
```

**After:**
```typescript
export function ChatScreen({ 
  route,        // ← Route params
  navigation    // ← Navigation prop
  currentUser 
})

// Access params:
const { user, friend } = route.params;

// Go back:
navigation.goBack()
```

### AuthScreen
**Before:**
```typescript
export function AuthScreen({ 
  onLoginSuccess   // ← Callback
})
```

**After:**
```typescript
export function AuthScreen({ 
  navigation   // ← Navigation prop
})

// No callback needed - authentication state handled by App.tsx
```

## New Profile Screen

### Access Profile Screen
**From HomeScreen:**
```typescript
<TouchableOpacity onPress={() => navigation.navigate('Profile', { user: currentUser })}>
  <Settings size={24} />
</TouchableOpacity>
```

**From ChatScreen Header:**
```typescript
<TouchableOpacity onPress={() => navigation.navigate('Profile', { user: currentUser })}>
  <MoreVertical size={24} />
</TouchableOpacity>
```

## Updated Message Types

All message operations now use the extended `Message` type:

```typescript
type Message = {
  // Existing
  id: string;
  text?: string;
  senderId: string;
  status?: 'sent' | 'read';
  
  // New
  type: 'text' | 'image' | 'audio' | 'file';
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  replyTo?: Message;       // For quoted messages
  isDeleted?: boolean;     // For deleted messages
};
```

## Dependencies Check

Ensure these are installed:
```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-image-viewing
npm install expo-av expo-document-picker
# Already in your package.json:
# - expo-image-picker
# - firebase
# - react-native-gesture-handler
```

## Firestore Schema Updates

### New `chats/{chatId}` fields:
```typescript
{
  typing: {
    [userId]: boolean   // For typing indicator
  }
}
```

### Updated `messages/{msgId}` fields:
```typescript
{
  type: 'text' | 'image' | 'audio' | 'file',  // Was: 'text' | 'image'
  audioUrl?: string,         // New
  fileUrl?: string,          // New
  fileName?: string,         // New
  replyTo?: Message,         // New
  isDeleted?: boolean,       // New
}
```

## No Changes Required To

- `AuthScreen` login/registration logic
- `HomeScreen` chat list queries
- `ChatScreen` message sending logic (just updated the structure)
- Firestore security rules (same paths, just new fields)
- `utils/index.ts` helper functions
- `styles/baseStyles.ts` color scheme

## Testing Guide

1. **Test Navigation Flow:**
   - Start app → Should show Auth screen
   - Login → Should navigate to Home
   - Click chat → Should navigate to Chat
   - Back button → Should return to Home
   - Settings icon → Should navigate to Profile
   - Back from Profile → Should return to previous screen

2. **Test New Features:**
   - Edit profile → Should save to Firestore
   - Send image → Should upload to Cloudinary and display
   - Click image → Should open full-screen viewer
   - Type message → Should show "typing..." on recipient
   - Long-press mic → Should record and upload audio
   - Click "+" → Should pick and upload file
   - Swipe right → Should show reply/delete options
   - Reply to message → Should show quoted text

3. **Test Error Handling:**
   - Try uploading without permissions → Should show alert
   - Loss of connection during upload → Should show error
   - Delete message → Should confirm and hide content

## Performance Tips

- The `useLayoutEffect` hook is used for header customization (executes synchronously)
- Typing indicator is debounced (2-second timeout) to reduce Firestore writes
- Audio recording auto-stops after 60 seconds
- Image list is memoized for the image viewer
- Messages are virtualized via FlatList

## Common Issues & Solutions

### Issue: "Cannot find module './src/screens/ProfileScreen'"
**Solution**: This is a TypeScript cache issue. Restart the TypeScript server or reload VS Code.

### Issue: Navigation params not received
**Solution**: Ensure you're accessing `route.params` properly:
```typescript
const { user, friend } = route.params;  // ✅ Correct
const { user, friend } = props.route.params;  // Also works
```

### Issue: Back button not working
**Solution**: React Navigation handles back buttons automatically. Don't override unless necessary.

### Issue: Typing indicator not appearing
**Solution**: Ensure Firestore path `chats/{chatId}/typing` is being updated and listened to.

## Migration Completed ✅

Your app is now fully migrated to React Navigation with all advanced features implemented!
