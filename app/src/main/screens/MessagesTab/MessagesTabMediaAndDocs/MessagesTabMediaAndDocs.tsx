import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ImagePickerAsset } from 'expo-image-picker';
import { DocumentPickerAsset } from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';

// providers
import { BaseMessageSendBirdType } from 'providers/ChatProvider/ChatProvider.types';

// supabase (Backend V2) chat
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import {
  getConversationAttachments,
  resolveThreadId,
} from 'services/supabase/supabase.chat';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import ButtonsMediaAndDocs from '../components/ButtonsMediaAndDocs/ButtonsMediaAndDocs';
import OpenFileModal from '../components/OpenFileModal/OpenFileModal';
import PhotoMediaMessagesTab from '../components/PhotoMediaMessagesTab/PhotoMediaMessagesTab';

// icons
import { IconEmptyFiles, IconFileProfile } from 'assets/icons-auto/components';

// styles
import styles from './MessagesTabMediaAndDocs.styles';
import colors from 'styles/colors';

type MessagesTabMediaAndDocsProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const WIDTH = Dimensions.get('window').width;

const MessagesTabMediaAndDocs: FunctionComponent<
  MessagesTabMediaAndDocsProps
> = ({ navigation }) => {
  const route =
    useRoute<
      RouteProp<RootMessagesTabParamList, 'messages-tab-media-and-docs'>
    >();
  const [typeSelected, setTypeSelected] = useState<
    'photos' | 'videos' | 'docs'
  >('photos');
  const [allFiles, setAllFiles] = useState<BaseMessageSendBirdType[]>([]);
  const [open, setOpen] = useState<{
    image: ImagePickerAsset | null;
    document: DocumentPickerAsset | null;
  }>({ image: null, document: null });
  const scrollType = useRef<ScrollView>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const images = useMemo(
    () => allFiles.filter(file => file.type?.startsWith('image')),
    [allFiles],
  );

  const videos = useMemo(
    () => allFiles.filter(file => file.type?.includes('video')),
    [allFiles],
  );

  const docs = useMemo(
    () =>
      allFiles.filter(
        file => !file.type?.startsWith('image') && !file.type?.includes('video'),
      ),
    [allFiles],
  );

  const index = useMemo(
    () => (typeSelected === 'photos' ? 0 : typeSelected === 'videos' ? 1 : 2),
    [typeSelected],
  );

  const getFiles = async () => {
    if (!route.params?.channelUrl) return;

    try {
      setLoading(true);
      let allFiles: BaseMessageSendBirdType[] = [];
      if (SUPABASE_ENABLED) {
        // Group urls resolve to their conversation thread; DM urls pass through.
        const threadId = await resolveThreadId(route.params.channelUrl);
        allFiles = (await getConversationAttachments(
          threadId,
        )) as unknown as BaseMessageSendBirdType[];
      }
      // Mock mode: no attachment store — empty state renders.
      const thumbnailsVideosArray = allFiles.filter(
        file => file.type && file.type.includes('video'),
      );
      const thumbnailsVideos = (
        await Promise.all(
          thumbnailsVideosArray.map(async file => {
            if (!file.url) return null;
            const thumbnails = await VideoThumbnails.getThumbnailAsync(
              file.url,
            );
            return {
              messageId: file.messageId,
              uri: thumbnails.uri,
            };
          }),
        )
      ).reduce<Record<string, string>>((acc, file) => {
        if (!file || !file.messageId) return acc;
        acc[file.messageId] = file.uri;
        return acc;
      }, {});
      setThumbnails(thumbnailsVideos);

      setAllFiles(allFiles);
    } catch (error) {
      if (__DEV__) console.warn('Error getting files', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollType.current) {
      scrollType.current.scrollTo({ x: WIDTH * index, y: 0, animated: true });
    }
  }, [typeSelected]);

  useEffect(() => {
    getFiles();
  }, [route.params?.channelUrl]);

  return (
    <>
      <BackgroundScreen type="messages">
        <HeaderTabScreen
          title="Media and Docs"
          onPressLeft={() => navigation.goBack()}
        />
        <View style={styles.container}>
          <View style={styles.buttonsContainer}>
            <ButtonsMediaAndDocs
              type={typeSelected}
              setTypeSelected={setTypeSelected}
            />
          </View>
          <ScrollView ref={scrollType} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
            {images.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {images.map((image, index) => (
                  <PhotoMediaMessagesTab
                    key={`image-${index}`}
                    messageImage={image}
                    setOpen={setOpen}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <IconEmptyFiles width={85} height={85} />
                <View style={styles.emptyTextContainer}>
                  <Text style={styles.emptyText}>No photos</Text>
                  <Text style={styles.emptySubText}>
                    Tap + to start sharing media
                  </Text>
                </View>
              </View>
            )}
            {videos.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {videos.map((video, index) => {
                  const imageUrl = thumbnails[video.messageId];
                  if (!imageUrl || !video.url) return null;

                  return (
                    <PhotoMediaMessagesTab
                      key={`video-${index}`}
                      messageImage={
                        {
                          // Grid tile: local JPEG thumbnail.
                          url: imageUrl,
                          type: video.type || '',
                          name: video.name,
                        } as BaseMessageSendBirdType
                      }
                      // Player/Share/Download need the REAL signed video URL —
                      // previously the thumbnail was handed to the video player
                      // (black screen) and the actual video was unreachable.
                      openUrl={video.url}
                      setOpen={setOpen}
                    />
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <IconEmptyFiles width={85} height={85} />
                <View style={styles.emptyTextContainer}>
                  <Text style={styles.emptyText}>No videos</Text>
                  <Text style={styles.emptySubText}>
                    Tap + to start sharing media
                  </Text>
                </View>
              </View>
            )}
            {docs.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.docContentContainer}
              >
                {docs.map((doc, index) => {
                  const isFirstThisMonth =
                    new Date(doc.createdAt).getMonth() ===
                      new Date().getMonth() &&
                    (!docs[index - 1] ||
                      new Date(docs[index - 1].createdAt).getMonth() !==
                        new Date(doc.createdAt).getMonth());
                  const isFirstOld =
                    new Date(doc.createdAt).getMonth() !==
                      new Date().getMonth() &&
                    (!docs[index - 1] ||
                      new Date(docs[index - 1].createdAt).getMonth() !==
                        new Date(doc.createdAt).getMonth());
                  const amountPages = doc.type?.includes('pdf') ? 1 : 2;
                  const sizeMB = doc.size ? doc.size / 1024 / 1024 : 0;

                  return (
                    <View key={`doc-${index}`} style={styles.docContainer}>
                      {isFirstThisMonth && (
                        <Text style={styles.dateText}>This month</Text>
                      )}
                      {isFirstOld && <Text style={styles.dateText}>Old</Text>}
                      <TouchableOpacity
                        style={styles.buttonDoc}
                        onPress={() =>
                          setOpen({
                            image: null,
                            document: {
                              uri: doc.url || '',
                              mimeType: doc.type || '',
                              name: doc.name || 'No_name.' + doc.type,
                            },
                          })
                        }
                      >
                        <IconFileProfile
                          width={44}
                          height={44}
                          stroke={colors.faint}
                        />
                        <View style={styles.docTitles}>
                          <Text style={styles.titleDoc}>
                            {doc.name || 'No_name.' + doc.type}
                          </Text>
                          <Text style={styles.subTitleDoc}>
                            {amountPages > 0 ? `${amountPages} pages •` : ''}
                            {sizeMB > 0 ? ` ${sizeMB.toFixed(2)} MB •` : ''}
                            {` ${
                              doc.type?.split('/').pop()?.toLocaleLowerCase() ||
                              'no type'
                            }`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <IconEmptyFiles width={85} height={85} />
                <View style={styles.emptyTextContainer}>
                  <Text style={styles.emptyText}>No docs</Text>
                  <Text style={styles.emptySubText}>
                    Tap + to start sharing media
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              color={colors.heading}
              size="large"
              animating={loading}
            />
          </View>
        )}
      </BackgroundScreen>
      {open.image && (
        <OpenFileModal
          file={open.image}
          onClose={() => setOpen({ image: null, document: null })}
        />
      )}
      {open.document && (
        <OpenFileModal
          file={open.document}
          onClose={() => setOpen({ image: null, document: null })}
        />
      )}
    </>
  );
};

export default MessagesTabMediaAndDocs;
