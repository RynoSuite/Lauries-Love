import { Dimensions, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  backgroundButton: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: colors.black,
    // Deeper than it was: at 0.4 over an already-dark screen the scrim barely
    // registered, so the sheet did not read as being in front of anything.
    opacity: 0.55,
  },
  background: {
    borderRadius: 32,
    backgroundColor: colors.surface,
    // A lit top edge, as on a raised surface: the sheet has to separate from
    // the screen behind it, and a shadow cannot do that on a dark ground.
    borderTopWidth: 1,
    borderTopColor: colors.lineStrong,
    elevation: 8,
    shadowOffset: { width: 0, height: -17.4 / 2 },
    shadowRadius: 17.4 / 2,
    shadowOpacity: 0.15,
  },
  handleIndicator: {
    display: 'none',
  },
  scrollViewContainer: {
    width: WIDTH,
  },
});

export default styles;
