import {
  countEchoTemplatesByDomain,
  countEchoTemplatesBySurface,
} from './eventEchoValidation';
import { ALL_EVENT_ECHO_TEMPLATES } from './eventEchoCopy';
import type { EventEchoContext } from './eventEchoTypes';
import {
  buildEventEchoBundle,
  selectAdvisorEcho,
  selectReportEcho,
  selectSocialEcho,
  selectTomorrowHintEcho,
} from './eventEchoSelectors';

export function buildAdvisorEchoLine(context: EventEchoContext): string | undefined {
  return selectAdvisorEcho(context)?.text;
}

export function buildSocialEchoMention(context: EventEchoContext): string | undefined {
  return selectSocialEcho(context)?.text;
}

export function buildReportEchoLine(context: EventEchoContext): string | undefined {
  return selectReportEcho(context)?.text;
}

export function buildTomorrowHintLine(context: EventEchoContext): string | undefined {
  return selectTomorrowHintEcho(context)?.text;
}

export function buildEventEchoBundleForPresentation(
  context: EventEchoContext,
) {
  return buildEventEchoBundle(context);
}

export function buildEventEchoSummaryForDocs(): string {
  const bySurface = countEchoTemplatesBySurface();
  const byDomain = countEchoTemplatesByDomain();
  return [
    '# Event Echo Pack Özet',
    '',
    `Toplam template: ${ALL_EVENT_ECHO_TEMPLATES.length}`,
    '',
    '## Yüzey',
    ...Object.entries(bySurface).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Domain',
    ...Object.entries(byDomain).map(([k, v]) => `- ${k}: ${v}`),
  ].join('\n');
}

export function formatEventEchoCoverageTable(): string {
  const byDomain = countEchoTemplatesByDomain();
  return Object.entries(byDomain)
    .map(([domain, count]) => `${domain}: ${count}`)
    .join('\n');
}

export function buildNextContentPackStage3Step(): string {
  return 'Sonraki adım: Crevia Event Domain UI Prioritization';
}

export function buildEventEchoDebugSummary(context: EventEchoContext): string {
  const bundle = buildEventEchoBundle(context);
  return [
    `domain=${context.domain}`,
    `day=${context.day}`,
    `outcome=${context.outcomeBand}`,
    `advisor=${bundle.advisorLine?.slice(0, 40) ?? '-'}`,
    `social=${bundle.socialMention?.slice(0, 40) ?? '-'}`,
    `report=${bundle.reportLine?.slice(0, 40) ?? '-'}`,
    `tomorrow=${bundle.tomorrowHint?.slice(0, 40) ?? '-'}`,
  ].join(' | ');
}
