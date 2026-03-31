import { getDetails, normalizeMedia, posterUrl, backdropUrl } from "./tmdb.js";
import { buildDetailsHtml, escapeHtml } from "./ui.js";
import { player } from "./player.js";

export async function handleDirectLink() {
  const storedLink = sessionStorage.getItem('directLink');
  let type = null;
  let id = null;
  
  if (storedLink) {
    const linkData = JSON.parse(storedLink);
    type = linkData.type;
    id = linkData.id;
    sessionStorage.removeItem('directLink');
    console.log('Found stored link:', type, id);
  } else {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('movie');
    const tvId = urlParams.get('tv');
    
    if (movieId) {
      type = 'movie';
      id = movieId;
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (tvId) {
      type = 'tv';
      id = tvId;
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  
  if (type && id) {
    try {
      showNotification(`📥 Caricamento contenuto...`, 'info');
      
      console.log('Loading content:', type, id);
      const details = await getDetails(type, id);
      const normalized = normalizeMedia({ ...details, media_type: type }, type);
      
      showNotification(`✅ "${normalized.title}" caricato!`, 'success');
      
      updateMetaTags(details, normalized, type);
      
      await new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });
      
      const detailsDialog = document.getElementById('detailsDialog');
      const detailsContent = document.getElementById('detailsContent');
      const trailerKey = details.videos?.results?.find(v => v.site === 'YouTube')?.key;
      const providerLink = details['watch/providers']?.results?.IT?.link || '';
      
      if (detailsContent) {
        const state = {
          favorites: JSON.parse(localStorage.getItem('disinfecting_favorites') || '[]'),
          watchlist: JSON.parse(localStorage.getItem('disinfecting_watchlist') || '[]')
        };
        detailsContent.innerHTML = buildDetailsHtml(details, normalized, trailerKey, providerLink, state);
        detailsDialog.showModal();
        
        const playBtn = detailsContent.querySelector('.play-movie-btn');
        if (playBtn) {
          playBtn.addEventListener('click', () => {
            player.playMovie(id, { autoplay: true, lang: 'it' });
          });
        }
        
        const favBtn = detailsContent.querySelector('[data-action="toggle-favorite"]');
        const watchlistBtn = detailsContent.querySelector('[data-action="toggle-watchlist"]');
        
        if (favBtn) {
          favBtn.addEventListener("click", () => {
            toggleCollection("favorites", normalized);
          });
        }
        if (watchlistBtn) {
          watchlistBtn.addEventListener("click", () => {
            toggleCollection("watchlist", normalized);
          });
        }
        
        const shareBtn = detailsContent.querySelector('.share-btn');
        if (shareBtn) {
          const shareUrl = shareBtn.getAttribute('data-url');
          const shareTitle = shareBtn.getAttribute('data-title');
          shareBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            shareContent(shareUrl, shareTitle);
          });
        }
        
        const closeBtn = document.getElementById('closeDetailsBtn');
        if (closeBtn) {
          const newCloseBtn = closeBtn.cloneNode(true);
          closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
          newCloseBtn.onclick = () => detailsDialog.close();
        }
      }
    } catch (error) {
      console.error('Error loading direct link:', error);
      showNotification(`❌ Errore: ${error.message}`, 'error');
    }
  }
}

function showNotification(message, type) {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let icon = '';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '✗';
  else icon = 'ℹ';
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${escapeHtml(message)}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  notification.style.animation = 'slideIn 0.3s ease forwards';
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

function updateMetaTags(details, item, type) {
  const title = item.title;
  const overview = item.overview || "Nessuna descrizione disponibile.";
  const posterPath = posterUrl(details.poster_path) || backdropUrl(details.backdrop_path) || "";
  const rating = details.vote_average || item.vote_average || 0;
  const year = item.year || (details.release_date || details.first_air_date || "").slice(0, 4);
  const mediaType = type === "movie" ? "Film" : "Serie TV";
  
  const metaTags = {
    'og:title': `${title} - disinfecting.kidnap.lol`,
    'og:description': `${mediaType} • ${year} • ⭐ ${rating.toFixed(1)}/10\n${overview.slice(0, 200)}${overview.length > 200 ? '...' : ''}`,
    'og:image': posterPath,
    'og:url': `https://disinfecting.kidnap.lol/?${type}=${item.id}`,
    'og:type': 'video.movie',
    'og:site_name': 'disinfecting.kidnap.lol',
    'twitter:card': 'summary_large_image',
    'twitter:title': `${title} - disinfecting.kidnap.lol`,
    'twitter:description': `${mediaType} • ${year} • ⭐ ${rating.toFixed(1)}/10\n${overview.slice(0, 200)}${overview.length > 200 ? '...' : ''}`,
    'twitter:image': posterPath,
    'description': `${title} - ${mediaType} del ${year}. Guarda in streaming gratuito. Voto: ${rating.toFixed(1)}/10. ${overview.slice(0, 160)}`,
    'keywords': `${title}, ${mediaType}, streaming, film, serie TV, guarda gratis, ${year}`
  };
  
  for (const [property, content] of Object.entries(metaTags)) {
    if (!content) continue;
    
    let meta = document.querySelector(`meta[property="${property}"]`) || 
               document.querySelector(`meta[name="${property}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (property.startsWith('og:')) {
        meta.setAttribute('property', property);
      } else {
        meta.setAttribute('name', property);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  }
  
  document.title = `${title} - disinfecting.kidnap.lol | Streaming Gratuito`;
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type === "movie" ? "Movie" : "TVSeries",
    "name": title,
    "description": overview,
    "image": posterPath,
    "url": `https://disinfecting.kidnap.lol/?${type}=${item.id}`,
    "datePublished": details.release_date || details.first_air_date,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": rating,
      "bestRating": "10",
      "worstRating": "0",
      "ratingCount": details.vote_count || 0
    }
  };
  
  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd, null, 2);
}

function toggleCollection(listName, item) {
  const key = `${item.media_type}:${item.id}`;
  let favorites = JSON.parse(localStorage.getItem('disinfecting_favorites') || '[]');
  let watchlist = JSON.parse(localStorage.getItem('disinfecting_watchlist') || '[]');
  
  if (listName === 'favorites') {
    const existingIndex = favorites.findIndex(entry => entry.key === key);
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
    } else {
      favorites.unshift({ ...item, key });
    }
    localStorage.setItem('disinfecting_favorites', JSON.stringify(favorites));
  } else {
    const existingIndex = watchlist.findIndex(entry => entry.key === key);
    if (existingIndex >= 0) {
      watchlist.splice(existingIndex, 1);
    } else {
      watchlist.unshift({ ...item, key });
    }
    localStorage.setItem('disinfecting_watchlist', JSON.stringify(watchlist));
  }
  
  window.dispatchEvent(new CustomEvent('libraryUpdated'));
}

function copyToClipboard(text, title) {
  navigator.clipboard.writeText(text).then(() => {
    const urlParams = new URLSearchParams(text.split('?')[1]);
    const movieId = urlParams.get('movie');
    const tvId = urlParams.get('tv');
    if (movieId) {
      sessionStorage.setItem('directLinkTitle', title);
    } else if (tvId) {
      sessionStorage.setItem('directLinkTitle', title);
    }
    showNotification(`✨ Link a "${title}" copiato negli appunti!`, 'success');
  }).catch(() => {
    showNotification('❌ Errore durante la copia del link', 'error');
  });
}

async function shareContent(url, title) {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const movieId = urlParams.get('movie');
  const tvId = urlParams.get('tv');
  if (movieId) {
    sessionStorage.setItem('directLinkTitle', title);
  } else if (tvId) {
    sessionStorage.setItem('directLinkTitle', title);
  }
  
  showNotification(`📋 Preparazione link per "${title}"...`, 'info');
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `🎬 Guarda ${title} su disinfecting.kidnap.lol`,
        url: url,
      });
      showNotification(`✅ "${title}" condiviso con successo!`, 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyToClipboard(url, title);
      }
    }
  } else {
    copyToClipboard(url, title);
  }
}