import type { ReactNode } from "react";
export type IconName =
  | "search"
  | "menu"
  | "calendar"
  | "note"
  | "sparkle"
  | "plus"
  | "arrow"
  | "close"
  | "wand"
  | "check"
  | "home"
  | "send"
  | "edit"
  | "clock"
  | "eye"
  | "eyeOff"
  | "trash";

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<IconName, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
        <path d="M7.5 3v4M16.5 3v4M3.5 9h17M8 13h3M13 13h3M8 16.5h3" />
      </>
    ),
    note: (
      <>
        <path d="M5 3.5h11l3 3V20.5H5z" />
        <path d="M16 3.5v4h3M8 12h8M8 16h6" />
      </>
    ),
    sparkle: (
      <path d="m12 3 1.25 5.75L19 10l-5.75 1.25L12 17l-1.25-5.75L5 10l5.75-1.25zM19 16l.5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h13M14 7l5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    wand: (
      <>
        <path d="m15 4 5 5M4 20 16 8l-4-4L0 16z" />
        <path d="m18 2 .4 1.6L20 4l-1.6.4L18 6l-.4-1.6L16 4l1.6-.4z" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3z" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    send: (
      <>
        <path d="m21 3-7 18-4-8-8-4z" />
        <path d="m10 13 5-5" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4L19 9l-4-4L4 16z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.2 0 9.5 6 9.5 6a17.8 17.8 0 0 1-3.1 3.7M6.1 6.1C3.8 7.6 2.5 12 2.5 12s3.3 6 9.5 6c1.4 0 2.6-.3 3.7-.8" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}
