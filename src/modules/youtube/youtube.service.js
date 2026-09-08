import { ENV } from "../../config/env.config.js";
import { AppError } from "../../utils/api-error.js";

/**
 * Récupère les dernières vidéos d'une chaîne YouTube via le flux Atom public
 * (pas besoin de clé API pour la liste de base).
 *
 * Config : YOUTUBE_CHANNEL_ID dans .env
 * Optionnel : YOUTUBE_API_KEY pour enrichir via Data API si fournie plus tard.
 */
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

function parserFeedAtom(xml) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);

  return entries.map((entry) => {
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
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : "",
    };
  }).filter((v) => v.id);
}

export class YoutubeService {
  static estConfigure() {
    return Boolean(ENV.YOUTUBE_CHANNEL_ID?.trim());
  }

  static async getVideos({ limit = 12 } = {}) {
    const channelId = ENV.YOUTUBE_CHANNEL_ID?.trim();
    if (!channelId) {
      throw new AppError(
        "Chaîne YouTube non configurée. Définissez YOUTUBE_CHANNEL_ID dans le .env du backend.",
        503,
      );
    }

    const max = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

    const response = await fetch(feedUrl, {
      headers: { Accept: "application/atom+xml, application/xml, text/xml" },
    });

    if (!response.ok) {
      throw new AppError(
        "Impossible de récupérer les vidéos YouTube pour le moment.",
        502,
      );
    }

    const xml = await response.text();
    const videos = parserFeedAtom(xml).slice(0, max);

    return {
      channelId,
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
      count: videos.length,
      data: videos,
    };
  }
}
