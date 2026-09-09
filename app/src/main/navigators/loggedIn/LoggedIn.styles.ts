import { Platform, StyleSheet } from 'react-native';
import colors from 'styles/colors';

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    // shadow
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  tabBarHide: {
    display: 'none',
  },
  // Matches the notification bell's counter: magenta disc, white figure.
  tabBadge: {
    backgroundColor: colors.magenta,
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default styles;
