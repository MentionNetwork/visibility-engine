import { describe, test, expect } from "vitest";
import type { ConnectorManifest, SiteConnector, ReadCap, Session } from "../src/index.js";
import type { Product, ShippingSettings } from "@mention-network/shared";

describe("connector manifest", () => {
  test("declares the store platforms it targets", () => {
    const m: Pick<ConnectorManifest, "targetPlatforms"> = { targetPlatforms: ["shopify", "woocommerce"] };
    expect(m.targetPlatforms).toContain("woocommerce");
  });
});

const offer = { price: { amount: 28, currency: "USD" }, availability: "in_stock" as const, source: "connector" as const };
const product: Product = { id: "p1", title: "Glow Serum", category: "serum", attributes: {}, variants: [], offer };

describe("expanded read surface", () => {
  test("read caps cover the audit rubric needs", () => {
    const caps: ReadCap[] = ["collections", "metafields", "shipping_settings", "recommendations", "merchant_feed_status"];
    expect(caps).toHaveLength(5);
  });

  test("optional read methods are typed with shared contracts", async () => {
    const read: SiteConnector["read"] = {
      getSite: async () => ({}),
      getPage: async (_s: Session, url: string) => ({ url, html: "<html/>", fetchedAt: "t" }),
      listProducts: async () => [product],
      getProduct: async () => product,
      listCollections: async () => [{ id: "c1", title: "Serums" }],
      getMetafields: async () => ({ ingredient: "PDRN" }),
      getShippingSettings: async (): Promise<ShippingSettings | null> => ({ freeShipping: true }),
      getRelatedProducts: async () => [product],
      getMerchantFeedStatus: async () => ({ status: "approved" }),
    };
    expect((await read.listProducts!({ platform: "shopify", identity: "x" }))[0].title).toBe("Glow Serum");
  });
});
