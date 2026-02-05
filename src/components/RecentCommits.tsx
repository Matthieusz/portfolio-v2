import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import type { RecentCommit, RecentCommitsData } from "../lib/katib";

export type { RecentCommit, RecentCommitsData };

interface RecentCommitsProps {
  initialData: RecentCommitsData | null;
}

const POLL_INTERVAL = 60000;

const formatDate = (value: string | undefined): string => {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
  ];

  let duration = diffSeconds;
  for (const [range, unit] of ranges) {
    if (Math.abs(duration) < range) {
      return rtf.format(duration, unit);
    }
    duration = Math.round(duration / range);
  }

  return rtf.format(duration, "year");
};

const CommitIcon: Component = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--primary)"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon icon-tabler icons-tabler-outline icon-tabler-git-commit"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    <path d="M12 3l0 6" />
    <path d="M12 15l0 6" />
  </svg>
);

const InfoTooltip: Component<{ content: string }> = (props) => (
  <span class="group relative inline-flex items-center">
    <span class="sr-only">{props.content}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--foreground)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon icon-tabler icons-tabler-outline icon-tabler-info-circle"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
      <path d="M12 9h.01"></path>
      <path d="M11 12h1v4h1"></path>
    </svg>
    <span class="bg-background text-foreground pointer-events-none absolute top-1/2 right-full z-10 mr-2 -translate-y-1/2 whitespace-nowrap rounded px-2 py-1 text-[0.65rem] opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
      {props.content}
    </span>
  </span>
);

const EmptyState: Component<{ message: string }> = (props) => (
  <div class="text-muted-foreground flex items-center gap-3">
    <span>{props.message}</span>
  </div>
);

const CommitRow: Component<{ commit: RecentCommit }> = (props) => (
  <div class="flex items-start justify-between gap-4">
    <div class="w-full min-w-0">
      <div class="flex items-center justify-between gap-2">
        <p class="text-muted-foreground text-xs uppercase">
          {props.commit.repo}
        </p>
        <div class="text-muted-foreground flex items-center justify-center gap-1 text-xs">
          <time datetime={props.commit.date ?? undefined}>
            {formatDate(props.commit.date)}
          </time>
          <Show when={props.commit.sha}>
            {(sha) => (
              <span class="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.65rem]">
                {sha().slice(0, 7)}
              </span>
            )}
          </Show>
        </div>
      </div>
      <div class="mt-1 flex items-center justify-between gap-2">
        <Show
          when={props.commit.url}
          fallback={
            <p class="text-foreground truncate text-sm font-medium">
              {props.commit.message}
            </p>
          }
        >
          {(url) => (
            <a
              href={url()}
              target="_blank"
              rel="noopener noreferrer"
              class="text-foreground hover:text-primary block truncate text-sm font-medium transition-colors"
            >
              {props.commit.message}
            </a>
          )}
        </Show>
        <Show
          when={
            props.commit.additions ||
            props.commit.deletions ||
            props.commit.filesChanged
          }
        >
          <div class="text-muted-foreground flex shrink-0 flex-row items-end text-[0.65rem]">
            <Show when={props.commit.filesChanged}>
              {(files) => <span>{files()} files</span>}
            </Show>
            <Show when={props.commit.additions}>
              {(additions) => (
                <span class="text-success text-sm"> +{additions()} </span>
              )}
            </Show>
            <Show when={props.commit.additions && props.commit.deletions}>
              <span class="ml-1 text-sm">/</span>
            </Show>
            <Show when={props.commit.deletions}>
              {(deletions) => (
                <span class="text-error text-sm"> -{deletions()} </span>
              )}
            </Show>
          </div>
        </Show>
      </div>
    </div>
  </div>
);

const RecentCommits: Component<RecentCommitsProps> = (props) => {
  const [data, setData] = createSignal<RecentCommitsData | null>(
    props.initialData,
  );
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(!props.initialData);

  const fetchCommits = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/katib/recent-commits");
      if (!response.ok) {
        setErrorMessage("Unable to load commits right now.");
        return;
      }
      const payload: RecentCommitsData | null = await response.json();
      setData(payload);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Unable to load commits right now.");
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(() => {
    fetchCommits();
    const interval = setInterval(fetchCommits, POLL_INTERVAL);
    onCleanup(() => clearInterval(interval));
  });

  const commits = () => data()?.commits ?? [];

  return (
    <div class="bg-card border-border relative flex h-full flex-col gap-3 overflow-hidden rounded-lg border p-4">
      <div class="relative z-10">
        <h3 class="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wider uppercase">
          <div class="flex items-center gap-2">
            <CommitIcon />
            Recent Commits
          </div>
          <InfoTooltip content="Built with Katib API and GitHub data" />
        </h3>
      </div>

      <div class="relative z-10 flex h-full flex-col gap-3">
        <Show
          when={!errorMessage()}
          fallback={<EmptyState message={errorMessage() ?? ""} />}
        >
          <Show
            when={commits().length > 0}
            fallback={
              <EmptyState
                message={
                  isLoading()
                    ? "Loading commits..."
                    : "No commit data available."
                }
              />
            }
          >
            <div class="flex flex-col gap-3">
              <For each={commits().slice(0, 5)}>
                {(commit) => <CommitRow commit={commit} />}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default RecentCommits;
