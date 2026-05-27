import { CompactGameHeader } from '@/ui/components/CompactGameHeader';

type EventsStatusHeaderProps = {
  screenTitle?: string;
};

export function EventsStatusHeader({
  screenTitle = 'Olay Kararı',
}: EventsStatusHeaderProps) {
  return <CompactGameHeader screenTitle={screenTitle} />;
}
