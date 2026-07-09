import { useMemo } from 'react';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

/** Tekrarlayan `useMemo(() => makeStyles(theme), [theme])` desenini sarmalar. */
export function useThemedStyles<T>(makeStyles: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [theme, makeStyles]);
}
