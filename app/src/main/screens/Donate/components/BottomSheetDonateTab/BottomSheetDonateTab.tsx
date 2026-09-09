import React, { FunctionComponent } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// components
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';


// styles
import styles from './BottomSheetDonateTab.styles';

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
        {/* No back arrow — the grabber closes it. See BottomSheetProfileTab. */}
        <View style={styles.header}>
          <Text style={styles.titleHeader}>{title}</Text>
        </View>
        {children}
      </View>
    </BottomSheetCustom>
  );
};

export default BottomSheetDonateTab;
