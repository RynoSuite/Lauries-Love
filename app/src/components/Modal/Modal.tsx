import React, { Dispatch, ReactNode, useCallback, useRef } from 'react';
import { Modal as ModalComponent, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import styles from './Modal.styles';

type Props = {
  children: ReactNode;
  onClose: Dispatch<boolean>;
  title: string;
  visible: boolean;
  disableScroll?: boolean;
  /** Take the screen, for sheets with more in them than fits comfortably. */
  fullScreen?: boolean;
};

/**
 * Full-width sheet with a title, used by the map filters.
 *
 * Was a plain RN Modal with animationType="slide", which moved the dim overlay
 * up with the sheet and offered no way to drag it away. Now the same
 * @gorhom/bottom-sheet machinery as ActionSheet, so every sheet in the app
 * behaves identically: drag to follow the finger, dismiss past a
 * velocity-aware threshold, backdrop fades while the sheet slides.
 */
export default function Modal({
  children,
  onClose,
  title,
  visible,
  disableScroll = false,
  fullScreen = false,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);

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
    <ModalComponent
      transparent
      statusBarTranslucent
      onRequestClose={() => sheetRef.current?.close()}
    >
      <BottomSheet
        ref={sheetRef}
        index={0}
        // A full-screen sheet stops just short of the top: the sliver of
        // backdrop above it is what keeps it reading as a sheet you can
        // dismiss rather than a screen you have navigated to.
        snapPoints={fullScreen ? ['94%'] : ['70%']}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onClose={() => onClose(false)}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.grabber}
      >
        <View style={styles.header}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <BottomSheetScrollView
          scrollEnabled={!disableScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheet>
    </ModalComponent>
  );
}
