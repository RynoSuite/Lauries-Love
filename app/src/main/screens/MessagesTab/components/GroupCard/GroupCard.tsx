import React, { FunctionComponent } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import styles, { SCRIM } from './GroupCard.styles';

type GroupCardProps = {
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  memberCount: number;
  joined: boolean;
  onPress: () => void;
  onJoin: () => void;
};

/**
 * A group, as a card with its cover behind it.
 *
 * Mirrors the web card: the cover fills the card, a scrim carries the text,
 * and the whole card is the target. The scrim is not optional — covers are
 * member-supplied, so a bright or busy photograph would otherwise make the
 * name unreadable, and a card whose legibility depends on what someone
 * uploaded is a card that will eventually be illegible.
 *
 * Join stays a one-tap action here. Leaving does not: it lives on the group
 * page behind a confirm, because a stray tap on a card should never quietly
 * remove someone from a support group.
 */
const GroupCard: FunctionComponent<GroupCardProps> = ({
  name,
  description,
  coverUrl,
  memberCount,
  joined,
  onPress,
  onJoin,
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
    {coverUrl ? (
      <>
        <Image source={{ uri: coverUrl }} style={styles.cover} />
        <LinearGradient
          colors={SCRIM.colors}
          locations={SCRIM.locations}
          style={styles.scrim}
          pointerEvents="none"
        />
      </>
    ) : null}

    <View style={styles.content}>
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text style={styles.members}>
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </Text>
        {description ? (
          <Text numberOfLines={2} style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>

      {joined ? (
        <View style={styles.joinedPill}>
          <Text style={styles.joinedText}>Joined</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onJoin}
          // The card is pressable; joining must not also open the group.
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.joinPill}
        >
          <Text style={styles.joinText}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

export default React.memo(GroupCard);
