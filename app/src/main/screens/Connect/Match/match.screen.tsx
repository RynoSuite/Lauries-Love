import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';

import colors from 'styles/colors';
import {
  useGetDefinitions,
  DefinitionType,
} from 'presentation/services/react-query/definition.query';
import {
  fetchMatchDeck,
  recordSwipe,
  type DeckCandidate,
} from 'services/supabase/supabase.match';
import { findOrCreateDirectConversation } from 'services/supabase/supabase.chat';
import {
  IconArrowLeft,
  IconTabHeart,
  IconXMark,
} from 'assets/icons-auto/components';
import styles, { CARD_WIDTH, SWIPE_THRESHOLD } from './match.styles';

// Meet members — the swipe deck, reached from the map.
//
// The map answers "who is near me"; this answers "who is like me". Ranking is
// done by match_deck() in the database, shared with the web app so the two
// cannot drift: shared diagnosis first, then how close the two diagnoses were
// in time, then location.
//
// A like is private. Nobody is told they were passed over, and a MUTUAL like
// creates an accepted friendship immediately, so the pair can message each
// other with no request to approve.

const TOP_UP_AT = 5;

function Card({ member, sharedLabels, allLabels }: {
  member: DeckCandidate;
  sharedLabels: string[];
  allLabels: string[];
}) {
  const shared = new Set(sharedLabels);
  const place = [member.city, member.state].filter(Boolean).join(', ');

  return (
    <>
      <View style={styles.avatar}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitial}>
            {(member.displayName || 'M').trim().charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {member.displayName}
      </Text>
      {!!place && <Text style={styles.place}>{place}</Text>}
      {member.distanceMiles != null && (
        <Text style={styles.distance}>
          about {Math.round(member.distanceMiles)} miles away
        </Text>
      )}

      {shared.size > 0 && (
        <Text style={styles.sharedLine}>
          You both have {[...shared].join(' and ')}
        </Text>
      )}

      {(allLabels.length > 0 || member.diagnosisYear) && (
        <View style={styles.chipRow}>
          {allLabels.map((label) => {
            const isShared = shared.has(label);
            return (
              <View
                key={label}
                style={[styles.chip, isShared && styles.chipShared]}
              >
                <Text
                  style={[styles.chipText, isShared && styles.chipTextShared]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
          {!!member.diagnosisYear && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Diagnosed {member.diagnosisYear}</Text>
            </View>
          )}
        </View>
      )}

      {!!member.description && (
        <Text style={styles.bio} numberOfLines={4}>
          {member.description}
        </Text>
      )}
    </>
  );
}

function MatchCelebration({
  member,
  onKeepLooking,
  onMessage,
  opening,
}: {
  member: DeckCandidate;
  onKeepLooking: () => void;
  onMessage: () => void;
  opening: boolean;
}) {
  const scale = useSharedValue(0.88);
  const ripple = useSharedValue(0);

  useEffect(() => {
    // A spring that overshoots slightly, so the card lands rather than stops.
    scale.value = withSpring(1, { damping: 11, stiffness: 160 });
    // One heartbeat, once: a looping animation turns a moment into a nag.
    ripple.value = withTiming(1, { duration: 900 });
  }, [ripple, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.88, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ripple.value, [0, 1], [0.5, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(ripple.value, [0, 1], [0.6, 2.4]) }],
  }));

  return (
    <View style={styles.matchBackdrop}>
      <Animated.View style={[styles.matchCard, cardStyle]}>
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[styles.matchRipple, rippleStyle]} />
          <IconTabHeart width={40} height={40} stroke={colors.magentaText} fill={colors.magentaText} />
        </View>

        <Text style={styles.matchTitle}>You’re connected</Text>
        <Text style={styles.matchBody}>
          You and {member.displayName} both said yes, so you’re friends now. No request to
          send, no waiting for anyone to accept.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={onMessage}
          disabled={opening}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>
            {opening ? 'Opening…' : `Message ${member.displayName}`}
          </Text>
        </Pressable>

        <Pressable onPress={onKeepLooking} accessibilityRole="button">
          <Text style={styles.matchSecondary}>Keep looking</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const MatchScreen = () => {
  const navigation = useNavigation<any>();
  const { getChannels } = useChatProvider();
  // The APP'S OWN tab bar overlays the bottom of this screen — it is not the
  // system gesture bar, and no safe-area inset accounts for it. Measured rather
  // than guessed at, the same way HomeTabMain and the group feed do it.
  const tabBarHeight = useBottomTabBarHeight();
  const controlsBottom = tabBarHeight + 30;
  // The diagnosis taxonomy, so an id on a card can be shown as its name.
  const diagnosisTypes = useGetDefinitions(DefinitionType.diagnosisType);
  const labelsFor = useCallback(
    (ids: string[]) =>
      (ids ?? [])
        .map(id => diagnosisTypes.data?.find((d: any) => d.id === id)?.description)
        .filter(Boolean) as string[],
    [diagnosisTypes.data],
  );

  const [deck, setDeck] = useState<DeckCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<DeckCandidate | null>(null);
  const [opening, setOpening] = useState(false);

  const decided = useRef(new Set<string>());
  const fetching = useRef(false);
  const busy = useRef(false);

  const translateX = useSharedValue(0);

  const loadMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const rows = await fetchMatchDeck(20);
      const fresh = rows.filter((r) => !decided.current.has(r.id));
      setDeck((current) => {
        const seen = new Set(current.map((c) => c.id));
        const added = fresh.filter((c) => !seen.has(c.id));
        if (!added.length && current.length === 0) setExhausted(true);
        return [...current, ...added];
      });
      setError(null);
    } catch {
      setError('Could not load members. Pull back and try again.');
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (!loading && !exhausted && deck.length <= TOP_UP_AT) void loadMore();
  }, [deck.length, loading, exhausted, loadMore]);

  const commit = useCallback(
    async (direction: 'like' | 'pass') => {
      const card = deck[0];
      if (!card || busy.current) return;
      busy.current = true;

      // The card leaves immediately rather than after the round trip: a swipe
      // that visibly waits feels broken, and the safe way to fail is showing
      // someone again later.
      decided.current.add(card.id);
      setDeck((current) => current.filter((c) => c.id !== card.id));
      translateX.value = 0;

      try {
        const outcome = await recordSwipe(card.id, direction);
        if (outcome.matched) setMatched(card);
      } catch {
        setError('That swipe did not save. They will come round again.');
      } finally {
        busy.current = false;
      }
    },
    [deck, translateX],
  );

  const fling = useCallback(
    (direction: 'like' | 'pass') => {
      translateX.value = withTiming(
        direction === 'like' ? CARD_WIDTH * 1.5 : -CARD_WIDTH * 1.5,
        { duration: 180 },
        (finished) => {
          if (finished) runOnJS(commit)(direction);
        },
      );
    },
    [commit, translateX],
  );

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(CARD_WIDTH * 1.5, { duration: 180 }, (done) => {
          if (done) runOnJS(commit)('like');
        });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-CARD_WIDTH * 1.5, { duration: 180 }, (done) => {
          if (done) runOnJS(commit)('pass');
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-CARD_WIDTH, 0, CARD_WIDTH],
          [-10, 0, 10],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const passStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  /**
   * Open the thread with the person just matched.
   *
   * Mirrors details.screen.tsx exactly, including the reset rather than a
   * navigate: the chat has to sit on top of the Messages tab's own list, so
   * backing out lands in the inbox rather than back on the deck. In Supabase
   * mode the conversation id plays the role of the old Sendbird channel url,
   * and user ids ARE profile ids.
   */
  async function openConversation() {
    if (!matched) return;
    setOpening(true);
    try {
      const conversationId = await findOrCreateDirectConversation(matched.id);
      await getChannels();
      setMatched(null);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Messages',
              state: {
                routes: [
                  { name: PATHS_MESSAGES_TAB.messagesTabMain },
                  {
                    name: PATHS_MESSAGES_TAB.messagesTabChat,
                    params: { channelUrl: conversationId, userId: matched.id },
                  },
                ],
              },
            },
          ],
        }),
      );
    } catch {
      setError('Could not open the conversation. They are in your messages either way.');
    } finally {
      setOpening(false);
    }
  }

  const top = deck[0];
  const behind = deck.slice(1, 3);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to the map"
        >
          <IconArrowLeft width={24} height={24} stroke={colors.heading} />
        </Pressable>
        <Text style={styles.title}>Meet members</Text>
        <View style={styles.backButton} />
      </View>

      <Text style={styles.intro}>
        People with a similar diagnosis, near you.{' '}
        <Text style={styles.introStrong}>Right to connect, left to pass.</Text> If you both
        say yes you’re connected straight away, and nobody is told when you don’t.
      </Text>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.magentaText} />
        </View>
      ) : !top ? (
        <View style={styles.centered}>
          <IconTabHeart width={34} height={34} stroke={colors.magentaText} />
          <Text style={styles.emptyTitle}>
            {exhausted ? 'That’s everyone for now' : 'No one left to show'}
          </Text>
          <Text style={styles.emptyBody}>
            You’ve seen everyone we can suggest today. New members join often, and the map is
            another way to find people near you.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Back to the map</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.deck}>
            {/* Rendered back to front so the top card is last and sits above. */}
            {behind
              .slice()
              .reverse()
              .map((member, index) => {
                const depth = behind.length - index;
                return (
                  <View
                    key={member.id}
                    style={[
                      styles.card,
                      {
                        transform: [
                          { translateY: depth * 10 },
                          { scale: 1 - depth * 0.04 },
                        ],
                        opacity: 1 - depth * 0.35,
                      },
                    ]}
                  />
                );
              })}

            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.card, topCardStyle]}>
                <Animated.View style={[styles.stamp, styles.stampLike, likeStampStyle]}>
                  <Text style={[styles.stampText, styles.stampTextLike]}>CONNECT</Text>
                </Animated.View>
                <Animated.View style={[styles.stamp, styles.stampPass, passStampStyle]}>
                  <Text style={[styles.stampText, styles.stampTextPass]}>PASS</Text>
                </Animated.View>

                <Card
                  member={top}
                  sharedLabels={labelsFor(top.sharedDiagnosisIds)}
                  allLabels={labelsFor(top.diagnosisTypeIds)}
                />
              </Animated.View>
            </GestureDetector>
          </View>

          <Text style={styles.hint}>
            Drag the card or use the buttons. Right to connect, left to pass.
          </Text>

          <View style={styles.spacer} />

          <View style={[styles.controls, { paddingBottom: controlsBottom }]}>
            <Pressable
              style={styles.controlButton}
              onPress={() => fling('pass')}
              accessibilityRole="button"
              accessibilityLabel={`Pass on ${top.displayName}`}
            >
              <IconXMark width={24} height={24} stroke={colors.muted} />
            </Pressable>
            <Pressable
              style={[styles.controlButton, styles.controlButtonLike]}
              onPress={() => fling('like')}
              accessibilityRole="button"
              accessibilityLabel={`Connect with ${top.displayName}`}
            >
              <IconTabHeart width={28} height={28} stroke={colors.white} fill={colors.white} />
            </Pressable>
          </View>


        </>
      )}

      {!!matched && (
        <MatchCelebration
          member={matched}
          opening={opening}
          onKeepLooking={() => setMatched(null)}
          onMessage={openConversation}
        />
      )}
    </SafeAreaView>
  );
};

export default React.memo(MatchScreen);
