import { getRecentCommits } from "@/lib/katib";
import type { APIRoute } from "astro";

export const prerender = false;

const DEFAULT_LIMIT = 5;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;

  const commits = await getRecentCommits(
    Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
  );

  return new Response(JSON.stringify(commits), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
};
