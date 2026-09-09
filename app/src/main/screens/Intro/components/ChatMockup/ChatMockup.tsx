import React, {
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, LayoutChangeEvent, Text, View } from 'react-native';

import PhoneFrame from '../PhoneFrame/PhoneFrame';
import styles from './ChatMockup.styles';

/**
 * A conversation, rebuilt as a live component for the intro slider's third
 * slide ("Connect, share and support").
 *
 * The other two slides show a room and a map; this one shows two people. It
 * plays a short exchange on a loop — a message arrives, the typing dots run,
 * the reply lands, the read receipt follows — because a still image of a chat
 * is the one screenshot that says least about the product. The whole promise
 * of the messaging feature is that something comes back.
 *
 * Messages are mounted as they arrive rather than pre-laid-out at zero
 * opacity, so the thread genuinely grows and scrolls: the viewport clips at a
 * fixed height and the oldest message rides up out of the top of it. Every
 * growth step is absorbed by a spring on the content's translateY, which is
 * why nothing jumps and nothing ever reaches the header.
 */

type Bubble = {
  mine: boolean;
  body: string;
};

const THREAD: Bubble[] = [
  { mine: false, body: 'How did the scan go?' },
  { mine: true, body: 'All clear. I have read the letter about nine times.' },
  { mine: false, body: 'That is the best news I have heard all week.' },
  { mine: true, body: 'Coffee Thursday to celebrate?' },
];

// The whole exchange, then a beat, then it starts again.
const LOOP = 8400;

const ChatMockup: FunctionComponent = () => {
  // How many messages have arrived. Mounting them one at a time is what makes
  // the thread scroll — a bubble that is merely transparent still takes up its
  // space, and the thread would be full-height from the first frame.
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [read, setRead] = useState(false);

  const bubbles = useRef(THREAD.map(() => new Animated.Value(0))).current;
  const receipt = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(0)).current;
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  const lastHeight = useRef(0);
  const lastShown = useRef(0);

  // The typing dots run continuously; only their container's opacity decides
  // whether you can see them, which keeps the loop's timing in one place.
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.stagger(
        140,
        dots.map(dot =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    bounce.start();
    return () => bounce.stop();
  }, [dots]);

  // The script. Plain timers rather than an Animated.sequence because these
  // steps change what is mounted, which is a render concern, not an animation.
  useEffect(() => {
    let alive = true;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const at = (ms: number, fn: () => void) => {
      timers.push(
        setTimeout(() => {
          if (alive) {
            fn();
          }
        }, ms),
      );
    };

    const run = () => {
      // Every timer from the previous pass has already fired by now.
      timers = [];
      at(200, () => setShown(1));
      at(900, () => setShown(2));
      at(2100, () => setTyping(true));
      at(3500, () => {
        setTyping(false);
        setShown(3);
      });
      at(4700, () => setShown(4));
      at(5200, () => setRead(true));
      at(7800, () => {
        setShown(0);
        setTyping(false);
        setRead(false);
      });
      at(LOOP, run);
    };

    run();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  // Each newly mounted bubble springs in. Started here, after the bubble is on
  // screen — a native-driven animation binds to the view it starts against, so
  // starting one before its view exists animates nothing.
  useEffect(() => {
    if (shown === 0) {
      bubbles.forEach(b => b.setValue(0));
      receipt.setValue(0);
      lastShown.current = 0;
      return;
    }
    for (let i = lastShown.current; i < shown; i += 1) {
      bubbles[i].setValue(0);
      Animated.spring(bubbles[i], {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }).start();
    }
    lastShown.current = shown;
  }, [shown, bubbles, receipt]);

  useEffect(() => {
    Animated.timing(receipt, {
      toValue: read ? 1 : 0,
      duration: read ? 300 : 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [read, receipt]);

  /**
   * Absorb the thread growing. The content is bottom-anchored, so adding a
   * message shifts everything above it up instantly. Starting the content
   * pushed down by exactly that much and springing it back to zero turns the
   * jump into a scroll — and because the viewport clips, the oldest message
   * slides out of the top instead of climbing into the header.
   */
  function onContentLayout(event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height;
    const grew = height - lastHeight.current;
    lastHeight.current = height;

    if (grew > 0 && grew < height) {
      shift.setValue(grew);
      Animated.spring(shift, {
        toValue: 0,
        useNativeDriver: true,
        speed: 13,
        bounciness: 4,
      }).start();
    }
  }

  return (
    <PhoneFrame>
      <View style={styles.header}>
        <View style={styles.back}>
          <View style={styles.backArrow} />
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.name} numberOfLines={1}>
            Maya Ruiz
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.status}>Online</Text>
          </View>
        </View>
      </View>
      <View style={styles.rule} />

      {/* The viewport. Fixed height and clipped, so the thread can never push
          past it no matter how many messages have landed. */}
      <View style={styles.viewport}>
        <Animated.View
          style={[styles.thread, { transform: [{ translateY: shift }] }]}
          onLayout={onContentLayout}
        >
          {THREAD.slice(0, shown).map((bubble, i) => (
            <Animated.View
              key={i}
              style={[
                bubble.mine ? styles.rowMine : styles.rowTheirs,
                {
                  opacity: bubbles[i],
                  transform: [
                    {
                      // Each side enters from its own edge, the way a sent
                      // message and a received one differ in the real app.
                      translateX: bubbles[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [bubble.mine ? 16 : -16, 0],
                      }),
                    },
                    { scale: bubbles[i] },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  bubble.mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    bubble.mine && styles.bubbleTextMine,
                  ]}
                >
                  {bubble.body}
                </Text>
              </View>
            </Animated.View>
          ))}

          {typing ? (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                {dots.map((dot, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        opacity: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.35, 1],
                        }),
                        transform: [
                          {
                            translateY: dot.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -3],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Animated.View style={[styles.receipt, { opacity: receipt }]}>
            <Text style={styles.receiptText}>Read 9:41</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.composer}>
        <View style={styles.field}>
          <Text style={styles.fieldText}>Message</Text>
        </View>
        <View style={styles.send}>
          <View style={styles.sendArrow} />
        </View>
      </View>
    </PhoneFrame>
  );
};

export default ChatMockup;
