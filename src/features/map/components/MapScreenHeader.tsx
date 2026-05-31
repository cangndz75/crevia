import { ReportHeaderCard } from '@/features/reports/components/ReportHeaderCard';
import type { MapScreenHeaderModel } from '@/features/map/presentation/mapScreenPresentation';

type Props = {
  model: MapScreenHeaderModel;
};

export function MapScreenHeader({ model }: Props) {
  return <ReportHeaderCard model={model} />;
}
