import { describe, test, expect } from "vitest";
import type { Product } from "@mention-network/shared";
import { productFactsFromConnector } from "../src/index.js";
import { FakeConnector, session } from "./fake-connector.js";

const offer = { price: { amount: 28, currency: "USD" }, availability: "in_stock" as const, source: "manual" as const };
const localProduct: Product = { id: "p1", title: "Glow Serum", category: "serum", attributes: { local: "yes" }, variants: [], offer };
const remoteProduct: Product = {
  id: "p1", title: "Glow Serum", category: "serum",
  attributes: { ingredient: "PDRN" },
  variants: [{ sku: "50ml", label: "50ml", offer }],
  offer: { ...offer, source: "connector" },
};

describe("productFactsFromConnector", () => {
  test("reads facts through getProduct and merges metafields, source=connector", async () => {
    const connector = new FakeConnector({
      read: {
        getProduct: async () => remoteProduct,
        getMetafields: async () => ({ skinType: "all" }),
      },
    });
    const facts = await productFactsFromConnector(connector, session).getFacts(localProduct);
    expect(facts.offer.source).toBe("connector");
    expect(facts.attributes).toMatchObject({ ingredient: "PDRN", skinType: "all" });
    expect(facts.variants).toHaveLength(1);
  });

  test("falls back to the passed product when getProduct is absent", async () => {
    const facts = await productFactsFromConnector(new FakeConnector(), session).getFacts(localProduct);
    expect(facts.offer.source).toBe("manual");
    expect(facts.attributes).toEqual({ local: "yes" });
  });

  test("falls back when getProduct returns null", async () => {
    const connector = new FakeConnector({ read: { getProduct: async () => null } });
    const facts = await productFactsFromConnector(connector, session).getFacts(localProduct);
    expect(facts.offer.source).toBe("manual");
  });

  test("falls back when the connector throws (degrade, don't throw)", async () => {
    const connector = new FakeConnector({ read: { getProduct: async () => { throw new Error("api down"); } } });
    const facts = await productFactsFromConnector(connector, session).getFacts(localProduct);
    expect(facts.offer.source).toBe("manual");
  });
});
