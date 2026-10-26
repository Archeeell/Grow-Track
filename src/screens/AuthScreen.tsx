/**
 * AuthScreen — pixel-faithful replica of Figma Make Auth.tsx.
 * Login, Register (signup), Forgot Password in one component with `page` prop.
 *
 * Source: Auth.tsx (Figma Make live bundle index-Dl027h-2.js)
 * Spec: docs/auth-figma-spec.md
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import {
  farmStorageKey,
  getPreviewPasswordHash,
  hashPassword,
  readProfiles,
  saveProfile,
  startSession,
} from '../auth/authStorage';
import { fonts } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  MailIcon,
  SproutIcon,
} from '../components/auth/AuthIcons';

// ─── Types ────────────────────────────────────────────────────────────────────
export type AuthPage = 'login' | 'signup' | 'forgot';

type Props = {
  page: AuthPage;
  onNavigate: (page: AuthPage) => void;
  onAuthSuccess: () => void;
};

type FieldKey = 'name' | 'email' | 'password' | 'confirm' | 'agreement' | 'form';
type Errors = Partial<Record<FieldKey, string>>;
type Values = { name: string; email: string; password: string; confirm: string };

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STRENGTH_COLORS: string[] = ['', '#e96a6a', '#e6c16a', '#4ca8ff', '#45d483'];
const cssEaseOut = Easing.out(Easing.ease);

const useFldStyles = makeStyles(({ colors }) => ({
  label: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.foreground, marginBottom: 8, includeFontPadding: false },
  inputWrapper: { position: 'relative' },
  input: { width: '100%', minHeight: 48, borderRadius: 12, borderWidth: 1, backgroundColor: colors.input, paddingHorizontal: 16, fontSize: 14, fontFamily: fonts.body, color: colors.foreground, includeFontPadding: false },
  inputPassword: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 4, top: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
  errorIcon: { marginTop: 4 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.destruct, fontFamily: fonts.body, includeFontPadding: false },
}));

const useStyles = makeStyles(({ colors }) => ({
  flex: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.bg,
    ...(Platform.OS === 'web' ? ({ borderLeftWidth: 1, borderRightWidth: 1, borderColor: withAlpha(colors.border, 0.70) } as object) : {}),
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { justifyContent: 'center' },
  headerBetween: { justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44, height: 44 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.pixelSemiBold, fontSize: 23, color: colors.primary, includeFontPadding: false, lineHeight: 28 },
  logoDot: { color: colors.accentBlue },
  farmVisual: { position: 'relative', width: 240, alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-end' },
  farmRow: { position: 'absolute', bottom: 24, width: 192, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 16 },
  pepperSeed: { width: 28, height: 28, marginBottom: 4 },
  farmSproutMid: { marginBottom: 4 },
  farmCenter: { flexDirection: 'column', alignItems: 'center' },
  pepperItem: { width: 36, height: 36 },
  groundBar: { position: 'absolute', bottom: 0, width: 192, borderTopWidth: 2, borderTopColor: withAlpha(colors.primary, 0.60) },
  groundGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  groundSpan: { width: 16, height: 12 },
  headingBlock: { alignItems: 'center', marginTop: 20 },
  headingBlockLogin: { marginBottom: 24 },
  headingBlockSignup: { marginBottom: 16 },
  h1: { fontFamily: fonts.pixel, fontSize: 32, lineHeight: 40, color: colors.foreground, textAlign: 'center', includeFontPadding: false },
  subtitle: { fontSize: 13, lineHeight: 20, color: colors.mutedForeground, textAlign: 'center', marginTop: 8, maxWidth: 320, fontFamily: fonts.body, includeFontPadding: false },
  form: {},
  formLogin: { gap: 16 },
  formSignup: { gap: 12 },
  strengthContainer: { marginTop: -4 },
  strengthBars: { flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 4 },
  strengthHint: { fontSize: 11, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false, marginTop: 6 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rememberLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  rememberText: { fontSize: 12, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  forgotBtn: { minHeight: 44, justifyContent: 'center' },
  forgotText: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.accentBlue, includeFontPadding: false },
  checkbox: { width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: colors.mutedForeground, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.primaryForeground, fontSize: 10, lineHeight: 12, includeFontPadding: false },
  agreementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  agreementText: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  agreementLink: { color: colors.accentBlue, textDecorationLine: 'underline', textDecorationColor: withAlpha(colors.accentBlue, 0.40) },
  primaryBtn: { flexDirection: 'row', minHeight: 48, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, backgroundColor: colors.primary, paddingHorizontal: 16 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.primaryForeground, includeFontPadding: false },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 10, letterSpacing: 0.5, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  googleBtn: { flexDirection: 'row', minHeight: 48, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16 },
  googleBtnText: { fontSize: 14, fontFamily: fonts.body, color: colors.foreground, includeFontPadding: false },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 },
  noticeIcon: { marginTop: 2 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  footer: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 12, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  switchLink: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  guestBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  guestBtnText: { fontSize: 13, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  guestInfo: { fontSize: 10, color: withAlpha(colors.mutedForeground, 0.80), fontFamily: fonts.body, includeFontPadding: false },
  sentContainer: { alignItems: 'center', paddingVertical: 20 },
  sentIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: withAlpha(colors.primary, 0.10), alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  sentTitle: { fontFamily: fonts.pixel, fontSize: 24, color: colors.foreground, includeFontPadding: false },
  sentBody: { fontSize: 14, color: colors.mutedForeground, fontFamily: fonts.body, textAlign: 'center', marginTop: 8, includeFontPadding: false },
  sentEmail: { fontFamily: fonts.bodySemiBold, color: colors.foreground },
  sentNote: { fontSize: 12, lineHeight: 20, color: colors.mutedForeground, fontFamily: fonts.body, textAlign: 'center', marginTop: 12, includeFontPadding: false },
  linkBtn: { marginTop: 8, minHeight: 44, justifyContent: 'center' },
  linkText: { fontSize: 12, fontFamily: fonts.body, includeFontPadding: false },
  details: { marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  detailsText: { fontSize: 11, lineHeight: 20, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  detailsHighlight: { color: colors.foreground },
}));

// ─── AuthField (proper sub-component so useState is valid) ────────────────────
type AuthFieldProps = {
  fieldKey: keyof Values;
  label: string;
  value: string;
  error?: string;
  isPassword?: boolean;
  visible?: boolean;
  isSignup: boolean;
  inputRef?: React.RefObject<TextInputInstance | null>;
  onChangeText: (v: string) => void;
  onToggleVisible?: () => void;
  onSubmitEditing: () => void;
};

function AuthField({
  fieldKey,
  label,
  value,
  error,
  isPassword = false,
  visible = false,
  isSignup,
  inputRef,
  onChangeText,
  onToggleVisible,
  onSubmitEditing,
}: AuthFieldProps) {
  const fldStyles = useFldStyles();
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  const keyboardType = fieldKey === 'email' ? 'email-address' as const : 'default' as const;
  let autoComplete: 'nickname' | 'email' | 'new-password' | 'current-password' | 'username' = 'username';
  if (fieldKey === 'name') autoComplete = 'nickname';
  else if (fieldKey === 'email') autoComplete = 'email';
  else if (isPassword) autoComplete = isSignup ? 'new-password' : 'current-password';

  const autoCapitalize = fieldKey === 'name' ? 'words' as const : 'none' as const;

  const placeholder =
    fieldKey === 'name' ? 'Your Growtopia name' :
    fieldKey === 'email' ? 'you@example.com' :
    fieldKey === 'confirm' ? 'Re-enter your password' :
    'Enter your password';

  const borderColor = hasError ? colors.destruct : isFocused ? colors.primary : colors.border;
  const webStyle = Platform.OS === 'web'
    ? ({ outlineStyle: 'none', ...(isFocused ? { boxShadow: `0 0 0 2px ${withAlpha(colors.primary, 0.15)}` } : {}) } as object)
    : {};

  return (
    <View>
      <Text style={fldStyles.label}>{label}</Text>
      <View style={fldStyles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={[
            fldStyles.input,
            ...(isPassword ? [fldStyles.inputPassword] : []),
            { borderColor },
            ...(Platform.OS === 'web' ? [{ outlineStyle: 'none', ...(isFocused ? { boxShadow: `0 0 0 2px ${withAlpha(colors.primary, 0.15)}` } : {}) } as object] : []),
          ] as object[]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          spellCheck={false}
          maxLength={fieldKey === 'name' ? 40 : 254}
          secureTextEntry={isPassword && !visible}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType={fieldKey === 'confirm' ? 'done' : 'next'}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && onToggleVisible && (
          <TouchableOpacity onPress={onToggleVisible} style={fldStyles.eyeBtn} accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${fieldKey === 'confirm' ? 'confirm password' : 'password'}`} accessibilityRole="button">
            {visible ? <EyeOffIcon size={18} color={colors.mutedForeground} /> : <EyeIcon size={18} color={colors.mutedForeground} />}
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <View style={fldStyles.errorRow}>
          <View style={fldStyles.errorIcon}><CircleAlertIcon size={13} color={colors.destruct} /></View>
          <Text style={fldStyles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── AuthScreen ───────────────────────────────────────────────────────────────
export function AuthScreen({ page, onNavigate, onAuthSuccess }: Props) {
  const styles = useStyles();
  const fldStyles = useFldStyles();
  const { colors } = useTheme();
  const { setAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const signup = page === 'signup';
  const forgot = page === 'forgot';

  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const nameRef = useRef<TextInputInstance | null>(null);
  const emailRef = useRef<TextInputInstance | null>(null);
  const passwordRef = useRef<TextInputInstance | null>(null);
  const confirmRef = useRef<TextInputInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    setValues({ name: '', email: '', password: '', confirm: '' });
    setErrors({});
    setNotice('');
    setSent(false);
    setBusy(false);
    setAgreed(false);
    setShowPassword(false);
    setShowConfirm(false);
    setDetailsOpen(false);
    enterOpacity.setValue(0);
    enterTranslateY.setValue(8);
    Animated.parallel([
      Animated.timing(enterOpacity, { toValue: 1, duration: 200, easing: cssEaseOut, useNativeDriver: true }),
      Animated.timing(enterTranslateY, { toValue: 0, duration: 200, easing: cssEaseOut, useNativeDriver: true }),
    ]).start();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const criteriaScore = [
    values.password.length >= 8,
    /[a-z]/.test(values.password) && /[A-Z]/.test(values.password),
    /\d/.test(values.password),
    /[^a-zA-Z0-9]/.test(values.password),
  ].filter(Boolean).length;
  const score = values.password.length < 8 ? Math.min(2, criteriaScore) : criteriaScore;

  const change = useCallback((key: keyof Values, val: string) => {
    setValues((c) => ({ ...c, [key]: val }));
    setErrors((c) => ({ ...c, [key]: '', form: '' }));
    setNotice('');
  }, []);

  const fail = useCallback((next: Errors) => {
    setErrors(next);
    const first = Object.keys(next)[0] as FieldKey;
    requestAnimationFrame(() => {
      if (first === 'name') nameRef.current?.focus();
      else if (first === 'email') emailRef.current?.focus();
      else if (first === 'password') passwordRef.current?.focus();
      else if (first === 'confirm') confirmRef.current?.focus();
    });
  }, []);

  const submit = useCallback(async () => {
    const next: Errors = {};
    const email = values.email.trim().toLowerCase();
    if (signup && !values.name.trim()) next.name = 'Enter your display name.';
    if (!email) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
    if (!forgot && !values.password) next.password = 'Enter your password.';
    if (signup) {
      if (values.password && (values.password.length < 8 || score < 3))
        next.password = 'Use 8+ characters with upper/lowercase letters and a number or symbol.';
      if (!values.confirm) next.confirm = 'Confirm your password.';
      else if (values.confirm !== values.password) next.confirm = "Passwords don't match.";
      if (!agreed) next.agreement = 'Please agree to the terms and privacy notice.';
      if (!next.email) {
        const profs = await readProfiles();
        if (profs.some((p) => p.email === email))
          next.email = 'This email is already registered in the preview. Sign in instead.';
      }
    }
    if (Object.keys(next).length) { fail(next); return; }
    setBusy(true);
    setErrors({});
    timerRef.current = setTimeout(async () => {
      setBusy(false);
      if (forgot) { setSent(true); return; }
      if (!signup) {
        const profs = await readProfiles();
        const profile = profs.find((p) => p.email === email);
        if (!profile) { fail({ email: 'No preview account found. Create an account or try the demo below.' }); return; }
        const previewHash = await getPreviewPasswordHash();
        const inputHash = await hashPassword(values.password);
        if (inputHash !== previewHash) { fail({ password: 'Incorrect password. Use the preview password shown below.' }); return; }
        await setAccount({ mode: 'member', name: profile.name, email }, remember);
      } else {
        const profile = { name: values.name.trim(), email };
        await saveProfile(profile);
        try {
          const guestFarms = await AsyncStorage.getItem('growtrack-guest-farms');
          if (guestFarms) await AsyncStorage.setItem(farmStorageKey({ mode: 'member', ...profile }), guestFarms);
        } catch { /* ignore */ }
        await setAccount({ mode: 'member', name: profile.name, email }, true);
      }
      onAuthSuccess();
    }, 550);
  }, [values, signup, forgot, agreed, score, remember, fail, setAccount, onAuthSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGuest = useCallback(async () => {
    await startSession({ mode: 'guest', name: 'Guest' }, true);
    await setAccount({ mode: 'guest', name: 'Guest' }, true);
    onAuthSuccess();
  }, [setAccount, onAuthSuccess]);

  const safePaddingTop = Math.max(24, insets.top);
  const safePaddingBottom = Math.max(24, insets.bottom);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { paddingTop: safePaddingTop, paddingBottom: safePaddingBottom, opacity: enterOpacity, transform: [{ translateY: enterTranslateY }] }]}>

          {/* Header */}
          <View style={[styles.header, page !== 'login' ? styles.headerBetween : styles.headerCenter]}>
            {page !== 'login' && (
              <Pressable onPress={() => onNavigate('login')} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} accessibilityLabel="Back to sign in" accessibilityRole="button">
                <ArrowLeftIcon size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
            <GrowTrackLogo />
            {page !== 'login' && <View style={styles.headerSpacer} />}
          </View>

          {/* Farm Visual */}
          <FarmVisual compact={signup || forgot} />

          {/* Heading */}
          <View style={[styles.headingBlock, signup ? styles.headingBlockSignup : styles.headingBlockLogin]}>
            <Text style={styles.h1} allowFontScaling={false}>
              {forgot ? 'Reset your password' : signup ? 'Create Account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {forgot ? "Enter your email and we'll send you a link to reset your password."
                : signup ? 'A place for all your farms.'
                : "Your worlds are growing. Let's check in."}
            </Text>
          </View>

          {/* Sent confirmation */}
          {sent ? (
            <View style={styles.sentContainer}>
              <View style={styles.sentIconWrap}><MailIcon size={26} color={colors.primary} /></View>
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentBody}>Reset link requested for <Text style={styles.sentEmail}>{values.email.trim()}</Text>.</Text>
              <Text style={styles.sentNote}>This is a preview confirmation. No email has been sent.</Text>
              <Pressable onPress={() => onNavigate('login')} style={({ pressed }) => [styles.primaryBtn, { marginTop: 24 }, pressed && styles.pressed]}>
                <Text style={styles.primaryBtnText}>Back to sign in</Text>
              </Pressable>
              <TouchableOpacity onPress={() => { setSent(false); setNotice(''); }} style={styles.linkBtn}>
                <Text style={[styles.linkText, { color: colors.accentBlue }]}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Form */}
              <View style={[styles.form, signup ? styles.formSignup : styles.formLogin]}>
                {signup && (
                  <AuthField fieldKey="name" label="Display name" value={values.name} error={errors.name} isSignup={signup} inputRef={nameRef} onChangeText={(v) => change('name', v)} onSubmitEditing={() => emailRef.current?.focus()} />
                )}
                <AuthField fieldKey="email" label="Email" value={values.email} error={errors.email} isSignup={signup} inputRef={emailRef} onChangeText={(v) => change('email', v)} onSubmitEditing={() => forgot ? void submit() : passwordRef.current?.focus()} />
                {!forgot && (
                  <AuthField fieldKey="password" label="Password" value={values.password} error={errors.password} isPassword visible={showPassword} isSignup={signup} inputRef={passwordRef} onChangeText={(v) => change('password', v)} onToggleVisible={() => setShowPassword(!showPassword)} onSubmitEditing={() => signup ? confirmRef.current?.focus() : void submit()} />
                )}

                {/* Password strength (signup only) */}
                {signup && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBars}>
                      {[0, 1, 2, 3].map((i) => (
                        <View key={i} style={[styles.strengthBar, { backgroundColor: i < score && score > 0 ? STRENGTH_COLORS[score] : colors.secondary }]} />
                      ))}
                    </View>
                    <Text style={styles.strengthHint}>8+ characters · mix letters, numbers, and symbols</Text>
                  </View>
                )}

                {signup && (
                  <AuthField fieldKey="confirm" label="Confirm password" value={values.confirm} error={errors.confirm} isPassword visible={showConfirm} isSignup={signup} inputRef={confirmRef} onChangeText={(v) => change('confirm', v)} onToggleVisible={() => setShowConfirm(!showConfirm)} onSubmitEditing={() => void submit()} />
                )}

                {/* Remember me + Forgot (login only) */}
                {!signup && !forgot && (
                  <View style={styles.rememberRow}>
                    <TouchableOpacity onPress={() => setRemember(!remember)} style={styles.rememberLabel} activeOpacity={0.7}>
                      <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                        {remember && <Text style={styles.checkmark}>{'✓'}</Text>}
                      </View>
                      <Text style={styles.rememberText}>Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onNavigate('forgot')} style={styles.forgotBtn}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Terms agreement (signup only) */}
                {signup && (
                  <View>
                    <TouchableOpacity onPress={() => { setAgreed(!agreed); setErrors((e) => ({ ...e, agreement: '' })); }} style={styles.agreementRow} activeOpacity={0.7}>
                      <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                        {agreed && <Text style={styles.checkmark}>{'✓'}</Text>}
                      </View>
                      <Text style={styles.agreementText}>
                        {'I agree to the '}<Text style={styles.agreementLink}>Terms</Text>{' and '}<Text style={styles.agreementLink}>Privacy Policy</Text>.
                      </Text>
                    </TouchableOpacity>
                    {errors.agreement ? (
                      <View style={fldStyles.errorRow}>
                        <View style={fldStyles.errorIcon}><CircleAlertIcon size={13} color={colors.destruct} /></View>
                        <Text style={fldStyles.errorText}>{errors.agreement}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Form-level error */}
                {errors.form ? (
                  <View style={fldStyles.errorRow}>
                    <View style={fldStyles.errorIcon}><CircleAlertIcon size={13} color={colors.destruct} /></View>
                    <Text style={fldStyles.errorText}>{errors.form}</Text>
                  </View>
                ) : null}

                {/* Primary button */}
                <Pressable onPress={() => void submit()} disabled={busy} style={({ pressed }) => [styles.primaryBtn, busy && styles.primaryBtnDisabled, pressed && !busy && styles.pressed]}>
                  <Text style={styles.primaryBtnText}>{forgot ? 'Send reset link' : signup ? 'Create Account' : 'Sign In'}</Text>
                  {!busy && <ArrowRightIcon size={16} color={colors.primaryForeground} />}
                </Pressable>
              </View>

              {/* OR + Google (login only) */}
              {!signup && !forgot && (
                <>
                  <View style={styles.orDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <Pressable onPress={() => setNotice('Google sign-in is not available in the preview.')} style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}>
                    <GoogleIcon size={16} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </Pressable>
                  {notice ? (
                    <View style={styles.noticeRow}>
                      <View style={styles.noticeIcon}><CircleAlertIcon size={15} color={colors.accentBlue} /></View>
                      <Text style={styles.noticeText}>{notice}</Text>
                    </View>
                  ) : null}
                </>
              )}

              {/* Footer: switch + guest */}
              {!forgot && (
                <View style={styles.footer}>
                  <Text style={styles.switchText}>
                    {signup ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={styles.switchLink} onPress={() => onNavigate(signup ? 'login' : 'signup')}>
                      {signup ? 'Sign in' : 'Create account'}
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={handleGuest} style={styles.guestBtn}>
                    <Text style={styles.guestBtnText}>Continue as Guest</Text>
                    <ArrowRightIcon size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <Text style={styles.guestInfo}>Up to 5 farms. No account needed.</Text>
                </View>
              )}

              {/* Forgot footer */}
              {forgot && (
                <View style={styles.footer}>
                  <TouchableOpacity onPress={() => onNavigate('login')} style={styles.guestBtn}>
                    <ArrowLeftIcon size={15} color={colors.accentBlue} />
                    <Text style={[styles.guestBtnText, { color: colors.accentBlue }]}>Back to sign in</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Details disclaimer */}
          <View style={styles.details}>
            <TouchableOpacity onPress={() => setDetailsOpen(!detailsOpen)}>
              <Text style={styles.detailsText}>Interactive preview · account services not connected</Text>
            </TouchableOpacity>
            {detailsOpen && (
              <>
                <Text style={[styles.detailsText, { marginTop: 8 }]}>
                  {'Demo email: '}<Text style={styles.detailsHighlight}>archell@growtrack.app</Text>{'\nPreview password: '}<Text style={styles.detailsHighlight}>GrowTrack123!</Text>
                </Text>
                <Text style={[styles.detailsText, { marginTop: 8 }]}>
                  New accounts work for this prototype only. All preview accounts use the password above for returning sign-in. Passwords entered here are not stored. Cloud sync and email delivery are not connected.
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── GrowTrackLogo ────────────────────────────────────────────────────────────
function GrowTrackLogo() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.logo}>
      <SproutIcon size={21} color={colors.primary} />
      <Text style={styles.logoText} allowFontScaling={false}>GrowTrack<Text style={styles.logoDot}>.</Text></Text>
    </View>
  );
}

// ─── FarmVisual ───────────────────────────────────────────────────────────────
function FarmVisual({ compact }: { compact: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const height = compact ? 80 : 112;
  const spans = Array.from({ length: 24 }, (_, i) =>
    i % 3 === 0 ? withAlpha(colors.primary, 0.15) : i % 3 === 1 ? colors.secondary : colors.card
  );
  return (
    <View style={[styles.farmVisual, { height }]}>
      <View style={styles.farmRow}>
        <Image source={require('../../assets/items/pepper-seed.webp')} style={styles.pepperSeed} resizeMode="contain" />
        <View style={styles.farmSproutMid}><SproutIcon size={35} color={withAlpha(colors.primary, 0.80)} strokeWidth={1.5 / (35 / 24)} /></View>
        <View style={styles.farmCenter}>
          <Image source={require('../../assets/items/pepper-item.webp')} style={styles.pepperItem} resizeMode="contain" />
          <View style={{ marginTop: -4 }}><SproutIcon size={29} color={colors.primary} strokeWidth={1.5 / (29 / 24)} /></View>
        </View>
      </View>
      <View style={styles.groundBar}>
        <View style={styles.groundGrid}>
          {spans.map((bg, i) => <View key={i} style={[styles.groundSpan, { backgroundColor: bg }]} />)}
        </View>
      </View>
    </View>
  );
}
