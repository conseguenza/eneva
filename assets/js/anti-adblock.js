class AntiAdblock {
  constructor() {
    this.adblockDetected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.init();
  }

  init() {
    this.detectAdblock();
    this.setupEventListeners();
    this.protectAdContainers();
  }

  detectAdblock() {
    // Method 1: Test ad div visibility
    const testAd = document.createElement('div');
    testAd.className = 'pub_300x250 pub_300x250m pub_300x250m';
    testAd.id = 'test-ad-div';
    testAd.style.cssText = 'position:absolute;top:-1000px;left:-1000px;width:1px;height:1px';
    testAd.innerHTML = '&nbsp;';
    document.body.appendChild(testAd);
    
    setTimeout(() => {
      const isHidden = testAd.offsetHeight === 0 || 
                       testAd.style.display === 'none' ||
                       getComputedStyle(testAd).display === 'none';
      
      if (isHidden) {
        this.adblockDetected = true;
        this.handleAdblockDetected();
      }
      testAd.remove();
    }, 100);

    // Method 2: Test Adsterra script loading
    this.testAdsterraLoading();
  }

  testAdsterraLoading() {
    // Check if Adsterra scripts are blocked
    const adsterraScripts = document.querySelectorAll('script[src*="profitablecpmratenetwork"]');
    
    setTimeout(() => {
      if (adsterraScripts.length === 0) {
        this.adblockDetected = true;
        this.handleAdblockDetected();
      }
    }, 500);
  }

  setupEventListeners() {
    // Monitor for DOM changes that might hide ads
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.id && (target.id.includes('container-') || target.id.includes('ad'))) {
            if (target.style.display === 'none' || target.style.visibility === 'hidden') {
              this.adblockDetected = true;
              this.handleAdblockDetected();
            }
          }
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'display', 'visibility', 'class']
    });
  }

  protectAdContainers() {
    // Monitor ad containers and restore if removed
    const adContainerIds = [
      'container-87588cc01b23bec81f34bb7f3dd9718b'
    ];
    
    setInterval(() => {
      adContainerIds.forEach(id => {
        const container = document.getElementById(id);
        if (!container && !this.adblockDetected) {
          this.adblockDetected = true;
          this.handleAdblockDetected();
        }
      });
    }, 1000);
  }

  handleAdblockDetected() {
    if (this.retryCount >= this.maxRetries) {
      this.showBlockingMessage();
      return;
    }
    
    this.retryCount++;
    this.showWarningMessage();
    this.attemptBypass();
  }

  showWarningMessage() {
    // Remove existing warning
    const existingWarning = document.getElementById('adblock-warning');
    if (existingWarning) existingWarning.remove();
    
    const warning = document.createElement('div');
    warning.id = 'adblock-warning';
    warning.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        max-width: 450px;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-left: 4px solid #ff6a91;
        border-radius: 12px;
        padding: 15px 20px;
        z-index: 999999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideUp 0.3s ease;
        backdrop-filter: blur(10px);
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 28px;">⚠️</div>
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #ff6a91; margin-bottom: 5px;">
              AdBlocker Rilevato!
            </div>
            <div style="font-size: 12px; color: #aeb8d0; line-height: 1.4;">
              disinfecting.kidnap.lol è gratuito grazie alla pubblicità. 
              Per favore, disabilita il tuo adblocker o aggiungi il sito alla whitelist.
            </div>
          </div>
          <button onclick="this.closest('#adblock-warning').remove()" style="
            background: transparent;
            border: none;
            color: #aeb8d0;
            font-size: 20px;
            cursor: pointer;
            padding: 0 5px;
          ">✕</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
      if (warning && warning.parentNode) warning.remove();
    }, 8000);
  }

  showBlockingMessage() {
    // Remove any existing overlay
    const existingOverlay = document.getElementById('adblock-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'adblock-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.95);
        backdrop-filter: blur(20px);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', sans-serif;
      ">
        <div style="
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          padding: 40px;
          border-radius: 28px;
          max-width: 500px;
          text-align: center;
          border: 1px solid rgba(136,167,255,0.2);
          margin: 20px;
        ">
          <div style="font-size: 64px; margin-bottom: 20px;">🛡️</div>
          <h2 style="color: #ff6a91; margin-bottom: 15px;">AdBlocker Rilevato</h2>
          <p style="color: #aeb8d0; margin-bottom: 20px; line-height: 1.6;">
            Il sito <strong style="color: #88a7ff;">disinfecting.kidnap.lol</strong> è completamente gratuito.<br>
            La pubblicità è l'unico modo che abbiamo per mantenere il servizio attivo.
          </p>
          <div style="background: rgba(136,167,255,0.1); padding: 15px; border-radius: 16px; margin-bottom: 25px;">
            <p style="color: #88a7ff; font-size: 14px; margin: 0;">
              💡 Come supportarci:
            </p>
            <p style="color: #aeb8d0; font-size: 12px; margin: 8px 0 0 0;">
              Disabilita l'adblocker o aggiungi <strong>disinfecting.kidnap.lol</strong> alla whitelist
            </p>
          </div>
          <button id="reload-site-btn" style="
            background: linear-gradient(135deg, #88a7ff, #b47dff);
            color: white;
            border: none;
            padding: 12px 28px;
            border-radius: 30px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            margin-right: 10px;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            🔄 Ricarica la pagina
          </button>
          <button id="continue-btn" style="
            background: transparent;
            color: #aeb8d0;
            border: 1px solid #aeb8d0;
            padding: 12px 28px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
            Continua senza supportare
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('reload-site-btn')?.addEventListener('click', () => {
      window.location.reload();
    });
    
    document.getElementById('continue-btn')?.addEventListener('click', () => {
      overlay.remove();
      this.retryCount = 0;
    });
  }

  attemptBypass() {
    // Try to reload ads if they were blocked
    this.reloadAdsterraScripts();
    this.recreateAdContainers();
  }

  reloadAdsterraScripts() {
    // Re-add Adsterra scripts if missing
    const existingPopunder = document.querySelector('script[src*="pl29023757"]');
    if (!existingPopunder) {
      const popunderScript = document.createElement('script');
      popunderScript.src = 'https://pl29023757.profitablecpmratenetwork.com/2e/de/a3/2edea3a97767f08bb199ee877d1651ae.js';
      document.head.appendChild(popunderScript);
    }
    
    const existingNative = document.querySelector('script[src*="pl29023758"]');
    if (!existingNative) {
      const nativeScript = document.createElement('script');
      nativeScript.src = 'https://pl29023758.profitablecpmratenetwork.com/87588cc01b23bec81f34bb7f3dd9718b/invoke.js';
      nativeScript.async = true;
      nativeScript.setAttribute('data-cfasync', 'false');
      document.body.appendChild(nativeScript);
    }
  }

  recreateAdContainers() {
    // Recreate native ad container if missing
    const container = document.getElementById('container-87588cc01b23bec81f34bb7f3dd9718b');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'container-87588cc01b23bec81f34bb7f3dd9718b';
      newContainer.style.textAlign = 'center';
      newContainer.style.margin = '20px 0';
      
      const heroSection = document.querySelector('.hero-panel');
      const mySpace = document.getElementById('my-space');
      
      if (heroSection && mySpace) {
        heroSection.parentNode.insertBefore(newContainer, mySpace);
      }
    }
  }
}

// Add animation styles if not present
if (!document.querySelector('#antiadblock-styles')) {
  const style = document.createElement('style');
  style.id = 'antiadblock-styles';
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize anti-adblock when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.antiAdblock = new AntiAdblock();
});

export const antiAdblock = window.antiAdblock;
