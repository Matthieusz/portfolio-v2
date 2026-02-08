import type { Component } from "solid-js";

interface InfoTooltipProps {
  size?: string;
  color?: string;
  content: string;
}

const InfoTooltip: Component<InfoTooltipProps> = (props) => (
  <span class="group relative inline-flex items-center">
    <span class="sr-only">{props.content}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? "24"}
      height={props.size ?? "24"}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color ?? "currentColor"}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon icon-tabler icons-tabler-outline icon-tabler-info-circle"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 9h.01" />
      <path d="M11 12h1v4h1" />
    </svg>
    <span class="bg-background text-foreground pointer-events-none absolute top-1/2 right-full z-10 mr-2 -translate-y-1/2 rounded px-2 py-1 text-[0.65rem] whitespace-nowrap opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
      {props.content}
    </span>
  </span>
);

export default InfoTooltip;
