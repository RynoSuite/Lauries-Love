import { StyleSheet } from 'react-native';
import colors from 'styles/colors';

const borderWidth = 8;

export const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    margin: 16,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMark: {
    borderColor: colors.magentaText,
    opacity: 0.8,
    borderWidth,
    borderRadius: 50,
    backgroundColor: colors.magentaText,
    height: 16,
  },
  inactiveMark: {
    borderColor: colors.magentaText,
    borderWidth,
    borderRadius: 100,
  },
  track: {
    borderRadius: 100,
    height: 4,
  },
  thumb: {
    width: 25,
    height: 25,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.ground,
  },
});

export const sliderStyles = {
  maximumTrackTintColor: colors.lineStrong,
  thumbTintColor: colors.magentaText,
  minimumTrackTintColor: colors.magentaText,
  trackStyle: styles.track,
  thumbStyle: styles.thumb,
};
