import { useEffect, useState } from 'react';
import { msUntilNextLocalMidnight, quoteForDay } from '../data/quotes';

// The left rail's first card. Replaces the fixed "Connect. Empower. Inspire."
// block with one quote a day from the client's list.
//
// The quote is DERIVED from the date, not stored and not random: everyone sees
// the same words on the same day, there is nothing to persist, nothing to
// fetch, and a reload never shuffles it. See `data/quotes.ts`.
export function DailyQuote() {
  const [quote, setQuote] = useState(() => quoteForDay());

  // A member with the tab open overnight would otherwise still be reading
  // yesterday's quote. Re-arm after each rollover rather than polling.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setQuote(quoteForDay());
        schedule();
      }, msUntilNextLocalMidnight());
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <img src="/you-matter.png" alt="" className="h-32 w-full object-cover" />
      <figure className="px-4 pb-4 pt-3 text-center">
        <blockquote className="font-serif text-[15px] leading-snug text-heading">
          {'“'}
          {quote.text}
          {'”'}
        </blockquote>
        <figcaption className="mt-2 text-xs font-semibold text-magenta-text">
          {'— '}
          {quote.author}
        </figcaption>
      </figure>
    </section>
  );
}
