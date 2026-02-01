// Run this script with: bun scripts/get-spotify-token.ts
// Follow the instructions to get a valid refresh token

export {};
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:3000/callback";

const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-read-playback-state",
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  console.error(
    "Run with: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx bun scripts/get-spotify-token.ts",
  );
  process.exit(1);
}

const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(" "))}`;

console.log("\n🎵 Spotify Refresh Token Generator\n");
console.log("Step 1: Open this URL in your browser:\n");
console.log(authUrl);
console.log("\nStep 2: Authorize the app");
console.log("\nStep 3: You'll be redirected to a URL like:");
console.log("        http://127.0.0.1:3000/callback?code=XXXXX");
console.log("\nStep 4: Copy the 'code' value and paste it below:\n");

const codePrompt = "Enter the authorization code: ";
process.stdout.write(codePrompt);

const code = await new Promise<string>((resolve) => {
  let input = "";
  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
    if (input.includes("\n")) {
      resolve(input.trim());
    }
  });
  process.stdin.resume();
});

console.log("\n🔄 Exchanging code for tokens...\n");

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

const data = await response.json();

if (!response.ok) {
  console.error("❌ Error from Spotify:", data);
  process.exit(1);
}

console.log("✅ Success! Add this to your .env file:\n");
console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
console.log("\n📝 Full response:", JSON.stringify(data, null, 2));

process.exit(0);
