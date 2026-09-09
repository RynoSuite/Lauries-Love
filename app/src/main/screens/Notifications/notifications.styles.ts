import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_HANKEN_GROTESK_600,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  innerContainer: {
    flex: 1,
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    marginRight: 30,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 32,
    color: colors.heading,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
  },
  allButton: {
    backgroundColor: colors.surface2,
  },
  selectedButton: {
    backgroundColor: colors.magenta,
  },
  filterButtonText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.heading,
  },
  filterButtonIcon: {
    width: 14,
    height: 14,
  },
  notificationSection: {
    gap: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontFamily: FONT_HANKEN_GROTESK_600,
    fontSize: 18,
    color: colors.heading,
  },
  emptyNotificationContainer: {
    flex: 1,
    alignItems: 'center',
    top: '16%',
  },
  emptyNotificationContent: {
    alignItems: 'center',
    gap: 20,
    width: 236,
  },
  emptyNotificationText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
  },
  emptyNotificationDescription: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.heading,
    textAlign: 'center',
  },
  notificationList: {
    gap: 8,
    paddingBottom: 80,
  },
});

export default styles;
