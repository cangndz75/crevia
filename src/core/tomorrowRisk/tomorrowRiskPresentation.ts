import { buildOneMoreDayCta, buildTomorrowRiskModel } from './tomorrowRiskModel';
import type { TomorrowRiskInput, TomorrowRiskPresentation } from './tomorrowRiskTypes';

export function buildTomorrowRiskPresentation(
  input: TomorrowRiskInput,
): TomorrowRiskPresentation {
  const report = buildTomorrowRiskModel(input);
  const hub =
    report && report.shouldShowInHub && !report.shouldShowInReport
      ? report
      : report?.shouldShowInHub
        ? { ...report, shouldShowAsCompact: true, maxVisibleLines: Math.min(2, report.maxVisibleLines) }
        : null;

  return {
    report: report?.shouldShowInReport ? report : null,
    hub,
    oneMoreDayCta: buildOneMoreDayCta(report, input.day),
  };
}

export function shouldShowTomorrowRiskInReport(input: TomorrowRiskInput): boolean {
  return Boolean(buildTomorrowRiskPresentation(input).report);
}

export function shouldShowTomorrowRiskInHub(input: TomorrowRiskInput): boolean {
  return Boolean(buildTomorrowRiskPresentation(input).hub);
}
