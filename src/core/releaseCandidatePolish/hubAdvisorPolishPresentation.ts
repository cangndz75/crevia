export type AdvisorSupportingLineCandidate = {
  id: 'city_echo' | 'resource' | 'pilot_theme' | 'main_operation';
  line: string;
  priority: number;
};

export function selectPriorityAdvisorSupportingLine(
  candidates: AdvisorSupportingLineCandidate[],
  day: number,
): string | undefined {
  const usable = candidates.filter((c) => c.line.trim().length > 0);
  if (usable.length === 0) return undefined;
  if (usable.length === 1) return usable[0]!.line;

  const sorted = [...usable].sort((a, b) => {
    if (day >= 8) {
      const day8Order: Record<AdvisorSupportingLineCandidate['id'], number> = {
        city_echo: 1,
        main_operation: 2,
        resource: 3,
        pilot_theme: 4,
      };
      return day8Order[a.id] - day8Order[b.id];
    }
    return a.priority - b.priority;
  });

  return sorted[0]!.line;
}
