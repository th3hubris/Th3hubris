/**
 * TH3HUBRIS — Minimalist Security Researcher Portfolio
 * Clean, lightweight, single-screen controller with Canvas PDF.js reader
 */

(function () {
  'use strict';

  // Setup PDF.js worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Academic Manuals Vault
  const PDF_VAULT = [
    {
      id: "opsec-anonymity",
      filename: "01_Advanced_OPSEC_and_Anonymity.pdf",
      url: "pdfs/01_Advanced_OPSEC_and_Anonymity.pdf",
      size: "2.4 KB",
      tag: "OPSEC",
      title: "01_Advanced_OPSEC_and_Anonymity.pdf",
      desc: "Tor transparent proxying (9040), zero-leak isolated DNS (9053), OpenVPN failover & kernel kill-switch."
    },
    {
      id: "network-pentest",
      filename: "02_Network_Penetration_Testing.pdf",
      url: "pdfs/02_Network_Penetration_Testing.pdf",
      size: "2.3 KB",
      tag: "PENTEST",
      title: "02_Network_Penetration_Testing.pdf",
      desc: "Tactical network reconnaissance, stealth port enumeration, service fingerprinting & IDS/IPS evasion."
    },
    {
      id: "kali-hardening",
      filename: "03_Kali_Linux_Hardening_Manual.pdf",
      url: "pdfs/03_Kali_Linux_Hardening_Manual.pdf",
      size: "2.3 KB",
      tag: "HARDENING",
      title: "03_Kali_Linux_Hardening_Manual.pdf",
      desc: "Browser DoH leak mitigation, network broadcast elimination, MAC cloaking & immutable resolv.conf locks."
    },
    {
      id: "redteam-ops",
      filename: "04_Red_Teaming_Offensive_Ops.pdf",
      url: "pdfs/04_Red_Teaming_Offensive_Ops.pdf",
      size: "2.2 KB",
      tag: "RED TEAM",
      title: "04_Red_Teaming_Offensive_Ops.pdf",
      desc: "Multi-hop SSH/SOCKS adversary emulation, credential harvesting, covert pivoting & anti-forensic hygiene."
    }
  ];

  // DOM Elements
  const vaultList = document.getElementById('vaultList');
  const vaultCount = document.getElementById('vaultCount');

  // Modal & Reader Elements
  const pdfModal = document.getElementById('pdfModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDocTitle = document.getElementById('modalDocTitle');
  const modalDownloadLink = document.getElementById('modalDownloadLink');
  const modalRawLink = document.getElementById('modalRawLink');

  const pdfCanvas = document.getElementById('pdfCanvas');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageNumberDisplay = document.getElementById('pageNumberDisplay');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');

  // Share Buttons
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  // Clone Snippet
  const copyCloneBtn = document.getElementById('copyCloneBtn');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // State
  let currentPdfDoc = null;
  let activePdfItem = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.35;
  let pageRendering = false;
  let pageNumPending = null;
  let toastTimer = null;

  // ============================================================================
  // RENDER VAULT LIST
  // ============================================================================
  function renderVault() {
    if (!vaultList) return;

    if (vaultCount) {
      vaultCount.textContent = `${PDF_VAULT.length} Manuals`;
    }

    vaultList.innerHTML = PDF_VAULT.map(item => `
      <li class="list-item" data-id="${item.id}">
        <div class="item-info">
          <a href="#" class="link-underlined title-link" data-open="${item.id}">
            ${escapeHtml(item.title)}
          </a>
          <span class="item-desc">${escapeHtml(item.desc)}</span>
        </div>
        <div class="item-actions">
          <button type="button" class="btn-inline-action" data-open="${item.id}" title="Read in interactive canvas reader">
            read
          </button>
          <a href="${item.url}" download="${item.filename}" class="btn-inline-download" title="Download direct PDF file">
            pdf
          </a>
        </div>
      </li>
    `).join('');

    // Attach listeners
    vaultList.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.getAttribute('data-open');
        const selected = PDF_VAULT.find(p => p.id === id);
        if (selected) openReader(selected);
      });
    });
  }

  // ============================================================================
  // IN-PAGE CANVAS READER (PDF.JS)
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
        console.warn('PDF.js render failed, invoking fallback:', err);
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
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 1.5rem;">
          <iframe src="${url}" style="width: 100%; height: 70vh; border: none; background: #ffffff;" title="PDF Manual"></iframe>
          <p style="margin-top: 1rem;">
            <a href="${url}" download class="btn-action-primary">⬇ Direct Download PDF</a>
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

    const wrapper = document.querySelector('.canvas-wrapper');
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
  // SOCIAL SHARING
  // ============================================================================
  function getShareInfo() {
    if (!activePdfItem) {
      return {
        title: 'TH3HUBRIS — Cybersecurity Engineer & Ethical Hacker',
        url: window.location.href
      };
    }
    const title = `${activePdfItem.title} | TH3HUBRIS Research`;
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
    const tweet = `Check out "${title}" by @th3hubris #Cybersecurity #BugBounty`;
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
      showToast('Copied');
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
  // INITIALIZATION
  // ============================================================================
  function init() {
    renderVault();

    // Modal listeners
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

    // Reader controls
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

    // Share listeners
    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);

    // Quick clone
    if (copyCloneBtn) {
      copyCloneBtn.addEventListener('click', () => {
        const cmd = 'git clone https://github.com/th3hubris/th3hubris.git';
        copyTextToClipboard(cmd, 'Clone command copied!');
        copyCloneBtn.textContent = 'COPIED';
        setTimeout(() => { copyCloneBtn.textContent = 'COPY'; }, 2500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
