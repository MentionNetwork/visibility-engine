export * from "./ports.js";
export * from "./domain.js";
export { ScanPipeline, selectPacks, promptVars } from "./pipeline.js";
export { detectStoreMention, extractRetailers, displayNameFromDomain } from "./detect.js";
export { scoreUnits, type SampledUnit, type ScoreResult, type ScoreOpts } from "./score.js";

export { AuditPipeline } from "./audit/pipeline.js";
export type { AuditContextDeps } from "./audit/pipeline.js";
export type { PageFetcherPort, AuditPackSource } from "./audit/ports.js";
export { CHECK_RUNNERS, botBlocked } from "./audit/runners.js";
export { scoreAudit } from "./audit/score.js";
export { buildContext } from "./audit/context.js";
