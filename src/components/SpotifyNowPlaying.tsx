import { Schema } from "effect";
import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  onCleanup,
  Show,
  type Component,
  type JSX,
} from "solid-js";
import {
  NowPlayingResponse,
  type NowPlayingData,
  type TrackInfo,
} from "../lib/spotify-contract";
import InfoTooltip from "./InfoTooltip";

const decodeNowPlayingResponse =
  Schema.decodeUnknownPromise(NowPlayingResponse);
const POLL_INTERVAL = 10000;
const PROGRESS_UPDATE_INTERVAL = 1000;

const formatTime = (ms: number): string => {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const extractColor = (img: HTMLImageElement): string => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "var(--primary)";

    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const imageData = ctx.getImageData(0, 0, 50, 50).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < imageData.length; i += 16) {
      const pr = imageData[i];
      const pg = imageData[i + 1];
      const pb = imageData[i + 2];
      if (pr + pg + pb > 60 && pr + pg + pb < 700) {
        r += pr;
        g += pg;
        b += pb;
        count++;
      }
    }

    if (count === 0) return "var(--primary)";

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return "var(--primary)";
  }
};

const Equalizer: Component = () => (
  <div
    aria-hidden="true"
    class="spotify-equalizer absolute flex items-end justify-center gap-0.5 rounded-sm p-1.5"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        class="equalizer-bar bg-primary h-3 w-1 rounded-full"
        style={{ "animation-delay": `${i * 0.15}s` }}
      />
    ))}
  </div>
);

interface TrackRowProps {
  label: string;
  track: TrackInfo | undefined;
}

const TrackRow: Component<TrackRowProps> = (props) => (
  <Show when={props.track}>
    {(track) => (
      <div class="flex items-center gap-3">
        <span class="text-muted-foreground w-16 shrink-0 text-[0.65rem] tracking-wide uppercase">
          {props.label}
        </span>
        <a
          href={track().songUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="spotify-link flex min-w-0 flex-1 items-center gap-3 rounded-sm"
          title={`${track().title} — ${track().artist} (opens in Spotify)`}
        >
          <img
            src={track().albumImageUrl}
            alt=""
            class="bg-muted size-11 shrink-0 rounded-sm object-cover"
            width={44}
            height={44}
          />
          <div class="min-w-0 flex-1">
            <p class="text-foreground truncate text-sm font-medium">
              {track().title}
            </p>
            <p class="text-muted-foreground truncate text-xs">
              {track().artist}
            </p>
          </div>
        </a>
      </div>
    )}
  </Show>
);

const SpotifyIcon: Component = () => (
  <svg
    viewBox="0 0 256 256"
    width="16"
    height="16"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    aria-hidden="true"
    class="shrink-0"
  >
    <path
      d="M128 0C57.308 0 0 57.309 0 128c0 70.696 57.309 128 128 128 70.697 0 128-57.304 128-128C256 57.314 198.697.007 127.998.007l.001-.006Zm58.699 184.614c-2.293 3.76-7.215 4.952-10.975 2.644-30.053-18.357-67.885-22.515-112.44-12.335a7.981 7.981 0 0 1-9.552-6.007 7.968 7.968 0 0 1 6-9.553c48.76-11.14 90.583-6.344 124.323 14.276 3.76 2.308 4.952 7.215 2.644 10.975Zm15.667-34.853c-2.89 4.695-9.034 6.178-13.726 3.289-34.406-21.148-86.853-27.273-127.548-14.92-5.278 1.594-10.852-1.38-12.454-6.649-1.59-5.278 1.386-10.842 6.655-12.446 46.485-14.106 104.275-7.273 143.787 17.007 4.692 2.89 6.175 9.034 3.286 13.72v-.001Zm1.345-36.293C162.457 88.964 94.394 86.71 55.007 98.666c-6.325 1.918-13.014-1.653-14.93-7.978-1.917-6.328 1.65-13.012 7.98-14.935C93.27 62.027 168.434 64.68 215.929 92.876c5.702 3.376 7.566 10.724 4.188 16.405-3.362 5.69-10.73 7.565-16.4 4.187h-.006Z"
      fill="#1ED760"
    />
  </svg>
);

const MusicIcon: Component = () => (
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
    class="icon icon-tabler icons-tabler-outline icon-tabler-music"
    aria-hidden="true"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    <path d="M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    <path d="M9 17v-13h10v13" />
    <path d="M9 8h10" />
  </svg>
);

const NotPlayingState: Component = () => (
  <div
    role="status"
    class="text-muted-foreground flex min-h-24 items-center justify-center gap-3 text-sm"
  >
    <svg
      aria-hidden="true"
      class="size-6 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
    <span>Not playing anything</span>
  </div>
);

const SpotifyNowPlaying: Component = () => {
  const [data, setData] = createSignal<NowPlayingData | null>(null);
  const [localProgress, setLocalProgress] = createSignal(0);
  const [albumColor, setAlbumColor] = createSignal("var(--primary)");
  const [titleNeedsScroll, setTitleNeedsScroll] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [hasError, setHasError] = createSignal(false);

  let titleRef: HTMLAnchorElement | undefined;
  let titleContainerRef: HTMLDivElement | undefined;

  const handleImageLoad = (img: HTMLImageElement) => {
    const color = extractColor(img);
    setAlbumColor(color);
  };

  const checkTitleScroll = () => {
    if (titleRef && titleContainerRef) {
      const needsScroll =
        (titleRef.firstElementChild?.scrollWidth ?? 0) >
        titleContainerRef.clientWidth;
      setTitleNeedsScroll(needsScroll);
    }
  };

  const fetchNowPlaying = async () => {
    try {
      const response = await fetch("/api/spotify/now-playing");
      if (!response.ok) {
        setHasError(true);
        return;
      }
      const payload: unknown = await response.json();
      const newData = await decodeNowPlayingResponse(payload);
      setData(newData);
      setHasError(false);
      if (newData?.progress !== undefined) {
        setLocalProgress(newData.progress);
      }
    } catch {
      // Preserve the last successful track during a temporary outage.
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchNowPlaying();
    const pollInterval = setInterval(fetchNowPlaying, POLL_INTERVAL);
    onCleanup(() => clearInterval(pollInterval));
  });

  onMount(() => {
    const progressInterval = setInterval(() => {
      const d = data();
      if (d?.isPlaying && d.duration) {
        setLocalProgress((prev) => Math.min(prev + 1000, d.duration ?? prev));
      }
    }, PROGRESS_UPDATE_INTERVAL);
    onCleanup(() => clearInterval(progressInterval));
  });

  createEffect(() => {
    data();
    const frame = requestAnimationFrame(checkTitleScroll);
    const observer = new ResizeObserver(checkTitleScroll);
    if (titleContainerRef) observer.observe(titleContainerRef);
    onCleanup(() => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    });
  });

  const progressPercentage = createMemo(() => {
    const d = data();
    if (!d?.duration) return 0;
    return Math.max(0, Math.min((localProgress() / d.duration) * 100, 100));
  });

  const containerStyle = (): JSX.CSSProperties => ({
    "--album-color": albumColor(),
  });

  return (
    <div
      class="spotify-card bg-card border-border relative flex h-full min-w-0 flex-col gap-4 overflow-clip rounded-lg border p-4"
      style={containerStyle()}
    >
      {/* Album color gradient overlay */}
      <div
        class="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at top left, ${albumColor()} 0%, transparent 70%)`,
        }}
      />

      <div class="relative z-10">
        <h3 class="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wider uppercase">
          <span class="flex items-center gap-2">
            <MusicIcon />
            BEEP BOOP
          </span>
          <InfoTooltip
            content="Built with Spotify API"
            size="16"
            color="var(--foreground)"
          />
        </h3>
      </div>

      <div class="relative z-10 w-full min-w-0">
        <Show
          when={data()}
          fallback={
            <Show
              when={!isLoading() && !hasError()}
              fallback={
                <div
                  role="status"
                  class="text-muted-foreground flex min-h-24 items-center justify-center gap-2 text-sm"
                >
                  <SpotifyIcon />
                  <span>
                    {isLoading()
                      ? "Loading Spotify…"
                      : "Spotify is unavailable right now."}
                  </span>
                </div>
              }
            >
              <NotPlayingState />
            </Show>
          }
        >
          {(currentData) => (
            <>
              <div class="flex items-start gap-4">
                <a
                  href={currentData().songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="spotify-link relative block size-24 shrink-0 rounded-md"
                  aria-label={`Open ${currentData().title} by ${currentData().artist} in Spotify`}
                >
                  <img
                    src={currentData().albumImageUrl}
                    alt={`${currentData().album} album cover`}
                    width={96}
                    height={96}
                    class="bg-muted size-full rounded-md object-cover"
                    crossorigin="anonymous"
                    onLoad={(e) => handleImageLoad(e.currentTarget)}
                  />
                  <Show when={currentData().isPlaying}>
                    <Equalizer />
                  </Show>
                </a>

                <div class="flex w-full min-w-0 flex-1 flex-col">
                  <div class="text-muted-foreground mbe-1 flex items-center gap-2 text-xs">
                    <SpotifyIcon />
                    <span>
                      {currentData().isPlaying ? (
                        <span class="flex items-center gap-1">Now Playing</span>
                      ) : (
                        <span>Last Played</span>
                      )}
                    </span>
                  </div>

                  <div
                    ref={(element) => {
                      titleContainerRef = element;
                    }}
                    class="marquee-container"
                  >
                    <a
                      ref={(element) => {
                        titleRef = element;
                      }}
                      href={currentData().songUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="spotify-link text-foreground marquee-content inline-flex rounded-xs font-medium whitespace-nowrap"
                      classList={{ scrolling: titleNeedsScroll() }}
                      title={`${currentData().title} (opens in Spotify)`}
                    >
                      <span>{currentData().title}</span>
                      <Show when={titleNeedsScroll()}>
                        <span aria-hidden="true">{currentData().title}</span>
                      </Show>
                    </a>
                  </div>

                  <p
                    class="text-muted-foreground truncate text-sm"
                    title={currentData().artist}
                  >
                    {currentData().artist}
                  </p>

                  <Show when={currentData().isPlaying}>
                    <div class="mbs-2 flex items-center gap-2 text-[0.65rem]">
                      <span class="text-muted-foreground tabular-nums">
                        {formatTime(
                          Math.min(
                            localProgress(),
                            currentData().duration ?? localProgress(),
                          ),
                        )}
                      </span>
                      <div
                        role="progressbar"
                        aria-label="Track progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progressPercentage())}
                        aria-valuetext={`${formatTime(localProgress())} of ${formatTime(currentData().duration ?? 0)}`}
                        class="bg-muted h-1 min-w-0 flex-1 overflow-clip rounded-full"
                      >
                        <div
                          class="bg-primary h-full rounded-full"
                          style={{ width: `${progressPercentage()}%` }}
                        />
                      </div>
                      <span class="text-muted-foreground tabular-nums">
                        {formatTime(currentData().duration ?? 0)}
                      </span>
                    </div>
                  </Show>
                </div>
              </div>

              <Show when={currentData().previousTrack || currentData().upNext}>
                <div class="border-border mbs-4 flex flex-col gap-3 [border-block-start-width:1px] [padding-block-start:0.75rem]">
                  <TrackRow
                    label="Previous"
                    track={currentData().previousTrack}
                  />
                  <TrackRow label="Up Next" track={currentData().upNext} />
                </div>
              </Show>
            </>
          )}
        </Show>
      </div>

      <style>{`
        .spotify-equalizer {
          inset-block-end: 0.375rem;
          inset-inline-end: 0.375rem;
          background: oklch(0 0 none / 0.7);
        }
        .spotify-card .spotify-link {
          transition: color 150ms ease-out, opacity 150ms ease-out;
        }
        .spotify-card .spotify-link:focus-visible {
          outline: 2px solid var(--foreground);
          outline-offset: 2px;
        }
        .spotify-card .spotify-link:active { opacity: 0.75; }
        .spotify-card .marquee-container {
          position: relative;
          overflow: clip;
          padding-block: 2px;
          margin-block: -2px;
        }
        .spotify-card .marquee-content > span { flex: none; }
        .spotify-card .marquee-content.scrolling { gap: 3rem; }
        .spotify-card .marquee-content.scrolling > span:last-child {
          padding-inline-end: 3rem;
        }
        .spotify-card .marquee-content:focus-visible { outline-offset: -2px; }

        @media (hover: hover) and (pointer: fine) {
          .spotify-card .spotify-link:hover,
          .spotify-card .spotify-link:hover .text-foreground {
            color: color-mix(in oklch, var(--primary), var(--foreground) 55%);
          }
          .spotify-card .marquee-container:hover .marquee-content {
            animation-play-state: paused;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes spotify-equalize {
            0%, 100% { transform: scaleY(0.35); }
            50% { transform: scaleY(1); }
          }
          @keyframes spotify-marquee {
            0%, 15% { transform: translateX(0); }
            85%, 100% { transform: translateX(-50%); }
          }
          .spotify-card .equalizer-bar {
            transform-origin: bottom;
            animation: spotify-equalize 0.8s ease-in-out infinite;
          }
          .spotify-card .marquee-content.scrolling {
            animation: spotify-marquee 16s linear infinite;
          }
          .spotify-card .marquee-content:focus-visible {
            animation: none;
          }
        }
        .spotify-card .marquee-content:focus-visible {
          max-inline-size: 100%;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .spotify-card .marquee-content:focus-visible > span:first-child {
          flex: 0 1 auto;
          min-inline-size: 0;
        }
        .spotify-card .marquee-content:focus-visible > span[aria-hidden] { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .spotify-card .marquee-content {
            max-inline-size: 100%;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .spotify-card .marquee-content > span:first-child {
            flex: 0 1 auto;
            min-inline-size: 0;
          }
          .spotify-card .marquee-content > span[aria-hidden] { display: none; }
        }
      `}</style>
    </div>
  );
};

export default SpotifyNowPlaying;
