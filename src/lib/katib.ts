import {
  Config,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

const KATIB_ENDPOINT = "https://katib.jasoncameron.dev/v2/commits/latest";

const RawRepository = Schema.Union([
  Schema.String,
  Schema.Struct({
    name: Schema.optionalKey(Schema.String),
    full_name: Schema.optionalKey(Schema.String),
    repo: Schema.optionalKey(Schema.String),
  }),
]);

const RawStats = Schema.Struct({
  additions: Schema.optionalKey(Schema.Finite),
  insertions: Schema.optionalKey(Schema.Finite),
  linesAdded: Schema.optionalKey(Schema.Finite),
  lines_added: Schema.optionalKey(Schema.Finite),
  deletions: Schema.optionalKey(Schema.Finite),
  linesDeleted: Schema.optionalKey(Schema.Finite),
  lines_deleted: Schema.optionalKey(Schema.Finite),
  filesChanged: Schema.optionalKey(Schema.Finite),
  files: Schema.optionalKey(Schema.Finite),
  changedFiles: Schema.optionalKey(Schema.Finite),
});

const RawCommit = Schema.Struct({
  messageHeadline: Schema.optionalKey(Schema.String),
  message: Schema.optionalKey(Schema.String),
  commitMessage: Schema.optionalKey(Schema.String),
  commit_message: Schema.optionalKey(Schema.String),
  commitUrl: Schema.optionalKey(Schema.String),
  commit_url: Schema.optionalKey(Schema.String),
  url: Schema.optionalKey(Schema.String),
  html_url: Schema.optionalKey(Schema.String),
  oid: Schema.optionalKey(Schema.String),
  sha: Schema.optionalKey(Schema.String),
  id: Schema.optionalKey(Schema.String),
  hash: Schema.optionalKey(Schema.String),
  repo: Schema.optionalKey(RawRepository),
  repository: Schema.optionalKey(RawRepository),
  project: Schema.optionalKey(RawRepository),
  repositoryName: Schema.optionalKey(Schema.String),
  repoName: Schema.optionalKey(Schema.String),
  projectName: Schema.optionalKey(Schema.String),
  committedDate: Schema.optionalKey(Schema.String),
  date: Schema.optionalKey(Schema.String),
  timestamp: Schema.optionalKey(Schema.String),
  committed_at: Schema.optionalKey(Schema.String),
  created_at: Schema.optionalKey(Schema.String),
  additions: Schema.optionalKey(Schema.Finite),
  insertions: Schema.optionalKey(Schema.Finite),
  linesAdded: Schema.optionalKey(Schema.Finite),
  deletions: Schema.optionalKey(Schema.Finite),
  linesDeleted: Schema.optionalKey(Schema.Finite),
  filesChanged: Schema.optionalKey(Schema.Finite),
  files: Schema.optionalKey(Schema.Finite),
  stats: Schema.optionalKey(RawStats),
  commitStats: Schema.optionalKey(RawStats),
  statsSummary: Schema.optionalKey(RawStats),
  links: Schema.optionalKey(
    Schema.Struct({
      html: Schema.optionalKey(Schema.String),
      web: Schema.optionalKey(Schema.String),
    }),
  ),
  commit: Schema.optionalKey(
    Schema.Struct({
      message: Schema.optionalKey(Schema.String),
      author: Schema.optionalKey(
        Schema.Struct({ date: Schema.optionalKey(Schema.String) }),
      ),
    }),
  ),
});

interface RawCommit extends Schema.Schema.Type<typeof RawCommit> {}

const KatibObjectPayload = Schema.Struct({
  ...RawCommit.fields,
  commits: Schema.optionalKey(Schema.Array(RawCommit)),
  data: Schema.optionalKey(Schema.Array(RawCommit)),
  items: Schema.optionalKey(Schema.Array(RawCommit)),
  totalCommits: Schema.optionalKey(Schema.Finite),
  total_commits: Schema.optionalKey(Schema.Finite),
  count: Schema.optionalKey(Schema.Finite),
});

interface KatibObjectPayload extends Schema.Schema.Type<
  typeof KatibObjectPayload
> {}

const KatibPayload = Schema.Union([
  Schema.Array(RawCommit),
  KatibObjectPayload,
]);

type KatibPayload = Schema.Schema.Type<typeof KatibPayload>;

/** A normalized commit projection consumed by the recent-commits UI. */
export interface RecentCommit {
  readonly message: string;
  readonly repo: string;
  readonly url?: string | undefined;
  readonly sha?: string | undefined;
  readonly date?: string | undefined;
  readonly additions?: number | undefined;
  readonly deletions?: number | undefined;
  readonly filesChanged?: number | undefined;
}

/** The normalized result returned by the Katib integration. */
export interface RecentCommitsData {
  readonly commits: ReadonlyArray<RecentCommit>;
  readonly totalCommits?: number | undefined;
}

/** Indicates that Katib configuration could not be loaded. */
export class KatibConfigurationError extends Schema.TaggedError<KatibConfigurationError>()(
  "KatibConfigurationError",
  { cause: Schema.Defect() },
) {}

/** Indicates that a Katib request could not reach the provider. */
export class KatibTransportError extends Schema.TaggedError<KatibTransportError>()(
  "KatibTransportError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}

/** Indicates that Katib rejected a request with a non-success status. */
export class KatibResponseError extends Schema.TaggedError<KatibResponseError>()(
  "KatibResponseError",
  {
    operation: Schema.String,
    status: Schema.Int,
  },
) {}

/** Indicates that a successful Katib response did not match its wire schema. */
export class KatibDecodeError extends Schema.TaggedError<KatibDecodeError>()(
  "KatibDecodeError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}

/** All expected failures produced by the Katib integration. */
export type KatibError =
  | KatibConfigurationError
  | KatibTransportError
  | KatibResponseError
  | KatibDecodeError;

interface KatibConfigurationService {
  readonly username: string;
  readonly githubToken: Option.Option<Redacted.Redacted<string>>;
}

/** Supplies GitHub identity configuration to the Katib integration. */
export class KatibConfiguration extends Context.Service<
  KatibConfiguration,
  KatibConfigurationService
>()("portfolio/KatibConfiguration") {
  /** Loads Katib configuration through Effect Config. */
  static readonly layer = Layer.effect(
    KatibConfiguration,
    Effect.gen(function* () {
      const username = yield* Config.string("GITHUB_USERNAME").pipe(
        Config.withDefault("Matthieusz"),
      );
      const githubToken = yield* Config.option(Config.redacted("GITHUB_TOKEN"));
      return KatibConfiguration.of({ username, githubToken });
    }).pipe(Effect.mapError((cause) => new KatibConfigurationError({ cause }))),
  );
}

interface KatibService {
  readonly recentCommits: (
    limit: number,
  ) => Effect.Effect<
    RecentCommitsData,
    Exclude<KatibError, KatibConfigurationError>
  >;
}

/** Owns the Katib request and external response decoding seam. */
export class Katib extends Context.Service<Katib, KatibService>()(
  "portfolio/Katib",
) {
  /** Builds Katib from explicit configuration and HTTP client dependencies. */
  static readonly layerNoDependencies = Layer.effect(
    Katib,
    Effect.gen(function* () {
      const configuration = yield* KatibConfiguration;
      const client = yield* HttpClient.HttpClient;

      const recentCommits = Effect.fn("Katib.recentCommits")(function* (
        limit: number,
      ) {
        const baseRequest = HttpClientRequest.get(KATIB_ENDPOINT, {
          urlParams: {
            username: configuration.username,
            limit: String(limit),
          },
        });
        const request = Option.match(configuration.githubToken, {
          onNone: () => baseRequest,
          onSome: (token) =>
            baseRequest.pipe(HttpClientRequest.bearerToken(token)),
        });
        const response = yield* client.execute(request).pipe(
          Effect.mapError(
            (cause) =>
              new KatibTransportError({
                operation: "Katib.recentCommits",
                cause,
              }),
          ),
        );

        if (response.status < 200 || response.status >= 300) {
          return yield* new KatibResponseError({
            operation: "Katib.recentCommits",
            status: response.status,
          });
        }

        const payload = yield* HttpClientResponse.schemaBodyJson(KatibPayload)(
          response,
        ).pipe(
          Effect.mapError(
            (cause) =>
              new KatibDecodeError({
                operation: "Katib.recentCommits",
                cause,
              }),
          ),
        );

        return normalizePayload(payload);
      });

      return Katib.of({ recentCommits });
    }),
  );

  /** Provides the production configuration and fetch-backed HTTP client. */
  static readonly layer = Katib.layerNoDependencies.pipe(
    Layer.provide(KatibConfiguration.layer),
    Layer.provide(FetchHttpClient.layer),
  );
}

const firstDefined = <Value>(
  ...values: ReadonlyArray<Value | undefined>
): Value | undefined => values.find((value) => value !== undefined);

const repositoryName = (
  repository: RawCommit["repository"] | undefined,
): string | undefined => {
  if (repository === undefined) return undefined;
  if (Schema.is(Schema.String)(repository)) return repository;
  return firstDefined(repository.name, repository.full_name, repository.repo);
};

const normalizeStats = (entry: RawCommit) => {
  const stats = firstDefined(
    entry.stats,
    entry.commitStats,
    entry.statsSummary,
  );
  return {
    additions: firstDefined(
      stats?.additions,
      stats?.insertions,
      stats?.linesAdded,
      stats?.lines_added,
      entry.additions,
      entry.insertions,
      entry.linesAdded,
    ),
    deletions: firstDefined(
      stats?.deletions,
      stats?.linesDeleted,
      stats?.lines_deleted,
      entry.deletions,
      entry.linesDeleted,
    ),
    filesChanged: firstDefined(
      stats?.filesChanged,
      stats?.files,
      stats?.changedFiles,
      entry.filesChanged,
      entry.files,
    ),
  };
};

const normalizeCommit = (entry: RawCommit): RecentCommit => ({
  message:
    firstDefined(
      entry.messageHeadline,
      entry.message,
      entry.commitMessage,
      entry.commit_message,
      entry.commit?.message,
    ) ?? "Untitled commit",
  repo:
    firstDefined(
      repositoryName(entry.repository),
      repositoryName(entry.repo),
      repositoryName(entry.project),
      entry.repositoryName,
      entry.repoName,
      entry.projectName,
    ) ?? "Unknown repo",
  url: firstDefined(
    entry.commitUrl,
    entry.commit_url,
    entry.url,
    entry.html_url,
    entry.links?.html,
    entry.links?.web,
  ),
  sha: firstDefined(entry.oid, entry.sha, entry.id, entry.hash),
  date: firstDefined(
    entry.committedDate,
    entry.date,
    entry.timestamp,
    entry.committed_at,
    entry.created_at,
    entry.commit?.author?.date,
  ),
  ...normalizeStats(entry),
});

const isCommitLike = (payload: KatibObjectPayload): boolean =>
  firstDefined(
    payload.messageHeadline,
    payload.message,
    payload.commitMessage,
    payload.commitUrl,
    payload.url,
    payload.oid,
    payload.sha,
    payload.id,
    payload.repository,
    payload.repo,
    payload.project,
  ) !== undefined;

const isCommitArray = (
  payload: KatibPayload,
): payload is ReadonlyArray<RawCommit> =>
  Schema.is(Schema.Array(RawCommit))(payload);

const normalizePayload = (payload: KatibPayload): RecentCommitsData => {
  if (isCommitArray(payload)) {
    return { commits: payload.map(normalizeCommit) };
  }

  const entries =
    firstDefined(payload.commits, payload.data, payload.items) ??
    (isCommitLike(payload) ? [payload] : []);
  return {
    commits: entries.map(normalizeCommit),
    totalCommits: firstDefined(
      payload.totalCommits,
      payload.total_commits,
      payload.count,
    ),
  };
};
