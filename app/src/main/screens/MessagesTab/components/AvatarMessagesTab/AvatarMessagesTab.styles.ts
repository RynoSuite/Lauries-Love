import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_700 } from 'styles/fonts';

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 180,
    overflow: 'hidden',
  },
  loaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  notImage: {
    justifyContent: 'center',
    alignItems: 'center',
    // The magenta fill, not the type colour: white on #911766 is 8.34:1.
    backgroundColor: colors.magenta,
  },
  text: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 16,
    lineHeight: 26,
    color: colors.white,
  },
});

export default styles;
