/**
 * TH3HUBRIS — Security Researcher Portfolio Controller
 * Seamless switching between Home and Document view (exact hx01.me flow)
 */

(function () {
  'use strict';

  // Configure PDF.js worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Publication Manuals Database
  const PUBLICATIONS = [
    {
      id: "opsec-anonymity",
      filename: "01_Advanced_OPSEC_and_Anonymity.pdf",
      url: "pdfs/01_Advanced_OPSEC_and_Anonymity.pdf",
      title: "01_Advanced_OPSEC_and_Anonymity.pdf",
      subtitle: "Tor Transparent Proxying (9040), Isolated DNS (9053) & Linux Kernel Kill-Switch",
      command: "cat /th3hubris/01_Advanced_OPSEC_and_Anonymity.md"
    },
    {
      id: "network-pentest",
      filename: "02_Network_Penetration_Testing.pdf",
      url: "pdfs/02_Network_Penetration_Testing.pdf",
      title: "02_Network_Penetration_Testing.pdf",
      subtitle: "Tactical Network Reconnaissance, Stealth Port Scanning & Modern IDS/IPS Evasion",
      command: "cat /th3hubris/02_Network_Penetration_Testing.md"
    },
    {
      id: "kali-hardening",
      filename: "03_Kali_Linux_Hardening_Manual.pdf",
      url: "pdfs/03_Kali_Linux_Hardening_Manual.pdf",
      title: "03_Kali_Linux_Hardening_Manual.pdf",
      subtitle: "Browser DoH Leak Mitigation, Broadcast Silencing, MAC Cloaking & Immutable Resolv.conf",
      command: "cat /th3hubris/03_Kali_Linux_Hardening_Manual.md"
    },
    {
      id: "redteam-ops",
      filename: "04_Red_Teaming_Offensive_Ops.pdf",
      url: "pdfs/04_Red_Teaming_Offensive_Ops.pdf",
      title: "04_Red_Teaming_Offensive_Ops.pdf",
      subtitle: "Adversary Emulation, Multi-Hop SSH/SOCKS Proxy Chains & Anti-Forensic Evasion",
      command: "cat /th3hubris/04_Red_Teaming_Offensive_Ops.md"
    }
  ];

  // DOM Views
  const homeView = document.getElementById('homeView');
  const docView = document.getElementById('docView');

  // Document View Header Elements
  const activeDocCommand = document.getElementById('activeDocCommand');
  const activeDocHeadline = document.getElementById('activeDocHeadline');
  const activeDocSubhead = document.getElementById('activeDocSubhead');
  const homeBtn = document.getElementById('homeBtn');
  const bottomHomeBtn = document.getElementById('bottomHomeBtn');

  // Reader Controls
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageNumberDisplay = document.getElementById('pageNumberDisplay');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');
  const downloadDocBtn = document.getElementById('downloadDocBtn');
  const rawDocBtn = document.getElementById('rawDocBtn');

  // Canvas & Spinner
  const pdfCanvas = document.getElementById('pdfCanvas');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Social Share Buttons
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // State
  let currentPdfDoc = null;
  let activeItem = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.35;
  let pageRendering = false;
  let pageNumPending = null;
  let toastTimer = null;

  // ============================================================================
  // NAVIGATION: HOME <-> DOCUMENT VIEW
  // ============================================================================
  function showHomeView() {
    docView.classList.remove('active-view');
    docView.classList.add('hidden-view');

    homeView.classList.remove('hidden-view');
    homeView.classList.add('active-view');

    currentPdfDoc = null;
    activeItem = null;
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showDocView(item) {
    activeItem = item;

    if (activeDocCommand) activeDocCommand.textContent = item.command;
    if (activeDocHeadline) activeDocHeadline.textContent = item.title;
    if (activeDocSubhead) activeDocSubhead.textContent = item.subtitle;

    if (downloadDocBtn) {
      downloadDocBtn.href = item.url;
      downloadDocBtn.setAttribute('download', item.filename);
    }
    if (rawDocBtn) rawDocBtn.href = item.url;

    homeView.classList.remove('active-view');
    homeView.classList.add('hidden-view');

    docView.classList.remove('hidden-view');
    docView.classList.add('active-view');

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Load PDF
    loadPdfDocument(item.url);
  }

  // ============================================================================
  // PDF.JS CANVAS READER
  // ============================================================================
  function loadPdfDocument(url) {
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (pdfCanvas) pdfCanvas.style.display = 'none';

    currentPage = 1;
    const width = window.innerWidth;
    if (width < 640) {
      currentScale = 0.85;
    } else if (width < 1024) {
      currentScale = 1.1;
    } else {
      currentScale = 1.35;
    }
    updateZoomDisplay();

    if (window.pdfjsLib) {
      pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
        currentPdfDoc = pdfDoc_;
        totalPages = currentPdfDoc.numPages;
        renderCanvasPage(currentPage);
      }).catch(err => {
        console.warn('PDF.js loading failed, falling back:', err);
        renderFallback(url);
      });
    } else {
      renderFallback(url);
    }
  }

  function renderCanvasPage(num) {
    if (!currentPdfDoc || !pdfCanvas) return;

    pageRendering = true;
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    currentPdfDoc.getPage(num).then(page => {
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: currentScale });
      const context = pdfCanvas.getContext('2d');

      pdfCanvas.width = Math.floor(viewport.width * dpr);
      pdfCanvas.height = Math.floor(viewport.height * dpr);
      pdfCanvas.style.width = `${Math.floor(viewport.width)}px`;
      pdfCanvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);

      renderTask.promise.then(() => {
        pageRendering = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        pdfCanvas.style.display = 'block';

        if (pageNumberDisplay) {
          pageNumberDisplay.textContent = `Page ${num} / ${totalPages}`;
        }

        if (pageNumPending !== null) {
          renderCanvasPage(pageNumPending);
          pageNumPending = null;
        }
      }).catch(err => {
        pageRendering = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
      });
    });

    if (prevPageBtn) prevPageBtn.disabled = num <= 1;
    if (nextPageBtn) nextPageBtn.disabled = num >= totalPages;
  }

  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderCanvasPage(num);
    }
  }

  function renderFallback(url) {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
    const box = document.querySelector('.canvas-centering-box');
    if (box) {
      box.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 1.5rem;">
          <iframe src="${url}" style="width: 100%; height: 70vh; border: none; background: #fff;" title="Document"></iframe>
          <p style="margin-top: 1rem;">
            <a href="${url}" download class="btn-strip-download">⬇ Direct Download PDF</a>
          </p>
        </div>
      `;
    }
  }

  function updateZoomDisplay() {
    if (zoomLevelDisplay) {
      zoomLevelDisplay.textContent = `${Math.round((currentScale / 1.35) * 100)}%`;
    }
  }

  // ============================================================================
  // SOCIAL SHARE
  // ============================================================================
  function getShareDetails() {
    if (!activeItem) {
      return {
        title: 'TH3HUBRIS — Security Researcher',
        url: window.location.href
      };
    }
    const title = `${activeItem.title} | TH3HUBRIS Research`;
    const fullUrl = new URL(activeItem.url, window.location.href).href;
    return { title, url: fullUrl };
  }

  function shareWhatsAppHandler() {
    const { title, url } = getShareDetails();
    const text = `🛡️ ${title}\nRead paper: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareLinkedInHandler() {
    const { url } = getShareDetails();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=650,height=600');
  }

  function shareXHandler() {
    const { title, url } = getShareDetails();
    const tweet = `Check out "${title}" by @th3hubris #SecurityResearch #BugBounty`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=650,height=500');
  }

  function shareTelegramHandler() {
    const { title, url } = getShareDetails();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
  }

  function copyLinkHandler() {
    const { url } = getShareDetails();
    copyText(url, 'Document link copied to clipboard!');
  }

  // ============================================================================
  // TOAST & CLIPBOARD
  // ============================================================================
  function showToast(msg) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2800);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (e) {
      showToast('Copied');
    }
    document.body.removeChild(textarea);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  function init() {
    // Publication triggers
    document.querySelectorAll('.pub-trigger').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('data-id');
        const item = PUBLICATIONS.find(p => p.id === id);
        if (item) {
          window.location.hash = item.id;
          showDocView(item);
        }
      });
    });

    // Navigation buttons
    if (homeBtn) homeBtn.addEventListener('click', showHomeView);
    if (bottomHomeBtn) bottomHomeBtn.addEventListener('click', showHomeView);

    // Pagination
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (currentPage <= 1) return;
        currentPage--;
        queueRenderPage(currentPage);
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        if (currentPage >= totalPages) return;
        currentPage++;
        queueRenderPage(currentPage);
      });
    }

    // Zoom
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (currentScale >= 2.5) return;
        currentScale += 0.2;
        updateZoomDisplay();
        if (currentPdfDoc) queueRenderPage(currentPage);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (currentScale <= 0.6) return;
        currentScale -= 0.2;
        updateZoomDisplay();
        if (currentPdfDoc) queueRenderPage(currentPage);
      });
    }

    // Shares
    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);

    // Hash change detection (supports back/forward buttons)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        showHomeView();
      } else {
        const item = PUBLICATIONS.find(p => p.id === hash);
        if (item) showDocView(item);
      }
    });

    // Check initial hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
      const item = PUBLICATIONS.find(p => p.id === initialHash);
      if (item) showDocView(item);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
