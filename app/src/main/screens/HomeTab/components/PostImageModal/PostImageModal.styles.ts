import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

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
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  buttonContainer: {
    backgroundColor: colors.quaternary20070,
  },
  label: {
    color: colors.muted,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
  },
  loaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface + '80',
  },
});

export default styles;
