import { randomUUID } from "node:crypto";
import type { ScanTarget, Criterion, CriterionResult, CheckResult, AuditReport } from "@mention-network/shared";
import type { PageFetcherPort, AuditPackSource } from "./ports.js";
import { buildContext } from "./context.js";
import { CHECK_RUNNERS } from "./runners.js";
import { scoreAudit } from "./score.js";

export interface AuditContextDeps {
  auditPacks: AuditPackSource;
  fetcher: PageFetcherPort;
}

export class AuditPipeline {
  constructor(private readonly deps: AuditContextDeps) {}

  async run(target: ScanTarget): Promise<AuditReport> {
    const packs = await this.deps.auditPacks.listAuditPacks();
    const criteria = packs.flatMap((p) => p.criteria);
    const ctx = await buildContext(target, criteria, this.deps.fetcher);

    const results: CriterionResult[] = [];
    for (const c of criteria) {
      const runner = CHECK_RUNNERS[c.check];
      const res: CheckResult = runner ? await runner(c, ctx) : { status: "pending" };
      results.push(toResult(c, res));
    }

    const { overallScore, groups, scoredCount, pendingCount } = scoreAudit(criteria, results);
    return {
      id: randomUUID(),
      target,
      overallScore,
      scoredCount,
      pendingCount,
      groups,
      criteria: results,
      generatedAt: new Date().toISOString(),
    };
  }
}

function toResult(c: Criterion, res: CheckResult): CriterionResult {
  if ("score" in res) return { criterionId: c.id, score: res.score, status: "scored", weight: c.weight, evidence: res.evidence };
  return { criterionId: c.id, score: null, status: res.status, weight: c.weight, evidence: res.evidence };
}
