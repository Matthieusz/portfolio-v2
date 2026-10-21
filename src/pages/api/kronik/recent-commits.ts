import type { APIRoute } from "astro";
import { Effect, Exit, Layer, Option } from "effect";
import { Kronik, type KronikError } from "@/lib/kronik";
import { runtimeConfigLayer } from "@/lib/runtime-config";

/** Prevents the live Kronik endpoint from being prerendered. */
export const prerender = false;

const DEFAULT_LIMIT = 5;

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
};

const KronikLive = Kronik.layer.pipe(Layer.provide(runtimeConfigLayer));

const statusForError = (error: KronikError): number => {
  switch (error._tag) {
    case "KronikConfigurationError":
      return 500;
    case "KronikTransportError":
    case "KronikResponseError":
    case "KronikDecodeError":
      return 502;
  }
};

/** Returns normalized recent commits or a transport-appropriate failure status. */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit =
    Number.isInteger(requestedLimit) &&
    requestedLimit >= 1 &&
    requestedLimit <= 100
      ? requestedLimit
      : DEFAULT_LIMIT;

  const exit = await Effect.runPromiseExit(
    Kronik.use((kronik) => kronik.recentCommits(limit)).pipe(
      Effect.provide(KronikLive),
    ),
  );

  if (Exit.isSuccess(exit)) {
    return new Response(JSON.stringify(exit.value), { status: 200, headers });
  }

  const status = Option.match(Exit.findErrorOption(exit), {
    onNone: () => 500,
    onSome: statusForError,
  });
  return new Response(JSON.stringify({ error: "Unable to load commits" }), {
    status,
    headers,
  });
};
