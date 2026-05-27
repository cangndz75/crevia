import Svg from 'react-native-svg';

type Props = {
  width: number;
  height: number;
  viewBox?: string;
  children: React.ReactNode;
};

/** Harita görseli ile aynı boyutta SVG overlay kabuğu */
export function MapOverlaySvg({
  width,
  height,
  viewBox = '0 0 1 1',
  children,
}: Props) {
  if (width <= 0 || height <= 0) return null;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="box-none"
    >
      {children}
    </Svg>
  );
}
