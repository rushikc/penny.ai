import React, {useMemo} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {Button, Divider, IconButton, Modal, Portal, Text} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppTheme} from '../../theme/useAppTheme';
import {popup, radius, spacing, typography} from '../../theme/tokens';

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
  primaryTone?: 'default' | 'danger';
  scrollable?: boolean;
  hideFooter?: boolean;
  maxHeightRatio?: number;
  contentStyle?: ViewStyle;
}

/**
 * Standard iOS-style bottom sheet for all popups. Layout comes from global
 * `popup` tokens; callers only tune height via `maxHeightRatio`.
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
  primaryTone = 'default',
  scrollable = true,
  hideFooter = false,
  maxHeightRatio = popup.defaultMaxHeightRatio,
  contentStyle,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();
  const sheetMaxHeight = Math.min(
    windowHeight * maxHeightRatio,
    windowHeight - insets.top - spacing.sm - popup.screenInsetBottom,
  );

  const bodyMaxHeight = useMemo(() => {
    const handleArea = spacing.sm + popup.handleHeight + spacing.sm;
    const headerArea = 56 + (subtitle ? 20 : 0) + popup.headerPaddingBottom;
    const footerArea = hideFooter ? 0 : 56;
    const dividerArea = hideFooter ? 0 : 1;
    const bottomPadding = Math.max(insets.bottom, spacing.lg);
    return Math.max(
      120,
      sheetMaxHeight - handleArea - headerArea - footerArea - dividerArea - bottomPadding,
    );
  }, [hideFooter, insets.bottom, sheetMaxHeight, subtitle]);

  const body = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      style={{maxHeight: bodyMaxHeight}}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, contentStyle, {maxHeight: bodyMaxHeight}]}>
      {children}
    </View>
  );

  const primaryButtonColor =
    primaryTone === 'danger' ? theme.colors.error : theme.colors.primary;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.keyboardAvoid,
            {
              paddingHorizontal: popup.screenInsetHorizontal,
              paddingBottom: popup.screenInsetBottom,
            },
          ]}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: popup.radius,
                maxHeight: sheetMaxHeight,
                maxWidth: popup.maxWidth,
                paddingBottom: Math.max(insets.bottom, spacing.lg),
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: theme.colors.custom.border,
                    width: popup.handleWidth,
                    height: popup.handleHeight,
                  },
                ]}
              />
            </View>

            <View style={[styles.header, {paddingHorizontal: popup.paddingHorizontal}]}>
              <View style={styles.headerText}>
                <Text style={[styles.title, {color: theme.colors.onSurface}]}>
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
              <IconButton
                icon="close"
                size={popup.closeIconSize}
                onPress={onDismiss}
                iconColor={theme.colors.custom.textSecondary}
                style={styles.closeBtn}
              />
            </View>

            <View style={styles.body}>{body}</View>

            {!hideFooter ? (
              <>
                <Divider style={{backgroundColor: theme.colors.custom.border}} />
                <View
                  style={[
                    styles.footer,
                    {
                      paddingHorizontal: popup.footerPaddingHorizontal,
                      gap: popup.gap,
                    },
                  ]}
                >
                  <Button mode="text" onPress={onDismiss} textColor={theme.colors.primary}>
                    {secondaryLabel}
                  </Button>
                  {onPrimary ? (
                    <Button
                      mode="contained"
                      onPress={onPrimary}
                      disabled={primaryDisabled}
                      buttonColor={primaryButtonColor}
                      style={styles.primaryBtn}
                      contentStyle={styles.primaryBtnContent}
                    >
                      {primaryLabel}
                    </Button>
                  ) : null}
                </View>
              </>
            ) : null}
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
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    paddingTop: spacing.sm,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    borderRadius: radius.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: popup.headerPaddingBottom,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  closeBtn: {
    margin: 0,
    marginTop: -spacing.xs,
  },
  title: {
    ...typography.cardTitle,
  },
  body: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: popup.paddingHorizontal,
    paddingBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    borderRadius: radius.md,
    minWidth: popup.primaryMinWidth,
  },
  primaryBtnContent: {
    paddingHorizontal: spacing.lg,
  },
});

export default BottomSheetModal;
