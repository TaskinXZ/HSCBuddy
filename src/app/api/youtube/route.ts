import { NextRequest, NextResponse } from "next/server";
import { buildYouTubeSearchUrl } from "@/lib/utils";
import { getChapterById } from "@/data/hsc-syllabus";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "HSC Science Bangla Lecture";
  const chapterId = searchParams.get("chapterId") || "";

  const ytApiKey = (process.env.YOUTUBE_API_KEY || "").trim();

  if (ytApiKey && ytApiKey !== "your_youtube_data_api_key_here") {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&type=video&q=${encodeURIComponent(
        query
      )}&key=${ytApiKey}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        const videos = (data.items || []).map(
          (item: {
            id: { videoId: string };
            snippet: {
              title: string;
              channelTitle: string;
              thumbnails?: { medium?: { url?: string } };
            };
          }) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || null,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            searchUrl: buildYouTubeSearchUrl(query),
            isVerifiedVideo: true,
            durationLabel: "Verified YouTube Video",
          })
        );

        return NextResponse.json({
          mode: "youtube_data_api",
          videos,
        });
      }
    } catch (e) {
      console.warn("YouTube Data API fallback triggered:", e);
    }
  }

  // Transparent YouTube Search Link Fallback (Section 11: "Never fabricate video URLs, titles, or metadata. Label it as a search link, not a verified video recommendation.")
  const chMeta = chapterId ? getChapterById(chapterId) : undefined;
  const topics = chMeta?.topics || [];

  const searchResources =
    topics.length > 0
      ? topics.map((t, idx) => ({
          id: `yt-search-${t.id}-${idx}`,
          title: `${t.titleEn} (${t.titleBn || chMeta?.titleBn || "HSC Bangla Tutorial"})`,
          channelName: "YouTube Bangla HSC Search (10 Minute School / Udvash / ACS / Onnorokom Pathshala)",
          videoUrl: null,
          searchUrl: buildYouTubeSearchUrl(t.youtubeQuery),
          searchQuery: t.youtubeQuery,
          isVerifiedVideo: false,
          durationLabel: "Targeted YouTube Search Link",
        }))
      : [
          {
            id: "yt-search-default-1",
            title: `${query} — Full Concept & CQ/MCQ One-Shot Search`,
            channelName: "YouTube Bangla HSC Search",
            videoUrl: null,
            searchUrl: buildYouTubeSearchUrl(query),
            searchQuery: query,
            isVerifiedVideo: false,
            durationLabel: "Targeted YouTube Search Link",
          },
          {
            id: "yt-search-default-2",
            title: `${query} — Board Question & Admission Shortcut Solve`,
            channelName: "YouTube Bangla HSC Search",
            videoUrl: null,
            searchUrl: buildYouTubeSearchUrl(`${query} Board CQ MCQ Solve`),
            searchQuery: `${query} Board CQ MCQ Solve`,
            isVerifiedVideo: false,
            durationLabel: "Targeted YouTube Search Link",
          },
        ];

  return NextResponse.json({
    mode: "search_fallback",
    videos: searchResources,
  });
}

