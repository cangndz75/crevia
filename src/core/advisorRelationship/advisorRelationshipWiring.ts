import { buildAdvisorOperationalRelationshipModel } from './advisorRelationshipModel';
import {
  buildAdvisorRelationshipHubLine,
  buildAdvisorRelationshipReportLine,
  buildAdvisorRelationshipResultLine,
  isDuplicateAdvisorRelationshipLine,
} from './advisorRelationshipPresentation';
import type {
  AdvisorRelationshipHubPresentation,
  AdvisorRelationshipInput,
  AdvisorRelationshipReportPresentation,
  AdvisorRelationshipResultPresentation,
} from './advisorRelationshipTypes';

export function buildAdvisorRelationshipHubPresentation(
  input: AdvisorRelationshipInput,
): AdvisorRelationshipHubPresentation {
  const model = buildAdvisorOperationalRelationshipModel(input);
  const existing = input.existingLines ?? [];

  const mainLine =
    model.hubLine && !isDuplicateAdvisorRelationshipLine(model.hubLine, existing)
      ? model.hubLine
      : model.mainAdvisorLine &&
          !isDuplicateAdvisorRelationshipLine(model.mainAdvisorLine, existing)
        ? model.mainAdvisorLine
        : undefined;

  const supportingLine =
    model.supportingLine &&
    mainLine &&
    !isDuplicateAdvisorRelationshipLine(model.supportingLine, [...existing, mainLine])
      ? model.supportingLine
      : undefined;

  const numberOfLines = model.day >= 8 ? (supportingLine ? 2 : 1) : mainLine ? 1 : 0;

  return {
    model,
    mainLine,
    supportingLine: model.day >= 8 ? supportingLine : undefined,
    numberOfLines,
    visible:
      model.relationshipVisibility !== 'hidden' &&
      Boolean(mainLine) &&
      !input.isDay1Tutorial,
  };
}

export function buildAdvisorRelationshipReportPresentation(
  input: AdvisorRelationshipInput,
): AdvisorRelationshipReportPresentation {
  const model = buildAdvisorOperationalRelationshipModel(input);
  const reportLine = buildAdvisorRelationshipReportLine(model, input.existingLines ?? []);

  return {
    model,
    reportLine,
    visible: Boolean(reportLine) && model.day >= 2,
  };
}

export function buildAdvisorRelationshipResultPresentation(
  input: AdvisorRelationshipInput,
): AdvisorRelationshipResultPresentation {
  const model = buildAdvisorOperationalRelationshipModel(input);
  const resultLine = buildAdvisorRelationshipResultLine(model, input.existingLines ?? []);

  return {
    model,
    resultLine,
    numberOfLines: 2,
    visible: Boolean(resultLine) && model.day >= 2,
  };
}

export { buildAdvisorRelationshipHubLine, buildAdvisorRelationshipReportLine, buildAdvisorRelationshipResultLine };
