export type PilotDayTheme =
  | 'learning'
  | 'complaint'
  | 'resource'
  | 'social_pressure'
  | 'opportunity'
  | 'butterfly_effect'
  | 'final_report';

export type PilotEventType =
  | 'citizen_complaint'
  | 'waste'
  | 'noise'
  | 'sidewalk'
  | 'market'
  | 'staff'
  | 'vehicle'
  | 'social_media'
  | 'opportunity'
  | 'butterfly'
  | 'permanent_solution'
  | 'final';

export type PilotDayPlan = {
  day: number;
  theme: PilotDayTheme;
  title: string;
  shortTitle: string;
  goal: string;
  description: string;
  primaryEventTypes: PilotEventType[];
  unlockHint: string;
  visualKey: string;
};
