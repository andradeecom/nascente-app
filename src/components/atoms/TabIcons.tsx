import { ColorValue } from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';

type TabIconProps = {
  color: ColorValue;
  size: number;
  focused: boolean;
  /** Tab-bar background, used to knock out inner details on the filled (focused) glyphs. */
  bg: string;
};

/**
 * Custom bottom-tab icon set with matching linear (unfocused) and solid (focused)
 * variants, so the active tab reads as filled rather than only changing color.
 * Hand-drawn on a 24x24 grid with a shared visual weight instead of pulling in a
 * second icon library just for solid glyphs. Each solid variant fills the exact
 * silhouette of its linear counterpart; inner details knock out in the tab-bar
 * background color (`bg`) so they read as cutouts in both light and dark themes.
 */

const STROKE = 1.9;

/** Home — a house with a rounded roofline and a door. */
export function HomeTabIcon({ color, size, focused, bg }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 20.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5"
        fill="none"
        stroke={focused ? bg : color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Reader — an open book. */
export function ReaderTabIcon({ color, size, focused, bg }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 6.5C12 5 10.5 4 8.5 4H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4.5c1.6 0 3.5.8 3.5 2 0-1.2 1.9-2 3.5-2H20a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4.5C13.5 4 12 5 12 6.5z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Line x1={12} y1={6.5} x2={12} y2={20} stroke={focused ? bg : color} strokeWidth={STROKE} />
    </Svg>
  );
}

/** Plans — a calendar. */
export function PlansTabIcon({ color, size, focused, bg }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x={3.5}
        y={5}
        width={17}
        height={15.5}
        rx={2.5}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={STROKE}
      />
      <Line x1={3.5} y1={9.5} x2={20.5} y2={9.5} stroke={focused ? bg : color} strokeWidth={STROKE} />
      <Line x1={8} y1={3} x2={8} y2={6.5} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={6.5} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** Study — a bookmark/ribbon (organized notes & saved passages). */
export function StudyTabIcon({ color, size, focused }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v15.5l-7-4-7 4V5a1.5 1.5 0 0 1 1.5-1.5z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Settings — sliders/adjustments with knob handles. */
export function SettingsTabIcon({ color, size, focused, bg }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={4} y1={7} x2={20} y2={7} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1={4} y1={12} x2={20} y2={12} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1={4} y1={17} x2={20} y2={17} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Knob cx={9} cy={7} color={color} focused={focused} bg={bg} />
      <Knob cx={15} cy={12} color={color} focused={focused} bg={bg} />
      <Knob cx={8} cy={17} color={color} focused={focused} bg={bg} />
    </Svg>
  );
}

/** Slider handle knob — filled when focused, hollow (bg-filled) when not. */
function Knob({
  cx,
  cy,
  color,
  focused,
  bg,
}: {
  cx: number;
  cy: number;
  color: ColorValue;
  focused: boolean;
  bg: string;
}) {
  return <Circle cx={cx} cy={cy} r={2.6} fill={focused ? color : bg} stroke={color} strokeWidth={STROKE} />;
}
