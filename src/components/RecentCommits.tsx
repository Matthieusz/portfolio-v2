import { Schema } from "effect";
import {
  createMemo,
  createSignal,
  For,
  onMount,
  onCleanup,
  Show,
  Switch,
  Match,
  type Component,
} from "solid-js";
import { RecentCommitsData, type RecentCommit } from "../lib/kronik-contract";
import InfoTooltip from "./InfoTooltip";

const decodeRecentCommitsData = Schema.decodeUnknownPromise(RecentCommitsData);
const POLL_INTERVAL = 900000;

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
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    <path d="M12 3l0 6" />
    <path d="M12 15l0 6" />
  </svg>
);

const EmptyState: Component<{ message: string }> = (props) => (
  <div
    role="status"
    class="text-muted-foreground flex flex-1 items-center justify-center py-8 text-sm"
  >
    <span>{props.message}</span>
  </div>
);

const LoadingSpinner: Component = () => (
  <div
    role="status"
    class="text-muted-foreground flex flex-1 items-center justify-center py-8"
  >
    <span class="sr-only">Loading recent commits…</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
      class="size-5 motion-safe:animate-spin"
    >
      <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
  </div>
);

const CommitRow: Component<{ commit: RecentCommit }> = (props) => (
  <li class="border-border flex min-w-0 flex-col gap-1.5 [border-block-end-width:1px] [padding-block-end:0.75rem] last:[border-block-end-width:0] last:[padding-block-end:0]">
    <div class="flex min-w-0 flex-col gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <p
          title={props.commit.repo}
          class="text-muted-foreground min-w-0 truncate text-xs"
        >
          {props.commit.repo}
        </p>
        <div class="text-muted-foreground shrink-0 text-xs whitespace-nowrap tabular-nums">
          <time
            datetime={props.commit.date ?? undefined}
            title={props.commit.date}
          >
            {formatDate(props.commit.date)}
          </time>
        </div>
      </div>
      <div class="flex min-w-0 flex-col gap-1.5">
        <Show
          when={props.commit.url}
          fallback={
            <p class="text-foreground text-sm leading-5 font-medium [overflow-wrap:anywhere]">
              {props.commit.message}
            </p>
          }
        >
          {(url) => (
            <a
              href={url()}
              target="_blank"
              rel="noopener noreferrer"
              title={props.commit.message}
              class="text-foreground dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-primary line-clamp-2 overflow-clip rounded-xs text-sm leading-5 font-medium [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:opacity-75 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[color-mix(in_oklch,var(--primary),var(--foreground)_55%)]"
            >
              <span>{props.commit.message}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="ms-0.5 inline-block size-[0.75em] align-super"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          )}
        </Show>
        <div class="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs tabular-nums">
          <Show when={props.commit.sha}>
            {(sha) => (
              <span class="inline-flex items-center gap-1" title={sha()}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="h-[1.2cap] w-auto shrink-0"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M3 12h6m6 0h6" />
                </svg>
                <code>{sha().slice(0, 7)}</code>
              </span>
            )}
          </Show>
          <Show
            when={
              props.commit.additions ||
              props.commit.deletions ||
              props.commit.filesChanged
            }
          >
            <div class="ms-auto flex flex-wrap items-center justify-end gap-2">
              <Show when={props.commit.filesChanged}>
                {(files) => (
                  <span>
                    {files()} {files() === 1 ? "file" : "files"}
                  </span>
                )}
              </Show>
              <Show when={props.commit.additions}>
                {(additions) => (
                  <span
                    class="dark:text-success text-green-800"
                    aria-label={`${additions()} additions`}
                  >
                    +{additions()}
                  </span>
                )}
              </Show>
              <Show when={props.commit.additions && props.commit.deletions}>
                <span aria-hidden="true" class="text-muted-foreground/60">
                  /
                </span>
              </Show>
              <Show when={props.commit.deletions}>
                {(deletions) => (
                  <span
                    class="dark:text-error text-rose-800"
                    aria-label={`${deletions()} deletions`}
                  >
                    −{deletions()}
                  </span>
                )}
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  </li>
);

const RecentCommits: Component = () => {
  const [data, setData] = createSignal<RecentCommitsData | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  const fetchCommits = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/kronik/recent-commits");
      if (!response.ok) {
        setErrorMessage("Unable to load commits right now.");
        return;
      }
      const payload: unknown = await response.json();
      const commitsData = await decodeRecentCommitsData(payload);
      setData(commitsData);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Unable to load commits right now.");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchCommits();
    const interval = setInterval(fetchCommits, POLL_INTERVAL);
    onCleanup(() => clearInterval(interval));
  });

  const commits = createMemo(() => data()?.commits ?? []);

  return (
    <div class="bg-card border-border relative flex h-full flex-col gap-4 overflow-clip rounded-lg border p-4">
      <div class="relative z-10">
        <h3 class="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wider uppercase">
          <span class="flex items-center gap-2">
            <CommitIcon />
            Recent Commits
          </span>
          <InfoTooltip
            content="Built with Kronik API and GitHub data"
            size="16"
            color="var(--foreground)"
          />
        </h3>
      </div>

      <div class="relative z-10 flex flex-1 flex-col">
        <Switch>
          <Match when={isLoading()}>
            <LoadingSpinner />
          </Match>
          <Match when={errorMessage()}>
            <EmptyState message="Unable to load commits right now." />
          </Match>
          <Match when={commits().length === 0}>
            <EmptyState message="No commit data available." />
          </Match>
          <Match when={commits().length > 0}>
            <ul aria-label="Recent commits" class="flex flex-col gap-3">
              <For each={commits().slice(0, 5)}>
                {(commit) => <CommitRow commit={commit} />}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default RecentCommits;
