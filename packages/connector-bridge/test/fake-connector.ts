import type { SiteConnector, Session, PageSnapshot } from "@mention-network/connector-sdk";

const MANIFEST: SiteConnector["manifest"] = {
  name: "mn-connector-fake",
  platform: "custom",
  version: "0.0.1",
  engineApi: "^0.1.0",
  targetPlatforms: ["custom"],
  capabilities: { read: ["site", "pages"], write: [] },
  auth: { kind: "api_key", scopes: [] },
};

export class FakeConnector implements SiteConnector {
  manifest = MANIFEST;
  calls: string[] = [];
  read: SiteConnector["read"];
  write?: SiteConnector["write"];

  constructor(overrides: { read?: Partial<SiteConnector["read"]>; write?: SiteConnector["write"] } = {}) {
    const record = (name: string) => this.calls.push(name);
    this.read = {
      getSite: async () => { record("getSite"); return {}; },
      getPage: async (_s: Session, url: string): Promise<PageSnapshot> => {
        record(`getPage:${url}`);
        return { url, html: "", fetchedAt: "t" };
      },
      ...overrides.read,
    };
    this.write = overrides.write;
  }

  async detect() { return { match: true, confidence: 1 }; }
  async connect(): Promise<Session> { return { platform: "custom", identity: "fake" }; }
}

export const session: Session = { platform: "custom", identity: "fake" };
