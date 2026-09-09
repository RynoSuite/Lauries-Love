import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  // A hairline and a little more room. These rows sit directly on the screen
  // background, and a fill alone left them reading as one undifferentiated
  // block rather than as separate, tappable things.
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  part: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partRight: {
    justifyContent: 'flex-end',
    gap: 8,
  },

  // The icon sits on a plate, as it does on the web app. At 20px on a dark
  // surface a bare stroke icon reads as debris; the disc gives it a home and
  // makes the row scannable by its icon rather than by reading every label.
  plate: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.magentaPlate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateDanger: {
    backgroundColor: colors.surface2,
  },

  label: {
    flexShrink: 1,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    lineHeight: 20,
    color: colors.heading,
  },
  labelDanger: {
    color: colors.danger,
  },
  valueContainer: {
    flex: 1,
  },
  // The value is what the row currently holds, not its name: quieter than the
  // label, and never wider than it.
  value: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'right',
  },
  // "Not set" is an absence, and should look like one rather than like data.
  valueEmpty: {
    color: colors.faint,
  },
});

export default styles;
