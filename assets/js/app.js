import { MOVIE_ROWS, TV_ROWS } from "./categories.js";
import { buildDetailsHtml, createCard, renderMiniLibrary, renderProfile, buildEpisodeSelector, escapeHtml } from "./ui.js";
import { backdropUrl, getDetails, getProviderLink, getRowData, getTrailerKey, getTrendingAll, normalizeMedia, searchMulti, getTVShowDetails } from "./tmdb.js";
import { player } from "./player.js";

const STORAGE_KEYS = {
  profile: "disinfecting_profile",
  favorites: "disinfecting_favorites",
  watchlist: "disinfecting_watchlist",
};

const state = {
  featured: null,
  mode: "all",
  favorites: readStorage(STORAGE_KEYS.favorites, []),
  watchlist: readStorage(STORAGE_KEYS.watchlist, []),
  profile: readStorage(STORAGE_KEYS.profile, { name: "Ospite", image: "" }),
  rowItems: new Map(),
};

const els = {
  movies: document.getElementById("movies"),
  series: document.getElementById("series"),
  rowTemplate: document.getElementById("rowTemplate"),
  cardTemplate: document.getElementById("cardTemplate"),
  heroBackdrop: document.getElementById("heroBackdrop"),
  heroTitle: document.getElementById("heroTitle"),
  heroMeta: document.getElementById("heroMeta"),
  heroText: document.getElementById("heroText"),
  heroTypeBadge: document.getElementById("heroTypeBadge"),
  heroYearBadge: document.getElementById("heroYearBadge"),
  heroPlayBtn: document.getElementById("heroPlayBtn"),
  heroSaveBtn: document.getElementById("heroSaveBtn"),
  favoriteCount: document.getElementById("favoriteCount"),
  watchlistCount: document.getElementById("watchlistCount"),
  favoritesMiniCount: document.getElementById("favoritesMiniCount"),
  watchlistMiniCount: document.getElementById("watchlistMiniCount"),
  favoritesPreview: document.getElementById("favoritesPreview"),
  watchlistPreview: document.getElementById("watchlistPreview"),
  activeModeText: document.getElementById("activeModeText"),
  searchSection: document.getElementById("searchSection"),
  searchGrid: document.getElementById("searchGrid"),
  searchSummary: document.getElementById("searchSummary"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  detailsDialog: document.getElementById("detailsDialog"),
  detailsContent: document.getElementById("detailsContent"),
  closeDetailsBtn: document.getElementById("closeDetailsBtn"),
  profileDialog: document.getElementById("profileDialog"),
  closeProfileBtn: document.getElementById("closeProfileBtn"),
  openProfileBtn: document.getElementById("openProfileBtn"),
  editProfileBtn: document.getElementById("editProfileBtn"),
  openLibraryBtn: document.getElementById("openLibraryBtn"),
  quickFavoritesBtn: document.getElementById("quickFavoritesBtn"),
  quickWatchlistBtn: document.getElementById("quickWatchlistBtn"),
  profileForm: document.getElementById("profileForm"),
  profileNameInput: document.getElementById("profileNameInput"),
  profileImageInput: document.getElementById("profileImageInput"),
  resetProfileBtn: document.getElementById("resetProfileBtn"),
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function itemKey(item) {
  return `${item.media_type}:${item.id}`;
}

function persistLibraries() {
  writeStorage(STORAGE_KEYS.favorites, state.favorites);
  writeStorage(STORAGE_KEYS.watchlist, state.watchlist);
}

function persistProfile() {
  writeStorage(STORAGE_KEYS.profile, state.profile);
}

function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${escapeHtml(message)}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function toggleCollection(listName, item) {
  const list = state[listName];
  const key = itemKey(item);
  const existingIndex = list.findIndex((entry) => entry.key === key);
  const listLabel = listName === 'favorites' ? 'preferiti' : 'watchlist';

  if (existingIndex >= 0) {
    list.splice(existingIndex, 1);
    showNotification(`Rimosso dai ${listLabel}`, 'info');
  } else {
    list.unshift({ ...item, key });
    showNotification(`Aggiunto ai ${listLabel}`, 'success');
  }

  persistLibraries();
  syncDerivedUi();
  rerenderVisibleCards();

  if (els.detailsDialog.open && els.detailsContent.dataset.currentKey === key) {
    openDetails(item);
  }
}

function syncDerivedUi() {
  els.favoriteCount.textContent = String(state.favorites.length);
  els.watchlistCount.textContent = String(state.watchlist.length);
  els.favoritesMiniCount.textContent = String(state.favorites.length);
  els.watchlistMiniCount.textContent = String(state.watchlist.length);
  renderMiniLibrary(els.favoritesPreview, state.favorites);
  renderMiniLibrary(els.watchlistPreview, state.watchlist);
  renderProfile(state.profile);
}

function rerenderVisibleCards() {
  document.querySelectorAll(".favorite-btn, .watchlist-btn").forEach((button) => {
    const card = button.closest(".media-card");
    const title = card?.querySelector(".media-title")?.textContent;
    const item = [...state.rowItems.values()].flat().find((entry) => entry.title === title)
      || state.favorites.find((entry) => entry.title === title)
      || state.watchlist.find((entry) => entry.title === title);

    if (!item || !card) return;

    const favoriteBtn = card.querySelector(".favorite-btn");
    const watchlistBtn = card.querySelector(".watchlist-btn");
    const key = itemKey(item);
    const favorited = state.favorites.some((entry) => entry.key === key);
    const watchlisted = state.watchlist.some((entry) => entry.key === key);
    favoriteBtn.classList.toggle("active-favorite", favorited);
    watchlistBtn.classList.toggle("active-watchlist", watchlisted);
    favoriteBtn.innerHTML = favorited ? '<i class="fas fa-heart"></i> Preferito' : '<i class="far fa-heart"></i> Preferito';
    watchlistBtn.innerHTML = watchlisted ? '<i class="fas fa-check-circle"></i> Salvato' : '<i class="far fa-plus-square"></i> Watchlist';
  });
}

function setHero(item) {
  state.featured = item;
  els.heroBackdrop.src = backdropUrl(item.backdrop_path) || "";
  els.heroTitle.textContent = item.title;
  els.heroMeta.innerHTML = `${item.media_type === "tv" ? '<i class="fas fa-tv"></i> Serie TV' : '<i class="fas fa-film"></i> Film'} • ${item.year} • <i class="fas fa-star"></i> ${Number(item.vote_average || 0).toFixed(1)}`;
  els.heroText.textContent = item.overview || "Sfoglia i contenuti in primo piano da TMDB.";
  els.heroTypeBadge.innerHTML = item.media_type === "tv" ? '<i class="fas fa-tv"></i> Serie TV' : '<i class="fas fa-film"></i> Film';
  els.heroYearBadge.innerHTML = `<i class="far fa-calendar-alt"></i> ${item.year}`;
  const isWatchlisted = state.watchlist.some((entry) => entry.key === itemKey(item));
  els.heroSaveBtn.innerHTML = isWatchlisted ? '<i class="fas fa-trash-alt"></i> Rimuovi dalla watchlist' : '<i class="fas fa-plus-circle"></i> Aggiungi alla watchlist';
}

function createHandlers() {
  return {
    openDetails,
    toggleFavorite: (item) => toggleCollection("favorites", item),
    toggleWatchlist: (item) => toggleCollection("watchlist", item),
  };
}

function addScrollControls(rowNode, scrollContainer) {
  const sectionHead = rowNode.querySelector('.section-head');
  const existingControls = sectionHead.querySelector('.scroll-controls');
  if (existingControls) existingControls.remove();
  
  const controls = document.createElement('div');
  controls.className = 'scroll-controls';
  controls.innerHTML = `
    <button class="scroll-btn" data-scroll="left" aria-label="Scorri a sinistra"><i class="fas fa-chevron-left"></i></button>
    <button class="scroll-btn" data-scroll="right" aria-label="Scorri a destra"><i class="fas fa-chevron-right"></i></button>
  `;
  sectionHead.appendChild(controls);
  
  const leftBtn = controls.querySelector('[data-scroll="left"]');
  const rightBtn = controls.querySelector('[data-scroll="right"]');
  const scrollAmount = 300;
  
  leftBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  
  rightBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

function renderRow(container, row, items) {
  const rowNode = els.rowTemplate.content.firstElementChild.cloneNode(true);
  const rowKicker = rowNode.querySelector(".row-kicker");
  const rowTitle = rowNode.querySelector(".row-title");
  const rowCopy = rowNode.querySelector(".row-copy");
  
  if (rowKicker) rowKicker.innerHTML = items[0]?.media_type === "tv" ? '<i class="fas fa-tv"></i> Serie TV' : '<i class="fas fa-film"></i> Film';
  if (rowTitle) rowTitle.textContent = row.title;
  if (rowCopy) rowCopy.textContent = row.description;

  const scroll = rowNode.querySelector(".row-scroll");
  
  items.forEach((item) => {
    const card = createCard(item, els.cardTemplate, createHandlers(), state);
    scroll.appendChild(card);
  });
  
  if (items.length > 4) {
    addScrollControls(rowNode, scroll);
  }
  
  container.appendChild(rowNode);
  
  setTimeout(() => {
    const scrollContainer = rowNode.querySelector(".row-scroll");
    if (scrollContainer && scrollContainer.scrollWidth > scrollContainer.clientWidth) {
      if (!rowNode.querySelector('.scroll-controls')) {
        addScrollControls(rowNode, scrollContainer);
      }
    }
  }, 100);
}

async function buildRows() {
  els.movies.innerHTML = "";
  els.series.innerHTML = "";

  if (state.mode === "all" || state.mode === "movie") {
    for (const row of MOVIE_ROWS) {
      const items = await getRowData(row, "movie");
      state.rowItems.set(`movie:${row.key}`, items);
      renderRow(els.movies, row, items);
    }
  }

  if (state.mode === "all" || state.mode === "tv") {
    for (const row of TV_ROWS) {
      const items = await getRowData(row, "tv");
      state.rowItems.set(`tv:${row.key}`, items);
      renderRow(els.series, row, items);
    }
  }
}

async function openDetails(item) {
  const details = await getDetails(item.media_type, item.id);
  const normalized = normalizeMedia({ ...details, media_type: item.media_type }, item.media_type);
  const trailerKey = getTrailerKey(details);
  const providerLink = getProviderLink(details);
  els.detailsContent.innerHTML = buildDetailsHtml(details, normalized, trailerKey, providerLink, state);
  els.detailsContent.dataset.currentKey = itemKey(item);
  els.detailsDialog.showModal();

  const favBtn = els.detailsContent.querySelector('[data-action="toggle-favorite"]');
  const watchlistBtn = els.detailsContent.querySelector('[data-action="toggle-watchlist"]');
  
  if (favBtn) {
    favBtn.addEventListener("click", () => toggleCollection("favorites", normalized));
  }
  if (watchlistBtn) {
    watchlistBtn.addEventListener("click", () => toggleCollection("watchlist", normalized));
  }
  
  const playMovieBtn = els.detailsContent.querySelector('.play-movie-btn');
  if (playMovieBtn) {
    playMovieBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tmdbId = playMovieBtn.getAttribute('data-tmdb-id');
      if (tmdbId) {
        showNotification(`Caricamento film...`, 'info');
        player.playMovie(tmdbId, { autoplay: true, primaryColor: "88a7ff", secondaryColor: "b47dff", lang: "it" });
      }
    });
  }
  
  if (item.media_type === "tv") {
    const episodesContainer = els.detailsContent.querySelector('#episodesContainer');
    if (episodesContainer) {
      try {
        const showDetails = await getTVShowDetails(item.id);
        if (showDetails && showDetails.seasons && showDetails.seasons.length > 0) {
          const episodesHtml = buildEpisodeSelector(showDetails, createHandlers());
          episodesContainer.innerHTML = episodesHtml;
          
          const attachEpisodeHandlers = () => {
            const playEpisodeBtns = episodesContainer.querySelectorAll('.play-episode-btn');
            playEpisodeBtns.forEach(btn => {
              btn.removeEventListener('click', window._episodeHandler);
              const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const season = parseInt(btn.getAttribute('data-season'));
                const episode = parseInt(btn.getAttribute('data-episode'));
                if (season && episode) {
                  showNotification(`Caricamento Stagione ${season} Episodio ${episode}...`, 'info');
                  player.playEpisode(item.id, season, episode, { autoplay: true, primaryColor: "88a7ff", secondaryColor: "b47dff", lang: "it" });
                }
              };
              btn.addEventListener('click', handler);
              window._episodeHandler = handler;
            });
          };
          
          attachEpisodeHandlers();
          
          const seasonTabs = episodesContainer.querySelectorAll('.season-tab');
          seasonTabs.forEach(tab => {
            tab.addEventListener("click", async () => {
              seasonTabs.forEach(t => t.classList.remove('active'));
              tab.classList.add('active');
              const seasonNum = parseInt(tab.getAttribute('data-season'));
              
              const fullShowDetails = await getTVShowDetails(item.id);
              const selectedSeason = fullShowDetails?.seasons?.find(s => s.season_number === seasonNum);
              const episodesGrid = episodesContainer.querySelector('.episodes-grid');
              
              if (selectedSeason && selectedSeason.episodes && episodesGrid) {
                episodesGrid.innerHTML = '';
                selectedSeason.episodes.forEach(ep => {
                  const episodeCard = document.createElement('div');
                  episodeCard.className = 'episode-card glass-soft';
                  episodeCard.setAttribute('data-season', seasonNum);
                  episodeCard.setAttribute('data-episode', ep.episode_number);
                  episodeCard.innerHTML = `
                    <div class="episode-info">
                      <span class="episode-number"><i class="fas fa-play-circle"></i> E${ep.episode_number}</span>
                      <span class="episode-name">${escapeHtml(ep.name || `Episodio ${ep.episode_number}`)}</span>
                    </div>
                    <button class="play-episode-btn primary-btn small" data-season="${seasonNum}" data-episode="${ep.episode_number}"><i class="fas fa-play"></i> Riproduci</button>
                  `;
                  episodesGrid.appendChild(episodeCard);
                });
                
                episodesGrid.querySelectorAll('.play-episode-btn').forEach(btn => {
                  btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const season = parseInt(btn.getAttribute('data-season'));
                    const episode = parseInt(btn.getAttribute('data-episode'));
                    showNotification(`Caricamento Stagione ${season} Episodio ${episode}...`, 'info');
                    player.playEpisode(item.id, season, episode, { autoplay: true, primaryColor: "88a7ff", secondaryColor: "b47dff", lang: "it" });
                  });
                });
              }
            });
          });
        } else {
          episodesContainer.innerHTML = '<div class="notice-box"><i class="fas fa-info-circle"></i> Nessun episodio disponibile per questa serie.</div>';
        }
      } catch (error) {
        console.error("Error loading episodes:", error);
        episodesContainer.innerHTML = '<div class="notice-box"><i class="fas fa-exclamation-triangle"></i> Errore nel caricamento degli episodi.</div>';
      }
    }
  }
}

async function runSearch(query) {
  try {
    showNotification(`Ricerca di "${query}"...`, 'info');
    const results = await searchMulti(query);
    els.searchGrid.innerHTML = "";
    els.searchSection.classList.remove("hidden");
    els.searchSummary.textContent = `${results.length} risultato${results.length === 1 ? "" : "i"} per “${query}”`;

    results.forEach((item) => {
      const card = createCard(item, els.cardTemplate, createHandlers(), state);
      els.searchGrid.appendChild(card);
    });

    if (!results.length) {
      els.searchGrid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i> Nessun risultato trovato per "${query}".</div>`;
      showNotification(`Nessun risultato trovato per "${query}"`, 'error');
    } else {
      showNotification(`Trovati ${results.length} risultati per "${query}"`, 'success');
    }
  } catch (error) {
    console.error("Search error:", error);
    els.searchGrid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> Ricerca fallita: ${error.message}</div>`;
    showNotification(`Ricerca fallita: ${error.message}`, 'error');
  }
}

function setupProfileForm() {
  els.profileNameInput.value = state.profile.name === "Ospite" ? "" : state.profile.name;
  els.profileImageInput.value = state.profile.image || "";

  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = {
      name: els.profileNameInput.value.trim() || "Ospite",
      image: els.profileImageInput.value.trim(),
    };
    persistProfile();
    syncDerivedUi();
    els.profileDialog.close();
    showNotification('Profilo aggiornato con successo!', 'success');
  });

  els.resetProfileBtn.addEventListener("click", () => {
    state.profile = { name: "Ospite", image: "" };
    persistProfile();
    syncDerivedUi();
    els.profileNameInput.value = "";
    els.profileImageInput.value = "";
    showNotification('Profilo ripristinato', 'info');
  });
}

function wireEvents() {
  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      document.querySelectorAll(".mode-btn").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      state.mode = button.dataset.mode;
      const modeText = state.mode === "all" ? "Mostrando tutto." : state.mode === "movie" ? "Mostrando solo film." : "Mostrando solo serie TV.";
      els.activeModeText.innerHTML = `<i class="fas fa-info-circle"></i> ${modeText}`;
      await buildRows();
      rerenderVisibleCards();
      const modeName = state.mode === "all" ? "tutto" : state.mode === "movie" ? "film" : "serie TV";
      showNotification(`Modalità cambiata in ${modeName}`, 'info');
    });
  });

  els.heroPlayBtn.addEventListener("click", () => {
    if (state.featured) {
      openDetails(state.featured);
    }
  });
  
  els.heroSaveBtn.addEventListener("click", () => {
    if (state.featured) {
      toggleCollection("watchlist", state.featured);
    }
  });
  
  els.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = els.searchInput.value.trim();
    if (!query) return;
    await runSearch(query);
  });

  els.closeDetailsBtn.addEventListener("click", () => els.detailsDialog.close());
  els.closeProfileBtn.addEventListener("click", () => els.profileDialog.close());
  els.openProfileBtn.addEventListener("click", () => els.profileDialog.showModal());
  els.editProfileBtn.addEventListener("click", () => els.profileDialog.showModal());
  els.openLibraryBtn.addEventListener("click", () => document.getElementById("my-space").scrollIntoView({ behavior: "smooth" }));
  els.quickFavoritesBtn.addEventListener("click", () => document.getElementById("my-space").scrollIntoView({ behavior: "smooth" }));
  els.quickWatchlistBtn.addEventListener("click", () => document.getElementById("my-space").scrollIntoView({ behavior: "smooth" }));

  [els.detailsDialog, els.profileDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      const inside = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    });
  });

  // Floating Scroll Button Logic
  const floatingBtn = document.getElementById('floatingScrollBtn');
  if (floatingBtn) {
    const rowsContainer = document.querySelector('.rows-stack');
    const moviesSection = document.getElementById('movies');
    
    const checkScrollPosition = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const firstRow = rowsContainer || moviesSection;
      
      if (firstRow) {
        const rowPosition = firstRow.getBoundingClientRect().top + window.scrollY;
        const shouldShow = scrollY < rowPosition - 100;
        
        if (shouldShow) {
          floatingBtn.classList.remove('hide');
          floatingBtn.classList.add('show');
        } else {
          floatingBtn.classList.remove('show');
          floatingBtn.classList.add('hide');
        }
      }
    };
    
    const scrollToRows = () => {
      const target = rowsContainer || moviesSection;
      
      if (target) {
        floatingBtn.classList.add('pulse');
        setTimeout(() => {
          floatingBtn.classList.remove('pulse');
        }, 1500);
        
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        showNotification('Scorrendo verso i contenuti...', 'info');
      }
    };
    
    window.addEventListener('scroll', checkScrollPosition);
    floatingBtn.addEventListener('click', scrollToRows);
    
    checkScrollPosition();
    
    setTimeout(() => {
      floatingBtn.classList.add('pulse');
      setTimeout(() => {
        floatingBtn.classList.remove('pulse');
      }, 1500);
    }, 1000);
  }
}

async function init() {
  syncDerivedUi();
  setupProfileForm();
  wireEvents();

  try {
    const trending = await getTrendingAll();
    const featured = trending.find((item) => item.backdrop_path) || trending[0];
    if (featured) setHero(featured);
    await buildRows();
    showNotification('Benvenuto su disinfecting by kidnap.lol!', 'success');
  } catch (error) {
    console.error("Init error:", error);
    els.heroTitle.textContent = "Configurazione TMDB richiesta";
    els.heroMeta.textContent = error.message;
    els.heroText.textContent = "Apri assets/js/config.js e incolla il tuo token di accesso TMDB.";
    els.movies.innerHTML = `<section class="section-block"><div class="empty-state"><i class="fas fa-exclamation-triangle"></i> ${error.message}</div></section>`;
    showNotification('Token TMDB richiesto. Controlla config.js', 'error');
  }
}

init();
