import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

import { GLASS_EDGE_SOFT, GLASS_FILL } from '../glass';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 9,
  },
  back: {
    width: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A chevron from one rotated corner: two borders on a square, turned.
  backArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: colors.heading,
    transform: [{ rotate: '45deg' }],
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 10,
    color: colors.white,
  },
  who: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 11,
    color: colors.heading,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.successText,
  },
  status: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 8,
    color: colors.muted,
  },
  rule: {
    height: 1,
    backgroundColor: GLASS_EDGE_SOFT,
  },

  // The window the thread scrolls inside. Clipped and bottom-aligned, so the
  // newest message sits where the eye already is and the oldest rides up out
  // of the top rather than climbing over the header.
  viewport: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  // The content itself takes its natural height; the viewport does the
  // clipping. It must not be flex, or it would stretch and stop growing.
  thread: {
    paddingTop: 8,
    gap: 5,
  },
  rowTheirs: {
    alignItems: 'flex-start',
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },
  // Theirs is glass; mine is the accent. One tail corner squared off on each,
  // which is the detail that stops two rounded rectangles reading as cards.
  bubbleTheirs: {
    backgroundColor: GLASS_FILL,
    borderBottomLeftRadius: 3,
  },
  bubbleMine: {
    backgroundColor: colors.magenta,
    borderBottomRightRadius: 3,
  },
  bubbleText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 10,
    lineHeight: 14,
    color: colors.body,
  },
  bubbleTextMine: {
    color: colors.white,
  },

  typingRow: {
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    borderBottomLeftRadius: 3,
    backgroundColor: GLASS_FILL,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.magentaText,
  },

  receipt: {
    alignItems: 'flex-end',
  },
  receiptText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 8,
    color: colors.faint,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
  },
  field: {
    flex: 1,
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: GLASS_FILL,
  },
  fieldText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 9,
    color: colors.faint,
  },
  send: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: {
    width: 7,
    height: 7,
    marginLeft: -1,
    borderTopWidth: 1.6,
    borderRightWidth: 1.6,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
  },
});

export default styles;
