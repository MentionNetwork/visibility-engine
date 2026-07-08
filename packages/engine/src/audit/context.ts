import type { ScanTarget, Criterion, AuditContext, PageBundle } from "@mention-network/shared";
import type { PageFetcherPort } from "./ports.js";

async function fetchText(fetcher: PageFetcherPort, url: string): Promise<string | null> {
  try {
    const b = await fetcher.getRaw(url);
    return b.status < 400 ? b.rawHtml : null;
  } catch {
    return null;
  }
}

export async function buildContext(
  target: ScanTarget,
  criteria: Criterion[],
  fetcher: PageFetcherPort,
): Promise<AuditContext> {
  let robots: string | null = null;
  try { robots = await fetcher.getRobots(target.store.domain); } catch { /* transient fetch failure */ }

  let productPage: PageBundle | null = null;
  if (target.product.url) {
    try { productPage = await fetcher.getRaw(target.product.url); } catch { /* transient fetch failure */ }
    if (productPage && fetcher.getRendered) {
      try { productPage.renderedHtml = await fetcher.getRendered(target.product.url); } catch { /* headless optional */ }
    }
  }

  const storePages: Record<string, PageBundle> = {};
  const pageKeys = [...new Set(
    criteria.filter((c) => c.check === "page_exists" && c.params?.page).map((c) => c.params!.page),
  )];
  for (const key of pageKeys) {
    try { storePages[key] = await fetcher.getRaw(`https://${target.store.domain}/${key}`); } catch { /* missing page */ }
  }

  const origin = `https://${target.store.domain}`;
  const llmsTxt = await fetchText(fetcher, `${origin}/llms.txt`);
  const sitemapXml = await fetchText(fetcher, `${origin}/sitemap.xml`);

  return { target, robots, productPage, storePages, llmsTxt, sitemapXml };
}
