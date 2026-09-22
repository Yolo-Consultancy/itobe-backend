import { ENV } from "../../config/env.config.js";
import { AppError } from "../../utils/api-error.js";

/**
 * Playlists Neno du portail Média, via le flux Atom public YouTube
 * (pas besoin de clé API).
 */
export const NENO_PLAYLISTS = [
  {
    id: "PLV53N7g2jwi0u4CBzf6xmaHLdtTe3jXA4",
    slug: "neno-storytime",
    title: "Neno Storytime",
  },
  {
    id: "PLV53N7g2jwi1X_boG37wsj__AcQ8GDKmn",
    slug: "origines-litterature-africaine",
    title: "Les Origines de la littérature Africaine",
  },
  {
    id: "PLOB9k6cI48v8",
    slug: "neno-analyse",
    title: "Neno Analyse",
  },
  {
    id: "PLXbRicN17lhg",
    slug: "origines-litterature-congolaise",
    title: "Les Origines de la Littérature Congolaise",
  },
];

function extraireBalise(bloc, nom) {
  const re = new RegExp(`<${nom}[^>]*>([\\s\\S]*?)<\\/${nom}>`, "i");
  const m = bloc.match(re);
  return m ? m[1].trim() : "";
}

function extraireAttr(bloc, balise, attr) {
  const re = new RegExp(`<${balise}[^>]*\\s${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  const m = bloc.match(re);
  return m ? m[1].trim() : "";
}

function decoderXml(texte) {
  return texte
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parserFeedAtom(xml, playlist) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);

  return entries
    .map((entry) => {
      const videoId =
        extraireBalise(entry, "yt:videoId") ||
        (extraireBalise(entry, "id").match(/yt:video:([\w-]{11})/) || [])[1] ||
        "";

      const titre = decoderXml(extraireBalise(entry, "title"));
      const publishedAt = extraireBalise(entry, "published");
      const updatedAt = extraireBalise(entry, "updated");
      const thumbnail =
        extraireAttr(entry, "media:thumbnail", "url") ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
      const description = decoderXml(extraireBalise(entry, "media:description")).slice(0, 280);
      const author = decoderXml(extraireBalise(entry, "name"));

      return {
        id: videoId,
        titre,
        description,
        publishedAt,
        updatedAt,
        thumbnail,
        author,
        url: videoId
          ? `https://www.youtube.com/watch?v=${videoId}&list=${playlist.id}`
          : "",
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : "",
        playlistId: playlist.id,
        playlistSlug: playlist.slug,
        playlistTitle: playlist.title,
      };
    })
    .filter((v) => v.id);
}

async function chargerPlaylist(playlist) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlist.id)}`;
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/atom+xml, application/xml, text/xml" },
  });

  if (!response.ok) {
    throw new Error(`Playlist ${playlist.id} indisponible (${response.status})`);
  }

  const xml = await response.text();
  const videos = parserFeedAtom(xml, playlist);
  return {
    id: playlist.id,
    slug: playlist.slug,
    title: playlist.title,
    url: `https://www.youtube.com/playlist?list=${playlist.id}`,
    count: videos.length,
    videos,
  };
}

export class YoutubeService {
  static estConfigure() {
    return NENO_PLAYLISTS.length > 0 || Boolean(ENV.YOUTUBE_CHANNEL_ID?.trim());
  }

  static async getVideos({ limit = 50, playlist } = {}) {
    const filtre = String(playlist ?? "").trim();
    const sources = filtre
      ? NENO_PLAYLISTS.filter((p) => p.slug === filtre || p.id === filtre)
      : NENO_PLAYLISTS;

    if (sources.length === 0) {
      throw new AppError("Playlist YouTube inconnue.", 404);
    }

    const resultats = await Promise.allSettled(sources.map((p) => chargerPlaylist(p)));
    const playlists = resultats
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    if (playlists.length === 0) {
      throw new AppError("Impossible de récupérer les vidéos YouTube pour le moment.", 502);
    }

    const max = Math.min(Math.max(Number(limit) || 50, 1), 80);
    const videos = playlists
      .flatMap((p) => p.videos)
      .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
      .slice(0, max);

    const channelId = ENV.YOUTUBE_CHANNEL_ID?.trim() || "";

    return {
      channelId,
      channelUrl: channelId
        ? `https://www.youtube.com/channel/${channelId}`
        : playlists[0]?.url || "",
      playlists: playlists.map(({ videos: _v, ...meta }) => meta),
      count: videos.length,
      data: videos,
    };
  }
}
