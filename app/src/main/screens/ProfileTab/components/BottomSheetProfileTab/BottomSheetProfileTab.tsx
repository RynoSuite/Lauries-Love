import React, { FunctionComponent } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// components
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';


// styles
import styles from './BottomSheetProfileTab.styles';

type BottomSheetProfileTabProps = {
  onClose: () => void;
  children: React.ReactNode;
  onSubmit: () => void;
  disabled?: boolean;
  title: string;
  isInputs?: boolean;
  snapPoints?: string[];
  index?: number;
  buttonsStyle?: StyleProp<ViewStyle>;
  isLoading?: boolean;
};

const BottomSheetProfileTab: FunctionComponent<BottomSheetProfileTabProps> = ({
  onClose,
  children,
  onSubmit,
  disabled = false,
  title,
  isInputs = false,
  snapPoints = ['10%'],
  index = 1,
  buttonsStyle,
  isLoading = false,
}) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <BottomSheetCustom
      onClose={onClose}
      snapPoints={snapPoints}
      isInputs={isInputs}
      index={index}
    >
      <View
        style={{
          paddingBottom: bottom,
        }}
      >
        {/* No back arrow. A sheet sits on top of the screen you are already
            on; an arrow implies you are leaving that screen for a previous
            one. The grabber above and Cancel below are the two ways out. */}
        <View style={styles.header}>
          <Text style={styles.titleHeader}>{title}</Text>
        </View>
        {children}
        <View style={[styles.buttons, buttonsStyle]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={disabled || isLoading}
            style={[
              styles.saveButton,
              (disabled || isLoading) && styles.disabledButton,
            ]}
            onPress={onSubmit}
          >
            <Text style={styles.saveText}>
              {isLoading ? 'Loading...' : 'Update'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetCustom>
  );
};

export default BottomSheetProfileTab;
