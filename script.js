/**
 * TH3HUBRIS — Personal Cybersecurity Portfolio & Academic Vault
 * Responsive, Ultra-Secure, Cross-Device Native Dark Interface
 */

(function () {
  'use strict';

  // Configure PDF.js worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Academic Manuals Repository
  const PDF_VAULT = [
    {
      id: "opsec-anonymity",
      filename: "01_Advanced_OPSEC_and_Anonymity.pdf",
      url: "pdfs/01_Advanced_OPSEC_and_Anonymity.pdf",
      size: "2.4 KB",
      tag: "OPSEC & ANONYMITY",
      title: "01_Advanced_OPSEC_and_Anonymity.pdf",
      desc: "Complete operational security framework: Tor transparent TCP routing (port 9040), zero-leak isolated DNSPort (port 9053), OpenVPN failover chains, and kernel kill-switches."
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
      desc: "System and browser hardening: mitigating Mozilla DoH leaks via enterprise policies, disabling broadcast discovery, MAC cloaking, and immutable resolv.conf locks."
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
  const vaultGrid = document.getElementById('vaultGrid');
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  const vaultStats = document.getElementById('vaultStats');

  // Modal & Reader Elements
  const pdfModal = document.getElementById('pdfModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDocTitle = document.getElementById('modalDocTitle');
  const modalDownloadLink = document.getElementById('modalDownloadLink');
  const modalRawLink = document.getElementById('modalRawLink');

  const canvasViewport = document.getElementById('canvasViewport');
  const pdfCanvas = document.getElementById('pdfCanvas');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageNumberDisplay = document.getElementById('pageNumberDisplay');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');

  // Social Share Elements
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  // Clone Snippet Elements
  const copyCloneBtn = document.getElementById('copyCloneBtn');
  const copyCloneText = document.getElementById('copyCloneText');
  const cloneStatus = document.getElementById('cloneStatus');

  // Notification Toast Elements
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Reader State
  let currentPdfDoc = null;
  let activePdfItem = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.35;
  let pageRendering = false;
  let pageNumPending = null;
  let searchQuery = '';
  let toastTimer = null;

  // ============================================================================
  // RENDER ACADEMIC VAULT CARDS
  // ============================================================================
  function renderVault() {
    if (!vaultGrid) return;

    const query = searchQuery.toLowerCase().trim();
    const filtered = PDF_VAULT.filter(item => {
      if (!query) return true;
      return item.title.toLowerCase().includes(query) ||
             item.desc.toLowerCase().includes(query) ||
             item.tag.toLowerCase().includes(query) ||
             item.filename.toLowerCase().includes(query);
    });

    if (vaultStats) {
      vaultStats.textContent = `${filtered.length} of ${PDF_VAULT.length} Manuals Available`;
    }

    if (filtered.length === 0) {
      vaultGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
          <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">No manuals found matching "${searchQuery}"</p>
          <p style="font-size: 0.85rem;">Try searching for keywords like "Tor", "OPSEC", "Hardening", or "Recon".</p>
        </div>
      `;
      return;
    }

    vaultGrid.innerHTML = filtered.map(item => `
      <article class="manual-card" data-id="${item.id}">
        <div class="manual-top">
          <div class="manual-badge-row">
            <span class="cat-chip">${escapeHtml(item.tag)}</span>
            <span class="file-meta-tag">${escapeHtml(item.size)} &bull; PDF</span>
          </div>

          <h3 class="manual-heading">${escapeHtml(item.title)}</h3>
          <p class="manual-summary">${escapeHtml(item.desc)}</p>
        </div>

        <div class="manual-actions-row">
          <button type="button" class="btn-read-online" data-open="${item.id}">
            <span>⚡ Read Document</span>
          </button>
          <a href="${item.url}" download="${item.filename}" class="btn-download-pdf">
            <span>⬇ Download</span>
          </a>
        </div>
      </article>
    `).join('');

    // Attach click listeners to open reader
    vaultGrid.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-open');
        const selected = PDF_VAULT.find(p => p.id === id);
        if (selected) openReader(selected);
      });
    });
  }

  // ============================================================================
  // INTERACTIVE IN-PAGE CANVAS PDF VIEWER
  // ============================================================================
  function openReader(item) {
    activePdfItem = item;

    if (modalDocTitle) modalDocTitle.textContent = item.filename;
    if (modalDownloadLink) {
      modalDownloadLink.href = item.url;
      modalDownloadLink.setAttribute('download', item.filename);
    }
    if (modalRawLink) modalRawLink.href = item.url;

    if (pdfModal) {
      pdfModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (pdfCanvas) pdfCanvas.style.display = 'none';

    currentPage = 1;
    // Adapt default scale to viewport width
    const screenWidth = window.innerWidth;
    if (screenWidth < 640) {
      currentScale = 0.85;
    } else if (screenWidth < 1024) {
      currentScale = 1.1;
    } else {
      currentScale = 1.35;
    }
    updateZoomDisplay();

    if (window.pdfjsLib) {
      pdfjsLib.getDocument(item.url).promise.then(pdfDoc_ => {
        currentPdfDoc = pdfDoc_;
        totalPages = currentPdfDoc.numPages;
        renderCanvasPage(currentPage);
      }).catch(err => {
        console.warn('PDF.js render failed, falling back to embedded viewer:', err);
        renderFallbackViewer(item.url);
      });
    } else {
      renderFallbackViewer(item.url);
    }
  }

  function renderCanvasPage(num) {
    if (!currentPdfDoc || !pdfCanvas) return;

    pageRendering = true;
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    currentPdfDoc.getPage(num).then(page => {
      // Calculate high-DPI resolution for ultra-sharp text
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

  function renderFallbackViewer(url) {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
    const wrapper = document.querySelector('.canvas-centering-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 2rem 1rem;">
          <iframe src="${url}" style="width: 100%; height: 70vh; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #ffffff;" title="PDF Manual"></iframe>
          <p style="margin-top: 1rem;">
            <a href="${url}" download class="btn-download-action" style="display: inline-block;">⬇ Direct Download PDF</a>
          </p>
        </div>
      `;
    }
  }

  function closeReader() {
    if (pdfModal) pdfModal.classList.add('hidden');
    document.body.style.overflow = '';
    currentPdfDoc = null;
    activePdfItem = null;

    // Reset canvas container if fallback was injected
    const wrapper = document.querySelector('.canvas-centering-wrapper');
    if (wrapper && !document.getElementById('pdfCanvas')) {
      wrapper.innerHTML = `<canvas id="pdfCanvas"></canvas>`;
    }
  }

  function updateZoomDisplay() {
    if (zoomLevelDisplay) {
      zoomLevelDisplay.textContent = `${Math.round((currentScale / 1.35) * 100)}%`;
    }
  }

  // ============================================================================
  // SOCIAL SHARE BUILDERS
  // ============================================================================
  function getShareInfo() {
    if (!activePdfItem) {
      return {
        title: 'TH3HUBRIS — Cybersecurity Engineer & Ethical Hacker',
        url: window.location.href
      };
    }
    const title = `${activePdfItem.title} | TH3HUBRIS Academic Vault`;
    const fileUrl = new URL(activePdfItem.url, window.location.href).href;
    return { title, url: fileUrl };
  }

  function shareWhatsAppHandler() {
    const { title, url } = getShareInfo();
    const text = `🛡️ ${title}\nRead technical manual: ${url}`;
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
  // CLIPBOARD & TOAST SYSTEM
  // ============================================================================
  function showToast(msg) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 3200);
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
      showToast('Copied to clipboard');
    }
    document.body.removeChild(textarea);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ============================================================================
  // INITIALIZATION & EVENT LISTENERS
  // ============================================================================
  function init() {
    renderVault();

    // Search Filtering
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderVault();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        renderVault();
      });
    }

    // Modal Events
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReader);
    if (pdfModal) {
      pdfModal.addEventListener('click', (e) => {
        if (e.target === pdfModal) closeReader();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pdfModal && !pdfModal.classList.contains('hidden')) {
        closeReader();
      }
    });

    // Reader Pagination
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

    // Reader Zoom Controls
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

    // Social Share Events
    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);

    // Git Clone Button
    if (copyCloneBtn) {
      copyCloneBtn.addEventListener('click', () => {
        const cmd = 'git clone https://github.com/th3hubris/th3hubris.git';
        copyTextToClipboard(cmd, 'Git clone command copied to clipboard!');
        if (copyCloneText) copyCloneText.textContent = 'COPIED!';
        if (cloneStatus) {
          cloneStatus.textContent = '✓ git clone https://github.com/th3hubris/th3hubris.git copied!';
        }
        setTimeout(() => {
          if (copyCloneText) copyCloneText.textContent = 'COPY';
          if (cloneStatus) cloneStatus.textContent = '';
        }, 3000);
      });
    }
  }

  // Self-bootstrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
