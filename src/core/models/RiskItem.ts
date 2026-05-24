export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RiskIcon = 'people' | 'vehicle' | 'megaphone' | 'alert' | 'document';

export type RiskItem = {
  id: string;
  title: string;
  subtitle: string;
  severity: RiskSeverity;
  description: string;
  probability: number;
  cost: number;
  actionLabel: string;
  icon: RiskIcon;
};
