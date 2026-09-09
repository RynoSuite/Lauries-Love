import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  universalContainer: {
    borderRadius: 10,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: colors.surface2,
    borderRadius: 10,
  },
  checkboxContainer: {
    justifyContent: 'space-between',
    paddingLeft: 13,
    paddingRight: 15,
  },
  selected: {
    paddingVertical: 13,
    backgroundColor: colors.surface2,
    margin: 2,
  },
  title: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    padding: 2,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.neutral[600],
  },
  selectCheckbox: {
    borderWidth: 0,
    backgroundColor: colors.magenta,
  },
});

export default styles;
