import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED_ENDPOINT =
  "https://api.spotify.com/v1/me/player/recently-played?limit=5";
const QUEUE_ENDPOINT = "https://api.spotify.com/v1/me/player/queue";

const SpotifyToken = Schema.Struct({
  access_token: Schema.String,
});

const SpotifyImage = Schema.Struct({
  url: Schema.String,
});

const SpotifyArtist = Schema.Struct({
  name: Schema.String,
});

const SpotifyAlbum = Schema.Struct({
  name: Schema.String,
  images: Schema.Array(SpotifyImage),
});

const SpotifyTrack = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  artists: Schema.Array(SpotifyArtist),
  album: SpotifyAlbum,
  external_urls: Schema.Struct({ spotify: Schema.String }),
  duration_ms: Schema.Number,
});

interface SpotifyTrack extends Schema.Schema.Type<typeof SpotifyTrack> {}

const CurrentlyPlayingResponse = Schema.Struct({
  is_playing: Schema.Boolean,
  item: Schema.NullOr(SpotifyTrack),
  progress_ms: Schema.NullOr(Schema.Number),
});

const RecentlyPlayedResponse = Schema.Struct({
  items: Schema.Array(
    Schema.Struct({
      track: SpotifyTrack,
      played_at: Schema.String,
    }),
  ),
});

const QueueResponse = Schema.Struct({
  queue: Schema.Array(SpotifyTrack),
});

/** A compact track projection used by the now-playing UI. */
export interface TrackInfo {
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly albumImageUrl: string;
  readonly songUrl: string;
}

/** The Spotify data returned to the browser, including adjacent tracks when available. */
export interface NowPlayingData {
  readonly isPlaying: boolean;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly albumImageUrl: string;
  readonly songUrl: string;
  readonly progress?: number | undefined;
  readonly duration?: number | undefined;
  readonly playedAt?: string | undefined;
  readonly trackId?: string | undefined;
  readonly previousTrack?: TrackInfo | undefined;
  readonly upNext?: TrackInfo | undefined;
}

/** Indicates that required Spotify credentials could not be loaded. */
export class SpotifyConfigurationError extends Schema.TaggedError<SpotifyConfigurationError>()(
  "SpotifyConfigurationError",
  { cause: Schema.Defect() },
) {}

/** Indicates that a Spotify request could not reach the provider. */
export class SpotifyTransportError extends Schema.TaggedError<SpotifyTransportError>()(
  "SpotifyTransportError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}

/** Indicates that Spotify rejected a request with a non-success status. */
export class SpotifyResponseError extends Schema.TaggedError<SpotifyResponseError>()(
  "SpotifyResponseError",
  {
    operation: Schema.String,
    status: Schema.Int,
  },
) {}

/** Indicates that a successful Spotify response did not match its wire schema. */
export class SpotifyDecodeError extends Schema.TaggedError<SpotifyDecodeError>()(
  "SpotifyDecodeError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}

/** All expected failures produced by the Spotify integration. */
export type SpotifyError =
  | SpotifyConfigurationError
  | SpotifyTransportError
  | SpotifyResponseError
  | SpotifyDecodeError;

interface SpotifyConfigurationService {
  readonly clientId: Redacted.Redacted<string>;
  readonly clientSecret: Redacted.Redacted<string>;
  readonly refreshToken: Redacted.Redacted<string>;
}

/** Supplies redacted Spotify credentials to the integration layer. */
export class SpotifyConfiguration extends Context.Service<
  SpotifyConfiguration,
  SpotifyConfigurationService
>()("portfolio/SpotifyConfiguration") {
  /** Loads Spotify credentials through Effect Config. */
  static readonly layer = Layer.effect(
    SpotifyConfiguration,
    Effect.gen(function* () {
      const clientId = yield* Config.redacted("SPOTIFY_CLIENT_ID");
      const clientSecret = yield* Config.redacted("SPOTIFY_CLIENT_SECRET");
      const refreshToken = yield* Config.redacted("SPOTIFY_REFRESH_TOKEN");

      return SpotifyConfiguration.of({
        clientId,
        clientSecret,
        refreshToken,
      });
    }).pipe(
      Effect.mapError((cause) => new SpotifyConfigurationError({ cause })),
    ),
  );
}

interface SpotifyService {
  readonly nowPlaying: () => Effect.Effect<
    NowPlayingData | null,
    Exclude<SpotifyError, SpotifyConfigurationError>
  >;
}

/** Owns Spotify token refresh and the now-playing request workflow. */
export class Spotify extends Context.Service<Spotify, SpotifyService>()(
  "portfolio/Spotify",
) {
  /** Builds Spotify from explicit configuration and HTTP client dependencies. */
  static readonly layerNoDependencies = Layer.effect(
    Spotify,
    Effect.gen(function* () {
      const configuration = yield* SpotifyConfiguration;
      const client = yield* HttpClient.HttpClient;

      const execute = Effect.fn("Spotify.execute")(function* (
        operation: string,
        request: HttpClientRequest.HttpClientRequest,
      ) {
        return yield* client
          .execute(request)
          .pipe(
            Effect.mapError(
              (cause) => new SpotifyTransportError({ operation, cause }),
            ),
          );
      });

      const requireSuccess = Effect.fn("Spotify.requireSuccess")(function* (
        operation: string,
        response: HttpClientResponse.HttpClientResponse,
      ) {
        if (response.status < 200 || response.status >= 300) {
          return yield* new SpotifyResponseError({
            operation,
            status: response.status,
          });
        }
        return response;
      });

      const getAccessToken = Effect.fn("Spotify.getAccessToken")(function* () {
        const request = HttpClientRequest.post(TOKEN_ENDPOINT).pipe(
          HttpClientRequest.basicAuth(
            configuration.clientId,
            configuration.clientSecret,
          ),
          HttpClientRequest.bodyUrlParams({
            grant_type: "refresh_token",
            refresh_token: Redacted.value(configuration.refreshToken),
          }),
        );
        const response = yield* execute("Spotify.getAccessToken", request);
        yield* requireSuccess("Spotify.getAccessToken", response);
        const token = yield* HttpClientResponse.schemaBodyJson(SpotifyToken)(
          response,
        ).pipe(
          Effect.mapError(
            (cause) =>
              new SpotifyDecodeError({
                operation: "Spotify.getAccessToken",
                cause,
              }),
          ),
        );
        return Redacted.make(token.access_token);
      });

      const getRecentTracks = Effect.fn("Spotify.getRecentTracks")(function* (
        accessToken: Redacted.Redacted<string>,
      ) {
        const request = HttpClientRequest.get(RECENTLY_PLAYED_ENDPOINT).pipe(
          HttpClientRequest.bearerToken(accessToken),
        );
        const response = yield* execute("Spotify.getRecentTracks", request);
        yield* requireSuccess("Spotify.getRecentTracks", response);
        return yield* HttpClientResponse.schemaBodyJson(RecentlyPlayedResponse)(
          response,
        ).pipe(
          Effect.mapError(
            (cause) =>
              new SpotifyDecodeError({
                operation: "Spotify.getRecentTracks",
                cause,
              }),
          ),
        );
      });

      const getQueue = Effect.fn("Spotify.getQueue")(function* (
        accessToken: Redacted.Redacted<string>,
      ) {
        const request = HttpClientRequest.get(QUEUE_ENDPOINT).pipe(
          HttpClientRequest.bearerToken(accessToken),
        );
        const response = yield* execute("Spotify.getQueue", request);
        yield* requireSuccess("Spotify.getQueue", response);
        return yield* HttpClientResponse.schemaBodyJson(QueueResponse)(
          response,
        ).pipe(
          Effect.mapError(
            (cause) =>
              new SpotifyDecodeError({
                operation: "Spotify.getQueue",
                cause,
              }),
          ),
        );
      });

      const getRecentlyPlayed = Effect.fn("Spotify.getRecentlyPlayed")(
        function* (accessToken: Redacted.Redacted<string>) {
          const data = yield* getRecentTracks(accessToken);
          const current = data.items[0];
          if (current === undefined) return null;

          return {
            isPlaying: false,
            ...trackToInfo(current.track),
            playedAt: current.played_at,
            trackId: current.track.id,
            previousTrack:
              data.items[1] === undefined
                ? undefined
                : trackToInfo(data.items[1].track),
          } satisfies NowPlayingData;
        },
      );

      const nowPlaying = Effect.fn("Spotify.nowPlaying")(function* () {
        const accessToken = yield* getAccessToken();
        const request = HttpClientRequest.get(NOW_PLAYING_ENDPOINT).pipe(
          HttpClientRequest.bearerToken(accessToken),
        );
        const response = yield* execute("Spotify.nowPlaying", request);

        if (response.status === 202 || response.status === 204) {
          return yield* getRecentlyPlayed(accessToken);
        }

        yield* requireSuccess("Spotify.nowPlaying", response);
        const current = yield* HttpClientResponse.schemaBodyJson(
          CurrentlyPlayingResponse,
        )(response).pipe(
          Effect.mapError(
            (cause) =>
              new SpotifyDecodeError({
                operation: "Spotify.nowPlaying",
                cause,
              }),
          ),
        );

        if (current.item === null) {
          return yield* getRecentlyPlayed(accessToken);
        }

        const [queue, recent] = yield* Effect.all(
          [getQueue(accessToken), getRecentTracks(accessToken)],
          { concurrency: "unbounded" },
        );

        return {
          isPlaying: current.is_playing,
          ...trackToInfo(current.item),
          progress: current.progress_ms ?? undefined,
          duration: current.item.duration_ms,
          trackId: current.item.id,
          previousTrack:
            recent.items[0] === undefined
              ? undefined
              : trackToInfo(recent.items[0].track),
          upNext:
            queue.queue[0] === undefined
              ? undefined
              : trackToInfo(queue.queue[0]),
        } satisfies NowPlayingData;
      });

      return Spotify.of({ nowPlaying });
    }),
  );

  /** Provides the production configuration and fetch-backed HTTP client. */
  static readonly layer = Spotify.layerNoDependencies.pipe(
    Layer.provide(SpotifyConfiguration.layer),
    Layer.provide(FetchHttpClient.layer),
  );
}

const trackToInfo = (track: SpotifyTrack): TrackInfo => ({
  title: track.name,
  artist: track.artists.map((artist) => artist.name).join(", "),
  album: track.album.name,
  albumImageUrl: track.album.images[0]?.url ?? "",
  songUrl: track.external_urls.spotify,
});
