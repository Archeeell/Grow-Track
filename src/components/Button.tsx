import {
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import { spacing } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const useStyles = makeStyles(({ colors }) => ({
  base: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: withAlpha(colors.destruct, 0.10),
    borderWidth: 1,
    borderColor: colors.destruct,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 15,
  },
  label_primary: {
    color: colors.primaryForeground,
  },
  label_secondary: {
    color: colors.foreground,
  },
  label_ghost: {
    color: colors.foreground,
  },
  label_danger: {
    color: colors.destruct,
  },
}));

export function Button({
  label,
  variant = 'primary',
  style,
  ...rest
}: PressableProps & { label: string; variant?: Variant }) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text style={[styles.label, styles[`label_${variant}` as keyof typeof styles] as object]}>
        {label}
      </Text>
    </Pressable>
  );
}
