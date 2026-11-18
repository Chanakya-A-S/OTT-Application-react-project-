import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Each icon: list of [shape, props] drawn on a 24x24 stroke grid.
const P = (d) => ['p', { d }];
const C = (cx, cy, r) => ['c', { cx, cy, r }];
const R = (x, y, width, height, rx) => ['r', { x, y, width, height, rx }];

const ICONS = {
  home: [P('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z')],
  tasks: [R(5, 4, 14, 17, 3), P('M9 4V3h6v1M9 12l2 2 4-4')],
  timer: [C(12, 13, 8), P('M12 9v4l2.5 2M10 2h4')],
  notes: [P('M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z'), P('M14 3v5h5M8 13h8M8 17h5')],
  user: [C(12, 8, 4), P('M4 21c1-4 4.5-6 8-6s7 2 8 6')],
  bell: [P('M6 16V11a6 6 0 1 1 12 0v5l2 2H4z'), P('M10 21h4')],
  heart: [P('M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z')],
  plus: [P('M12 5v14M5 12h14')],
  check: [P('M5 12.5 10 17l9-10')],
  play: [P('M8 5v14l11-7z')],
  pause: [P('M8 5v14M16 5v14')],
  search: [C(11, 11, 7), P('m20 20-4-4')],
  image: [R(3, 4, 18, 16, 3), C(9, 10, 2), P('m21 16-5-5-9 9')],
  camera: [P('M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z'), C(12, 13.5, 3.5)],
  back: [P('M15 5l-7 7 7 7')],
  more: [C(12, 5, 1), C(12, 12, 1), C(12, 19, 1)],
  cal: [R(3, 5, 18, 16, 3), P('M3 10h18M8 3v4M16 3v4')],
  clock: [C(12, 12, 9), P('M12 7v5l3 2')],
  list: [P('M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01')],
  chev: [P('m9 5 7 7-7 7')],
  chevL: [P('m15 5-7 7 7 7')],
  moon: [P('M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z')],
  sun: [C(12, 12, 4), P('M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5')],
  edit: [P('M4 20h4L19 9l-4-4L4 16z')],
  book: [P('M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z'), P('M4 19V5')],
  reset: [P('M4 4v6h6'), P('M20 12a8 8 0 1 0-2.3 5.7')],
  trash: [P('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3')],
  pin: [P('M9 4h6l-1 6 4 3v2H6v-2l4-3z'), P('M12 15v6')],
  x: [P('M6 6l12 12M18 6 6 18')],
  bulb: [P('M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z')],
  palette: [P('M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z'), C(7.5, 11, 1), C(11, 7, 1), C(16, 8, 1)],
  settings: [C(12, 12, 3), P('M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z')],
  logout: [P('M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9')],
  cloud: [P('M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z')],
  checkSq: [R(4, 4, 16, 16, 4), P('m8 12 3 3 5-6')],
  text: [P('M5 6h14M12 6v13M9 19h6')],
  grip: [P('M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01')],
  eye: [P('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'), C(12, 12, 3)],
  eyeOff: [P('M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2')],
  mail: [R(3, 5, 18, 14, 3), P('m3 7 9 6 9-6')],
  lock: [R(5, 11, 14, 10, 3), P('M8 11V7a4 4 0 0 1 8 0v4')],
  flame: [P('M12 21c4 0 7-2.5 7-7 0-4-3-6-4-9-1 3-3 4-4 4 0-2-1-3-2-4-1 3-4 5-4 9 0 4.5 3 7 7 7z')],
  stop: [R(6, 6, 12, 12, 3)],
  chart: [P('M4 20V10M10 20V4M16 20v-7M22 20H2')],
  skip: [P('M5 5l10 7-10 7zM19 5v14')],
};

export default function Icon({ name, size = 22, color = '#000', width = 2, fill = 'none' }) {
  const shapes = ICONS[name] || ICONS.more;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {shapes.map(([k, p], i) =>
        k === 'p' ? <Path key={i} {...p} /> : k === 'c' ? <Circle key={i} {...p} /> : <Rect key={i} {...p} />
      )}
    </Svg>
  );
}
