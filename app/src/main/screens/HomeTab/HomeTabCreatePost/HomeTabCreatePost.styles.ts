import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    position: 'relative',
    flex: 1,
    gap: 20,
    paddingBottom: 200,
    paddingTop: 20,
  },
  containerWithImage: {
    paddingBottom: 281, // Increased padding to accommodate the image
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.heading,
    fontSize: 16,
    lineHeight: 20,
  },
  postButtonContainer: {
    paddingHorizontal: 16,
  },
  postButton: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonActive: {
    backgroundColor: colors.magenta,
  },
  postButtonText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.white,
    fontSize: 16,
    lineHeight: 20,
  },
  postButtonTextActive: {
    color: colors.white,
  },
  textInputContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    justifyContent: 'flex-start',
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
    paddingVertical: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 34,
    gap: 8,
  },
  footerVisibilityCont: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Choosing which group a post goes to. Replaces a full-width sentence that
  // described the audience the app had derived for you.
  groupPicker: {
    gap: 8,
    paddingTop: 4,
  },
  groupPickerLabel: {
    paddingHorizontal: 16,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  groupChips: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
  },
  groupChip: {
    maxWidth: 200,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  groupChipActive: {
    backgroundColor: colors.magenta,
    borderColor: colors.magentaText,
  },
  groupChipText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.body,
  },
  groupChipTextActive: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.white,
  },
  footerText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
  },
  uploadButton: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadActiveButton: {
    backgroundColor: colors.magenta,
  },
  imageButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageButtonText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  imageButtonTextActive: {
    color: colors.white,
  },
  imageCont: {
    backgroundColor: colors.surface,
    width: 81,
    height: 81,
    position: 'relative',
    marginLeft: 77, // 16 + 49(avatarSize) + 12(gap between avatar and text input)
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    elevation: 5,
    borderRadius: 8,
  },
  imageShadow: {},
  uploadedImage: {
    width: 81,
    height: 81,
    borderRadius: 8,
    overflow: 'hidden',
  },
  clearImageButton: {
    position: 'absolute',
    top: -8.5,
    right: -11,
    backgroundColor: colors.line,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default styles;
