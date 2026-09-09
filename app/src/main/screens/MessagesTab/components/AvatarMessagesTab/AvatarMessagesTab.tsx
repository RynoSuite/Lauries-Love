import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Text,
  ImageSourcePropType,
} from 'react-native';

// styles
import styles from './AvatarMessagesTab.styles';
import colors from 'styles/colors';

type AvatarMessagesTabProps = {
  imageUrl: string | ImageSourcePropType;
  width?: number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  name?: string;
};

const AvatarMessagesTab: FunctionComponent<AvatarMessagesTabProps> = ({
  imageUrl,
  width = 60,
  height = 60,
  resizeMode = 'cover',
  name,
}) => {
  const hasImage = Boolean(imageUrl);
  const [loading, setLoading] = useState(hasImage);

  useEffect(() => {
    setLoading(Boolean(imageUrl));
  }, [imageUrl]);

  const showTwoLetters = useMemo(() => {
    const parts = (name ?? '').trim().split(/s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    // First and LAST word. This used to index the first word twice, so
    // "Jeremy Marshall" came out as "JJ".
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }, [name]);

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width,
          height,
        },
      ]}
    >
      {loading && hasImage && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={colors.primary[100]} />
        </View>
      )}
      {typeof imageUrl === 'string' && imageUrl.length > 0 ? (
        <Image
          source={{ uri: imageUrl, cache: 'force-cache' }}
          style={styles.avatar}
          resizeMode={resizeMode}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      ) : imageUrl && typeof imageUrl !== 'string' ? (
        <Image
          source={imageUrl}
          style={styles.avatar}
          resizeMode={resizeMode}
        />
      ) : (
        <View style={[styles.avatar, styles.notImage]}>
          <Text style={styles.text}>{showTwoLetters}</Text>
        </View>
      )}
    </View>
  );
};

export default AvatarMessagesTab;
