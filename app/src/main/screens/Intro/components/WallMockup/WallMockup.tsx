import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import colors from 'styles/colors';
import PhoneFrame from '../PhoneFrame/PhoneFrame';
import styles, { heartLobe, TABS } from './WallMockup.styles';

/**
 * The community wall, rebuilt as a live component for the intro slider.
 *
 * Replaces a flat screenshot. A screenshot goes stale the moment the design
 * moves, ships a megabyte-and-a-half PNG, and cannot animate. This is the same
 * scene drawn with the app's own tokens, so it restyles itself whenever the
 * palette changes.
 *
 * It is also a product demo, not decoration: the tabs walk themselves through
 * All posts / Friends / Groups and the timeline refills each time with
 * different people and different posts, so ten seconds of the intro shows the
 * feed working rather than one frozen frame of it.
 *
 * Everything animated is opacity and transform, so it all runs on the native
 * driver and stays smooth on an intro screen that is loading the app behind
 * it.
 */

type Post = {
  initial: string;
  name: string;
  time: string;
  // Group posts carry the room they were written in, which is how the Groups
  // tab reads as groups while still being the same timeline card.
  group?: string;
  body: string;
  likes: number;
  comments: number;
  featured?: boolean;
};

// Written to sound like the real board — a milestone, a small win, an
// invitation — because placeholder text in a mockup makes the product look
// unfinished, and the client reads these in screenshots.
const FEEDS: Post[][] = [
  [
    {
      initial: 'D',
      name: 'Danielle B.',
      time: '2h',
      body: 'Rang the bell this morning. Still does not feel real.',
      likes: 23,
      comments: 6,
      featured: true,
    },
    {
      initial: 'N',
      name: 'Naomi S.',
      time: '5h',
      body: 'Started walking again. Twenty minutes, but it is twenty more than last month.',
      likes: 11,
      comments: 2,
    },
  ],
  [
    {
      initial: 'M',
      name: 'Maya Ruiz',
      time: '1h',
      body: 'Six month scan came back clear. I have read the letter nine times.',
      likes: 41,
      comments: 12,
      featured: true,
    },
    {
      initial: 'T',
      name: 'Theo Kaplan',
      time: '3h',
      body: 'Anyone near Denver want to get coffee this week?',
      likes: 8,
      comments: 4,
    },
  ],
  [
    {
      initial: 'A',
      name: 'Alina Novak',
      time: '45m',
      group: 'Breast Cancer Warriors',
      body: 'Weekly check-in is open. How is everyone doing today?',
      likes: 34,
      comments: 9,
      featured: true,
    },
    {
      initial: 'S',
      name: 'Sam Whitfield',
      time: '4h',
      group: 'Caregivers Circle',
      body: 'Some days I am not sure who is more tired, him or me.',
      likes: 17,
      comments: 5,
    },
  ],
];

const TAB_LABELS = ['All posts', 'Friends', 'Groups'];
const PRESENCE = ['32 members online', '12 friends nearby', '18 groups active'];
const TAB_DWELL = 3600;
const LIKE_AFTER = 1500;

/**
 * A heart built from two rounded lobes rather than an imported icon: a mockup
 * depicting the icon set should not depend on it, and this one has to scale
 * and beat.
 */
const Heart: FunctionComponent<{ size: number; color: string }> = ({
  size,
  color,
}) => {
  const lobe = heartLobe(size, color);
  return (
    <View style={{ width: size, height: size }}>
      <View style={[lobe.base, lobe.left]} />
      <View style={[lobe.base, lobe.right]} />
    </View>
  );
};

const WallMockup: FunctionComponent = () => {
  const [tab, setTab] = useState(0);
  // One like lands per tab, on the top post. Reset on every tab change so the
  // loop always plays it out on the new name.
  const [liked, setLiked] = useState(false);

  const rows = useRef([0, 1].map(() => new Animated.Value(0))).current;
  const underline = useRef(new Animated.Value(0)).current;
  const heart = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const live = useRef(new Animated.Value(0)).current;

  // The unread dot on the bell, and the presence dot, share one pulse.
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(live, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(live, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [live]);

  // The tabs walk themselves through the three filters: the posts leave, the
  // underline slides, and the next tab's posts rise in behind it.
  useEffect(() => {
    let cancelled = false;

    const showRows = (delay: number) =>
      Animated.stagger(
        140,
        rows.map((row, i) =>
          Animated.timing(row, {
            toValue: 1,
            duration: 420,
            delay: i === 0 ? delay : 0,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      );

    showRows(240).start();

    const timer = setInterval(() => {
      if (cancelled) {
        return;
      }
      Animated.parallel(
        rows.map(row =>
          Animated.timing(row, {
            toValue: 0,
            duration: 170,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ).start(({ finished }) => {
        if (cancelled || !finished) {
          return;
        }
        setLiked(false);
        heart.setValue(1);
        setTab(current => {
          const next = (current + 1) % FEEDS.length;
          Animated.spring(underline, {
            toValue: next,
            useNativeDriver: true,
            speed: 14,
            bounciness: 6,
          }).start();
          return next;
        });
        showRows(0).start();
      });
    }, TAB_DWELL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [rows, underline, heart]);

  // A like lands while you are watching: the heart swells and fills, the count
  // ticks up, and two more drift off the card.
  useEffect(() => {
    const like = setTimeout(() => {
      setLiked(true);
      float.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(heart, {
            toValue: 1.45,
            useNativeDriver: true,
            speed: 20,
            bounciness: 16,
          }),
          Animated.spring(heart, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 8,
          }),
        ]),
        Animated.timing(float, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, LIKE_AFTER);
    return () => clearTimeout(like);
  }, [tab, heart, float]);

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
    ],
  });

  // A drifting heart: up and out, fading and shrinking as it goes.
  const drift = (lift: number, spread: number) => ({
    opacity: float.interpolate({
      inputRange: [0, 0.15, 0.7, 1],
      outputRange: [0, 0.85, 0.45, 0],
    }),
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -32 - lift],
        }),
      },
      {
        translateX: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, spread],
        }),
      },
      {
        scale: float.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.6, 1, 0.7],
        }),
      },
    ],
  });

  return (
    <PhoneFrame>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Wall</Text>
          <View style={styles.bell}>
            <View style={styles.bellDome} />
            <View style={styles.bellClapper} />
            <Animated.View
              style={[
                styles.bellDot,
                {
                  opacity: live.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 1],
                  }),
                  transform: [
                    {
                      scale: live.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.search}>
          <View style={styles.searchGlass} />
          <View style={styles.searchHandle} />
          <Text style={styles.searchText}>Search Community</Text>
        </View>

        <View style={styles.tabs}>
          {TAB_LABELS.map((label, i) => (
            <View key={label} style={styles.tabSlot}>
              <Text style={i === tab ? styles.tabActive : styles.tab}>
                {label}
              </Text>
            </View>
          ))}
          {/* One unit wide and scaled to the label it sits under: width cannot
              be driven natively, but scaleX can. */}
          <Animated.View
            style={[
              styles.tabUnderline,
              {
                transform: [
                  {
                    translateX: underline.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: TABS.centers,
                    }),
                  },
                  {
                    scaleX: underline.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: TABS.widths,
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <View style={styles.tabsRule} />

        <View style={styles.presence}>
          <Animated.View
            style={[
              styles.liveDot,
              {
                opacity: live.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
                transform: [
                  {
                    scale: live.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.presenceText}>{PRESENCE[tab]}</Text>
        </View>

        {FEEDS[tab].map((post, i) => {
          const hot = Boolean(post.featured);
          const on = hot && liked;
          return (
            <Animated.View
              // Keyed by slot, NOT by tab or author. A key that changes with
              // the tab remounts the card, and a native-driven animation is
              // bound to the native node it started on: the fade-in would keep
              // running against the torn-down view while the new one sat at
              // opacity 0. The slot persists; only its contents change.
              key={i}
              style={[styles.card, rise(rows[i])]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.avatar, i > 0 && styles.avatarAlt]}>
                  <Text style={[styles.avatarText, i > 0 && styles.avatarTextAlt]}>
                    {post.initial}
                  </Text>
                </View>
                <View style={styles.cardWho}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {post.name}
                  </Text>
                  {post.group ? (
                    <Text style={styles.cardGroup} numberOfLines={1}>
                      in {post.group}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.cardMeta}>{post.time}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardText} numberOfLines={2}>
                  {post.body}
                </Text>
                <View style={styles.cardFoot}>
                  {hot ? (
                    <View style={styles.driftLayer} pointerEvents="none">
                      <Animated.View style={drift(0, -9)}>
                        <Heart size={8} color={colors.magentaText} />
                      </Animated.View>
                      <Animated.View style={[styles.driftTwo, drift(10, 7)]}>
                        <Heart size={6} color={colors.magentaHi} />
                      </Animated.View>
                    </View>
                  ) : null}
                  <Animated.View
                    style={hot ? { transform: [{ scale: heart }] } : null}
                  >
                    <Heart
                      size={11}
                      color={on ? colors.magentaText : colors.faint}
                    />
                  </Animated.View>
                  <Text style={[styles.count, on && styles.countOn]}>
                    {post.likes + (on ? 1 : 0)}
                  </Text>
                  <View style={styles.comment} />
                  <Text style={styles.count}>{post.comments}</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
    </PhoneFrame>
  );
};

export default WallMockup;
