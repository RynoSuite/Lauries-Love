import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { PageTitle } from '../components/PageTitle';
import { IconArrowRight, IconHeartFilled, IconMap, IconMessages } from '../components/Icons';
import { useDefinitions } from '../lib/useDefinitions';
import { deckName, useMatchDeck, type DeckCandidate } from '../lib/useMatchDeck';

// Meet members — the swipe deck.
//
// Reached from the map, and the pairing is deliberate: the map answers "who is
// near me", this answers "who is like me". Ranking is by shared diagnosis
// first, then how close in time their diagnosis was, then location — see
// match_deck() in 20260918140000_member_matching_v1.sql.
//
// A like is private. Nobody is told they were passed over, and a match creates
// an accepted friendship straight away rather than a request someone has to
// approve — so the pair can message the moment it happens.

// Past this many pixels a release commits the swipe. Below it the card springs
// back, so a small hesitant drag is not a decision.
const COMMIT_PX = 110;

function Chip({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'brand' }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ' +
        (tone === 'brand'
          ? 'bg-magenta-plate text-magenta-text'
          : 'border border-line bg-surface-2 text-muted')
      }
    >
      {children}
    </span>
  );
}

function MatchOverlay({
  member,
  onClose,
}: {
  member: DeckCandidate;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const name = deckName(member);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <IconHeartFilled className="mx-auto h-9 w-9 text-magenta-text" />
        <h2 className="mt-3 font-serif text-xl text-heading">You’re connected</h2>
        <p className="mt-1 text-sm text-muted">
          You and {name} both wanted to connect, so you’re friends now — no request needed.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => navigate('/messages')}
            className="flex items-center justify-center gap-2 rounded-lg bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi"
          >
            <IconMessages className="h-[18px] w-[18px]" />
            Send {name} a message
          </button>
          <Link
            to={`/users/${member.id}`}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-body transition-colors hover:bg-surface-2 hover:text-heading"
          >
            View their profile
          </Link>
          <button onClick={onClose} className="py-1 text-sm text-muted hover:text-heading">
            Keep looking
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  member,
  offset,
  dragging,
  stacked,
}: {
  member: DeckCandidate;
  offset?: number;
  dragging?: boolean;
  stacked?: number;
}) {
  const { labels } = useDefinitions();
  const name = deckName(member);
  const place = [member.city, member.state].filter(Boolean).join(', ');
  const diagnoses = labels(member.diagnosis_type_ids);
  const shared = new Set(labels(member.shared_diagnosis_ids));

  // The cards behind the top one are offset and dimmed so the pile reads as a
  // pile rather than a single card that blinks between people.
  const depth = stacked ?? 0;
  const style: React.CSSProperties = depth
    ? { transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`, opacity: 1 - depth * 0.35 }
    : {
        transform: `translateX(${offset ?? 0}px) rotate(${(offset ?? 0) / 28}deg)`,
        transition: dragging ? 'none' : 'transform 220ms ease-out',
      };

  return (
    <div
      style={style}
      className="absolute inset-x-0 top-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
    >
      <div className="flex flex-col items-center px-6 pb-5 pt-7 text-center">
        <Avatar path={member.avatar_path} name={name} size={104} />
        <h2 className="mt-3 font-serif text-xl text-heading">{name}</h2>
        {place && <p className="mt-0.5 text-sm text-muted">{place}</p>}

        {member.distance_miles != null && (
          <p className="mt-0.5 text-xs text-faint">
            about {Math.round(member.distance_miles)} miles away
          </p>
        )}

        {/* Why this person: the single most useful thing on the card. */}
        {shared.size > 0 && (
          <p className="mt-3 text-sm text-magenta-text">
            You both have {[...shared].join(' and ')}
          </p>
        )}

        {(diagnoses.length > 0 || member.diagnosis_year) && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {diagnoses.map((d) => (
              <Chip key={d} tone={shared.has(d) ? 'brand' : 'plain'}>
                {d}
              </Chip>
            ))}
            {member.diagnosis_year && <Chip>Diagnosed {member.diagnosis_year}</Chip>}
          </div>
        )}

        {member.description && (
          <p className="mt-4 line-clamp-4 text-left text-sm leading-relaxed text-body">
            {member.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function Connect() {
  const { deck, loading, error, exhausted, swipe } = useMatchDeck();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [matched, setMatched] = useState<DeckCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const startX = useRef(0);

  const top = deck[0];

  const decide = useCallback(
    async (direction: 'like' | 'pass') => {
      if (!top || busy) return;
      setBusy(true);
      // Fling the card the way it was sent before it unmounts.
      setOffset(direction === 'like' ? 600 : -600);
      const card = top;
      const result = await swipe(card, direction);
      setOffset(0);
      setBusy(false);
      if (result.matched) setMatched(card);
    },
    [top, busy, swipe],
  );

  // Arrow keys, because a deck you can only use with a mouse is a deck half the
  // people reviewing it cannot use.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (matched) return;
      if (e.key === 'ArrowRight') void decide('like');
      if (e.key === 'ArrowLeft') void decide('pass');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, matched]);

  function onPointerDown(e: React.PointerEvent) {
    if (busy) return;
    setDragging(true);
    startX.current = e.clientX;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (offset > COMMIT_PX) void decide('like');
    else if (offset < -COMMIT_PX) void decide('pass');
    else setOffset(0);
  }

  return (
    <div className="mx-auto max-w-md">
      <PageTitle
        actions={
          <Link
            to="/map"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-heading"
          >
            <IconMap className="h-[18px] w-[18px]" />
            Map
          </Link>
        }
      >
        Meet members
      </PageTitle>

      <p className="mb-5 text-sm text-muted">
        People with a similar diagnosis, near you. If you both say yes, you’re connected
        straight away — and nobody is told when you don’t.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted">Finding members…</p>
      ) : !top ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <IconHeartFilled className="mx-auto h-8 w-8 text-magenta-text" />
          <h2 className="mt-3 font-serif text-lg text-heading">
            {exhausted ? 'That’s everyone for now' : 'No one left to show'}
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            You’ve seen everyone we can suggest today. New members join often — and the map
            is another way to find people near you.
          </p>
          <Link
            to="/map"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-magenta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi"
          >
            Open the map
            <IconArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      ) : (
        <>
          {/* The pile needs a fixed height: the cards are absolutely positioned
              so they can stack, which takes them out of flow. */}
          <div
            className="relative h-[460px] touch-pan-y select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {deck
              .slice(0, 3)
              .reverse()
              .map((c, i, arr) => {
                const depth = arr.length - 1 - i;
                return depth === 0 ? (
                  <Card key={c.id} member={c} offset={offset} dragging={dragging} />
                ) : (
                  <Card key={c.id} member={c} stacked={depth} />
                );
              })}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              onClick={() => void decide('pass')}
              disabled={busy}
              aria-label={`Skip ${deckName(top)}`}
              className="grid h-14 w-14 place-items-center rounded-full border border-line-strong bg-surface text-2xl text-muted transition-colors hover:border-line-strong hover:text-heading disabled:opacity-50"
            >
              ✕
            </button>
            <button
              onClick={() => void decide('like')}
              disabled={busy}
              aria-label={`Connect with ${deckName(top)}`}
              className="grid h-16 w-16 place-items-center rounded-full bg-magenta text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
            >
              <IconHeartFilled className="h-7 w-7" />
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-faint">
            Drag the card, use the buttons, or press ← and →
          </p>
        </>
      )}

      {matched && <MatchOverlay member={matched} onClose={() => setMatched(null)} />}
    </div>
  );
}
