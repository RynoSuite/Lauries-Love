import { Platform, StyleSheet } from 'react-native';
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
    gap: 44,
    paddingHorizontal: 16,
    marginTop: 11,
    paddingBottom: Platform.OS === 'ios' ? 0 : 96,
  },
  backButton: {
    gap: 12,
  },
  profileContainer: {
    gap: 8,
    alignItems: 'center',
  },
  profileDetails: {
    gap: 12,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 120,
  },
  profileName: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileInfoText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.muted,
  },
  profileInfoDate: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.muted,
  },
  buttonFriend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    height: 52,
    borderRadius: 52,
  },
  textFriend: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 16,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonMessage: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  actionButtonMap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 40,
    backgroundColor: colors.surface2,
  },
  sendMessageButton: {
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  buttonText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.heading,
  },
  detailsCard: {
    gap: 20,
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#DFDFDF',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsLabel: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.heading,
  },
  detailsValue: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.heading,
    maxWidth: '45%',
  },
  detailsDate: {
    fontFamily: FONT_HANKEN_GROTESK_600,
    fontSize: 16,
    color: colors.heading,
    maxWidth: 120,
  },
});

export default styles;
