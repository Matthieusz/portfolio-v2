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
import {
  ActivitySummary,
  ContributionStreak,
  RecentCommitsData,
  type RecentCommit,
} from "../lib/kronik-contract";
import InfoTooltip from "./InfoTooltip";

const decodeRecentCommitsData = Schema.decodeUnknownPromise(RecentCommitsData);
const decodeActivity = Schema.decodeUnknownPromise(ActivitySummary);
const decodeStreak = Schema.decodeUnknownPromise(ContributionStreak);
const POLL_INTERVAL = 900000;
const LANGUAGE_COLORS = [
  "#16a6c4",
  "#df583c",
  "#367bb5",
  "#f06535",
  "#87c95b",
  "#a779c6",
  "#f0c75e",
  "#74c6cf",
];

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
  <li class="border-border flex min-w-0 flex-col gap-1 [border-block-end-width:1px] [padding-block-end:0.5rem] last:[border-block-end-width:0] last:[padding-block-end:0]">
    <div class="flex min-w-0 flex-col gap-1">
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
      <div class="flex min-w-0 flex-col gap-1">
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
              props.commit.filesChanged !== undefined
            }
          >
            <div class="ms-auto flex flex-wrap items-center justify-end gap-2">
              <Show when={props.commit.filesChanged !== undefined}>
                <span>
                  {props.commit.filesChanged}{" "}
                  {props.commit.filesChanged === 1 ? "file" : "files"}
                </span>
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
  const [activity, setActivity] = createSignal<ActivitySummary | null>(null);
  const [activityUnavailable, setActivityUnavailable] = createSignal(false);
  const visibleLanguages = createMemo(() =>
    (activity()?.languages ?? []).filter(
      (language) => language.percentage >= 1,
    ),
  );
  const [streak, setStreak] = createSignal<ContributionStreak | null>(null);
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

  const fetchStreak = async () => {
    try {
      const response = await fetch("/api/kronik/streak");
      if (!response.ok) return;
      const payload: unknown = await response.json();
      setStreak(await decodeStreak(payload));
    } catch {
      // The commit list remains useful when the streak endpoint is unavailable.
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch("/api/kronik/activity");
      if (!response.ok) throw new Error("Activity unavailable");
      const payload: unknown = await response.json();
      setActivity(await decodeActivity(payload));
      setActivityUnavailable(false);
    } catch {
      setActivityUnavailable(true);
    }
  };

  onMount(() => {
    void fetchCommits();
    void fetchStreak();
    void fetchActivity();
    const interval = setInterval(() => {
      void fetchCommits();
      void fetchStreak();
      void fetchActivity();
    }, POLL_INTERVAL);
    onCleanup(() => clearInterval(interval));
  });

  const commits = createMemo(() => data()?.commits ?? []);

  return (
    <div class="bg-card border-border relative flex h-full flex-col gap-4 overflow-clip rounded-lg border p-4">
      <div class="relative z-10">
        <h3 class="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs font-medium tracking-wider uppercase">
          <span class="flex items-center gap-2">
            <CommitIcon />
            Recent Commits
          </span>
          <span class="flex flex-wrap items-center gap-x-3 gap-y-2 tracking-normal normal-case">
            <Show when={streak()}>
              {(value) => (
                <>
                  <span class="text-foreground inline-flex items-center gap-1.5 text-xs font-medium tabular-nums">
                    <span
                      class="group relative inline-flex items-center"
                      aria-label="Current contribution streak"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--primary)"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        class="size-4 shrink-0 -translate-y-px"
                      >
                        <path d="M12 22c4.4 0 7-3 7-6.5 0-2.5-1.4-4.6-3-6-.2 2-1.2 2.7-2 3-1-3.4-2.7-5.9-5-7.5.4 3-1 5.1-2.3 6.8C5.7 13 5 14.2 5 15.5 5 19 7.6 22 12 22z" />
                        <path d="M9.5 18.5c0-1.3.9-2.4 2.5-3.5 1.6 1.1 2.5 2.2 2.5 3.5a2.5 2.5 0 0 1-5 0z" />
                      </svg>
                      <span class="bg-background text-foreground pointer-events-none absolute top-full right-0 z-20 mt-2 rounded px-2 py-1 text-[0.65rem] font-normal whitespace-nowrap opacity-0 shadow group-hover:opacity-100">
                        Current contribution streak
                      </span>
                    </span>
                    {value().currentStreak}d
                  </span>
                  <span class="text-foreground inline-flex items-center gap-1.5 text-xs font-medium tabular-nums">
                    <span
                      class="group relative inline-flex items-center"
                      aria-label="Longest contribution streak in the past year"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--primary)"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        class="size-4 shrink-0"
                      >
                        <path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                        <path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" />
                      </svg>
                      <span class="bg-background text-foreground pointer-events-none absolute top-full right-0 z-20 mt-2 rounded px-2 py-1 text-[0.65rem] font-normal whitespace-nowrap opacity-0 shadow group-hover:opacity-100">
                        Longest contribution streak in the past year
                      </span>
                    </span>
                    {value().longestStreak}d
                  </span>
                </>
              )}
            </Show>
            <InfoTooltip
              content="Built with Kronik API and GitHub data"
              size="16"
              color="var(--foreground)"
            />
          </span>
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
            <ul aria-label="Recent commits" class="flex flex-col gap-2">
              <For each={commits().slice(0, 5)}>
                {(commit) => <CommitRow commit={commit} />}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>
      <section
        aria-label="Activity overview"
        class="border-border relative z-10 flex flex-col gap-3 [border-block-start-width:1px] [padding-block-start:1rem]"
      >
        <h4 class="text-foreground text-sm font-semibold">
          Activity overview{" "}
          <span class="text-muted-foreground font-normal">· Last 30 days</span>
        </h4>
        <Show
          when={activity()}
          fallback={
            <p class="text-muted-foreground text-xs" role="status">
              {activityUnavailable()
                ? "Activity overview unavailable right now."
                : "Loading activity overview…"}
            </p>
          }
        >
          {(summary) => (
            <>
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Show when={visibleLanguages().length > 0}>
                  <p class="text-muted-foreground text-xs">
                    Languages in active repos
                  </p>
                </Show>
                <p class="text-muted-foreground flex flex-wrap gap-x-3 text-xs tabular-nums">
                  <span>
                    <span class="sr-only">Additions: </span>
                    <span class="dark:text-success text-green-800">
                      +{summary().totals.additions.toLocaleString("en")}
                    </span>
                  </span>
                  <span>
                    <span class="sr-only">Deletions: </span>
                    <span class="dark:text-error text-rose-800">
                      −{summary().totals.deletions.toLocaleString("en")}
                    </span>
                  </span>
                </p>
              </div>
              <Show when={visibleLanguages().length > 0}>
                <div class="flex flex-col gap-2">
                  <div
                    class="relative flex h-2 rounded-full"
                    aria-hidden="true"
                  >
                    <For each={visibleLanguages()}>
                      {(language, index) => (
                        <span
                          class="group relative first:rounded-s-full last:rounded-e-full"
                          style={{
                            "flex-grow": language.percentage,
                            "flex-basis": "0",
                            "background-color":
                              LANGUAGE_COLORS[index() % LANGUAGE_COLORS.length],
                          }}
                        >
                          <span
                            class={`bg-background text-foreground pointer-events-none absolute bottom-full z-20 mb-2 rounded px-2 py-1 text-[0.65rem] whitespace-nowrap opacity-0 shadow transition-opacity duration-150 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 ${index() === 0 ? "start-0" : "end-0"}`}
                          >
                            {language.name}{" "}
                            {language.percentage.toLocaleString("en", {
                              maximumFractionDigits: 1,
                            })}
                            %
                          </span>
                        </span>
                      )}
                    </For>
                  </div>
                  <ul class="sr-only">
                    <For each={visibleLanguages()}>
                      {(language) => (
                        <li>
                          {language.name}: {language.percentage}%
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </>
          )}
        </Show>
      </section>
    </div>
  );
};

export default RecentCommits;
