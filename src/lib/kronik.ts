import { Config, Context, Effect, Layer, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
import type { RecentCommit, RecentCommitsData } from "./kronik-contract";

const KRONIK_ENDPOINT = "https://kronik.informati.dev/api/v1/users";

const RawCommit = Schema.Struct({
  sha: Schema.String,
  url: Schema.String,
  repository: Schema.Struct({ nameWithOwner: Schema.String }),
  headline: Schema.String,
  committedAt: Schema.String,
  additions: Schema.Finite,
  deletions: Schema.Finite,
});

interface RawCommit extends Schema.Schema.Type<typeof RawCommit> {}

const KronikPayload = Schema.Struct({
  items: Schema.Array(RawCommit),
});

/** Indicates that Kronik configuration could not be loaded. */
export class KronikConfigurationError extends Schema.TaggedError<KronikConfigurationError>()(
  "KronikConfigurationError",
  { cause: Schema.Defect() },
) {}

/** Indicates that a Kronik request could not reach the provider. */
export class KronikTransportError extends Schema.TaggedError<KronikTransportError>()(
  "KronikTransportError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}

/** Indicates that Kronik rejected a request with a non-success status. */
export class KronikResponseError extends Schema.TaggedError<KronikResponseError>()(
  "KronikResponseError",
  {
    operation: Schema.String,
    status: Schema.Int,
  },
) {}

/** Indicates that a successful Kronik response did not match its wire schema. */
export class KronikDecodeError extends Schema.TaggedError<KronikDecodeError>()(
  "KronikDecodeError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}

/** All expected failures produced by the Kronik integration. */
export type KronikError =
  | KronikConfigurationError
  | KronikTransportError
  | KronikResponseError
  | KronikDecodeError;

interface KronikConfigurationService {
  readonly username: string;
}

/** Supplies GitHub identity configuration to the Kronik integration. */
export class KronikConfiguration extends Context.Service<
  KronikConfiguration,
  KronikConfigurationService
>()("portfolio/KronikConfiguration") {
  /** Loads Kronik configuration through Effect Config. */
  static readonly layer = Layer.effect(
    KronikConfiguration,
    Effect.gen(function* () {
      const username = yield* Config.String("GITHUB_USERNAME").pipe(
        Config.withDefault("Matthieusz"),
      );
      return KronikConfiguration.of({ username });
    }).pipe(
      Effect.mapError((cause) => new KronikConfigurationError({ cause })),
    ),
  );
}

interface KronikService {
  readonly recentCommits: (
    limit: number,
  ) => Effect.Effect<
    RecentCommitsData,
    Exclude<KronikError, KronikConfigurationError>
  >;
}

/** Owns the Kronik request and external response decoding seam. */
export class Kronik extends Context.Service<Kronik, KronikService>()(
  "portfolio/Kronik",
) {
  /** Builds Kronik from explicit configuration and HTTP client dependencies. */
  static readonly layerNoDependencies = Layer.effect(
    Kronik,
    Effect.gen(function* () {
      const configuration = yield* KronikConfiguration;
      const client = yield* HttpClient.HttpClient;

      const recentCommits = Effect.fn("Kronik.recentCommits")(function* (
        limit: number,
      ) {
        const request = HttpClientRequest.get(
          `${KRONIK_ENDPOINT}/${encodeURIComponent(configuration.username)}/commits`,
          { urlParams: { limit: String(limit) } },
        );
        const response = yield* client.execute(request).pipe(
          Effect.mapError(
            (cause) =>
              new KronikTransportError({
                operation: "Kronik.recentCommits",
                cause,
              }),
          ),
        );

        if (response.status < 200 || response.status >= 300) {
          return yield* new KronikResponseError({
            operation: "Kronik.recentCommits",
            status: response.status,
          });
        }

        const payload = yield* HttpClientResponse.schemaBodyJson(KronikPayload)(
          response,
        ).pipe(
          Effect.mapError(
            (cause) =>
              new KronikDecodeError({
                operation: "Kronik.recentCommits",
                cause,
              }),
          ),
        );

        return { commits: payload.items.map(normalizeCommit) };
      });

      return Kronik.of({ recentCommits });
    }),
  );

  /** Provides the production configuration and fetch-backed HTTP client. */
  static readonly layer = Kronik.layerNoDependencies.pipe(
    Layer.provide(KronikConfiguration.layer),
    Layer.provide(FetchHttpClient.layer),
  );
}

const normalizeCommit = (entry: RawCommit): RecentCommit => ({
  message: entry.headline,
  repo: entry.repository.nameWithOwner,
  url: entry.url,
  sha: entry.sha,
  date: entry.committedAt,
  additions: entry.additions,
  deletions: entry.deletions,
});
