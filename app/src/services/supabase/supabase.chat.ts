// Direct + group chat on Supabase (Phase B2) — replaces Sendbird chat.
// Legacy Sendbird channel/message shapes preserved so screens stay unchanged.
// Realtime: postgres_changes subscription on messages per conversation.

import { supabase, currentUserId, assertUuid } from './client';
import {
  publicUrlFor,
  signedUrlsFor,
  uploadChatAttachment,
} from './supabase.storage';

// Local cached session read — no network round-trip per request.
const uid = currentUserId;

const senderFromProfile = (p: any) => {
  const avatar = publicUrlFor('avatars', p?.avatar_path) ?? '';
  return {
    userId: p?.id ?? 'unknown',
    nickname: p?.display_name || p?.first_name || 'Member',
    plainProfileUrl: avatar,
    profileUrl: avatar,
    isActive: true,
    metaData: { id: p?.id ?? 'unknown' },
  };
};

const extToMime = (p: string) => {
  const ext = (p.split('.').pop() || '').toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'pdf') return 'application/pdf';
  // video: without these, .mp4/.mov rendered as broken <Image>s and never
  // matched the video filters/thumbnails in chat + Media & Docs.
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'doc' || ext === 'docx') return 'application/msword';
  if (ext === 'txt') return 'text/plain';
  return 'image/jpeg';
};

// attachmentUrl: signed URL for m.attachment_path (private bucket).
// With an attachment the legacy shape is a Sendbird FILE message.
const msgShape = (m: any, senderProfile: any, attachmentUrl?: string | null) => ({
  messageId: m.id,
  message: m.body ?? '',
  createdAt: new Date(m.created_at).getTime(),
  messageType: m.attachment_path ? 'file' : 'user',
  ...(m.attachment_path
    ? {
        url: attachmentUrl ?? '',
        plainUrl: attachmentUrl ?? '',
        name: m.attachment_path.split('/').pop() ?? 'attachment',
        type: extToMime(m.attachment_path),
        size: 0, // byte size isn't stored on the row; consumers treat 0 as unknown
      }
    : {}),
  sender: senderFromProfile(senderProfile),
  reactions: [],
});

// conversation row (+members' profiles) -> legacy chat channel shape
const conversationToChannel = (
  unread: number,
  conv: any,
  memberProfiles: any[],
  meId: string,
  lastMessage: any | null,
) => {
  const others = memberProfiles.filter(p => p?.id !== meId);
  const display =
    conv.name ||
    others.map(o => o?.display_name || o?.first_name).filter(Boolean).join(', ') ||
    'Conversation';
  return {
    url: conv.id,
    name: display,
    coverUrl: '',
    memberCount: memberProfiles.length,
    joinedMemberCount: memberProfiles.length,
    createdAt: new Date(conv.created_at).getTime(),
    customType: conv.is_group ? 'group' : 'chat',
    cachedMetaData: { type: conv.is_group ? 'group' : 'chat' },
    members: memberProfiles.map(senderFromProfile),
    creator: null,
    lastMessage: lastMessage,
    unreadMessageCount: unread,
    data: '',
  };
};

/**
 * The people in one thread.
 *
 * The Members screen was calling getGroupMembers(), which reads group_members
 * by group_id — right for a community group, empty for an ad-hoc group
 * conversation, whose people live in conversation_members. So creating a group
 * message and opening its Members screen showed nothing at all.
 *
 * resolveThreadId is used because the Messages list mixes conversation ids and
 * community-group ids in the same "channel url".
 */
export async function getConversationMembers(channelUrl: string) {
  const conversationId = await resolveThreadId(channelUrl);
  const { data, error } = await supabase
    .from('conversation_members')
    .select(
      'profile:profiles(id, first_name, last_name, display_name, avatar_path)',
    )
    .eq('conversation_id', conversationId);
  if (error) throw error;
  return (data ?? [])
    .map((r: any) => r.profile)
    .filter(Boolean)
    .map((profile: any) => senderFromProfile(profile));
}

/** All my conversations, shaped as legacy chat channels, newest first. */
export async function getMyConversations(meIdHint?: string) {
  const me = meIdHint ?? (await uid());
  if (!me) return [];

  const { data: myMemberships, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', me);
  if (error) throw error;
  const convIds = (myMemberships ?? []).map(m => m.conversation_id);
  if (convIds.length === 0) return [];

  const [{ data: convs }, { data: memberRows }] = await Promise.all([
    supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('conversation_members')
      .select(
        'conversation_id, profile:profiles(id, first_name, display_name, avatar_path)',
      )
      .in('conversation_id', convIds),
  ]);

  // Which threads are waiting for me. A function because the read marker is
  // on conversation_members while the messages are in another table, and a
  // member cannot select rows in conversations they are not part of.
  const unreadByConv: Record<string, number> = {};
  try {
    const { data: unreadRows } = await supabase.rpc(
      'my_unread_by_conversation',
    );
    (unreadRows ?? []).forEach((r: any) => {
      unreadByConv[r.conversation_id] = Number(r.unread_count) || 0;
    });
  } catch {
    // A missing function must not empty the inbox: every row simply reads as
    // having nothing unread.
  }

  const membersByConv: Record<string, any[]> = {};
  const profileById: Record<string, any> = {};
  (memberRows ?? []).forEach((r: any) => {
    (membersByConv[r.conversation_id] ??= []).push(r.profile);
    if (r.profile?.id) profileById[r.profile.id] = r.profile;
  });

  // Last message is DENORMALIZED onto conversations (maintained by the bump
  // trigger) — correct per-conversation, no global newest-N heuristic.
  const lastByConv: Record<string, any> = {};
  (convs ?? []).forEach((c: any) => {
    if (c.last_message_at) {
      lastByConv[c.id] = {
        message: c.last_message_body ?? '',
        createdAt: new Date(c.last_message_at).getTime(),
        sender: senderFromProfile(
          c.last_message_sender ? profileById[c.last_message_sender] : null,
        ),
      };
    }
  });

  return (convs ?? []).map(c =>
    conversationToChannel(
      unreadByConv[c.id] ?? 0,
      c,
      membersByConv[c.id] ?? [],
      me,
      lastByConv[c.id] ?? null,
    ),
  );
}

/**
 * Find (or create) the 1:1 conversation with another profile.
 * Atomic in the DB: find_or_create_direct_conversation() computes a canonical
 * pair key (unique index) so two devices tapping "message" simultaneously
 * always land in the SAME conversation — no check-then-insert race.
 */
export async function findOrCreateDirectConversation(otherProfileId: string) {
  assertUuid(otherProfileId);
  const { data, error } = await supabase.rpc(
    'find_or_create_direct_conversation',
    { other_profile: otherProfileId },
  );
  if (error) throw error;
  return data as string;
}

/**
 * Group chat thread: ONE conversation per group, membership derived from
 * group_members (see is_conversation_member in the DB). Find-or-create.
 */
export async function findOrCreateGroupConversation(groupId: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('group_id', groupId)
    .maybeSingle();
  if (existing) return existing.id as string;

  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('conversations')
    .insert({ is_group: true, group_id: groupId, created_by: me })
    .select('id')
    .single();
  if (error) {
    // 23505: another member created it concurrently — fetch theirs.
    if ((error as any).code === '23505') {
      const { data: raced } = await supabase
        .from('conversations')
        .select('id')
        .eq('group_id', groupId)
        .single();
      if (raced) return raced.id as string;
    }
    throw error;
  }
  return data.id as string;
}

/**
 * The Messages list mixes conversation urls and GROUP urls. Resolve either
 * into a real conversation id (creating the group thread on first open).
 */
export async function resolveThreadId(channelUrl: string) {
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', channelUrl)
    .maybeSingle();
  if (conv) return conv.id as string;

  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .eq('id', channelUrl)
    .maybeSingle();
  if (group) return findOrCreateGroupConversation(group.id);

  return channelUrl; // unknown — let downstream error surface
}

/**
 * Messages for a conversation — NEWEST FIRST (the chat screen renders an
 * inverted FlatList). `before` is a created_at ISO cursor for loading OLDER
 * history (keyset pagination) — pass the oldest loaded message's created_at.
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: string,
) {
  let q = supabase
    .from('messages')
    .select(
      '*, sender:profiles!messages_sender_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .eq('conversation_id', conversationId);
  if (before) q = q.lt('created_at', before);
  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  // Batch-sign every attachment on the page in ONE storage round-trip.
  const paths = (data ?? [])
    .map(m => m.attachment_path)
    .filter(Boolean) as string[];
  const signed = paths.length
    ? await signedUrlsFor('chat-attachments', paths)
    : {};
  return (data ?? []).map(m =>
    msgShape(m, m.sender, m.attachment_path ? signed[m.attachment_path] : null),
  );
}

export async function sendChatMessage(conversationId: string, body: string) {
  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: me, body })
    .select(
      '*, sender:profiles!messages_sender_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .single();
  if (error) throw error;
  return msgShape(data, data.sender);
}

/**
 * Send an image/document attachment: upload to the private chat-attachments
 * bucket, then insert the message row. Returns a legacy FILE-shaped message
 * with a signed display URL.
 */
export async function sendChatAttachment(
  conversationId: string,
  localUri: string,
  mimeType?: string | null,
) {
  assertUuid(conversationId, 'conversation id');
  const me = await uid();
  if (!me) throw new Error('Not authenticated');
  const path = await uploadChatAttachment(conversationId, localUri, mimeType);
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: me,
      attachment_path: path,
    })
    .select(
      '*, sender:profiles!messages_sender_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .single();
  if (error) throw error;
  const signed = await signedUrlsFor('chat-attachments', [path]);
  return msgShape(data, data.sender, signed[path]);
}

/** Attachment messages for a conversation (Media & Docs screen). */
export async function getConversationAttachments(conversationId: string) {
  assertUuid(conversationId, 'conversation id');
  const { data, error } = await supabase
    .from('messages')
    .select(
      '*, sender:profiles!messages_sender_id_fkey(id, first_name, display_name, avatar_path)',
    )
    .eq('conversation_id', conversationId)
    .not('attachment_path', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const paths = (data ?? []).map(m => m.attachment_path) as string[];
  const signed = paths.length
    ? await signedUrlsFor('chat-attachments', paths)
    : {};
  return (data ?? []).map(m => msgShape(m, m.sender, signed[m.attachment_path]));
}

/**
 * Live delivery: subscribe to new messages in a conversation.
 * Returns an unsubscribe function. The callback receives a legacy-shaped
 * message (sender profile fetched lazily).
 */
// Sender profiles are stable within a session — cache them so a busy
// conversation doesn't trigger one profiles round-trip PER incoming message.
const senderProfileCache = new Map<string, any>();
const SENDER_CACHE_MAX = 300;

export function subscribeToConversation(
  conversationId: string,
  onMessage: (msg: any) => void,
) {
  // The filter string below is interpolated — never let a non-UUID through.
  assertUuid(conversationId, 'conversation id');
  // Channel topic must be unique PER SUBSCRIBER: two screens on the same
  // conversation (e.g. support chat opened twice) previously shared the
  // `conv-<id>` topic, so removeChannel on one unmount killed delivery for
  // the still-mounted one.
  const topic = `conv-${conversationId}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async payload => {
        const row: any = payload.new;
        let sender = senderProfileCache.get(row.sender_id);
        if (!sender) {
          const { data } = await supabase
            .from('profiles')
            .select('id, first_name, display_name, avatar_path')
            .eq('id', row.sender_id)
            .single();
          sender = data;
          if (sender) {
            if (senderProfileCache.size >= SENDER_CACHE_MAX)
              senderProfileCache.clear();
            senderProfileCache.set(row.sender_id, sender);
          }
        }
        let attUrl: string | null = null;
        if (row.attachment_path) {
          const signed = await signedUrlsFor('chat-attachments', [
            row.attachment_path,
          ]).catch(() => ({}) as Record<string, string>);
          attUrl = signed[row.attachment_path] ?? null;
        }
        onMessage(msgShape(row, sender, attUrl));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Mark a thread read for the caller.
 *
 * conversation_members carries no update policy, deliberately: a member must
 * not be able to rewrite anyone's read state, including their own directly.
 * The SECURITY DEFINER function is the only way in, and the web app has used
 * it since the unread work — mobile never called it, so a badge here could
 * only ever go up.
 */
export async function markConversationRead(channelUrl: string) {
  const conversationId = await resolveThreadId(channelUrl);
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
}
