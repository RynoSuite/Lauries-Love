// The daily quote shown in the left rail.
//
// Client-supplied list (Sept 2026), replacing the fixed "Connect. Empower.
// Inspire." card. One quote a day, the same one for every member.
//
// Text is stored WITHOUT its surrounding quotation marks — the card draws
// those, so the typography stays consistent no matter how a line was pasted.

export type Quote = {
  text: string;
  author: string;
};

export const QUOTES: Quote[] = [
  { text: 'This is a wonderful day. I’ve never seen this one before.', author: 'Maya Angelou' },
  { text: 'Try to be a rainbow in someone’s cloud.', author: 'Maya Angelou' },
  { text: 'Nothing can dim the light which shines from within.', author: 'Maya Angelou' },
  {
    text: 'You may not control all the events that happen to you, but you can decide not to be reduced by them.',
    author: 'Maya Angelou',
  },
  { text: 'My mission in life is not merely to survive, but to thrive.', author: 'Maya Angelou' },
  { text: 'Keep your face to the sunshine and you cannot see a shadow.', author: 'Helen Keller' },
  {
    text: 'Although the world is full of suffering, it is also full of the overcoming of it.',
    author: 'Helen Keller',
  },
  { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
  {
    text: 'Resolve to keep happy, and your joy and you shall form an invincible host against difficulties.',
    author: 'Helen Keller',
  },
  {
    text: 'The best and most beautiful things in the world cannot be seen or even touched—they must be felt with the heart.',
    author: 'Helen Keller',
  },
  { text: 'With the new day comes new strength and new thoughts.', author: 'Eleanor Roosevelt' },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    text: 'You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.',
    author: 'Eleanor Roosevelt',
  },
  { text: 'Once you choose hope, anything’s possible.', author: 'Christopher Reeve' },
  {
    text: 'The more you praise and celebrate your life, the more there is in life to celebrate.',
    author: 'Oprah Winfrey',
  },
  {
    text: 'Surround yourself with only people who are going to lift you higher.',
    author: 'Oprah Winfrey',
  },
  {
    text: 'In the depth of winter, I finally learned that within me there lay an invincible summer.',
    author: 'Albert Camus',
  },
  {
    text: 'I am not afraid of storms, for I am learning how to sail my ship.',
    author: 'Louisa May Alcott',
  },
  {
    text: 'You’re braver than you believe, stronger than you seem, and smarter than you think.',
    author: 'A. A. Milne',
  },
  { text: 'Believe you can and you’re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Don’t count the days. Make the days count.', author: 'Muhammad Ali' },
  {
    text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
    author: 'Ralph Waldo Emerson',
  },
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  { text: 'If you are going through hell, keep going.', author: 'Winston Churchill' },
  { text: 'May your choices reflect your hopes, not your fears.', author: 'Nelson Mandela' },
  {
    text: 'Your time is limited, so don’t waste it living someone else’s life.',
    author: 'Steve Jobs',
  },
  { text: 'I’m grateful for every new, healthy day I have.', author: 'Olivia Newton-John' },
  {
    text: 'I look at my cancer journey as a gift: it made me slow down and realize the important things.',
    author: 'Olivia Newton-John',
  },
  { text: 'I am going to keep having fun every day I have left.', author: 'Randy Pausch' },
  { text: 'You just have to decide whether you are a Tigger or an Eeyore.', author: 'Randy Pausch' },
  {
    text: 'You beat cancer by how you live, why you live, and in the manner in which you live.',
    author: 'Stuart Scott',
  },
  {
    text: 'You have to be willing to give up the life you planned and greet the life that is waiting for you.',
    author: 'Joseph Campbell',
  },
  { text: 'I am not what happened to me. I am what I choose to become.', author: 'Carl Jung' },
  {
    text: 'Hope is being able to see that there is light despite all of the darkness.',
    author: 'Desmond Tutu',
  },
  {
    text: 'Keep your face always toward the sunshine—and shadows will fall behind you.',
    author: 'Walt Whitman',
  },
  {
    text: 'In three words I can sum up everything I’ve learned about life: it goes on.',
    author: 'Robert Frost',
  },
  {
    text: 'How wonderful it is that nobody need wait a single moment before starting to improve the world.',
    author: 'Anne Frank',
  },
  { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
  { text: 'If you want the rainbow, you gotta put up with the rain.', author: 'Dolly Parton' },
  {
    text: 'Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin.',
    author: 'Mother Teresa',
  },
  {
    text: 'The only limit to our realization of tomorrow will be our doubts of today.',
    author: 'Franklin D. Roosevelt',
  },
  { text: 'That it will never come again is what makes life so sweet.', author: 'Emily Dickinson' },
  { text: 'It is never too late to be what you might have been.', author: 'George Eliot' },
  {
    text: 'We are all in the gutter, but some of us are looking at the stars.',
    author: 'Oscar Wilde',
  },
  {
    text: 'All we have to decide is what to do with the time that is given us.',
    author: 'J. R. R. Tolkien',
  },
  { text: 'Everything has its wonders, even darkness and silence.', author: 'Helen Keller' },
  { text: 'Be present in all things and thankful for all things.', author: 'Maya Angelou' },
  {
    text: 'Hope and fear cannot occupy the same space at the same time. Invite one to stay.',
    author: 'Maya Angelou',
  },
  { text: 'When one door of happiness closes, another opens.', author: 'Helen Keller' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
];

/**
 * The day's index, counted in whole LOCAL days since the epoch.
 *
 * Date.UTC of the local Y/M/D — not the timestamp itself — so the number only
 * changes at the member's own midnight. Using the raw epoch would roll the
 * quote over mid-evening for anyone west of UTC, and daylight saving would
 * make one day 23 hours long.
 */
export function dayIndex(date = new Date()): number {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  // The remainder is negative for a pre-epoch date (a wrong device clock), and
  // a negative index would render nothing at all.
  return ((days % QUOTES.length) + QUOTES.length) % QUOTES.length;
}

export function quoteForDay(date = new Date()): Quote {
  return QUOTES[dayIndex(date)];
}

/** Milliseconds until the next local midnight, so an open tab rolls over. */
export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return next.getTime() - now.getTime();
}
