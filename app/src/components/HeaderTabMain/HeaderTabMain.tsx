import React, { FunctionComponent } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';

// icons
import { IconQrWhite } from 'assets/icons-auto/components';

// styles
import styles from './HeaderTabMain.styles';
import colors from 'styles/colors';

type HeaderTabMainProps = {
  title: string;
  onPressQR?: () => void;
  customRightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

const HeaderTabMain: FunctionComponent<HeaderTabMainProps> = ({
  title,
  onPressQR,
  customRightElement,
  containerStyle,
}) => {
  return (
    <View style={[styles.header, containerStyle]}>
      <Text style={styles.titleHeader}>{title}</Text>
      {customRightElement}
      {!customRightElement && onPressQR && (
        <TouchableOpacity style={styles.buttonHeader} onPress={onPressQR}>
          <View style={styles.qrPlate}>
            <IconQrWhite width={24} height={24} fill={colors.white} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HeaderTabMain;
