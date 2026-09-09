import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  container: {
    flex: 1,
    width: WIDTH,
    height: HEIGHT,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Was 4: the avatar and title touched the top edge of the panel.
    paddingTop: 20,
    paddingBottom: 12,
    gap: 16,
  },
  buttonHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userName: {
    flex: 1,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 20,
    lineHeight: 24,
    color: colors.heading,
  },
  //messages
  messages: {
    flex: 1,
  },
  messagesContainer: {
    paddingTop: 100,
  },
  date: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
    textAlign: 'center',
    paddingVertical: 22,
  },
  // The chip carries the indent now, so the label no longer pads itself off
  // the left edge.
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 20,
    paddingBottom: 4,
  },
  name: {
    flexShrink: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  messageContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 22,
    gap: 10,
  },
  avatarContainer: {
    position: 'absolute',
    height: '100%',
    minHeight: 60,
    justifyContent: 'flex-end',
    left: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
  },
  messageContainerMine: {
    justifyContent: 'flex-end',
    paddingRight: 16,
    paddingLeft: 20,
  },
  messageContainerMineNext: {
    paddingBottom: 8,
  },
  messageContainerOtherUser: {
    paddingBottom: 24,
  },
  messageContainerOtherDay: {
    paddingTop: 0,
  },
  message: {
    position: 'relative',
    minWidth: 85,
    padding: 16,
    backgroundColor: colors.surface2,
    borderRadius: 20,
  },
  messageMine: {
    backgroundColor: colors.magenta,
  },
  messageText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
    paddingBottom: 6,
  },
  messageTextMine: {
    color: colors.white,
  },
  messageDate: {
    position: 'absolute',
    bottom: 7,
    right: 8,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 14,
  },
  messageDateMine: {
    color: colors.neutral[400],
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 18,
  },

  //footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 19,
    paddingHorizontal: 0,
    paddingLeft: 0,
  },
  input: {
    paddingHorizontal: 11,
    paddingVertical: 11,
  },
  buttonSend: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: colors.magenta,
  },
  loaderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[900] + '80',
  },
});

export default styles;
