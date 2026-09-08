import { useEffect, useState } from 'react';

// Tara's story.
//
// This exists in the live mobile app (TaraStoryPostHomeTab / HomeTabTaraDetails)
// and had no web equivalent. It is the origin story of the platform, so it
// belongs somewhere a new member will actually meet it.
//
// The poster image is bundled; the video is the same S3 object the mobile app
// plays, so there is one copy rather than two that can drift apart.
const VIDEO_URL = 'https://lauries-love-video.s3.amazonaws.com/lauries.mp4';

// Remembered per browser so a returning member is not shown the full pitch
// every visit — the same idea as the mobile app's KEY_SAW_FULL_TARA_STORY
// flag, just kept locally. localStorage can throw in a private window, so
// every access is guarded and simply falls back to showing the card.
const SEEN_KEY = 'll.taraStorySeen';

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private window: showing it again is a fine failure mode */
  }
}

export function TaraStory() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true); // assume seen until read, avoids a flash

  useEffect(() => {
    setSeen(readSeen());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function play() {
    setOpen(true);
    setSeen(true);
    writeSeen();
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <button
          onClick={play}
          className="group relative block w-full"
          aria-label="Play Tara's story"
        >
          <img
            src="/tara-story.png"
            alt=""
            className="h-32 w-full object-cover object-top"
          />
          <span className="absolute inset-0 grid place-items-center bg-ground/25 transition-colors group-hover:bg-ground/10">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-magenta text-white shadow-lg">
              {/* Play triangle, nudged right so it looks centered in the circle */}
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          </span>
        </button>

        <div className="p-4">
          <h3 className="font-sans text-sm font-semibold text-magenta-text">
            Tara&rsquo;s story
          </h3>
          {!seen && (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              The inspiration behind Laurie&rsquo;s Love, a platform born from a
              deep friendship and a shared journey through cancer.
            </p>
          )}
          <button
            onClick={play}
            className="mt-2 text-sm text-magenta-text hover:underline"
          >
            {seen ? 'Watch again' : 'Watch her story'}{' '}
            <span className="text-faint">3 min</span>
          </button>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tara's story"
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <h2 className="font-serif text-lg text-heading">
                Tara&rsquo;s story
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-heading"
              >
                ×
              </button>
            </div>
            {/* autoPlay is deliberate here: the member pressed play. It is the
                one place in the app where sound starting is expected. */}
            <video
              src={VIDEO_URL}
              poster="/tara-story.png"
              controls
              autoPlay
              playsInline
              className="max-h-[70vh] w-full bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
