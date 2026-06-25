import {
  createMemo,
  createSignal,
  onMount,
  Show,
  type Component,
} from "solid-js";

/*
  Hero right column: a single terminal panel that streams the ambient "now"
  signal — current track, latest commit, and Poznań local time — collapsed
  from the old Miscellaneous widgets into one focus point. The static shell
  lines type in once on load; the $ status line is live and updates in place.
*/

interface NowPlaying {
  isPlaying: boolean;
  title: string;
  artist: string;
  songUrl: string;
}
interface Commit {
  message: string;
  repo: string;
  url?: string;
}

const BANNER_LINES = ["$ whoami", "mateusz irski — software engineer", "$ contact", "mateusz.irski@gmail.com"];

const getPoznanTime = (): string =>
  new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const LiveFeed: Component = () => {
  const [typed, setTyped] = createSignal("");
  const [done, setDone] = createSignal(prefersReducedMotion());
  const [now, setNow] = createSignal<string>(getPoznanTime());
  const [track, setTrack] = createSignal<NowPlaying | null>(null);
  const [commit, setCommit] = createSignal<Commit | null>(null);

  const banner = BANNER_LINES.join("\n");

  onMount(() => {
    if (prefersReducedMotion()) {
      setTyped(banner);
      setDone(true);
    } else {
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        setTyped(banner.slice(0, i));
        if (i >= banner.length) {
          clearInterval(timer);
          setDone(true);
        }
      }, 18);
    }

    const clock = setInterval(() => setNow(getPoznanTime()), 1000);

    const fetchTrack = async () => {
      try {
        const res = await fetch("/api/spotify/now-playing");
        if (!res.ok) return;
        const data = (await res.json()) as NowPlaying | null;
        if (data) setTrack(data);
      } catch {
        /* stale */
      }
    };
    const fetchCommits = async () => {
      try {
        const res = await fetch("/api/katib/recent-commits");
        if (!res.ok) return;
        const data = (await res.json()) as { commits?: Commit[] } | null;
        const first = data?.commits?.[0];
        if (first) setCommit(first);
      } catch {
        /* stale */
      }
    };

    fetchTrack();
    fetchCommits();
    const trackPoll = setInterval(fetchTrack, 10000);
    const commitPoll = setInterval(fetchCommits, 60000);

    return () => {
      clearInterval(clock);
      clearInterval(trackPoll);
      clearInterval(commitPoll);
    };
  });

  const trackLine = createMemo(() => {
    const t = track();
    if (!t) return "idle";
    return t.isPlaying ? `listening → ${t.title} — ${t.artist}` : `last played → ${t.title} — ${t.artist}`;
  });

  const commitLine = createMemo(() => {
    const c = commit();
    if (!c) return "nothing shipped recently";
    const msg = c.message.length > 42 ? c.message.slice(0, 42) + "…" : c.message;
    return `last commit → ${c.repo} · ${msg}`;
  });

  return (
    <div class="border-border bg-card relative overflow-hidden rounded-lg border font-mono shadow-sm">
      {/* Terminal title bar */}
      <div class="border-border flex items-center gap-2 border-b px-3 py-2">
        <span class="size-2.5 rounded-full bg-[oklch(0.7_0.19_20)]" />
        <span class="size-2.5 rounded-full bg-[oklch(0.83_0.14_75)]" />
        <span class="size-2.5 rounded-full bg-[oklch(0.8_0.15_150)]" />
        <span class="text-muted-foreground ml-2 text-xs tracking-wider">
          mateusz@irski: ~
        </span>
      </div>

      {/* Body */}
      <div class="relative min-h-[15rem] overflow-hidden p-4 text-sm leading-relaxed">
        <pre class="text-foreground whitespace-pre-wrap break-words">
          {typed()}
          <Show when={done()}>
            <span class="block text-foreground">
              <span class="text-muted-foreground">$ </span>location
            </span>
            <span class="block text-muted-foreground">
              Poznań, Poland · <span class="text-primary tabular-nums">{now()}</span>
            </span>
            <span class="mt-2 block text-foreground">
              <span class="text-muted-foreground">$ </span>status
            </span>
            <span class="text-primary block">{trackLine()}</span>
            <span class="text-primary block">{commitLine()}</span>
          </Show>
          <span class="bg-primary ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink" aria-hidden="true" />
        </pre>

        {/* Scanline overlay */}
        <div
          class="terminal-scanline pointer-events-none absolute inset-x-0 top-0 h-16 animate-scanline opacity-30"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in oklch, var(--color-primary) 25%, transparent), transparent)",
          }}
        />
      </div>
    </div>
  );
};

export default LiveFeed;