import React, { useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Star } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type StarredMessagesScreenProps = NativeStackScreenProps<RootStackParamList, 'StarredMessages'>;

export function StarredMessagesScreen({ navigation, route }: StarredMessagesScreenProps) {
  const { friend } = route.params;
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yıldızlı Mesajlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Star size={38} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{friend.name} ile yıldızlı mesajlar</Text>
        <Text style={styles.subtitle}>
          Yıldızlı mesajları listeleme adımı bir sonraki sürümde tamamlanacaktır. Menü ve ekran akışı hazırlandı.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    headerTitle: {
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    iconWrap: {
      width: 78,
      height: 78,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    title: {
      marginTop: 14,
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      color: t.colors.textSecondary,
      marginTop: 10,
      textAlign: 'center',
      lineHeight: 20,
      fontSize: 14 * t.fontScale,
    },
  });
