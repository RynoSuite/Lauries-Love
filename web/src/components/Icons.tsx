// Line icons for the app shell. Drawn on a 24-pixel grid at one stroke weight,
// inheriting currentColor so they take Sea Mist / Lagoon / Magenta from the
// surrounding class — per the brand guide's icon spec. Inline SVG rather than
// an icon package: no dependency, no network fetch, no bundle cost.
type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconCommunity({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 19v-1.5a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3V19" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M21 19v-1.5a3 3 0 0 0-2.25-2.9M15.5 5.2a3 3 0 0 1 0 5.6" />
    </svg>
  );
}
export function IconGroups({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="16.5" cy="9.5" r="2.1" />
      <path d="M3 18.5v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1M15 14.6h1.8a3 3 0 0 1 3 3v.9" />
    </svg>
  );
}
export function IconMessages({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5Z" />
    </svg>
  );
}
export function IconMap({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M19 10.2c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
export function IconHeart({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20s-7.2-4.6-7.2-9.4A4 4 0 0 1 12 8.3a4 4 0 0 1 7.2 2.3C19.2 15.4 12 20 12 20Z" />
    </svg>
  );
}
// Filled counterpart for the liked state. Same path as IconHeart so the shape
// does not shift when a post is liked — only the fill arrives.
export function IconHeartFilled({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor" strokeWidth={1.2}>
      <path d="M12 20s-7.2-4.6-7.2-9.4A4 4 0 0 1 12 8.3a4 4 0 0 1 7.2 2.3C19.2 15.4 12 20 12 20Z" />
    </svg>
  );
}
export function IconComment({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5Z" />
    </svg>
  );
}
export function IconFlag({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 20V5.5M6 5.5h9.5l-1.6 3 1.6 3H6" />
    </svg>
  );
}
export function IconBell({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 16H6l1.2-2v-4a4.8 4.8 0 0 1 9.6 0v4Z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </svg>
  );
}
export function IconSupport({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="m14.4 9.6 3.4-3.4M6.2 17.8l3.4-3.4M14.4 14.4l3.4 3.4M6.2 6.2l3.4 3.4" />
    </svg>
  );
}
export function IconProfile({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5.5 19.5v-.8a4.5 4.5 0 0 1 4.5-4.5h4a4.5 4.5 0 0 1 4.5 4.5v.8" />
    </svg>
  );
}
export function IconAdmin({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 5.5 6v5.4c0 4 2.8 7.4 6.5 8.6 3.7-1.2 6.5-4.6 6.5-8.6V6L12 3.5Z" />
      <path d="m9.4 11.8 1.9 1.9 3.4-3.6" />
    </svg>
  );
}
export function IconSignOut({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 5.5h3a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-3" />
      <path d="M10 15.5 13.5 12 10 8.5M13.5 12H4.5" />
    </svg>
  );
}
export function IconBook({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 5.5h5a2.5 2.5 0 0 1 2.5 2.5v10a2 2 0 0 0-2-2h-5.5v-10Z" />
      <path d="M19.5 5.5h-5A2.5 2.5 0 0 0 12 8v10a2 2 0 0 1 2-2h5.5v-10Z" />
    </svg>
  );
}
export function IconRibbon({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21c-1.6-3.1-2.8-5.4-3.6-7.1M12 21c1.6-3.1 2.8-5.4 3.6-7.1" />
      <path d="M12 14.2c-2.6-2-3.9-3.7-3.9-5.6A3.9 3.9 0 0 1 12 4.8a3.9 3.9 0 0 1 3.9 3.8c0 1.9-1.3 3.6-3.9 5.6Z" />
    </svg>
  );
}
export function IconMore({ className = 'h-[18px] w-[18px]' }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2.2} strokeLinecap="round">
      <path d="M6 12h.01M12 12h.01M18 12h.01" />
    </svg>
  );
}
export function IconPencil({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5V20Z" />
      <path d="M14.5 6.5 17.5 9.5" />
    </svg>
  );
}
export function IconTrash({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 7h14M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7" />
      <path d="M6.5 7l.8 11a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  );
}
export function IconArrowRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h13M13 7l5 5-5 5" />
    </svg>
  );
}
