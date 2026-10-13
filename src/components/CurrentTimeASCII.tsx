import { mountAsciiCanvas } from "@/lib/ascii-canvas";
import * as alpineDawn from "ascii.rest/pieces/alpine-dawn";
import * as nightCoast from "ascii.rest/pieces/night-coast";
import * as oceanSunset from "ascii.rest/pieces/ocean-sunset";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Component,
} from "solid-js";

type TimeOfDay = "night" | "sunrise" | "sunset";

const SCENES = {
  night: nightCoast,
  sunrise: alpineDawn,
  sunset: oceanSunset,
} satisfies Record<
  TimeOfDay,
  typeof nightCoast | typeof alpineDawn | typeof oceanSunset
>;

const TIME_RANGES: { start: number; end: number; period: TimeOfDay }[] = [
  { start: 0, end: 6, period: "night" },
  { start: 6, end: 17, period: "sunrise" },
  { start: 17, end: 20, period: "sunset" },
  { start: 20, end: 24, period: "night" },
];

const getPoznanTime = (): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Warsaw" }),
  );
};

const getTimeOfDay = (date: Date): TimeOfDay => {
  const hour = date.getHours();
  const range = TIME_RANGES.find((r) => hour >= r.start && hour < r.end);
  return range?.period ?? "night";
};

const CurrentTimeASCII: Component = () => {
  const [currentTime, setCurrentTime] = createSignal(getPoznanTime());

  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    const interval = setInterval(() => {
      setCurrentTime(getPoznanTime());
    }, 1000);
    onCleanup(() => clearInterval(interval));
  });

  const currentPeriod = createMemo(() => getTimeOfDay(currentTime()));

  createEffect(() => {
    const period = currentPeriod();
    if (!canvas) return;
    onCleanup(mountAsciiCanvas(canvas, SCENES[period]));
  });

  return (
    <div class="w-full max-w-[28rem] shrink-0 font-mono text-sm">
      <div class="flex aspect-[2/1] items-center justify-center overflow-hidden rounded">
        <canvas
          ref={(element) => {
            canvas = element;
          }}
          role="img"
          aria-label={SCENES[currentPeriod()].meta.note}
          class="text-foreground block w-full"
        />
      </div>
      <p class="text-muted-foreground mt-2 text-center text-xs">
        Art from{" "}
        <a
          href="https://ascii.rest/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary underline underline-offset-4 transition-colors"
        >
          ascii.rest
        </a>{" "}
        by @bas3line
      </p>
    </div>
  );
};

export default CurrentTimeASCII;
