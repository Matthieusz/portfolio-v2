import { Schema } from "effect";

/** Decodes a normalized commit returned by the Kronik API route. */
export const RecentCommit = Schema.Struct({
  message: Schema.String,
  repo: Schema.String,
  url: Schema.optional(Schema.String),
  sha: Schema.optional(Schema.String),
  date: Schema.optional(Schema.String),
  additions: Schema.optional(Schema.Finite),
  deletions: Schema.optional(Schema.Finite),
  filesChanged: Schema.optional(Schema.Finite),
});

/** A normalized commit rendered by the recent-commits UI. */
export interface RecentCommit extends Schema.Schema.Type<typeof RecentCommit> {}

/** Decodes the normalized result returned by the Kronik API route. */
export const RecentCommitsData = Schema.Struct({
  commits: Schema.Array(RecentCommit),
  totalCommits: Schema.optional(Schema.Finite),
});

/** The normalized recent-commits result returned to the browser. */
export interface RecentCommitsData extends Schema.Schema.Type<
  typeof RecentCommitsData
> {}
