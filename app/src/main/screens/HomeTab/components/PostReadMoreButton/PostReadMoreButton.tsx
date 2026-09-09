import React, { FunctionComponent } from 'react';
import { Text, TouchableOpacity } from 'react-native';

// icons
import { IconArrowRight } from 'assets/icons-auto/components';

// styles
import styles from './PostReadMoreButton.styles';
import colors from 'styles/colors';

type PostReadMoreButtonProps = {
  onPress: () => void;
  text?: string;
};

const PostReadMoreButton: FunctionComponent<PostReadMoreButtonProps> = ({
  onPress,
  text = 'Read more',
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.readMoreButton}>
      <Text style={styles.readMoreText}>{text}</Text>

      <IconArrowRight
        width={19}
        height={19}
        stroke={colors.heading}
        strokeWidth={2.5}
      />
    </TouchableOpacity>
  );
};

export default React.memo(PostReadMoreButton);
