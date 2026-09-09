import React, { FunctionComponent, useCallback, useRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import colors from 'styles/colors';
import styles from './ActionSheet.styles';

export type ActionSheetItem = {
  label: string;
  /** Rendered to the left of the label. Any icon component works. */
  icon?: React.ReactNode;
  /** Destructive actions are tinted and read as a warning. */
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  items: ActionSheetItem[];
  onClose: () => void;
};

/**
 * Bottom sheet used in place of Alert.alert for choices.
 *
 * Built on @gorhom/bottom-sheet, which this app already depends on and already
 * uses in BottomSheetCustom. An earlier version drove the drag by hand with
 * PanResponder and never worked: a value animated on the native driver ignores
 * setValue() from JS, a parent Pressable swallowed the gesture, and the
 * responder was memoised in a ref that survived every Fast Refresh. The
 * library does all of it on the UI thread.
 *
 * Free from the library: the sheet follows the finger, dismisses on a
 * velocity-aware threshold, the backdrop FADES while the sheet SLIDES, and
 * tapping outside closes it.
 */
const ActionSheet: FunctionComponent<ActionSheetProps> = ({
  visible,
  title,
  message,
  items,
  onClose,
}) => {
  const sheetRef = useRef<BottomSheet>(null);

  // Plays the close animation; onClose fires from the sheet's own onClose, so
  // tapping a row, tapping the backdrop and swiping down all exit identically.
  const dismiss = useCallback(() => sheetRef.current?.close(), []);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.6}
      />
    ),
    [],
  );

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent onRequestClose={dismiss}>
      <BottomSheet
        ref={sheetRef}
        index={0}
        // Height follows the content: one row or four, the sheet fits it.
        enableDynamicSizing
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.grabber}
      >
        <BottomSheetView style={styles.sheetContent}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.items}>
            {items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  dismiss();
                  // After the close animation, so a navigation or a second
                  // sheet does not fight it.
                  setTimeout(item.onPress, 220);
                }}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && styles.itemDivider,
                  pressed && styles.itemPressed,
                ]}
              >
                {!!item.icon && <View style={styles.itemIcon}>{item.icon}</View>}
                <Text
                  style={[
                    styles.itemLabel,
                    item.destructive && styles.itemLabelDestructive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [
              styles.cancel,
              pressed && styles.itemPressed,
            ]}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </Modal>
  );
};

export default ActionSheet;
export { colors };
