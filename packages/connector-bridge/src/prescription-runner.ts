import type { SiteConnector, Session, ChangePlan, Diff, ApplyResult } from "@mention-network/connector-sdk";
import type { Prescription } from "@mention-network/shared";

export interface PrescriptionRunner {
  /** plan + dryRun in one step; returns the preview a UI shows the merchant. */
  preview(rx: Prescription): Promise<{ plan: ChangePlan; diff: Diff }>;
  /** Applies a previously previewed plan; rejects a plan this runner never previewed. */
  apply(plan: ChangePlan): Promise<ApplyResult>;
  rollback(applyId: string): Promise<void>;
}

/**
 * Wraps connector.write and makes dry-run-before-apply a mechanical
 * guarantee instead of a convention.
 */
export function prescriptionRunner(connector: SiteConnector, session: Session): PrescriptionRunner {
  const write = connector.write;
  if (!write) throw new Error("connector is read-only — it declares no write capabilities");

  const previewed = new Set<string>();

  return {
    async preview(rx: Prescription) {
      const plan = await write.plan(session, rx);
      const diff = await write.dryRun(session, plan);
      previewed.add(plan.prescriptionId);
      return { plan, diff };
    },
    async apply(plan: ChangePlan) {
      if (!previewed.has(plan.prescriptionId)) {
        throw new Error(`plan ${plan.prescriptionId} was not previewed — run preview (dry-run) before apply`);
      }
      return write.apply(session, plan);
    },
    async rollback(applyId: string) {
      return write.rollback(session, applyId);
    },
  };
}
