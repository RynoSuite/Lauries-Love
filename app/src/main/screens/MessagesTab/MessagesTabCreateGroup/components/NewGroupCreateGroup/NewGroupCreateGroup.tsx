import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

// providers
import { UserSendBirdType } from 'providers/ChatProvider/ChatProvider.types';

// icons
import {
  IconArrowDown,
  IconCameraAvatar,
  IconClose,
} from 'assets/icons-auto/components';

// styles
import styles from './NewGroupCreateGroup.styles';
import colors from 'styles/colors';

type NewGroupCreateGroupProps = {
  newGroup: {
    members: UserSendBirdType[];
    name: string;
    permissions: 'public' | 'private' | null;
    image: string | null;
  };
  setNewGroup: React.Dispatch<
    React.SetStateAction<{
      members: UserSendBirdType[];
      name: string;
      permissions: 'public' | 'private' | null;
      image: string | null;
    }>
  >;
  setIsShowImageModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const NewGroupCreateGroup: FunctionComponent<NewGroupCreateGroupProps> = ({
  newGroup,
  setNewGroup,
  setIsShowImageModal,
}) => {
  const [visible, setVisible] = useState(false);

  const toggleMenu = () => {
    setVisible(!visible);
  };

  const buttonAnchor = useMemo(
    () => (
      <LinearGradient
        colors={[colors.magentaText, colors.tertiary[500]]}
        style={[
          styles.permissionsButtonGradient,
          visible && styles.permissionsButtonGradientActive,
        ]}
      >
        <Pressable
          onPress={toggleMenu}
          style={[
            styles.permissionsButton,
            visible && styles.permissionsButtonActive,
          ]}
        >
          <View style={styles.background} />
          <Text
            style={[
              styles.permissionsText,
              newGroup.permissions !== null && styles.permissionsTextSelected,
            ]}
          >
            {newGroup.permissions || 'Group permissions'}
          </Text>
          <IconArrowDown
            width={20}
            height={20}
            stroke={'red'}
            strokeWidth={2}
          />
        </Pressable>
      </LinearGradient>
    ),
    [newGroup.permissions, visible],
  );

  return (
    <ScrollView scrollEnabled={false} contentContainerStyle={styles.container}>
      <View style={styles.groupNameContainer}>
        <View style={styles.background} />
        <TouchableOpacity
          style={[styles.camera, newGroup.image && styles.cameraImage]}
          onPress={() => setIsShowImageModal(true)}
        >
          {newGroup.image ? (
            <Image
              source={{ uri: newGroup.image }}
              style={styles.groupImage}
              resizeMode={'cover'}
            />
          ) : (
            <IconCameraAvatar
              width={26}
              height={26}
              stroke={colors.white}
              strokeWidth={2.1}
            />
          )}
        </TouchableOpacity>
        <TextInput
          value={newGroup.name}
          onChangeText={text => setNewGroup(prev => ({ ...prev, name: text }))}
          placeholder="Group name"
          style={styles.groupNameInput}
          placeholderTextColor={colors.faint}
        />
      </View>
      <Menu
        visible={visible}
        onDismiss={toggleMenu}
        anchor={buttonAnchor}
        anchorPosition={'bottom'}
        contentStyle={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            setNewGroup(prev => ({ ...prev, permissions: 'public' }));
            toggleMenu();
          }}
          title={'Public'}
          contentStyle={styles.itemMenu}
          titleStyle={styles.titleItemMenu}
          rippleColor={colors.transparent}
        />
        <View style={styles.separatorMenu} />
        <Menu.Item
          onPress={() => {
            setNewGroup(prev => ({ ...prev, permissions: 'private' }));
            toggleMenu();
          }}
          title={'Private'}
          contentStyle={styles.itemMenu}
          titleStyle={styles.titleItemMenu}
          rippleColor={colors.transparent}
        />
      </Menu>
      <View style={styles.permissionsContainer}>
        <Text style={styles.permissionsTitle}>
          Group members: {newGroup.members.length}
        </Text>
        <View style={[styles.groupNameContainer, styles.membersContainer]}>
          <View style={styles.background} />
          <View style={styles.listMembers}>
            {newGroup.members.map(selectFriend => (
              <View
                key={`selectedFriend-${selectFriend.userId}`}
                style={styles.member}
              >
                <View style={styles.memberImageContainer}>
                  {selectFriend.plainProfileUrl &&
                  selectFriend.plainProfileUrl.length > 0 ? (
                    <Image
                      source={{
                        uri: selectFriend.plainProfileUrl,
                      }}
                      style={styles.memberImage}
                    />
                  ) : (
                    <View style={styles.avatarLetterContainer}>
                      <Text style={styles.avatarLetter}>
                        {selectFriend.nickname.split(' ')[0][0] ||
                          selectFriend.userId[0]}
                        {selectFriend.nickname.split(' ')[1]?.[0] || ''}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeMember}
                  onPress={() =>
                    setNewGroup(prev => ({
                      ...prev,
                      members: prev.members.filter(
                        memberItem => memberItem.userId !== selectFriend.userId,
                      ),
                    }))
                  }
                >
                  <IconClose
                    width={14}
                    height={14}
                    stroke={colors.white}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
                <Text numberOfLines={1} style={styles.memberName}>
                  {selectFriend.nickname}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default NewGroupCreateGroup;
