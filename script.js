/**
 * TH3HUBRIS — Interactive Personal Cybersecurity Portal
 * Features: Guaranteed In-Page PDF.js Canvas Reader, Real-Time Grep Filter, Social Share
 */

(function () {
  'use strict';

  // Setup PDF.js worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // PDF Modules Repository
  const PDF_VAULT = [
    {
      id: "opsec-anonymity",
      filename: "01_Advanced_OPSEC_and_Anonymity.pdf",
      url: "pdfs/01_Advanced_OPSEC_and_Anonymity.pdf",
      size: "2.4 KB",
      tag: "OPSEC & ANONYMITY",
      title: "01_Advanced_OPSEC_and_Anonymity.pdf",
      desc: "Complete operational security framework: Tor transparent TCP routing (9040), isolated DNSPort (9053), OpenVPN failover chains, and Linux kernel firewall kill-switches."
    },
    {
      id: "network-pentest",
      filename: "02_Network_Penetration_Testing.pdf",
      url: "pdfs/02_Network_Penetration_Testing.pdf",
      size: "2.3 KB",
      tag: "PENTESTING & RECON",
      title: "02_Network_Penetration_Testing.pdf",
      desc: "Tactical methodology for stealth network scanning, port enumeration, banner grabbing, service fingerprinting, and modern IDS/IPS evasion strategies."
    },
    {
      id: "kali-hardening",
      filename: "03_Kali_Linux_Hardening_Manual.pdf",
      url: "pdfs/03_Kali_Linux_Hardening_Manual.pdf",
      size: "2.3 KB",
      tag: "SYSTEM HARDENING",
      title: "03_Kali_Linux_Hardening_Manual.pdf",
      desc: "System and browser hardening: mitigating Mozilla DoH leaks via enterprise policies, disabling broadcast services, MAC cloaking, and immutable resolv.conf locks."
    },
    {
      id: "redteam-ops",
      filename: "04_Red_Teaming_Offensive_Ops.pdf",
      url: "pdfs/04_Red_Teaming_Offensive_Ops.pdf",
      size: "2.2 KB",
      tag: "RED TEAM OPS",
      title: "04_Red_Teaming_Offensive_Ops.pdf",
      desc: "Adversary emulation: covert pivoting via multi-hop SSH/SOCKS proxy chains, credential harvesting, lateral movement, and counter-forensic evasion tactics."
    }
  ];

  // DOM Elements
  const docsList = document.getElementById('docsList');
  const vaultSearch = document.getElementById('vaultSearch');
  const clearSearch = document.getElementById('clearSearch');
  const vaultCounter = document.getElementById('vaultCounter');

  // Modal & Reader Elements
  const pdfModal = document.getElementById('pdfModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalFileName = document.getElementById('modalFileName');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const modalRawBtn = document.getElementById('modalRawBtn');

  const pdfCanvas = document.getElementById('pdfCanvas');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevel = document.getElementById('zoomLevel');

  // Social Share Elements
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  // Copy Clone Snippet
  const copyCloneBtn = document.getElementById('copyCloneBtn');
  const cloneFeedback = document.getElementById('cloneFeedback');
  const cyberToast = document.getElementById('cyberToast');
  const toastMsg = document.getElementById('toastMsg');

  // Reader State
  let currentPdfDoc = null;
  let activePdfItem = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.35;
  let pageRendering = false;
  let pageNumPending = null;
  let searchQuery = '';

  // ============================================================================
  // RENDER DOCUMENT VAULT LIST
  // ============================================================================
  function renderVault() {
    if (!docsList) return;

    const filtered = PDF_VAULT.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return item.title.toLowerCase().includes(q) ||
             item.desc.toLowerCase().includes(q) ||
             item.tag.toLowerCase().includes(q) ||
             item.filename.toLowerCase().includes(q);
    });

    if (vaultCounter) {
      vaultCounter.textContent = `${filtered.length} of ${PDF_VAULT.length} Documents`;
    }

    if (filtered.length === 0) {
      docsList.innerHTML = `
        <div class="doc-card" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          [-] No documents found matching "${searchQuery}".
        </div>
      `;
      return;
    }

    docsList.innerHTML = filtered.map(item => `
      <article class="doc-card" data-id="${item.id}">
        <div class="doc-meta">
          <span class="doc-tag">${item.tag}</span>
          <span class="doc-size">${item.size}</span>
        </div>

        <button type="button" class="doc-title-btn cyber-link" data-open="${item.id}">
          📄 ${item.title}
        </button>

        <p class="doc-desc">${item.desc}</p>

        <div class="doc-actions">
          <button type="button" class="btn-open-viewer" data-open="${item.id}">
            <span>⚡</span> [ READ IN VIEWER ]
          </button>
          <span style="color: var(--border-subtle)">|</span>
          <a href="${item.url}" download="${item.filename}" class="link-download-direct">
            ⬇ Direct Download
          </a>
        </div>
      </article>
    `).join('');

    // Attach click listeners to open reader
    docsList.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.getAttribute('data-open');
        const selected = PDF_VAULT.find(p => p.id === id);
        if (selected) openReader(selected);
      });
    });
  }

  // ============================================================================
  // GUARANTEED IN-PAGE CANVAS PDF VIEWER
  // ============================================================================
  function openReader(item) {
    activePdfItem = item;
    modalFileName.textContent = item.filename;

    modalDownloadBtn.href = item.url;
    modalDownloadBtn.setAttribute('download', item.filename);
    modalRawBtn.href = item.url;

    pdfModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    loadingIndicator.classList.remove('hidden');
    pdfCanvas.style.display = 'none';

    currentPage = 1;
    currentScale = 1.35;
    updateZoomDisplay();

    if (window.pdfjsLib) {
      pdfjsLib.getDocument(item.url).promise.then(pdfDoc_ => {
        currentPdfDoc = pdfDoc_;
        totalPages = currentPdfDoc.numPages;
        renderCanvasPage(currentPage);
      }).catch(err => {
        console.error('PDF.js render failed, invoking fallback viewer:', err);
        renderFallbackViewer(item.url);
      });
    } else {
      renderFallbackViewer(item.url);
    }
  }

  function renderCanvasPage(num) {
    pageRendering = true;
    loadingIndicator.classList.remove('hidden');

    currentPdfDoc.getPage(num).then(page => {
      const viewport = page.getViewport({ scale: currentScale });
      const context = pdfCanvas.getContext('2d');

      pdfCanvas.height = viewport.height;
      pdfCanvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);

      renderTask.promise.then(() => {
        pageRendering = false;
        loadingIndicator.classList.add('hidden');
        pdfCanvas.style.display = 'block';

        if (pageIndicator) {
          pageIndicator.textContent = `Page ${num} / ${totalPages}`;
        }

        if (pageNumPending !== null) {
          renderCanvasPage(pageNumPending);
          pageNumPending = null;
        }
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

  function renderFallbackViewer(url) {
    loadingIndicator.classList.add('hidden');
    const container = document.querySelector('.canvas-scroll-container');
    if (container) {
      container.innerHTML = `
        <iframe src="${url}" style="width: 100%; height: 75vh; border: none; background: #fff;" allowfullscreen></iframe>
      `;
    }
  }

  function closeReader() {
    pdfModal.classList.add('hidden');
    document.body.style.overflow = '';
    currentPdfDoc = null;
    activePdfItem = null;
    const container = document.querySelector('.canvas-scroll-container');
    if (container && !document.getElementById('pdfCanvas')) {
      container.innerHTML = `<canvas id="pdfCanvas"></canvas>`;
    }
  }

  function updateZoomDisplay() {
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(currentScale * 100 / 1.35)}%`;
    }
  }

  // ============================================================================
  // SOCIAL SHARE BUILDERS
  // ============================================================================
  function getShareInfo() {
    if (!activePdfItem) return { title: 'TH3HUBRIS Cybersecurity Vault', url: window.location.href };
    const title = activePdfItem.title;
    const fileUrl = new URL(activePdfItem.url, window.location.href).href;
    return { title, url: fileUrl };
  }

  function shareWhatsAppHandler() {
    const { title, url } = getShareInfo();
    const text = `⚔️ ${title} | TH3HUBRIS Academic Vault: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareLinkedInHandler() {
    const { url } = getShareInfo();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=650,height=600');
  }

  function shareXHandler() {
    const { title, url } = getShareInfo();
    const tweet = `Check out "${title}" by @th3hubris #Cybersecurity #EthicalHacking`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=650,height=500');
  }

  function shareTelegramHandler() {
    const { title, url } = getShareInfo();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
  }

  function copyLinkHandler() {
    const { url } = getShareInfo();
    copyTextToClipboard(url, 'Document link copied to clipboard!');
  }

  // ============================================================================
  // CLIPBOARD & TOAST
  // ============================================================================
  function showToast(msg) {
    if (!cyberToast || !toastMsg) return;
    toastMsg.textContent = msg;
    cyberToast.classList.remove('hidden');
    setTimeout(() => {
      cyberToast.classList.add('hidden');
    }, 2800);
  }

  function copyTextToClipboard(text, successMsg) {
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
      showToast('Could not copy link.');
    }
    document.body.removeChild(textarea);
  }

  // ============================================================================
  // INITIALIZATION & EVENT BINDINGS
  // ============================================================================
  function init() {
    renderVault();

    // Search filter
    if (vaultSearch) {
      vaultSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderVault();
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        if (vaultSearch) vaultSearch.value = '';
        searchQuery = '';
        renderVault();
      });
    }

    // Modal controls
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReader);
    if (pdfModal) {
      pdfModal.addEventListener('click', (e) => {
        if (e.target === pdfModal) closeReader();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !pdfModal.classList.contains('hidden')) {
        closeReader();
      }
    });

    // Page navigation in reader
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

    // Zoom controls
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
        if (currentScale <= 0.8) return;
        currentScale -= 0.2;
        updateZoomDisplay();
        if (currentPdfDoc) queueRenderPage(currentPage);
      });
    }

    // Social shares
    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);

    // Git clone button
    if (copyCloneBtn) {
      copyCloneBtn.addEventListener('click', () => {
        const cmd = 'git clone https://github.com/th3hubris/th3hubris.git';
        copyTextToClipboard(cmd, 'git clone command copied!');
        if (cloneFeedback) {
          cloneFeedback.textContent = '[+] git clone command copied to clipboard!';
          setTimeout(() => { cloneFeedback.textContent = ''; }, 3000);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
