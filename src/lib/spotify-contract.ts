import { Schema } from "effect";

/** Decodes the compact track projection rendered by the Spotify UI. */
export const TrackInfo = Schema.Struct({
  title: Schema.String,
  artist: Schema.String,
  album: Schema.String,
  albumImageUrl: Schema.String,
  songUrl: Schema.String,
});

/** A compact track projection rendered by the Spotify UI. */
export interface TrackInfo extends Schema.Schema.Type<typeof TrackInfo> {}

/** Decodes Spotify now-playing data returned by the server. */
export const NowPlayingData = Schema.Struct({
  isPlaying: Schema.Boolean,
  ...TrackInfo.fields,
  progress: Schema.optional(Schema.Finite),
  duration: Schema.optional(Schema.Finite),
  playedAt: Schema.optional(Schema.String),
  trackId: Schema.optional(Schema.String),
  previousTrack: Schema.optional(TrackInfo),
  upNext: Schema.optional(TrackInfo),
});

/** Spotify now-playing data, including adjacent tracks when available. */
export interface NowPlayingData extends Schema.Schema.Type<
  typeof NowPlayingData
> {}

/** Decodes the nullable response returned by the Spotify API route. */
export const NowPlayingResponse = Schema.NullOr(NowPlayingData);
