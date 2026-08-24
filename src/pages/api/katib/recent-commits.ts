import type { APIRoute } from "astro";
import { Effect, Exit, Layer, Option } from "effect";
import { Katib, type KatibError } from "@/lib/katib";
import { runtimeConfigLayer } from "@/lib/runtime-config";

/** Prevents the live Katib endpoint from being prerendered. */
export const prerender = false;

const DEFAULT_LIMIT = 5;

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
};

const KatibLive = Katib.layer.pipe(Layer.provide(runtimeConfigLayer));

const statusForError = (error: KatibError): number => {
  switch (error._tag) {
    case "KatibConfigurationError":
      return 500;
    case "KatibTransportError":
    case "KatibResponseError":
    case "KatibDecodeError":
      return 502;
  }
};

/** Returns normalized recent commits or a transport-appropriate failure status. */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : DEFAULT_LIMIT;

  const exit = await Effect.runPromiseExit(
    Katib.use((katib) => katib.recentCommits(limit)).pipe(
      Effect.provide(KatibLive),
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
