import type { APIRoute } from "astro";
import { Effect, Exit, Layer, Option } from "effect";
import { runtimeConfigLayer } from "@/lib/runtime-config";
import { Spotify, type SpotifyError } from "@/lib/spotify";

/** Prevents the live Spotify endpoint from being prerendered. */
export const prerender = false;

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
};

const SpotifyLive = Spotify.layer.pipe(Layer.provide(runtimeConfigLayer));

const statusForError = (error: SpotifyError): number => {
  switch (error._tag) {
    case "SpotifyConfigurationError":
      return 500;
    case "SpotifyTransportError":
    case "SpotifyResponseError":
    case "SpotifyDecodeError":
      return 502;
  }
};

/** Returns Spotify now-playing data or a transport-appropriate failure status. */
export const GET: APIRoute = async () => {
  const exit = await Effect.runPromiseExit(
    Spotify.use((spotify) => spotify.nowPlaying()).pipe(
      Effect.provide(SpotifyLive),
    ),
  );

  if (Exit.isSuccess(exit)) {
    return new Response(JSON.stringify(exit.value), { status: 200, headers });
  }

  const status = Option.match(Exit.findErrorOption(exit), {
    onNone: () => 500,
    onSome: statusForError,
  });
  return new Response("null", { status, headers });
};
