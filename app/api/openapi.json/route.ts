import { NextResponse } from "next/server";

export const revalidate = 86400;

const BASE = "https://hantawatch-global.vercel.app";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "HantaWatch Public API",
    version: "1.0.0",
    summary: "Live hantavirus surveillance + research signals.",
    description:
      "Aggregates WHO Disease Outbreak News, CDC NNDSS, CDC MMWR, PAHO, EuropePMC, bioRxiv, Wikipedia and GBIF into a unified surface. Free tier with no auth; rate-limit increased with an API key (managed at /account).",
    license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    contact: { name: "HantaWatch", url: BASE },
  },
  servers: [{ url: BASE, description: "Production" }],
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Bearer token. Generate at /account. Format: `Bearer hw_<token>`.",
      },
    },
    schemas: {
      CountrySnapshot: {
        type: "object",
        properties: {
          iso: { type: "string", description: "ISO-3166 alpha-2 lowercase" },
          country: { type: "string" },
          flag: { type: "string" },
          region: { type: "string", enum: ["Americas", "Europe", "Asia", "Africa", "Oceania"] },
          cases: { type: ["integer", "null"] },
          deaths: { type: ["integer", "null"] },
          cfrPct: { type: ["number", "null"], description: "Computed only when both cases and deaths are present" },
          strain: { type: ["string", "null"] },
          status: { type: ["string", "null"], enum: ["outbreak", "active", "monitored", null] },
          lastReport: { type: "string", format: "date" },
          source: { type: "string", description: "Per-row attribution to the upstream publisher" },
          sourceUrl: { type: "string", format: "uri" },
          population: { type: ["integer", "null"], description: "UN World Population Prospects" },
          notes: { type: ["string", "null"] },
        },
      },
      OutbreakEvent: {
        type: "object",
        properties: {
          id: { type: "string", description: "e.g. 'who-2026-DON600'" },
          date: { type: "string", format: "date" },
          country: { type: "string" },
          iso: { type: "string" },
          flag: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          title: { type: "string" },
          body: { type: "string" },
          breakdown: { $ref: "#/components/schemas/CaseBreakdown" },
          source: { type: "string" },
          sourceUrl: { type: "string", format: "uri" },
        },
      },
      CaseBreakdown: {
        type: "object",
        properties: {
          reported: { type: ["integer", "null"] },
          confirmed: { type: ["integer", "null"] },
          probable: { type: ["integer", "null"] },
          hospitalized: { type: ["integer", "null"] },
          critical: { type: ["integer", "null"] },
          deceased: { type: ["integer", "null"] },
          recovered: { type: ["integer", "null"] },
        },
      },
    },
  },
  paths: {
    "/api/v1/countries": {
      get: {
        summary: "List country surveillance rows",
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"] }, required: false },
          { name: "region", in: "query", schema: { type: "string" }, required: false },
          { name: "status", in: "query", schema: { type: "string", enum: ["outbreak", "active", "monitored"] }, required: false },
        ],
        responses: {
          "200": {
            description: "List of country rows with per-row source attribution.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    fetched_at: { type: "string", format: "date-time" },
                    sources: { type: "array", items: { type: "object" } },
                    data: { type: "array", items: { $ref: "#/components/schemas/CountrySnapshot" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/outbreaks": {
      get: {
        summary: "List active WHO Disease Outbreak News for hantavirus",
        parameters: [
          { name: "since", in: "query", schema: { type: "string", format: "date" } },
          { name: "severity", in: "query", schema: { type: "string", enum: ["low", "medium", "high"] } },
        ],
        responses: {
          "200": {
            description: "Outbreak events with parsed case breakdown.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    fetched_at: { type: "string", format: "date-time" },
                    source: { type: "string" },
                    data: { type: "array", items: { $ref: "#/components/schemas/OutbreakEvent" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/strains": {
      get: {
        summary: "Strain reference + observed live aggregates",
        responses: { "200": { description: "Strain catalog with per-strain observed totals." } },
      },
    },
    "/api/v1/metrics": {
      get: {
        summary: "Top-line metrics across all live sources",
        responses: { "200": { description: "Aggregate breakdown + region/strain totals + risk top 5." } },
      },
    },
    "/api/health/sources": {
      get: {
        summary: "Live source health check",
        responses: { "200": { description: "Per-source status + freshness for every adapter." } },
      },
    },
    "/api/rss/outbreaks": {
      get: {
        summary: "Atom feed of active hantavirus outbreaks",
        responses: {
          "200": {
            description: "Atom 1.0 feed.",
            content: { "application/atom+xml": { schema: { type: "string" } } },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "access-control-allow-origin": "*",
    },
  });
}
