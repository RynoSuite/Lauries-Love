import React, { FunctionComponent } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// styles
import styles from './HeaderCreateGroup.styles';

type HeaderCreateGroupProps = {
  title: 'Add Members' | 'New Group';
  labelRight: string;
  onPressRight: () => void;
  isRightDisabled: boolean;
  onPressLeft: () => void;
};

const HeaderCreateGroup: FunctionComponent<HeaderCreateGroupProps> = ({
  title,
  labelRight,
  onPressRight,
  isRightDisabled,
  onPressLeft,
}) => (
  <View style={styles.container}>
    <TouchableOpacity
      disabled={labelRight === 'Creating...'}
      onPress={onPressLeft}
      style={styles.cancelButton}
    >
      <Text style={styles.cancelText}>Cancel</Text>
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
    <TouchableOpacity
      onPress={onPressRight}
      disabled={isRightDisabled}
      style={styles.nextButton}
    >
      <Text
        style={[styles.nextText, isRightDisabled && styles.nextTextDisabled]}
      >
        {labelRight}
      </Text>
    </TouchableOpacity>
  </View>
);

export default HeaderCreateGroup;
