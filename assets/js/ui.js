import { backdropUrl, posterUrl } from "./tmdb.js";

const FALLBACK_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
  <rect width="160" height="160" rx="80" fill="#11182D"/>
  <circle cx="80" cy="62" r="28" fill="#8AA6FF"/>
  <path d="M34 132c8-24 28-38 46-38s38 14 46 38" fill="#8AA6FF"/>
</svg>
`);

export function escapeHtml(text = "") {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (match) => map[match]);
}

export function createCard(item, template, handlers, state) {
  const node = template.content.firstElementChild.cloneNode(true);
  const button = node.querySelector(".poster-button");
  const poster = node.querySelector(".poster-img");
  const title = node.querySelector(".media-title");
  const subtitle = node.querySelector(".media-subtitle");
  const mediaType = node.querySelector(".media-type");
  const favoriteBtn = node.querySelector(".favorite-btn");
  const watchlistBtn = node.querySelector(".watchlist-btn");

  poster.src = posterUrl(item.poster_path) || backdropUrl(item.backdrop_path) || "";
  poster.alt = `${item.title} locandina`;
  title.textContent = item.title;
  subtitle.textContent = `${item.year} • ${item.media_type === "tv" ? "Serie TV" : "Film"}`;
  mediaType.innerHTML = item.media_type === "tv" ? '<i class="fas fa-tv"></i> Serie TV' : '<i class="fas fa-film"></i> Film';

  refreshStateButtons(item, favoriteBtn, watchlistBtn, state);

  button.addEventListener("click", () => handlers.openDetails(item));
  favoriteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers.toggleFavorite(item);
  });
  watchlistBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers.toggleWatchlist(item);
  });

  return node;
}

export function refreshStateButtons(item, favoriteBtn, watchlistBtn, state) {
  const key = `${item.media_type}:${item.id}`;
  const isFavorited = state.favorites.some((entry) => entry.key === key);
  const isWatchlisted = state.watchlist.some((entry) => entry.key === key);
  
  favoriteBtn.classList.toggle("active-favorite", isFavorited);
  watchlistBtn.classList.toggle("active-watchlist", isWatchlisted);
  favoriteBtn.innerHTML = isFavorited ? '<i class="fas fa-heart"></i> Preferito' : '<i class="far fa-heart"></i> Preferito';
  watchlistBtn.innerHTML = isWatchlisted ? '<i class="fas fa-check-circle"></i> Salvato' : '<i class="far fa-plus-square"></i> Watchlist';
}

export function renderMiniLibrary(container, items) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i> Nessun contenuto qui.</div>`;
    return;
  }

  items.slice(0, 8).forEach((item) => {
    const img = document.createElement("img");
    img.className = "mini-poster";
    img.alt = `${item.title} locandina`;
    img.src = posterUrl(item.poster_path) || backdropUrl(item.backdrop_path) || "";
    container.appendChild(img);
  });
}

export function renderProfile(profile) {
  const avatar = document.getElementById("profileAvatar");
  const name = document.getElementById("profileName");
  const profileLabel = document.getElementById("profileNameLabel");
  avatar.src = profile.image || FALLBACK_AVATAR;
  name.textContent = profile.name || "Ospite";
  profileLabel.innerHTML = profile.name || "Ospite";
}

export function buildEpisodeSelector(showDetails, handlers) {
  if (!showDetails || !showDetails.seasons || showDetails.seasons.length === 0) {
    return '<div class="notice-box"><i class="fas fa-info-circle"></i> Nessun episodio disponibile</div>';
  }
  
  let html = `
    <div class="episode-selector">
      <h3><i class="fas fa-list"></i> Episodi</h3>
      <div class="seasons-tabs">
  `;
  
  showDetails.seasons.forEach((season, idx) => {
    html += `
      <button class="season-tab ${idx === 0 ? 'active' : ''}" data-season="${season.season_number}">
        <i class="fas fa-calendar-alt"></i> Stagione ${season.season_number}
      </button>
    `;
  });
  
  html += `</div><div class="episodes-grid" data-show-id="${showDetails.id}">`;
  
  const firstSeason = showDetails.seasons[0];
  if (firstSeason && firstSeason.episodes) {
    firstSeason.episodes.forEach(episode => {
      html += `
        <div class="episode-card glass-soft" data-season="${firstSeason.season_number}" data-episode="${episode.episode_number}">
          <div class="episode-info">
            <span class="episode-number"><i class="fas fa-play-circle"></i> E${episode.episode_number}</span>
            <span class="episode-name">${escapeHtml(episode.name || `Episodio ${episode.episode_number}`)}</span>
          </div>
          <button class="play-episode-btn primary-btn small" data-season="${firstSeason.season_number}" data-episode="${episode.episode_number}"><i class="fas fa-play"></i> Riproduci</button>
        </div>
      `;
    });
  }
  
  html += `</div></div>`;
  
  return html;
}

export function buildDetailsHtml(details, item, trailerKey, providerLink, state) {
  const genres = (details.genres || []).map((genre) => genre.name).join(" • ") || "Nessun genere disponibile";
  const date = details.release_date || details.first_air_date || "Data sconosciuta";
  const isFavorited = state.favorites.some((entry) => entry.key === `${item.media_type}:${item.id}`);
  const isWatchlisted = state.watchlist.some((entry) => entry.key === `${item.media_type}:${item.id}`);
  const favoriteLabel = isFavorited ? '<i class="fas fa-heart"></i> Rimuovi dai preferiti' : '<i class="far fa-heart"></i> Aggiungi ai preferiti';
  const watchlistLabel = isWatchlisted ? '<i class="fas fa-check-circle"></i> Rimuovi dalla watchlist' : '<i class="far fa-plus-square"></i> Aggiungi alla watchlist';
  
  const shareUrl = `${window.location.origin}/?${item.media_type}=${item.id}`;
  const shareButtonHtml = `
    <button class="ghost-btn share-btn" data-url="${shareUrl}" data-title="${escapeHtml(item.title)}">
      <i class="fas fa-share-alt"></i> Condividi
    </button>
  `;
  
  const playButtonHtml = item.media_type === "movie" ? `
    <button class="primary-btn play-movie-btn" data-tmdb-id="${item.id}">
      <i class="fas fa-play"></i> Riproduci Film
    </button>
  ` : '';
  
  const episodesHtml = item.media_type === "tv" ? `
    <div id="episodesContainer" class="episodes-container">
      <div class="loading-episodes"><i class="fas fa-spinner fa-pulse"></i> Caricamento episodi...</div>
    </div>
  ` : '';
  
  const yearText = item.year && item.year !== "—" ? item.year : "Anno sconosciuto";
  const typeIcon = item.media_type === "tv" ? '<i class="fas fa-tv"></i>' : '<i class="fas fa-film"></i>';
  const starIcon = '<i class="fas fa-star"></i>';
  const calendarIcon = '<i class="far fa-calendar-alt"></i>';
  
  return `
    <div class="details-layout">
      <div>
        <img class="details-poster" src="${escapeHtml(posterUrl(details.poster_path) || backdropUrl(details.backdrop_path) || "")}" alt="${escapeHtml(item.title)} locandina" />
      </div>
      <div class="details-copy">
        <div class="hero-overlay-top">
          <span class="type-badge">${typeIcon} ${item.media_type === "tv" ? "Serie TV" : "Film"}</span>
          <span class="muted-badge">${calendarIcon} ${escapeHtml(String(yearText))}</span>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="details-meta">${calendarIcon} ${escapeHtml(date)} • ${starIcon} ${Number(details.vote_average || item.vote_average || 0).toFixed(1)} • ${escapeHtml(genres)}</p>
        <p class="details-overview">${escapeHtml(details.overview || item.overview || "Nessuna descrizione disponibile.")}</p>

        <div class="details-actions">
          ${playButtonHtml}
          ${shareButtonHtml}
          <button class="ghost-btn" data-action="toggle-favorite">${favoriteLabel}</button>
          <button class="ghost-btn" data-action="toggle-watchlist">${watchlistLabel}</button>
          ${providerLink ? `<a class="ghost-btn" href="${escapeHtml(providerLink)}" target="_blank" rel="noreferrer"><i class="fas fa-tv"></i> Provider ufficiali</a>` : ""}
        </div>
        
        ${episodesHtml}

        ${trailerKey ? `
          <div class="player-frame">
            <iframe
              src="https://www.youtube.com/embed/${escapeHtml(trailerKey)}"
              title="${escapeHtml(item.title)} trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        ` : `
          <div class="notice-box">
            <i class="fas fa-video"></i> Nessun trailer ufficiale restituito da TMDB per questo titolo.
          </div>
        `}

        <div class="notice-box">
          <i class="fas fa-play-circle"></i> Guarda film e episodi direttamente nel player. Clicca sul pulsante di riproduzione per iniziare lo streaming.
        </div>
      </div>
    </div>
  `;
}