import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { Katib } from "./katib";

const configuration = ConfigProvider.fromUnknown({
  GITHUB_USERNAME: "Matthieusz",
});

describe("Katib", () => {
  it.effect("decodes the provider response before normalizing commits", () => {
    const fakeFetch: typeof globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      assert.strictEqual(url.searchParams.get("username"), "Matthieusz");
      assert.strictEqual(url.searchParams.get("limit"), "3");

      return Response.json({
        commits: [
          {
            commitMessage: "Ship schema decoding",
            repository: { full_name: "informati/portfolio-v2" },
            sha: "abc1234",
            stats: {
              lines_added: 12,
              lines_deleted: 3,
              changedFiles: 2,
            },
          },
        ],
        total_commits: 1,
      });
    };

    const testLayer = Layer.mergeAll(
      Katib.layer.pipe(Layer.provide(ConfigProvider.layer(configuration))),
      Layer.succeed(FetchHttpClient.Fetch, fakeFetch),
    );

    return Katib.use((katib) => katib.recentCommits(3)).pipe(
      Effect.provide(testLayer),
      Effect.tap((result) =>
        Effect.sync(() => {
          assert.deepStrictEqual(result, {
            commits: [
              {
                message: "Ship schema decoding",
                repo: "informati/portfolio-v2",
                url: undefined,
                sha: "abc1234",
                date: undefined,
                additions: 12,
                deletions: 3,
                filesChanged: 2,
              },
            ],
            totalCommits: 1,
          });
        }),
      ),
    );
  });

  it.effect("normalizes an empty provider response", () => {
    const fakeFetch: typeof globalThis.fetch = async () => Response.json(null);

    const testLayer = Layer.mergeAll(
      Katib.layer.pipe(Layer.provide(ConfigProvider.layer(configuration))),
      Layer.succeed(FetchHttpClient.Fetch, fakeFetch),
    );

    return Katib.use((katib) => katib.recentCommits(5)).pipe(
      Effect.provide(testLayer),
      Effect.tap((result) =>
        Effect.sync(() => {
          assert.deepStrictEqual(result, { commits: [] });
        }),
      ),
    );
  });

  it.effect("returns a typed decode error for malformed commits", () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      Response.json({ commits: "not-an-array" });

    const testLayer = Layer.mergeAll(
      Katib.layer.pipe(Layer.provide(ConfigProvider.layer(configuration))),
      Layer.succeed(FetchHttpClient.Fetch, fakeFetch),
    );

    return Katib.use((katib) => katib.recentCommits(5)).pipe(
      Effect.provide(testLayer),
      Effect.flip,
      Effect.tap((error) =>
        Effect.sync(() => {
          assert.strictEqual(error._tag, "KatibDecodeError");
        }),
      ),
    );
  });
});
