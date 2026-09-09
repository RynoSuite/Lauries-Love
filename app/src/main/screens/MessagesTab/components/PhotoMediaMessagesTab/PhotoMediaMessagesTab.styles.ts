import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: WIDTH / 3 - 2 * 2,
    height: WIDTH / 3 - 2 * 2,
    overflow: 'hidden',
  },
  loaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.magenta,
  },
  sizeElement: {
    width: '100%',
    height: '100%',
  },
});

export default styles;
