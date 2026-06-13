export type CreviaMapDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type CreviaMapPoint = {
  x: number;
  y: number;
};

export type CreviaMapDistrictLayout = {
  id: CreviaMapDistrictId;
  label: string;
  center: CreviaMapPoint;
  color: string;
  labelTextColor?: string;
};

export type CreviaMapMarkerKind =
  | 'main'
  | 'pulse'
  | 'container'
  | 'personnel'
  | 'vehicle'
  | 'completed';

export type CreviaMapOperationMarker = {
  id: string;
  districtId?: CreviaMapDistrictId;
  point: CreviaMapPoint;
  color?: string;
  kind?: CreviaMapMarkerKind;
  priority?: 'normal' | 'high' | 'critical';
  minZoom?: number;
};

export type CreviaMapImageAsset = {
  source: number;
  width: number;
  height: number;
};

export type CreviaBaseMapMode = 'card' | 'fullscreen';
