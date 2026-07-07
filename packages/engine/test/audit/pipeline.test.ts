import { describe, test, expect } from "vitest";
import type { AuditPack, ScanTarget } from "@mention-network/shared";
import { AuditPipeline } from "../../src/audit/pipeline.js";
import { FakePageFetcher, FakeAuditPackSource } from "./fakes.js";

const target: ScanTarget = {
  store: { id: "s", domain: "glow.ae", displayName: "Glow" },
  product: { id: "p", title: "Serum", category: "serum", url: "https://glow.ae/serum", attributes: {}, variants: [], offer: { price: { amount: 28, currency: "USD" }, availability: "in_stock", source: "manual" } },
};

const pack: AuditPack = {
  id: "on-store-access", type: "audit", area: "on_store", version: "0.1.0", engineApi: "^0.1.0",
  label: { en: "AI access" },
  criteria: [
    { id: "access.robots", label: { en: "robots" }, group: "access", area: "on_store", weight: "critical", scope: "store", check: "robots_allows_bot", scoring: { "0": "", "50": "", "100": "" } },
    { id: "content.unique", label: { en: "unique" }, group: "content", area: "on_store", weight: "high", scope: "product_page", check: "llm_judge", scoring: { "0": "", "50": "", "100": "" } },
  ],
};

describe("AuditPipeline", () => {
  test("runs runners, scores, and marks llm_judge pending", async () => {
    const fetcher = new FakePageFetcher("User-agent: *\nDisallow:", { "https://glow.ae/serum": { rawHtml: "Serum $28" } });
    const pipeline = new AuditPipeline({ auditPacks: new FakeAuditPackSource([pack]), fetcher });
    const report = await pipeline.run(target);

    expect(report.overallScore).toBe(100);        // robots allowed; content pending
    expect(report.scoredCount).toBe(1);
    expect(report.pendingCount).toBe(1);
    const robots = report.criteria.find((c) => c.criterionId === "access.robots")!;
    expect(robots).toMatchObject({ status: "scored", score: 100, weight: "critical" });
    const content = report.criteria.find((c) => c.criterionId === "content.unique")!;
    expect(content).toMatchObject({ status: "pending", score: null });
  });

  test("an unknown check id resolves to pending", async () => {
    const oddPack: AuditPack = { ...pack, criteria: [{ ...pack.criteria[0], id: "x", check: "does_not_exist" }] };
    const pipeline = new AuditPipeline({ auditPacks: new FakeAuditPackSource([oddPack]), fetcher: new FakePageFetcher(null) });
    const report = await pipeline.run(target);
    expect(report.criteria[0]).toMatchObject({ status: "pending" });
  });
});
