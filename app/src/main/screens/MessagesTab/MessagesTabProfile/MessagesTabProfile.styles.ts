import { Dimensions, Platform, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 44,
    paddingHorizontal: 16,
    marginTop: 11,
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
  profileName: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  profileInfoText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.muted,
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
    maxWidth: '45%',
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.heading,
  },
  loaderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[900] + '80',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarLetterContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 32,
    color: colors.white,
  },
});

export default styles;
