import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Renders one message attachment.
//
// chat-attachments is a PRIVATE bucket, gated on conversation membership, so
// there is no public URL to put in a src. Every attachment needs a signed URL
// minted for the viewer, which is also what the mobile app does. Signed links
// expire, so they are fetched when the bubble mounts rather than stored.

const IMAGE = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif'];
const VIDEO = ['mp4', 'mov', 'webm', 'm4v', 'ogg'];

const SIGNED_URL_TTL = 60 * 60; // an hour is plenty for a session

function extOf(path: string): string {
  return (path.split('.').pop() ?? '').toLowerCase();
}

export function fileNameOf(path: string): string {
  const raw = path.split('/').pop() ?? 'attachment';
  // Stored as "<uid>-<timestamp>.<ext>"; show something a person can read
  // rather than a uuid.
  return raw.replace(/^[0-9a-f-]{36}-\d+\./i, 'attachment.');
}

export function MessageAttachment({
  path,
  mine,
}: {
  path: string;
  mine: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.storage
      .from('chat-attachments')
      .createSignedUrl(path, SIGNED_URL_TTL)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  const ext = extOf(path);

  if (failed) {
    return (
      <div className={'text-xs ' + (mine ? 'text-white/70' : 'text-faint')}>
        This attachment is no longer available.
      </div>
    );
  }
  if (!url) {
    return (
      <div className={'text-xs ' + (mine ? 'text-white/70' : 'text-faint')}>
        Loading attachment…
      </div>
    );
  }

  if (IMAGE.includes(ext)) {
    return (
      <a href={url} target="_blank" rel="noreferrer noopener">
        <img
          src={url}
          alt=""
          loading="lazy"
          className="max-h-72 rounded-lg object-contain"
        />
      </a>
    );
  }

  if (VIDEO.includes(ext)) {
    return (
      // No autoplay: a video that starts talking on its own in a support
      // conversation is the wrong surprise.
      <video src={url} controls preload="metadata" className="max-h-72 rounded-lg" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={
        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm underline ' +
        (mine ? 'bg-white/10 text-white' : 'bg-ground/40 text-heading')
      }
    >
      <span aria-hidden="true">📎</span>
      {fileNameOf(path)}
    </a>
  );
}
