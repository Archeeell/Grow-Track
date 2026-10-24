import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';

const useStyles = makeStyles(({ colors }) => ({
  wrap: {
    gap: 6,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.foreground,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
}));

export function Field({
  label,
  hint,
  placeholderTextColor,
  ...input
}: TextInputProps & { label: string; hint?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
        style={styles.input}
        {...input}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
