import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Button } from '../components/Button';

type Props = {
  title: string;
  onBack?: () => void;
  rightLabel?: string;
  onRight?: () => void;
  children: ReactNode;
};

export function Screen({ title, onBack, rightLabel, onRight, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {onBack ? <Button label="Back" variant="ghost" onPress={onBack} /> : <View style={styles.spacer} />}
        <Text style={styles.title}>{title}</Text>
        {rightLabel && onRight ? (
          <Button label={rightLabel} variant="ghost" onPress={onRight} />
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
      {children}
    </SafeAreaView>
  );
}

export function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 52,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  spacer: {
    minWidth: 64,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 48,
    gap: spacing.md,
  },
});
