import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    paddingTop: 8,
  },
  searchContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 24,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  inputSearchContainer: {
    flex: 1,
    borderRadius: 28,
    gap: 12,
  },
  inputSearch: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 14,
    lineHeight: 16,
    color: colors.heading,
  },
  cancel: {
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    lineHeight: 20,
    color: colors.heading,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  iconCreateButton: {
    backgroundColor: colors.magenta,
    padding: 11,
    borderRadius: 50,
  },
  titleCreateButton: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  loaderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 100,
    height: HEIGHT - 200,
  },
  titlesEmptyList: {
    gap: 8,
    paddingHorizontal: 82,
  },
  titleEmptyList: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 28,
    color: colors.heading,
    textAlign: 'center',
  },
  subtitleEmptyList: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
    textAlign: 'center',
  },
});

export default styles;
