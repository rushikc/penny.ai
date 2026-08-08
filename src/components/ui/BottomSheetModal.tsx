import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {Button, Divider, Modal, Portal, Text} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppTheme} from '../../theme/useAppTheme';
import {radius, spacing} from '../../theme/tokens';

interface BottomSheetModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
}

/**
 * iOS-style bottom sheet built on react-native-paper Modal. Avoids the nested
 * card look of Dialog and anchors actions at the bottom with safe-area padding.
 */
const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onDismiss,
  title,
  subtitle,
  children,
  primaryLabel = 'Save',
  secondaryLabel = 'Cancel',
  onPrimary,
  primaryDisabled = false,
  scrollable = true,
  contentStyle,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const body = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, contentStyle]}>{children}</View>
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(insets.bottom, spacing.lg),
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={[styles.handle, {backgroundColor: theme.colors.custom.border}]} />
            </View>

            <View style={styles.header}>
              <Text variant="titleLarge" style={[styles.title, {color: theme.colors.onSurface}]}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  variant="bodySmall"
                  style={{color: theme.colors.custom.textSecondary, marginTop: spacing.xs}}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.body}>{body}</View>

            <Divider style={{backgroundColor: theme.colors.custom.border}} />

            <View style={styles.footer}>
              <Button mode="text" onPress={onDismiss} textColor={theme.colors.primary}>
                {secondaryLabel}
              </Button>
              {onPrimary ? (
                <Button
                  mode="contained"
                  onPress={onPrimary}
                  disabled={primaryDisabled}
                  style={styles.primaryBtn}
                  contentStyle={styles.primaryBtnContent}
                >
                  {primaryLabel}
                </Button>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    maxHeight: '92%',
    paddingTop: spacing.sm,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: radius.pill,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: '700',
  },
  body: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    borderRadius: radius.md,
    minWidth: 96,
  },
  primaryBtnContent: {
    paddingHorizontal: spacing.lg,
  },
});

export default BottomSheetModal;
