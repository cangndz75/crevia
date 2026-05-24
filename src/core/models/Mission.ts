export type MissionStatus = 'active' | 'completed' | 'locked';

export type Mission = {
  id: string;
  title: string;
  status: MissionStatus;
  description?: string;
};
