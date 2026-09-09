import { StyleSheet } from 'react-native';

import colors from 'styles/colors';

const styles = StyleSheet.create({
  container: {
    height: 4,
    borderRadius: 10,
    backgroundColor: colors.line,
  },
  progress: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: colors.magenta,
  },
});

export default styles;
