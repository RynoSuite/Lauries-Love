import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  bellIconContainer: {
    position: 'relative',
    paddingHorizontal: 16,
  },
  bellIcon: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 30,
  },
  unreadCountContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    right: 8,
    top: 0,
  },
  unreadCountText: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.neutral[100],
    fontSize: 12,
    lineHeight: 12,
  },
});

export default styles;
