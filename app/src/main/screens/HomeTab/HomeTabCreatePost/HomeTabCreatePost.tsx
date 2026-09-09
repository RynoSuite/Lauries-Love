import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// types
import { RootHomeTabParamList } from 'main/navigators/HomeTabStacks/HomeTabStacks.types';

// providers
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { usePostsProvider } from 'providers/PostsProvider/PostsProvider';
import { useGetUsersReq } from 'presentation/services/react-query/user.query';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { createPost } from 'services/supabase/supabase.social';
import { uploadImageBase64, publicUrlFor } from 'services/supabase/supabase.storage';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import AvatarMessagesTab from 'main/screens/MessagesTab/components/AvatarMessagesTab/AvatarMessagesTab';
import VisibilitySelector from '../components/VisibilitySelector/VisibilitySelector';

// utils
import { customShowError } from 'utils/other';

// icons
import {
  IconAddImage,
  IconClose,
  IconWorld,
} from 'assets/icons-auto/components';

// constants
import { PATHS_HOME_TAB } from 'main/navigators/paths';

// styles
import styles from './HomeTabCreatePost.styles';
import colors from 'styles/colors';
import PostImageModal, {
  ImageUploadItem,
} from '../components/PostImageModal/PostImageModal';

type HomeTabCreatePostProps = {
  navigation: NativeStackNavigationProp<RootHomeTabParamList>;
};

const HomeTabCreatePost: FunctionComponent<HomeTabCreatePostProps> = ({
  navigation,
}) => {
  const { showToast } = useToastProvider();
  const [focused, setFocused] = useState(false);
  const [postText, setPostText] = useState('');
  const [readyInput, setReadyInput] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'group'>('public');
  const bottomFooterRef = useRef(new Animated.Value(10)).current;
  const inputRef = useRef<TextInput>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userDB } = useUserDBProvider();
  const { getPosts } = usePostsProvider();
  const { data: usersData } = useGetUsersReq();

  const isActionButtonActive = useMemo(() => postText.length > 0, [postText]);

  // --- @mentions -----------------------------------------------------------
  // Selected mentions this session: single-token handle (name w/o spaces) ->
  // profile id. On post we keep only the ones whose @handle still appears.
  const [selectedMentions, setSelectedMentions] = useState<
    { id: string; handle: string }[]
  >([]);

  const myId = userDB?.id ?? userDB?.cognitoId ?? '';
  const mentionCandidates = useMemo(() => {
    const list = (usersData?.data ?? []) as any[];
    return list
      .filter(u => u?.id && u.id !== myId)
      .map(u => {
        const name = (u.displayName || u.firstName || 'Member') as string;
        return { id: u.id as string, name, handle: name.replace(/\s+/g, '') };
      });
  }, [usersData?.data, myId]);

  // The active partial being typed: a trailing "@word" at the caret/end.
  const mentionPartial = useMemo(() => {
    const m = /@([A-Za-z0-9_.]*)$/.exec(postText);
    return m ? m[1] : null;
  }, [postText]);

  const mentionSuggestions = useMemo(() => {
    if (mentionPartial === null) return [];
    const q = mentionPartial.toLowerCase();
    return mentionCandidates
      .filter(c =>
        q ? c.handle.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) : true,
      )
      .slice(0, 6);
  }, [mentionPartial, mentionCandidates]);

  const onSelectMention = (c: { id: string; handle: string }) => {
    // Replace the trailing "@partial" with "@handle ".
    setPostText(prev => prev.replace(/@([A-Za-z0-9_.]*)$/, `@${c.handle} `));
    setSelectedMentions(prev =>
      prev.some(m => m.id === c.id) ? prev : [...prev, c],
    );
    inputRef.current?.focus();
  };

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageUploadItem | null>(
    null,
  );

  const toggleAnimatedFooter = () => {
    Animated.timing(bottomFooterRef, {
      toValue: focused ? 0 : 10,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const onCreatePost = async () => {
    setIsLoading(true);
    try {
      if (SUPABASE_ENABLED) {
        // Backend V2: optional photo -> Storage; 'My Groups' visibility ->
        // audience tags (role + diagnosis names, legacy semantics).
        let imagePath: string | null = null;
        if (selectedImage) {
          imagePath = await uploadImageBase64(
            'post-images',
            selectedImage.base64,
            selectedImage.ext,
          );
        }
        const audienceTags =
          visibility === 'group'
            ? ([
                userDB?.role?.description,
                ...((userDB?.diagnosisTypes ?? []) as any[]).map(
                  d => d?.description,
                ),
              ].filter(Boolean) as string[])
            : [];
        // Keep only mentions whose @handle still appears in the final body.
        const mentionIds = selectedMentions
          .filter(m => postText.includes(`@${m.handle}`))
          .map(m => m.id);
        await createPost(postText, { imagePath, audienceTags, mentionIds });
        getPosts();
        navigation.navigate(PATHS_HOME_TAB.homeTabMain);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      if (__DEV__) console.warn('Error creating post', error);
      setIsLoading(false);
      customShowError({
        error,
        showToast,
      });
    }
  };

  const handleImageSelect = (asset: ImageUploadItem) => {
    setSelectedImage(asset);
  };

  useEffect(() => {
    toggleAnimatedFooter();
  }, [focused]);

  useEffect(() => {
    if (readyInput) inputRef.current?.focus();
  }, [readyInput]);

  return (
    <>
      <BackgroundScreen type="home-create-post">
        <KeyboardAvoidingView
          style={styles.scroll}
          contentContainerStyle={styles.scroll}
          behavior="padding"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.postButtonContainer}>
              <TouchableOpacity
                disabled={!isActionButtonActive || isLoading}
                onPress={onCreatePost}
                style={[
                  styles.postButton,
                  isActionButtonActive && !isLoading && styles.postButtonActive,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.neutral[100]} />
                ) : (
                  <Text
                    style={[
                      styles.postButtonText,
                      isActionButtonActive && styles.postButtonTextActive,
                    ]}
                  >
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            scrollEnabled={false}
            style={styles.scroll}
            contentContainerStyle={styles.scroll}
          >
            <View
              style={[
                styles.container,
                selectedImage && styles.containerWithImage,
              ]}
            >
              <View style={styles.textInputContainer}>
                <View style={styles.avatarContainer}>
                  <AvatarMessagesTab
                    imageUrl={
                      publicUrlFor('avatars', userDB?.profilePicture) || ''
                    }
                    width={49}
                    height={49}
                  />
                </View>
                <TextInput
                  ref={inputRef}
                  multiline
                  placeholder="What’s happening?"
                  placeholderTextColor={colors.faint}
                  style={styles.textInput}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  value={postText}
                  onChangeText={setPostText}
                  onLayout={() => setReadyInput(true)}
                />
              </View>
              {mentionSuggestions.length > 0 && (
                <View
                  style={{
                    marginTop: 4,
                    marginLeft: 61,
                    marginRight: 12,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.line,
                    overflow: 'hidden',
                  }}
                >
                  {mentionSuggestions.map((c, idx) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => onSelectMention(c)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.line,
                      }}
                    >
                      <Text style={{ color: colors.body }}>
                        <Text style={{ color: colors.magentaText }}>@</Text>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {selectedImage && (
                <View style={styles.imageCont}>
                  <View style={styles.imageShadow}>
                    <Image
                      source={{ uri: selectedImage.previewUri }}
                      style={styles.uploadedImage}
                      resizeMode="cover"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.clearImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <IconClose
                      width={14}
                      height={14}
                      stroke={colors.white}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.8}
                    />
                  </TouchableOpacity>
                </View>
              )}
              <VisibilitySelector
                visibility={visibility}
                setVisibility={setVisibility}
              />
              {visibility === 'group' && (
                <Text style={styles.footerText}>
                  {(() => {
                    const tags = [
                      userDB?.role?.description,
                      ...((userDB?.diagnosisTypes ?? []) as any[]).map(
                        (d: any) => d?.description,
                      ),
                    ].filter(Boolean);
                    return tags.length > 0
                      ? `Shared with your community: ${tags.join(' \u00b7 ')}`
                      : 'Shared with members who match your profile';
                  })()}
                </Text>
              )}
              <Animated.View
                style={[
                  styles.footer,
                  {
                    bottom: bottomFooterRef,
                  },
                ]}
              >
                <View style={styles.footerVisibilityCont}>
                  <IconWorld width={23} height={23} />
                  <Text style={styles.footerText}>Anyone can reply</Text>
                </View>
                <TouchableOpacity
                  // Rebuild fix (user-reported): photo can be attached before
                  // typing — was disabled until the text field had content.
                  disabled={isLoading || !!selectedImage}
                  onPress={() => setShowUploadModal(true)}
                  style={[
                    styles.uploadButton,
                    !isLoading && !selectedImage && styles.uploadActiveButton,
                  ]}
                >
                  <View style={styles.imageButtonInner}>
                    <IconAddImage width={24} height={24} />
                    <Text
                      style={[
                        styles.imageButtonText,
                        isActionButtonActive && styles.imageButtonTextActive,
                      ]}
                    >
                      Add Photo
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BackgroundScreen>
      {showUploadModal && (
        <PostImageModal
          onClose={() => setShowUploadModal(false)}
          onImageSelected={asset => handleImageSelect(asset)}
        />
      )}
    </>
  );
};

export default HomeTabCreatePost;
