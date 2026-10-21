import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { Spotify } from "./spotify";

const configuration = ConfigProvider.fromUnknown({
  SPOTIFY_CLIENT_ID: "client-id",
  SPOTIFY_CLIENT_SECRET: "client-secret",
  SPOTIFY_REFRESH_TOKEN: "refresh-token",
});

const track = (id: string, name: string) => ({
  id,
  name,
  artists: [{ name: "Artist" }],
  album: { name: "Album", images: [{ url: "https://images.test/album" }] },
  external_urls: { spotify: `https://open.spotify.test/${id}` },
  duration_ms: 180_000,
});

describe("Spotify", () => {
  it.effect(
    "refreshes the token and combines current, queue, and recent data",
    () => {
      const requests: Array<Request> = [];
      const fakeFetch: typeof globalThis.fetch = async (input, init) => {
        const request = new Request(input, init);
        requests.push(request);

        if (request.url.endsWith("/api/token")) {
          return Response.json({ access_token: "access-token" });
        }
        if (request.url.endsWith("/currently-playing")) {
          return Response.json({
            is_playing: true,
            item: track("current", "Current Track"),
            progress_ms: 30_000,
          });
        }
        if (request.url.endsWith("/queue")) {
          return Response.json({ queue: [track("next", "Next Track")] });
        }
        if (request.url.includes("/recently-played")) {
          return Response.json({
            items: [
              {
                track: track("previous", "Previous Track"),
                played_at: "2026-01-01T00:00:00Z",
              },
            ],
          });
        }
        return new Response(null, { status: 404 });
      };

      const testLayer = Layer.mergeAll(
        Spotify.layer.pipe(Layer.provide(ConfigProvider.layer(configuration))),
        Layer.succeed(FetchHttpClient.Fetch, fakeFetch),
      );

      return Spotify.use((spotify) => spotify.nowPlaying()).pipe(
        Effect.provide(testLayer),
        Effect.tap((result) =>
          Effect.sync(() => {
            assert.deepStrictEqual(result, {
              isPlaying: true,
              title: "Current Track",
              artist: "Artist",
              album: "Album",
              albumImageUrl: "https://images.test/album",
              songUrl: "https://open.spotify.test/current",
              progress: 30_000,
              duration: 180_000,
              trackId: "current",
              previousTrack: {
                title: "Previous Track",
                artist: "Artist",
                album: "Album",
                albumImageUrl: "https://images.test/album",
                songUrl: "https://open.spotify.test/previous",
              },
              upNext: {
                title: "Next Track",
                artist: "Artist",
                album: "Album",
                albumImageUrl: "https://images.test/album",
                songUrl: "https://open.spotify.test/next",
              },
            });
            assert.strictEqual(requests.length, 4);
            assert.isTrue(
              requests
                .filter((request) => !request.url.endsWith("/api/token"))
                .every(
                  (request) =>
                    request.headers.get("Authorization") ===
                    "Bearer access-token",
                ),
            );
          }),
        ),
      );
    },
  );

  it.effect("returns a typed decode error for malformed provider data", () => {
    const fakeFetch: typeof globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      if (request.url.endsWith("/api/token")) {
        return Response.json({ access_token: "access-token" });
      }
      return Response.json({ is_playing: true, item: { id: "invalid" } });
    };

    const testLayer = Layer.mergeAll(
      Spotify.layer.pipe(Layer.provide(ConfigProvider.layer(configuration))),
      Layer.succeed(FetchHttpClient.Fetch, fakeFetch),
    );

    return Spotify.use((spotify) => spotify.nowPlaying()).pipe(
      Effect.provide(testLayer),
      Effect.flip,
      Effect.tap((error) =>
        Effect.sync(() => {
          assert.strictEqual(error._tag, "SpotifyDecodeError");
        }),
      ),
    );
  });

  it.effect(
    "fails through the configuration layer before making a request",
    () => {
      let requestCount = 0;
      const fakeFetch: typeof globalThis.fetch = async () => {
        requestCount += 1;
        return new Response(null, { status: 500 });
      };

      const testLayer = Layer.mergeAll(
        Spotify.layer.pipe(
          Layer.provide(
            ConfigProvider.layer(
              ConfigProvider.fromUnknown({ SPOTIFY_CLIENT_ID: "client-id" }),
            ),
          ),
        ),
        Layer.succeed(FetchHttpClient.Fetch, fakeFetch),
      );

      return Spotify.use((spotify) => spotify.nowPlaying()).pipe(
        Effect.provide(testLayer),
        Effect.flip,
        Effect.tap((error) =>
          Effect.sync(() => {
            assert.strictEqual(error._tag, "SpotifyConfigurationError");
            assert.strictEqual(requestCount, 0);
          }),
        ),
      );
    },
  );
});
