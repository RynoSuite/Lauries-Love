import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * The shell every signed-out page sits in.
 *
 * Signing in was a small grey card centred on an empty background — the first
 * thing a member sees of a community, and it said nothing about one. The
 * community wall's artwork runs behind the whole page now, with the promise on
 * the left and the form on the right.
 *
 * The scrim is the part that matters. The artwork is dark on the left and
 * bright pink and gold in the lower right, so a flat overlay would either wash
 * out the artwork or leave the copy fighting it. This one is heaviest on the
 * left, where the words are, and thins towards the right, where the picture
 * earns its place behind the card.
 *
 * Below `lg` the columns stack and the supporting points are dropped: on a
 * phone, someone who has opened the sign-in page wants the form, not the
 * pitch. The headline stays, because it is one line and it is the reason they
 * are here.
 */
export function AuthLayout({
  children,
  points,
}: {
  children: ReactNode;
  /** The three things this community does. Omitted on narrow screens. */
  points?: { title: string; body: string }[];
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/feed-bg.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ground via-ground/92 to-ground/45" />
        {/* A second wash top to bottom, so the corners of the artwork cannot
            brighten enough to take the text with them. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ground/70 via-transparent to-ground/85" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <section className="max-w-lg">
          <Link to="/login" className="mb-8 inline-flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Laurie's Love"
              className="h-14 w-14 object-contain"
            />
            <span className="font-serif text-2xl text-heading">
              Laurie&rsquo;s Love
            </span>
          </Link>

          <h1 className="font-serif text-4xl leading-tight text-heading sm:text-5xl">
            So no warrior ever walks alone.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-body">
            A community for people facing cancer, the people who love them, and
            the people who care for them — to connect, share, and find someone
            who understands.
          </p>

          {points && points.length > 0 && (
            <ul className="mt-10 hidden space-y-5 lg:block">
              {points.map((p) => (
                <li key={p.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-magenta-text"
                  />
                  <div>
                    <div className="font-semibold text-heading">{p.title}</div>
                    <div className="text-sm text-muted">{p.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* The card keeps a solid surface rather than sitting translucent on
            the artwork: a form is for reading and typing into, and the picture
            behind it would compete with both. */}
        <section className="w-full justify-self-center lg:justify-self-end">
          <div className="w-full rounded-2xl border border-line bg-surface p-7 shadow-2xl sm:p-8 lg:max-w-md">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

/** The three things the app does, shown beside the sign-in form. */
export const AUTH_POINTS = [
  {
    title: 'A community wall',
    body: 'Share what you are going through, and read from people who have been there.',
  },
  {
    title: 'Members near you',
    body: 'Find others on the same journey nearby — locations stay approximate, on purpose.',
  },
  {
    title: 'Groups and messages',
    body: 'Join groups for your diagnosis or your role, and talk one to one.',
  },
];
