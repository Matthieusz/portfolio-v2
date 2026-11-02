import type { APIRoute } from "astro";
import { Effect, Exit, Layer, Option } from "effect";
import { Kronik } from "@/lib/kronik";
import { runtimeConfigLayer } from "@/lib/runtime-config";
import { statusForError } from "./recent-commits";

/** Fetch streaks at request time. */
export const prerender = false;

/** Returns contribution streaks, independently of recent commits. */
export const GET: APIRoute = async () => {
  const exit = await Effect.runPromiseExit(
    Kronik.use((kronik) => kronik.streak()).pipe(
      Effect.provide(Kronik.layer.pipe(Layer.provide(runtimeConfigLayer))),
    ),
  );
  const headers = { "Cache-Control": "no-cache, no-store, must-revalidate" };
  if (Exit.isSuccess(exit)) return Response.json(exit.value, { headers });
  const status = Option.match(Exit.findErrorOption(exit), {
    onNone: () => 500,
    onSome: statusForError,
  });
  return Response.json(
    { error: "Unable to load streaks" },
    { status, headers },
  );
};
