import { Ability } from './Ability';
import { OperationsBrief } from './OperationsBrief';
import { CityPulseMetric } from './CityPulseMetric';
import { CityState } from './CityState';
import { DailyMission } from './DailyMission';
import { DailyReport } from './DailyReport';
import {
  EventAdvisorNote,
  EventCard,
  EventOpportunity,
  SolvedEvent,
} from './EventCard';
import { PilotGameState } from './PilotGameState';
import { PlayerState } from './PlayerState';
import { RiskItem } from './RiskItem';

export type GameState = {
  city: CityState;
  player: PlayerState;
  cityPulse: CityPulseMetric[];
  dailyMissions: DailyMission[];
  events: EventCard[];
  featuredEventId: string;
  eventOpportunity: EventOpportunity;
  solvedEvents: SolvedEvent[];
  eventAdvisor: EventAdvisorNote;
  risks: RiskItem[];
  abilities: Ability[];
  dailyReport: DailyReport;
  riskSummary: {
    total: number;
    activeThreats: number;
    critical: number;
  };
  operationsBrief: OperationsBrief;
  pilot: PilotGameState;
};
