import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { ImagePickerAsset } from 'expo-image-picker';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';

// providers
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderCreateGroup from './components/HeaderCreateGroup/HeaderCreateGroup';
import AddMembersCreateGroup from './components/AddMembersCreateGroup/AddMembersCreateGroup';
import NewGroupCreateGroup from './components/NewGroupCreateGroup/NewGroupCreateGroup';
import GroupImageModal from '../components/GroupImageModal/GroupImageModal';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { createGroup as createGroupSupabase } from 'services/supabase/supabase.social';
import { uploadImage } from 'services/supabase/supabase.storage';

// constants
import { DEFAULT_NEW_GROUP } from './MessagesTabCreateGroup.constants';
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// styles
import styles from './MessagesTabCreateGroup.styles';
import { UserSendBirdType } from 'providers/ChatProvider/ChatProvider.types';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

const WIDTH = Dimensions.get('window').width;

type MessagesTabCreateGroupProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabCreateGroup: FunctionComponent<
  MessagesTabCreateGroupProps
> = ({ navigation }) => {
  const { showToast } = useToastProvider();
  const { getChannels } = useChatProvider();
  const [selectedTab, setSelectedTab] = useState(0);
  const [newGroup, setNewGroup] = useState(DEFAULT_NEW_GROUP);
  const [isShowImageModal, setIsShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateGroup, setIsCreateGroup] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const titleHeader = useMemo(
    () => (selectedTab === 0 ? 'Add Members' : 'New Group'),
    [selectedTab],
  );


  const scrollTo = () => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({ x: selectedTab * WIDTH, animated: true });
  };

  const onSelect = (selectUser: UserSendBirdType) => {
    const isSelect = newGroup.members.some(
      member => member.userId === selectUser.userId,
    );
    if (isSelect)
      setNewGroup(state => ({
        ...state,
        members: state.members.filter(
          member => member.userId !== selectUser.userId,
        ),
      }));
    else
      setNewGroup(state => ({
        ...state,
        members: [...state.members, selectUser],
      }));
  };

  const createGroup = async () => {
    try {
      if (isLoading) return;
      if (!newGroup.name?.trim()) {
        showToast({ type: 'error', message: 'Give the group a name first.' });
        setIsCreateGroup(false);
        return;
      }

      setIsLoading(true);

      if (SUPABASE_ENABLED) {
        // Supabase mode: one atomic RPC creates the group + memberships
        // (caller becomes admin). Selected members are UserSendBirdType —
        // metaData.id carries the profile id (userId equals it in Supabase
        // mode, so it's a safe fallback).
        const memberIds = newGroup.members.map(
          member => member.metaData?.id || member.userId,
        );
        // Cover photo (optional): upload to the public avatars bucket under
        // the creator's uid prefix; a failed upload shouldn't block creation.
        let coverPath: string | null = null;
        if (newGroup.image) {
          try {
            coverPath = await uploadImage('avatars', newGroup.image);
          } catch (e) {
            if (__DEV__) console.warn('group cover upload failed', e);
          }
        }
        const supabaseChannel = await createGroupSupabase(newGroup.name, {
          memberIds,
          coverPath,
        });
        await getChannels();
        navigation.navigate(PATHS_MESSAGES_TAB.messagesTabChatGroup, {
          channelUrl: supabaseChannel.url,
        });
        return; // `finally` still clears the loading/create flags
      }
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Could not create the group.',
      });
    } finally {
      setIsLoading(false);
      setIsCreateGroup(false);
    }
  };

  useEffect(() => {
    scrollTo();
  }, [selectedTab]);

  useEffect(() => {
    if (isCreateGroup) createGroup();
  }, [isCreateGroup]);

  return (
    <>
      <PaperProvider>
        <BackgroundScreen type="messages">
          <HeaderCreateGroup
            title={titleHeader}
            labelRight={
              selectedTab === 0 ? 'Next' : isLoading ? 'Creating...' : 'Create'
            }
            onPressRight={() => {
              if (selectedTab === 0) setSelectedTab(1);
              else setIsCreateGroup(true);
            }}
            isRightDisabled={isLoading || isCreateGroup}
            onPressLeft={() => {
              if (selectedTab === 0) navigation.goBack();
              else setSelectedTab(0);
            }}
          />
          <ScrollView
            ref={scrollRef}
            horizontal
            scrollEnabled={false}
            style={styles.container}
            contentContainerStyle={styles.container}
          >
            <AddMembersCreateGroup
              selectUsers={newGroup.members}
              setSelectUsers={onSelect}
            />
            <NewGroupCreateGroup
              newGroup={newGroup}
              setNewGroup={setNewGroup}
              setIsShowImageModal={setIsShowImageModal}
            />
          </ScrollView>
        </BackgroundScreen>
      </PaperProvider>
      {isShowImageModal && (
        <GroupImageModal
          onClose={() => setIsShowImageModal(false)}
          onSubmittedImage={(image: ImagePickerAsset) => {
            setNewGroup(state => ({
              ...state,
              image: image.uri,
            }));
            setIsShowImageModal(false);
          }}
        />
      )}
    </>
  );
};

export default MessagesTabCreateGroup;
