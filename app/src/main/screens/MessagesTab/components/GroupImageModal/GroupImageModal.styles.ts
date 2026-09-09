import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  handleIndicatorStyle: {
    backgroundColor: colors.surface2,
    width: 36,
    display: 'flex',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  titleHeader: {
    color: colors.muted,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 20,
    lineHeight: 22,
  },
  buttonHeader: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingHorizontal: 20,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  buttonContainer: {
    backgroundColor: colors.quaternary20070,
  },
  label: {
    color: colors.muted,
  },
});

export default styles;
