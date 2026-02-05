const CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
  "base64",
);
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED_ENDPOINT =
  "https://api.spotify.com/v1/me/player/recently-played?limit=5";
const QUEUE_ENDPOINT = "https://api.spotify.com/v1/me/player/queue";

interface SpotifyToken {
  access_token: string;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  name: string;
  external_urls: { spotify: string };
}

interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
  duration_ms: number;
}

interface CurrentlyPlayingResponse {
  is_playing: boolean;
  item: SpotifyTrack;
  progress_ms: number;
}

interface RecentlyPlayedResponse {
  items: Array<{
    track: SpotifyTrack;
    played_at: string;
  }>;
}

interface QueueResponse {
  currently_playing: SpotifyTrack | null;
  queue: SpotifyTrack[];
}

const parseJsonSafely = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
}

export interface NowPlayingData {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
  progress?: number;
  duration?: number;
  playedAt?: string;
  trackId?: string;

  previousTrack?: TrackInfo;
  upNext?: TrackInfo;
}

async function getAccessToken(): Promise<SpotifyToken | null> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  if (!response.ok) return null;

  const data = await parseJsonSafely<SpotifyToken>(response);
  if (!data?.access_token) return null;

  return data;
}

function trackToInfo(track: SpotifyTrack): TrackInfo {
  return {
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    album: track.album.name,
    albumImageUrl: track.album.images[0]?.url ?? "",
    songUrl: track.external_urls.spotify,
  };
}

async function getQueue(
  accessToken: string,
): Promise<{ upNext?: TrackInfo } | null> {
  try {
    const response = await fetch(QUEUE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return null;

    const data = await parseJsonSafely<QueueResponse>(response);
    if (!data) return null;

    return {
      upNext: data.queue[0] ? trackToInfo(data.queue[0]) : undefined,
    };
  } catch {
    return null;
  }
}

async function getRecentTracks(
  accessToken: string,
): Promise<{ previousTrack?: TrackInfo } | null> {
  try {
    const response = await fetch(RECENTLY_PLAYED_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return null;

    const data = await parseJsonSafely<RecentlyPlayedResponse>(response);
    if (!data) return null;

    return {
      previousTrack: data.items[0]
        ? trackToInfo(data.items[0].track)
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function getNowPlaying(): Promise<NowPlayingData | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const { access_token } = token;

    // Try to get currently playing track
    const currentlyPlayingResponse = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // 204 means nothing is playing, check recently played
    if (
      currentlyPlayingResponse.status === 204 ||
      currentlyPlayingResponse.status === 202
    ) {
      return getRecentlyPlayed(access_token);
    }

    if (!currentlyPlayingResponse.ok) {
      return null;
    }

    const data = await parseJsonSafely<CurrentlyPlayingResponse>(
      currentlyPlayingResponse,
    );
    if (!data) return null;

    // No track data or it's an ad/podcast
    if (!data.item) {
      return getRecentlyPlayed(access_token);
    }

    // Fetch queue and recent tracks in parallel
    const [queueData, recentData] = await Promise.all([
      getQueue(access_token),
      getRecentTracks(access_token),
    ]);

    return {
      isPlaying: data.is_playing,
      title: data.item.name,
      artist: data.item.artists.map((artist) => artist.name).join(", "),
      album: data.item.album.name,
      albumImageUrl: data.item.album.images[0]?.url ?? "",
      songUrl: data.item.external_urls.spotify,
      progress: data.progress_ms,
      duration: data.item.duration_ms,
      trackId: data.item.id,
      previousTrack: recentData?.previousTrack,
      upNext: queueData?.upNext,
    };
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return null;
  }
}

async function getRecentlyPlayed(
  accessToken: string,
): Promise<NowPlayingData | null> {
  try {
    const response = await fetch(RECENTLY_PLAYED_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await parseJsonSafely<RecentlyPlayedResponse>(response);
    if (!data) return null;
    const tracks = data.items;

    if (!tracks || tracks.length === 0) {
      return null;
    }

    const track = tracks[0].track;

    return {
      isPlaying: false,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      albumImageUrl: track.album.images[0]?.url ?? "",
      songUrl: track.external_urls.spotify,
      playedAt: tracks[0].played_at,
      trackId: track.id,
      previousTrack: tracks[1] ? trackToInfo(tracks[1].track) : undefined,
    };
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return null;
  }
}
