import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_HANKEN_GROTESK_700,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  image: {
    width: 49,
    height: 49,
    borderRadius: 49,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontFamily: FONT_HANKEN_GROTESK_700,
    fontSize: 18,
    alignSelf: 'center',
    color: colors.heading,
  },
  cityStateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: 128,
    borderRadius: 20,
    backgroundColor: 'rgba(166, 166, 166, 0.22)',
  },
  cityStateText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 15,
    color: '#7B7B7B',
  },
  detailsText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.faint,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    maxWidth: width - 128,
  },
  buttonOutlinedContainer: {
    borderRadius: 44,
    height: 44,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 44,
    height: 44,
  },
  buttonInnerContainer: {
    flex: 1,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: colors.surface,
  },
  sendMessageText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.primary[400],
  },
  viewProfileText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.neutral[100],
  },
});

export default styles;
