import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modal, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { SharedValue } from 'react-native-reanimated';

// providers
import { useKeyboardProvider } from '../../providers/KeyboardProvider/KeyboardProvider';

// styles
import styles from './BottomSheetCustom.styles';

type BottomSheetCustomProps = {
  children: React.ReactNode;
  index?: number;
  onClose: () => void;
  snapPoints?: (string | number)[] | SharedValue<(string | number)[]>;
  handleIndicatorStyle?: StyleProp<ViewStyle>;
  isInputs?: boolean;
  isHide?: boolean;
  maxDynamicContentSize?: number;
  dynamic?: boolean;
};

const BottomSheetCustom: FunctionComponent<BottomSheetCustomProps> = ({
  children,
  index = 1,
  onClose,
  snapPoints = ['50%', '90%'],
  handleIndicatorStyle,
  isInputs,
  isHide,
  dynamic = true,
}) => {
  const { showKeyboard } = useKeyboardProvider();
  const [isLoaded, setIsLoaded] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleIndicatorStyles = useMemo(
    () => [styles.handleIndicator, handleIndicatorStyle],
    [handleIndicatorStyle],
  );

  const onCloseAnimation = () => {
    bottomSheetRef.current?.close();
  };

  useEffect(() => {
    if (!showKeyboard) {
      if (index > 0 && isLoaded) bottomSheetRef.current?.snapToIndex(index);
      else bottomSheetRef.current?.expand();
    }
  }, [showKeyboard]);

  useEffect(() => {
    if (isHide) bottomSheetRef.current?.close();
  }, [isHide]);

  return (
    <Modal transparent>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={index}
        onClose={onClose}
        enableContentPanningGesture={dynamic}
        // Without this the handle is a decoration: dragging the sheet down
        // would rubber-band back instead of dismissing it.
        enablePanDownToClose
        onChange={i => {
          // Only where index 0 is a deliberate "collapsed" point beneath the
          // real one — the convention the profile sheets use. A sheet with a
          // single snap point settles at index 0 the moment it opens, so this
          // used to close it on arrival: it appeared, then vanished on its
          // own. Dragging one of those away still closes it, through
          // enablePanDownToClose and the onClose prop.
          if (i === 0 && Array.isArray(snapPoints) && snapPoints.length > 1)
            onClose();
        }}
        backgroundStyle={styles.background}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0} // The index at which the backdrop becomes visible
            disappearsOnIndex={-1} // The index at which the backdrop disappears
            pressBehavior="close" // Tapping on the backdrop will close the sheet
          />
        )}
        handleIndicatorStyle={handleIndicatorStyles}
      >
        <BottomSheetView
          onLayout={() => {
            setIsLoaded(true);
          }}
        >
          {isInputs ? (
            <ScrollView horizontal scrollEnabled={false}>
              <View style={styles.scrollViewContainer}>{children}</View>
            </ScrollView>
          ) : (
            children
          )}
        </BottomSheetView>
      </BottomSheet>
    </Modal>
  );
};

export default BottomSheetCustom;
