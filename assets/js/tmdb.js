import { TMDB_LANGUAGE, TMDB_READ_ACCESS_TOKEN, TMDB_REGION } from "./config.js";

const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

function assertToken() {
  if (!TMDB_READ_ACCESS_TOKEN || TMDB_READ_ACCESS_TOKEN.includes("PASTE_YOUR")) {
    throw new Error("Token TMDB mancante. Aggiungilo a assets/js/config.js");
  }
}

async function request(path, params = {}) {
  assertToken();

  const url = new URL(`${API_BASE}/${path}`);
  const merged = {
    language: TMDB_LANGUAGE,
    region: TMDB_REGION,
    include_adult: "false",
    ...params,
  };

  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  if (!response.ok) {
    throw new Error(`Richiesta TMDB fallita: ${response.status}`);
  }

  return response.json();
}

export function imageUrl(path, size = "w780") {
  return path ? `${IMAGE_BASE}/${size}${path}` : "";
}

export function posterUrl(path) {
  return imageUrl(path, "w500");
}

export function backdropUrl(path) {
  return imageUrl(path, "w1280");
}

export function normalizeMedia(item, forcedType = null) {
  const mediaType = forcedType || item.media_type || (item.first_air_date !== undefined ? "tv" : "movie");
  const title = item.title || item.name || "Senza titolo";
  const date = item.release_date || item.first_air_date || "";
  return {
    id: item.id,
    media_type: mediaType,
    title,
    overview: item.overview || "Nessuna descrizione disponibile.",
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date || "",
    first_air_date: item.first_air_date || "",
    vote_average: item.vote_average || 0,
    popularity: item.popularity || 0,
    year: date ? String(date).slice(0, 4) : "—",
  };
}

export async function getTrendingAll() {
  const data = await request("trending/all/week");
  return (data.results || []).filter((item) => ["movie", "tv"].includes(item.media_type)).map((item) => normalizeMedia(item));
}

export async function getRowData(row, mediaType) {
  if (row.endpoint) {
    const data = await request(row.endpoint);
    return (data.results || []).map((item) => normalizeMedia(item, mediaType));
  }

  const data = await request(`discover/${mediaType}`, row.discover || {});
  return (data.results || []).map((item) => normalizeMedia(item, mediaType));
}

export async function searchMulti(query) {
  const data = await request("search/multi", { query, page: 1 });
  return (data.results || [])
    .filter((item) => ["movie", "tv"].includes(item.media_type))
    .map((item) => normalizeMedia(item));
}

export async function getDetails(mediaType, id) {
  return request(`${mediaType}/${id}`, { append_to_response: "videos,watch/providers" });
}

export function getTrailerKey(details) {
  const videos = details?.videos?.results || [];
  const best = videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ||
    videos.find((video) => video.site === "YouTube" && video.type === "Teaser") ||
    videos.find((video) => video.site === "YouTube");
  return best?.key || null;
}

export function getProviderLink(details) {
  const region = details?.["watch/providers"]?.results?.[TMDB_REGION] || details?.["watch/providers"]?.results?.US;
  return region?.link || "";
}

export async function getTVShowDetails(id) {
  try {
    const data = await request(`tv/${id}`, { 
      append_to_response: "seasons" 
    });
    
    const seasons = (data.seasons || []).map(season => ({
      season_number: season.season_number,
      name: season.name,
      episode_count: season.episode_count,
      poster_path: season.poster_path,
      air_date: season.air_date
    })).filter(s => s.season_number > 0);
    
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        try {
          const seasonData = await request(`tv/${id}/season/${season.season_number}`);
          const episodes = (seasonData.episodes || []).map(ep => ({
            episode_number: ep.episode_number,
            name: ep.name,
            overview: ep.overview,
            still_path: ep.still_path,
            air_date: ep.air_date,
            runtime: ep.runtime
          }));
          return { ...season, episodes };
        } catch (error) {
          return { ...season, episodes: [] };
        }
      })
    );
    
    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      seasons: seasonsWithEpisodes
    };
  } catch (error) {
    console.error('Errore nel caricamento dei dettagli della serie:', error);
    return null;
  }
}