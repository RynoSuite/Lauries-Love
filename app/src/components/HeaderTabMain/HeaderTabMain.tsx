import React, { FunctionComponent } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';

// icons
import { IconQr } from 'assets/icons-auto/components';

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
            {/* IconQrWhite is a white circle with a grey glyph inside it —
                its own plate. On a magenta plate that reads as a white disc
                with something in the middle, which is where the golf ball
                came from. IconQr is the glyph alone. */}
            <IconQr width={22} height={22} fill={colors.white} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HeaderTabMain;
