import { StyleSheet } from 'react-native';
import colors from 'styles/colors';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  skeletonImage: {
    height: 34,
    width: 34,
    borderRadius: 34,
  },
  skeletonItem: {
    height: 14,
    width: 256,
    borderRadius: 4,
  },
});

export default styles;
