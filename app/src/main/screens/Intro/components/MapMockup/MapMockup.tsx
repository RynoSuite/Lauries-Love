import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import colors from 'styles/colors';
import PhoneFrame from '../PhoneFrame/PhoneFrame';
import styles, { MARKERS, ROADS } from './MapMockup.styles';

/**
 * The member map, rebuilt as a live component for the intro slider's second
 * slide ("Find support near you").
 *
 * Models the real screen: the same dark inverted tiles, magenta clusters that
 * break apart as you zoom, a pin popup with the member's name in magenta, and
 * the count of members in view. It runs the loop a user would run by hand —
 * markers land, a cluster opens, a member's card pops — so the slide shows the
 * map working rather than a screenshot of one.
 *
 * It also tells the truth about privacy. Real member positions are rounded to
 * a ~3.5 mile grid before they are ever stored, so the viewer is drawn as a
 * dot inside an accuracy ring rather than as a precise point. A mockup that
 * implied street-level accuracy would be advertising something the product
 * deliberately does not do.
 *
 * Everything animated is opacity and transform, so it all runs on the native
 * driver.
 */

const NEARBY = [
  { name: 'Maya Ruiz', detail: 'Survivor · 3 mi away' },
  { name: 'Theo Kaplan', detail: 'Caregiver · 5 mi away' },
];

const CYCLE = 4200;

const MapMockup: FunctionComponent = () => {
  // Which member's card is open, and whether the big cluster has broken apart.
  const [who, setWho] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const pins = useRef(MARKERS.map(() => new Animated.Value(0))).current;
  const zoom = useRef(new Animated.Value(0)).current;
  const popup = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  // The accuracy ring around the viewer, breathing outward. This is the
  // privacy story made visible: a area, never a point.
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    // A slow pan, so the map never looks frozen.
    const pan = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    pan.start();
    return () => {
      pulse.stop();
      pan.stop();
    };
  }, [ring, drift]);

  // Markers land one after another, the way they do when the map finishes
  // loading its members.
  useEffect(() => {
    const land = Animated.stagger(
      90,
      pins.map(pin =>
        Animated.spring(pin, {
          toValue: 1,
          delay: 200,
          useNativeDriver: true,
          speed: 14,
          bounciness: 10,
        }),
      ),
    );
    land.start();
    return () => land.stop();
  }, [pins]);

  // The loop: zoom in so the cluster breaks into its members, open one
  // member's card, close it, zoom back out and move to the next member.
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) {
        return;
      }
      setZoomed(true);
      Animated.parallel([
        Animated.timing(zoom, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(popup, {
          toValue: 1,
          delay: 500,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
      ]).start();

      setTimeout(() => {
        if (cancelled) {
          return;
        }
        Animated.parallel([
          Animated.timing(popup, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(zoom, {
            toValue: 0,
            duration: 600,
            delay: 120,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (cancelled || !finished) {
            return;
          }
          setZoomed(false);
          setWho(current => (current + 1) % NEARBY.length);
        });
      }, CYCLE - 1400);
    };

    const first = setTimeout(run, 900);
    const timer = setInterval(run, CYCLE);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [zoom, popup]);

  const member = NEARBY[who];

  return (
    <PhoneFrame>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Members near you</Text>
        <View style={styles.locate}>
          <View style={styles.locateRing} />
          <View style={styles.locateDot} />
        </View>
      </View>

      <View style={styles.filters}>
        {['All', 'Survivors', 'Caregivers'].map((f, i) => (
          <View key={f} style={[styles.chip, i === 0 && styles.chipOn]}>
            <Text style={[styles.chipText, i === 0 && styles.chipTextOn]}>
              {f}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.canvas}>
        {/* The tile layer. The real map inverts OpenStreetMap to sit on the
            dark ground; at this size that reads as pale streets on deep teal,
            so the streets are drawn rather than fetched. */}
        <Animated.View
          style={[
            styles.tiles,
            {
              transform: [
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-5, 5],
                  }),
                },
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, -3],
                  }),
                },
                {
                  scale: zoom.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.22],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.water} />
          <View style={styles.park} />
          {ROADS.map((road, i) => (
            <View key={i} style={road} />
          ))}

          {MARKERS.map((marker, i) => {
            // The big cluster is the one that breaks apart on zoom: its badge
            // fades as its members fade in, which is what marker clustering
            // actually looks like on the real map.
            const isCluster = marker.count > 1;
            const opening = isCluster && zoomed;
            return (
              <Animated.View
                key={i}
                style={[
                  marker.at,
                  {
                    opacity: pins[i],
                    transform: [
                      { scale: pins[i] },
                      {
                        // Counter-scale so pins keep their size while the
                        // tiles zoom, exactly as map markers do.
                        scale: zoom.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.82],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {isCluster ? (
                  <>
                    <View
                      style={[styles.cluster, opening && styles.clusterFaded]}
                    >
                      <Text style={styles.clusterText}>{marker.count}</Text>
                    </View>
                    {opening ? (
                      <>
                        <View style={[styles.pin, styles.split1]} />
                        <View style={[styles.pin, styles.split2]} />
                        <View style={[styles.pin, styles.split3]} />
                      </>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.pin} />
                )}
              </Animated.View>
            );
          })}

          {/* The viewer: a dot inside an accuracy ring, never a precise
              point — member coordinates are rounded before storage. */}
          <View style={styles.mePosition}>
            <Animated.View
              style={[
                styles.meRing,
                {
                  opacity: ring.interpolate({
                    inputRange: [0, 0.15, 1],
                    outputRange: [0, 0.5, 0],
                  }),
                  transform: [
                    {
                      scale: ring.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.8],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.meHalo} />
            <View style={styles.meDot} />
          </View>
        </Animated.View>

        {/* The member card, the same shape the real popup uses: name in
            magenta, one line of detail.

            It sits outside the tiles layer on purpose. As a child of it the
            popup inherited the zoom, and a view scaled up after it is drawn
            has its text rasterised at the smaller size — which is why it
            arrived blurry and only sharpened once the zoom settled. Map
            popups do not scale with the map anyway. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.popup,
            {
              opacity: popup,
              transform: [
                {
                  translateY: popup.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.popupAvatar}>
            <Text style={styles.popupInitial}>{member.name.charAt(0)}</Text>
          </View>
          <View style={styles.popupText}>
            <Text style={styles.popupName} numberOfLines={1}>
              {member.name}
            </Text>
            <Text style={styles.popupDetail} numberOfLines={1}>
              {member.detail}
            </Text>
          </View>
          <View style={styles.popupTail} />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerCount}>{zoomed ? 24 : 18} members in view</Text>
      </View>
    </PhoneFrame>
  );
};

export default MapMockup;
