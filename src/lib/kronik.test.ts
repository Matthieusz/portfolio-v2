import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { Kronik } from "./kronik";

const configuration = ConfigProvider.fromUnknown({
  GITHUB_USERNAME: "Matthieusz",
  GITHUB_TOKEN: "must-not-be-forwarded",
});

const testLayer = (fetch: typeof globalThis.fetch) =>
  Kronik.layer.pipe(
    Layer.provide(ConfigProvider.layer(configuration)),
    Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetch)),
  );

describe("Kronik", () => {
  it.effect(
    "requests public commits without forwarding GitHub credentials",
    () => {
      const fakeFetch: typeof globalThis.fetch = async (input, init) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        assert.strictEqual(
          url.origin + url.pathname,
          "https://kronik.informati.dev/api/v1/users/Matthieusz/commits",
        );
        assert.strictEqual(url.searchParams.get("limit"), "3");
        assert.strictEqual(request.headers.get("authorization"), null);

        return Response.json({
          user: { login: "Matthieusz" },
          items: [
            {
              headline: "Ship schema decoding",
              body: "Commit details",
              repository: { nameWithOwner: "informati/portfolio-v2" },
              url: "https://github.com/informati/portfolio-v2/commit/abc1234",
              sha: "abc1234",
              committedAt: "2026-10-21T12:00:00Z",
              additions: 12,
              deletions: 3,
            },
          ],
          previous: null,
          next: "opaque-cursor",
        });
      };

      return Kronik.use((kronik) => kronik.recentCommits(3)).pipe(
        Effect.provide(testLayer(fakeFetch)),
        Effect.tap((result) =>
          Effect.sync(() => {
            assert.deepStrictEqual(result, {
              commits: [
                {
                  message: "Ship schema decoding",
                  repo: "informati/portfolio-v2",
                  url: "https://github.com/informati/portfolio-v2/commit/abc1234",
                  sha: "abc1234",
                  date: "2026-10-21T12:00:00Z",
                  additions: 12,
                  deletions: 3,
                },
              ],
            });
          }),
        ),
      );
    },
  );

  it.effect("normalizes an empty commit page", () =>
    Kronik.use((kronik) => kronik.recentCommits(5)).pipe(
      Effect.provide(testLayer(async () => Response.json({ items: [] }))),
      Effect.tap((result) =>
        Effect.sync(() => {
          assert.deepStrictEqual(result, { commits: [] });
        }),
      ),
    ),
  );

  for (const payload of [
    null,
    { commits: [] },
    { items: "not-an-array" },
    { items: [{ headline: "Missing required fields" }] },
    {
      items: [
        {
          headline: "Invalid stats",
          repository: { nameWithOwner: "informati/portfolio-v2" },
          url: "https://github.com/informati/portfolio-v2/commit/abc1234",
          sha: "abc1234",
          committedAt: "2026-10-21T12:00:00Z",
          additions: "12",
          deletions: 3,
        },
      ],
    },
  ]) {
    it.effect(
      `rejects malformed provider data: ${JSON.stringify(payload)}`,
      () =>
        Kronik.use((kronik) => kronik.recentCommits(5)).pipe(
          Effect.provide(testLayer(async () => Response.json(payload))),
          Effect.flip,
          Effect.tap((error) =>
            Effect.sync(() => {
              assert.strictEqual(error._tag, "KronikDecodeError");
            }),
          ),
        ),
    );
  }

  it.effect("preserves a non-success provider status as a typed error", () =>
    Kronik.use((kronik) => kronik.recentCommits(5)).pipe(
      Effect.provide(
        testLayer(async () => new Response(null, { status: 429 })),
      ),
      Effect.flip,
      Effect.tap((error) =>
        Effect.sync(() => {
          assert.strictEqual(error._tag, "KronikResponseError");
          if (error._tag === "KronikResponseError") {
            assert.strictEqual(error.status, 429);
          }
        }),
      ),
    ),
  );

  it.effect("classifies network failures as transport errors", () =>
    Kronik.use((kronik) => kronik.recentCommits(5)).pipe(
      Effect.provide(
        testLayer(async () => {
          throw new TypeError("Network unavailable");
        }),
      ),
      Effect.flip,
      Effect.tap((error) =>
        Effect.sync(() => {
          assert.strictEqual(error._tag, "KronikTransportError");
        }),
      ),
    ),
  );
});
