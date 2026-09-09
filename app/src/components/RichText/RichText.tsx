import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

import colors from 'styles/colors';

// Match #hashtags and @mentions. Keep in sync with the SQL trigger in
// 20260806120000_community_features_v1.sql (hashtags) and the composer's
// mention resolver. Capturing group so String.split keeps the tokens.
const TOKEN_RE = /(#[A-Za-z0-9_]{1,50}|@[A-Za-z0-9_.]{1,50})/g;

type RichTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Called with the tag (no leading '#') when a hashtag is tapped. */
  onHashtagPress?: (tag: string) => void;
  /** Called with the handle (no leading '@') when a mention is tapped. */
  onMentionPress?: (handle: string) => void;
};

/**
 * Renders post/comment bodies with tappable, highlighted #hashtags and
 * @mentions. Purely presentational and additive — falls back to plain text
 * when no handlers are supplied. Uses a single <Text> so it wraps naturally
 * and honors numberOfLines.
 */
const RichText: React.FC<RichTextProps> = ({
  text,
  style,
  linkStyle,
  numberOfLines,
  onHashtagPress,
  onMentionPress,
}) => {
  const parts = (text ?? '').split(TOKEN_RE);
  const link = [
    { color: colors.magentaText, fontWeight: '600' as const },
    linkStyle,
  ];

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part[0] === '#' && part.length > 1) {
          const tag = part.slice(1);
          return (
            <Text
              key={`h-${i}`}
              style={link}
              suppressHighlighting
              onPress={
                onHashtagPress ? () => onHashtagPress(tag) : undefined
              }
            >
              {part}
            </Text>
          );
        }
        if (part[0] === '@' && part.length > 1) {
          const handle = part.slice(1);
          return (
            <Text
              key={`m-${i}`}
              style={link}
              suppressHighlighting
              onPress={
                onMentionPress ? () => onMentionPress(handle) : undefined
              }
            >
              {part}
            </Text>
          );
        }
        return <Text key={`t-${i}`}>{part}</Text>;
      })}
    </Text>
  );
};

export default RichText;
