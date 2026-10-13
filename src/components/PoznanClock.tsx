import {
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Component,
} from "solid-js";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Warsaw",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Shows Poznań's local time, updating once a second while mounted. */
const PoznanClock: Component = () => {
  const [now, setNow] = createSignal<Date | null>(null);

  onMount(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    onCleanup(() => clearInterval(interval));
  });

  const displayedTime = createMemo(() => {
    const date = now();
    return date ? formatter.format(date) : "--:--:--";
  });

  return (
    <time
      dateTime={now()?.toISOString()}
      aria-label="Local time in Poznań"
      class="text-primary inline-block w-[8ch] tabular-nums"
    >
      {displayedTime()}
    </time>
  );
};

export default PoznanClock;
