import React, { FunctionComponent } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// components
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// styles
import styles from './BottomSheetDonateTab.styles';
import colors from 'styles/colors';

type BottomSheetDonateTabProps = {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  snapPoints?: string[];
  index?: number;
  dynamic?: boolean;
};

const BottomSheetDonateTab: FunctionComponent<BottomSheetDonateTabProps> = ({
  onClose,
  children,
  title,
  snapPoints = ['90%'],
  index = 1,
  dynamic = true,
}) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <BottomSheetCustom
      onClose={onClose}
      snapPoints={snapPoints}
      isInputs={true}
      index={index}
      dynamic={dynamic}
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
      </View>
    </BottomSheetCustom>
  );
};

export default BottomSheetDonateTab;
