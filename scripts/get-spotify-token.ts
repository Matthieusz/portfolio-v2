import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { Effect, Schema } from "effect";

// Run with: bun scripts/get-spotify-token.ts
// The Spotify app must allow http://127.0.0.1:3000/callback as a redirect URI.

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const CALLBACK_HOST = "127.0.0.1";
const CALLBACK_PORT = 3000;
const CALLBACK_PATH = "/callback";
const REDIRECT_URI = `http://${CALLBACK_HOST}:${CALLBACK_PORT}${CALLBACK_PATH}`;
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-read-playback-state",
];

const SpotifyTokenResponseSchema = Schema.Struct({
  refresh_token: Schema.optionalKey(Schema.String),
  error: Schema.optionalKey(Schema.String),
  error_description: Schema.optionalKey(Schema.String),
});

type SpotifyTokenResponse = Schema.Schema.Type<
  typeof SpotifyTokenResponseSchema
>;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  console.error(
    "Run with: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx bun scripts/get-spotify-token.ts",
  );
  process.exit(1);
}

const openBrowser = (url: string): void => {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  try {
    const browser =
      process.platform === "win32"
        ? spawn("cmd", ["/c", command, "", url], {
            detached: true,
            stdio: "ignore",
          })
        : spawn(command, [url], {
            detached: true,
            stdio: "ignore",
          });
    browser.once("error", () => {
      // The URL is printed below, so a missing browser command is recoverable.
    });
    browser.unref();
  } catch {
    // The URL is printed below, so a missing browser command is recoverable.
  }
};

const waitForAuthorizationCode = (
  authUrl: string,
  expectedState: string,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", REDIRECT_URI);

      if (requestUrl.pathname !== CALLBACK_PATH) {
        response.writeHead(404).end("Not found");
        return;
      }

      const error = requestUrl.searchParams.get("error");
      if (error) {
        response.writeHead(400).end("Spotify authorization was denied.");
        clearTimeout(timeout);
        server.close();
        reject(new Error(`Spotify authorization failed: ${error}`));
        return;
      }

      if (requestUrl.searchParams.get("state") !== expectedState) {
        response.writeHead(400).end("Invalid authorization state.");
        clearTimeout(timeout);
        server.close();
        reject(new Error("Spotify authorization returned an invalid state"));
        return;
      }

      const code = requestUrl.searchParams.get("code");
      if (!code) {
        response.writeHead(400).end("Authorization code was missing.");
        clearTimeout(timeout);
        server.close();
        reject(new Error("Spotify authorization code was missing"));
        return;
      }

      response
        .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        .end(
          "<h1>Spotify authorization complete</h1><p>You can close this tab.</p>",
        );
      clearTimeout(timeout);
      server.close();
      resolve(code);
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for Spotify authorization"));
    }, CALLBACK_TIMEOUT_MS);

    server.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    server.listen(CALLBACK_PORT, CALLBACK_HOST, () => {
      console.log("\n🎵 Spotify Refresh Token Generator\n");
      console.log("Opening Spotify authorization in your browser...");
      console.log(`If it does not open, visit this URL manually:\n\n${authUrl}`);
      console.log("\nWaiting for authorization callback...\n");
      openBrowser(authUrl);
    });
  });

const state = randomBytes(16).toString("hex");
const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("scope", SCOPES.join(" "));
authUrl.searchParams.set("state", state);

const code = await waitForAuthorizationCode(authUrl.toString(), state);
console.log("🔄 Exchanging code for tokens...\n");

const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
  "base64",
);

const response = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  }),
});

let responseBody: unknown;
try {
  responseBody = await response.json();
} catch {
  responseBody = undefined;
}

let tokenData: SpotifyTokenResponse;
try {
  tokenData = await Effect.runPromise(
    Schema.decodeUnknownEffect(SpotifyTokenResponseSchema)(responseBody),
  );
} catch {
  tokenData = {};
}

if (!response.ok) {
  const reason =
    tokenData.error_description ?? tokenData.error ?? "Unknown Spotify error";
  console.error(`❌ Spotify token exchange failed: ${reason}`);
  process.exit(1);
}

if (!tokenData.refresh_token) {
  console.error("❌ Spotify did not return a refresh token");
  process.exit(1);
}

console.log("✅ Success! Add this to your .env file:\n");
console.log(`SPOTIFY_REFRESH_TOKEN=${tokenData.refresh_token}`);
