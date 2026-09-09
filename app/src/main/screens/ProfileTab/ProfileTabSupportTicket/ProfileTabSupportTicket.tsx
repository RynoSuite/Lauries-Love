import React, { FunctionComponent, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CommonActions,
  RouteProp,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';

// types
import { RootProfileTabParamList } from 'main/navigators/ProfileTabStacks/ProfileTabStacks.types';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import Button from 'components/Button/Button';

// providers
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// backend
import { currentUserId } from 'services/supabase/client';
import { findOrCreateDirectConversation } from 'services/supabase/supabase.chat';
import {
  getSupportTicketById,
  listSupportStaff,
  updateSupportTicketTriage,
  StaffMember,
  SupportTicket,
} from 'services/supabase/supabase.support';

// styles
import styles from './ProfileTabSupportTicket.styles';
import colors from 'styles/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootProfileTabParamList>;
};

const STATUSES: SupportTicket['status'][] = ['open', 'in_progress', 'closed'];
const STATUS_LABEL: Record<SupportTicket['status'], string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
};

const ProfileTabSupportTicket: FunctionComponent<Props> = ({ navigation }) => {
  const route =
    useRoute<RouteProp<RootProfileTabParamList, 'profile-tab-support-ticket'>>();
  const ticketId = route.params?.ticketId as string;
  const { showToast } = useToastProvider();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [status, setStatus] = useState<SupportTicket['status']>('open');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, s, me] = await Promise.all([
        getSupportTicketById(ticketId),
        listSupportStaff(),
        currentUserId(),
      ]);
      setStaff(s);
      setMyId(me);
      if (t) {
        setTicket(t);
        setStatus(t.status);
        setAssignedTo(t.assignedTo);
      }
    } catch (e) {
      if (__DEV__) console.warn('load ticket failed', e);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const save = async () => {
    if (!ticket || saving) return;
    setSaving(true);
    try {
      await updateSupportTicketTriage(ticket.id, { status, assignedTo });
      showToast({ type: 'success', message: 'Ticket updated.' });
      navigation.goBack();
    } catch (e: any) {
      showToast({
        type: 'error',
        message: e?.message ?? 'Could not save. Try again.',
      });
      if (__DEV__) console.warn('save triage failed', e);
    } finally {
      setSaving(false);
    }
  };

  const replyInChat = async () => {
    if (!ticket) return;
    try {
      // Prefer the conversation the ticket already created; otherwise open a
      // direct chat with the reporter.
      let convId = ticket.conversationId;
      if (!convId && ticket.reporterId) {
        convId = await findOrCreateDirectConversation(ticket.reporterId);
      }
      if (!convId) {
        showToast({ type: 'error', message: 'No chat available for this ticket.' });
        return;
      }
      // Cross-tab navigation into a nested chat route — RN types don't model
      // the nested `state` payload, so cast (same pattern as the Home support
      // entry). Runtime is correct.
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Messages',
          state: {
            index: 1,
            routes: [
              { name: PATHS_MESSAGES_TAB.messagesTabMain },
              {
                name: PATHS_MESSAGES_TAB.messagesTabChat,
                params: { channelUrl: convId, userId: ticket.reporterId },
              },
            ],
          },
        } as any),
      );
    } catch (e: any) {
      showToast({
        type: 'error',
        message: e?.message ?? 'Could not open the chat.',
      });
      if (__DEV__) console.warn('reply in chat failed', e);
    }
  };

  if (loading) {
    return (
      <BackgroundScreen>
        <HeaderTabScreen title="Ticket" onPressLeft={() => navigation.goBack()} />
        <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
      </BackgroundScreen>
    );
  }

  if (!ticket) {
    return (
      <BackgroundScreen>
        <HeaderTabScreen title="Ticket" onPressLeft={() => navigation.goBack()} />
        <Text style={{ textAlign: 'center', marginTop: 60, color: colors.faint }}>
          Ticket not found.
        </Text>
      </BackgroundScreen>
    );
  }

  const shortId = ticket.id.replace(/-/g, '').slice(0, 8).toUpperCase();

  return (
    <BackgroundScreen>
      <HeaderTabScreen title="Ticket" onPressLeft={() => navigation.goBack()} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <Text style={styles.cat}>
            {ticket.category} · #{shortId}
          </Text>

          <Text style={styles.k}>Description</Text>
          <Text style={styles.desc}>{ticket.description}</Text>

          <Text style={styles.k}>Reporter</Text>
          <Text style={styles.contact}>{ticket.reporterName}</Text>
          {!!ticket.reporterEmail && (
            <Text
              style={[styles.contact, styles.link]}
              onPress={() => Linking.openURL(`mailto:${ticket.reporterEmail}`)}
            >
              {ticket.reporterEmail}
            </Text>
          )}
          {!!ticket.reporterPhone && (
            <Text
              style={[styles.contact, styles.link]}
              onPress={() => Linking.openURL(`tel:${ticket.reporterPhone}`)}
            >
              {ticket.reporterPhone}
            </Text>
          )}

          <Text style={styles.k}>Status</Text>
          <View style={styles.segment}>
            {STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.segBtn, status === s && styles.segActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.segText, status === s && styles.segTextActive]}>
                  {STATUS_LABEL[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.k}>Assignee</Text>
          <View style={styles.assigneeRow}>
            <TouchableOpacity
              style={[styles.pill, assignedTo === null && styles.pillActive]}
              onPress={() => setAssignedTo(null)}
            >
              <Text
                style={[styles.pillText, assignedTo === null && styles.pillTextActive]}
              >
                Unassigned
              </Text>
            </TouchableOpacity>
            {!!myId && staff.some(s => s.id === myId) && (
              <TouchableOpacity
                style={[styles.pill, assignedTo === myId && styles.pillActive]}
                onPress={() => setAssignedTo(myId)}
              >
                <Text
                  style={[styles.pillText, assignedTo === myId && styles.pillTextActive]}
                >
                  Me
                </Text>
              </TouchableOpacity>
            )}
            {staff
              .filter(s => s.id !== myId)
              .map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.pill, assignedTo === s.id && styles.pillActive]}
                  onPress={() => setAssignedTo(s.id)}
                >
                  <Text
                    style={[styles.pillText, assignedTo === s.id && styles.pillTextActive]}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.actions}>
            <Button
              title="Reply in chat"
              variant="secondary"
              onPress={replyInChat}
            />
            <Button
              title={saving ? 'Saving…' : 'Save changes'}
              onPress={save}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </View>
    </BackgroundScreen>
  );
};

export default ProfileTabSupportTicket;
