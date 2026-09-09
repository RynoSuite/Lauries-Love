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

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// styles
import styles from './BottomSheetProfileTab.styles';
import colors from 'styles/colors';

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
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.titleHeader}>{title}</Text>
          <TouchableOpacity
            disabled
            onPress={onClose}
            style={styles.buttonHideHeader}
          >
            <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
          </TouchableOpacity>
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
