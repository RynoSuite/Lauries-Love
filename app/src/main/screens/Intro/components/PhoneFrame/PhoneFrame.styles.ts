import { StyleSheet } from 'react-native';

import {
  EDGE_BOTTOM,
  EDGE_LEFT,
  EDGE_RIGHT,
  EDGE_TOP,
  H,
  PAD,
  RADIUS,
  SCREEN_FILL,
  W,
} from '../glass';

const styles = StyleSheet.create({
  // One view again. The shadow it used to cast is gone, and the split into a
  // casting view plus a clipping view existed only because iOS cannot reliably
  // do both at once — a border and a clip on the same view are fine.
  phone: {
    width: W,
    height: H,
    borderRadius: RADIUS,
    backgroundColor: SCREEN_FILL,
    borderWidth: 1,
    borderTopColor: EDGE_TOP,
    borderLeftColor: EDGE_LEFT,
    borderRightColor: EDGE_RIGHT,
    borderBottomColor: EDGE_BOTTOM,
    paddingHorizontal: PAD,
    paddingTop: 12,
    overflow: 'hidden',
  },
  frost: {
    ...StyleSheet.absoluteFillObject,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default styles;
