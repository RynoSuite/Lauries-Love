import React, { FunctionComponent, useMemo } from 'react';
import {
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// icons
import {
  IconArrowRight,
  IconComments,
  IconTabHeart,
} from 'assets/icons-auto/components';

// styles
import styles from './PostFooter.styles';
import colors from 'styles/colors';

type PostFooterProps = {
  onPressLike: () => void;
  onPressComment: () => void;
  isLiked: boolean;
  likes: number;
  comments: number;
  footerStyles?: StyleProp<ViewStyle>;
};

const PostFooter: FunctionComponent<PostFooterProps> = ({
  isLiked,
  likes,
  onPressLike,
  onPressComment,
  comments,
  footerStyles,
}) => {
  const footerStyle = useMemo(
    () => [styles.footer, footerStyles],
    [footerStyles],
  );

  return (
    <View style={footerStyle}>
      <TouchableOpacity style={styles.footerLeft} onPress={onPressLike}>
        <IconTabHeart
          width={24}
          height={24}
          stroke={isLiked ? colors.magentaText : colors.muted}
          strokeWidth={2.5}
          fill={isLiked ? colors.magentaText : colors.transparent}
        />
        <Text style={styles.footerText}>{likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerLeft} onPress={onPressComment}>
        {/* Same rule as the heart: muted until there is something to see,
            magenta once the post has comments. A permanently pink icon says
            nothing, and every post looked identical. */}
        <IconComments
          width={24}
          height={24}
          stroke={comments > 0 ? colors.magentaText : colors.muted}
        />
        <Text style={styles.footerText}>{comments}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(PostFooter);
