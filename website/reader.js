/**
 * TH3HUBRIS — Document Canvas Reader (PDF.js)
 * Clean, dedicated reader for research publications
 */

(function () {
  'use strict';

  const canvasEl = document.getElementById('pdfCanvas');
  const PDF_URL = (canvasEl && canvasEl.getAttribute('data-pdf-url')) || 'pdfs/Network_Fundamentals_For_Cybersecurity.pdf';
  const DOC_TITLE = (canvasEl && canvasEl.getAttribute('data-doc-title')) || 'أساسيات الشبكات للأمن السيبراني.pdf';

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageNumberDisplay = document.getElementById('pageNumberDisplay');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');

  const pdfCanvas = document.getElementById('pdfCanvas');
  const loadingSpinner = document.getElementById('loadingSpinner');

  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  let currentPdfDoc = null;
  let currentPage = 1;
  let totalPages = 1;
  let currentScale = 1.35;
  let pageRendering = false;
  let pageNumPending = null;
  let toastTimer = null;

  function init() {
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
      pdfjsLib.getDocument(PDF_URL).promise.then(doc => {
        currentPdfDoc = doc;
        totalPages = doc.numPages;
        renderCanvasPage(currentPage);
      }).catch(err => {
        console.warn('PDF.js render failed, fallback:', err);
        renderFallback();
      });
    } else {
      renderFallback();
    }

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

    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);
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
      }).catch(() => {
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

  function renderFallback() {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
    const box = document.querySelector('.canvas-centering-box');
    if (box) {
      box.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 1.5rem;">
          <iframe src="${PDF_URL}" style="width: 100%; height: 70vh; border: none; background: #fff;" title="${DOC_TITLE}"></iframe>
          <p style="margin-top: 1rem;">
            <a href="${PDF_URL}" download="${DOC_TITLE}" class="btn-strip-download">⬇ Direct Download PDF</a>
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

  function shareWhatsAppHandler() {
    const text = `🛡️ ${DOC_TITLE} | TH3HUBRIS: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareLinkedInHandler() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener,noreferrer,width=650,height=600');
  }

  function shareXHandler() {
    const tweet = `Check out "${DOC_TITLE}" by @th3hubris #SecurityResearch #Cybersecurity`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener,noreferrer,width=650,height=500');
  }

  function shareTelegramHandler() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(DOC_TITLE)}`, '_blank', 'noopener,noreferrer');
  }

  function copyLinkHandler() {
    copyText(window.location.href, 'Link copied to clipboard!');
  }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
