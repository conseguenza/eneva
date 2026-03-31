import { TMDB_REGION } from "./config.js";

export class VideoPlayer {
  constructor() {
    this.playerWindow = null;
    this.eventHandlers = new Map();
  }

  playMovie(tmdbId, options = {}) {
    const defaultOptions = {
      autoplay: true,
      primaryColor: "88a7ff",
      secondaryColor: "b47dff",
      lang: "it",
      ...options
    };
    const url = this.buildMovieUrl(tmdbId, defaultOptions);
    this.openPlayer(url, 'movie', tmdbId);
  }

  playEpisode(tmdbId, season, episode, options = {}) {
    const defaultOptions = {
      autoplay: true,
      primaryColor: "88a7ff",
      secondaryColor: "b47dff",
      lang: "it",
      ...options
    };
    const url = this.buildEpisodeUrl(tmdbId, season, episode, defaultOptions);
    this.openPlayer(url, 'episode', { tmdbId, season, episode });
  }

  buildMovieUrl(tmdbId, options = {}) {
    const params = this.buildParams(options);
    return `https://vixsrc.to/movie/${tmdbId}${params}`;
  }

  buildEpisodeUrl(tmdbId, season, episode, options = {}) {
    const params = this.buildParams(options);
    return `https://vixsrc.to/tv/${tmdbId}/${season}/${episode}${params}`;
  }

  buildParams(options) {
    const params = [];
    
    if (options.primaryColor) {
      params.push(`primaryColor=${options.primaryColor.replace('#', '')}`);
    }
    if (options.secondaryColor) {
      params.push(`secondaryColor=${options.secondaryColor.replace('#', '')}`);
    }
    if (options.autoplay !== undefined) {
      params.push(`autoplay=${options.autoplay}`);
    }
    if (options.startAt) {
      params.push(`startAt=${options.startAt}`);
    }
    if (options.lang) {
      params.push(`lang=${options.lang}`);
    }
    
    return params.length ? `?${params.join('&')}` : '';
  }

  openPlayer(url, type, data) {
    let playerModal = document.getElementById('playerModal');
    
    if (!playerModal) {
      playerModal = this.createPlayerModal();
      document.body.appendChild(playerModal);
    }
    
    const iframe = playerModal.querySelector('#playerFrame');
    const statusElement = playerModal.querySelector('.player-status');
    
    iframe.src = url;
    statusElement.textContent = 'Caricamento player...';
    
    playerModal.showModal();
    
    const closeBtn = playerModal.querySelector('.player-close');
    const newCloseHandler = () => {
      iframe.src = '';
      playerModal.close();
      statusElement.textContent = 'Player chiuso';
    };
    
    closeBtn.onclick = newCloseHandler;
    
    playerModal.addEventListener('click', (e) => {
      if (e.target === playerModal) {
        iframe.src = '';
        playerModal.close();
        statusElement.textContent = 'Player chiuso';
      }
    });
    
    this.setupEventListening(iframe, statusElement);
  }

  createPlayerModal() {
    const modal = document.createElement('dialog');
    modal.id = 'playerModal';
    modal.className = 'modal player-modal';
    
    modal.innerHTML = `
      <div class="modal-shell glass player-modal-shell">
        <button class="modal-close player-close" aria-label="Chiudi player">×</button>
        <div class="player-container">
          <iframe
            id="playerFrame"
            class="player-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
            referrerpolicy="origin"
          ></iframe>
        </div>
        <div class="player-events-panel">
          <div class="player-controls-info">
            <span class="player-status">Pronto per riprodurre</span>
          </div>
        </div>
      </div>
    `;
    
    return modal;
  }

  setupEventListening(iframe, statusElement) {
    const messageHandler = (event) => {
      if (!event.origin.includes('vixsrc.to')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'PLAYER_EVENT') {
          this.handlePlayerEvent(data.data, statusElement);
        }
      } catch (e) {
      }
    };
    
    window.removeEventListener('message', this._messageHandler);
    this._messageHandler = messageHandler;
    window.addEventListener('message', messageHandler);
  }

  handlePlayerEvent(eventData, statusElement) {
    if (!statusElement) return;
    
    switch (eventData.event) {
      case 'play':
        statusElement.textContent = '▶ In riproduzione';
        statusElement.style.color = '#69e5ae';
        break;
      case 'pause':
        statusElement.textContent = '⏸ In pausa';
        statusElement.style.color = '#aeb8d0';
        break;
      case 'seeked':
        statusElement.textContent = `⏩ Saltato a ${Math.floor(eventData.currentTime)}s`;
        setTimeout(() => {
          if (statusElement.textContent.includes('Saltato')) {
            statusElement.textContent = '▶ In riproduzione';
          }
        }, 2000);
        break;
      case 'ended':
        statusElement.textContent = '✓ Riproduzione terminata';
        statusElement.style.color = '#88a7ff';
        break;
      case 'timeupdate':
        break;
    }
    
    window.dispatchEvent(new CustomEvent('playerEvent', { detail: eventData }));
  }
}

export async function fetchCatalog(type, lang = "it") {
  try {
    let url = `https://vixsrc.to/api/list/${type}`;
    if (lang) {
      url += `?lang=${lang}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Catalog fetch failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return null;
  }
}

export const player = new VideoPlayer();