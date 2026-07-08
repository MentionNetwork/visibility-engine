import type { SiteConnector, Session } from "@mention-network/connector-sdk";
import type { ProductFactsPort } from "@mention-network/engine";
import type { Product } from "@mention-network/shared";

/**
 * Adapts a connected SiteConnector into the engine's ProductFactsPort.
 * Degrades to the facts already on the passed product when the connector
 * lacks getProduct, finds nothing, or fails.
 */
export function productFactsFromConnector(connector: SiteConnector, session: Session): ProductFactsPort {
  return {
    async getFacts(product: Product) {
      const local = { variants: product.variants, attributes: product.attributes, offer: product.offer };
      const { getProduct, getMetafields } = connector.read;
      if (!getProduct) return local;
      try {
        const remote = await getProduct(session, product.id);
        if (!remote) return local;
        const metafields = getMetafields ? await getMetafields(session, product.id) : {};
        return {
          variants: remote.variants,
          attributes: { ...remote.attributes, ...metafields },
          offer: { ...remote.offer, source: "connector" },
        };
      } catch {
        return local;
      }
    },
  };
}
