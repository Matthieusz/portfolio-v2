import { parseJsonSafely } from "./utils";

const KATIB_BASE_URL = "https://katib.jasoncameron.dev";
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_USERNAME = import.meta.env.GITHUB_USERNAME ?? "Matthieusz";

const DEFAULT_LIMIT = 5;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const pickString = (
  record: UnknownRecord,
  keys: string[],
): string | undefined =>
  keys
    .map((key) => record[key])
    .find((value): value is string => typeof value === "string");

const pickNumber = (
  record: UnknownRecord,
  keys: string[],
): number | undefined =>
  keys
    .map((key) => record[key])
    .find(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );

const isCommitLike = (record: UnknownRecord): boolean =>
  Boolean(
    pickString(record, ["messageHeadline", "message", "commitMessage"]) ||
    pickString(record, ["commitUrl", "url", "html_url"]) ||
    pickString(record, ["oid", "sha", "id"]) ||
    pickString(record, ["repo", "repository", "project"]),
  );

export interface RecentCommit {
  message: string;
  repo: string;
  url?: string;
  sha?: string;
  date?: string;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
}

export interface RecentCommitsData {
  commits: RecentCommit[];
  totalCommits?: number;
}

const getCommitArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    if (Array.isArray(payload.commits)) return payload.commits;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (isCommitLike(payload)) return [payload];
  }
  return [];
};

const parseRepoName = (record: UnknownRecord): string | undefined => {
  const repoValue = record.repository ?? record.repo ?? record.project;
  if (typeof repoValue === "string") return repoValue;
  if (isRecord(repoValue)) {
    return (
      pickString(repoValue, ["name", "full_name", "repo"]) ??
      pickString(record, ["repositoryName", "repoName", "projectName"])
    );
  }
  return pickString(record, ["repositoryName", "repoName", "projectName"]);
};

const parseStats = (record: UnknownRecord) => {
  const statsValue =
    (isRecord(record.stats) && record.stats) ||
    (isRecord(record.commitStats) && record.commitStats) ||
    (isRecord(record.statsSummary) && record.statsSummary);

  const baseStats = {
    additions: pickNumber(record, ["additions", "insertions", "linesAdded"]),
    deletions: pickNumber(record, ["deletions", "linesDeleted"]),
    filesChanged: pickNumber(record, ["filesChanged", "files"]),
  };

  if (!statsValue) return baseStats;

  return {
    additions:
      pickNumber(statsValue, [
        "additions",
        "insertions",
        "linesAdded",
        "lines_added",
      ]) ?? baseStats.additions,
    deletions:
      pickNumber(statsValue, ["deletions", "linesDeleted", "lines_deleted"]) ??
      baseStats.deletions,
    filesChanged:
      pickNumber(statsValue, ["filesChanged", "files", "changedFiles"]) ??
      baseStats.filesChanged,
  };
};

const parseCommit = (entry: unknown): RecentCommit | null => {
  if (!isRecord(entry)) return null;

  const commitRecord = isRecord(entry.commit) ? entry.commit : undefined;
  const authorRecord =
    commitRecord && isRecord(commitRecord.author) ? commitRecord.author : null;

  const message =
    pickString(entry, [
      "messageHeadline",
      "message",
      "commitMessage",
      "commit_message",
    ]) ??
    (commitRecord ? pickString(commitRecord, ["message"]) : undefined) ??
    "Untitled commit";

  const url =
    pickString(entry, ["commitUrl", "commit_url", "url", "html_url"]) ??
    (isRecord(entry.links)
      ? pickString(entry.links, ["html", "web"])
      : undefined);

  const sha = pickString(entry, ["oid", "sha", "id", "hash"]);

  const date =
    pickString(entry, [
      "committedDate",
      "date",
      "timestamp",
      "committed_at",
      "created_at",
    ]) ?? (authorRecord ? pickString(authorRecord, ["date"]) : undefined);

  const repo = parseRepoName(entry) ?? "Unknown repo";

  return {
    message,
    repo,
    url,
    sha,
    date,
    ...parseStats(entry),
  };
};

const parseCommits = (payload: unknown): RecentCommit[] => {
  const commits = getCommitArray(payload)
    .map((entry) => parseCommit(entry))
    .filter((entry): entry is RecentCommit => Boolean(entry));

  return commits;
};

export async function getRecentCommits(
  limit: number = DEFAULT_LIMIT,
): Promise<RecentCommitsData | null> {
  if (!GITHUB_USERNAME) return null;

  const url = new URL("/v2/commits/latest", KATIB_BASE_URL);
  url.searchParams.set("username", GITHUB_USERNAME);
  url.searchParams.set("limit", String(limit));

  const headers = new Headers();
  if (GITHUB_TOKEN) {
    headers.set("Authorization", `Bearer ${GITHUB_TOKEN}`);
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) return null;

  const payload = await parseJsonSafely<unknown>(response);
  if (!payload) return null;
  const commits = parseCommits(payload);
  const totalCommits = isRecord(payload)
    ? pickNumber(payload, ["totalCommits", "total_commits", "count"])
    : undefined;

  return {
    commits,
    totalCommits: totalCommits ?? undefined,
  };
}
