/**
 * TH3HUBRIS — Personal Cybersecurity Portfolio & Academic Vault
 * Sleek, lightweight, zero bloat, pure vanilla JavaScript
 */

(function () {
  'use strict';

  // ============================================================================
  // PDF ACADEMIC MODULES
  // To add new lessons: simply drop your PDF file in the /pdfs/ folder
  // and add an entry to this array.
  // ============================================================================
  const PDF_VAULT = [
    {
      id: "opsec-anonymity",
      filename: "01_Advanced_OPSEC_and_Anonymity.pdf",
      url: "pdfs/01_Advanced_OPSEC_and_Anonymity.pdf",
      size: "2.4 MB",
      perm: "-rw-r--r--",
      displayName: "01_Advanced_OPSEC_and_Anonymity.pdf",
      desc: "Complete operational security framework: Tor transparent TCP routing (9040), isolated DNSPort (9053), OpenVPN failover chains, and Linux kernel firewall kill-switches."
    },
    {
      id: "network-pentest",
      filename: "02_Network_Penetration_Testing.pdf",
      url: "pdfs/02_Network_Penetration_Testing.pdf",
      size: "3.1 MB",
      perm: "-rw-r--r--",
      displayName: "02_Network_Penetration_Testing.pdf",
      desc: "Tactical methodology for stealth network scanning, port enumeration, banner grabbing, service fingerprinting, and modern IDS/IPS evasion strategies."
    },
    {
      id: "kali-hardening",
      filename: "03_Kali_Linux_Hardening_Manual.pdf",
      url: "pdfs/03_Kali_Linux_Hardening_Manual.pdf",
      size: "1.8 MB",
      perm: "-rw-r--r--",
      displayName: "03_Kali_Linux_Hardening_Manual.pdf",
      desc: "System and browser hardening: mitigating Mozilla DoH leaks via enterprise policies, disabling broadcast services, MAC cloaking, and immutable resolv.conf locks."
    },
    {
      id: "redteam-ops",
      filename: "04_Red_Teaming_Offensive_Ops.pdf",
      url: "pdfs/04_Red_Teaming_Offensive_Ops.pdf",
      size: "4.5 MB",
      perm: "-rw-r--r--",
      displayName: "04_Red_Teaming_Offensive_Ops.pdf",
      desc: "Adversary emulation: covert pivoting via multi-hop SSH/SOCKS proxy chains, credential harvesting, lateral movement, and counter-forensic evasion tactics."
    }
  ];

  // DOM Elements
  const pdfFileList = document.getElementById('pdfFileList');
  const pdfSearchInput = document.getElementById('pdfSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filesCount = document.getElementById('filesCount');

  // Modal Elements
  const pdfModal = document.getElementById('pdfModal');
  const pdfFrame = document.getElementById('pdfFrame');
  const modalFileName = document.getElementById('modalFileName');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const modalExternalBtn = document.getElementById('modalExternalBtn');
  const modalCloseBtnTop = document.getElementById('modalCloseBtnTop');
  const modalCloseBtnText = document.getElementById('modalCloseBtnText');

  // Social Share Buttons
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  // Copy Clone & Toast
  const copyCloneBtn = document.getElementById('copyCloneBtn');
  const cloneMsg = document.getElementById('cloneMsg');
  const cyberToast = document.getElementById('cyberToast');
  const toastMsg = document.getElementById('toastMsg');

  let activeModalPdf = null;
  let searchQuery = '';

  // ============================================================================
  // RENDER PDF VAULT LIST
  // ============================================================================
  function renderList() {
    if (!pdfFileList) return;

    const filtered = PDF_VAULT.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return item.displayName.toLowerCase().includes(q) ||
             item.desc.toLowerCase().includes(q) ||
             item.filename.toLowerCase().includes(q);
    });

    if (filesCount) {
      filesCount.textContent = `${filtered.length} of ${PDF_VAULT.length} files`;
    }

    if (filtered.length === 0) {
      pdfFileList.innerHTML = `
        <div class="pdf-item" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          [-] No matching documents found for "${searchQuery}".
        </div>
      `;
      return;
    }

    pdfFileList.innerHTML = filtered.map(item => `
      <article class="pdf-item">
        <div class="pdf-meta">
          <span class="pdf-perm">${item.perm} <span style="color:#ffffff">[PDF]</span></span>
          <span class="pdf-size">${item.size}</span>
        </div>

        <a href="javascript:void(0)" class="pdf-title-link cyber-hover" data-open="${item.id}" title="${item.displayName}">
          📄 ${item.displayName}
        </a>

        <p class="pdf-desc">${item.desc}</p>

        <div class="pdf-actions">
          <button type="button" class="btn-view-modal cyber-hover" data-open="${item.id}">
            <span>⚡</span> [ READ IN VIEWER ]
          </button>
          <span style="color: var(--border-subtle)">|</span>
          <a href="${item.url}" download="${item.filename}" class="direct-download-link cyber-hover">
            ⬇ Direct Download
          </a>
        </div>
      </article>
    `).join('');

    // Attach click triggers
    pdfFileList.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.getAttribute('data-open');
        const selected = PDF_VAULT.find(p => p.id === id);
        if (selected) openModal(selected);
      });
    });
  }

  // ============================================================================
  // MODAL CONTROLLER & SOCIAL SHARING
  // ============================================================================
  function openModal(pdfItem) {
    activeModalPdf = pdfItem;
    modalFileName.textContent = pdfItem.filename;

    pdfFrame.src = pdfItem.url;
    modalDownloadBtn.href = pdfItem.url;
    modalDownloadBtn.setAttribute('download', pdfItem.filename);
    modalExternalBtn.href = pdfItem.url;

    pdfModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modalCloseBtnTop.focus();
  }

  function closeModal() {
    pdfModal.classList.add('hidden');
    pdfFrame.src = '';
    activeModalPdf = null;
    document.body.style.overflow = '';
  }

  function getShareDetails() {
    if (!activeModalPdf) return { title: 'TH3HUBRIS Cybersecurity Vault', url: window.location.href };
    const title = activeModalPdf.displayName;
    const fileUrl = new URL(activeModalPdf.url, window.location.href).href;
    return { title, url: fileUrl };
  }

  function shareWhatsAppHandler() {
    const { title, url } = getShareDetails();
    const text = `⚔️ ${title} | TH3HUBRIS Academic Vault: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  function shareLinkedInHandler() {
    const { url } = getShareDetails();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=650,height=600');
  }

  function shareXHandler() {
    const { title, url } = getShareDetails();
    const tweet = `Check out "${title}" by @th3hubris #Cybersecurity #OPSEC`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=650,height=500');
  }

  function shareTelegramHandler() {
    const { title, url } = getShareDetails();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
  }

  function copyLinkHandler() {
    const { url } = getShareDetails();
    copyToClipboard(url, 'Link copied to clipboard!');
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
    }, 2600);
  }

  function copyToClipboard(text, successMsg) {
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
      showToast('Could not copy to clipboard.');
    }
    document.body.removeChild(textarea);
  }

  // ============================================================================
  // EVENT BINDINGS
  // ============================================================================
  function init() {
    renderList();

    // Grep search input
    if (pdfSearchInput) {
      pdfSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderList();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (pdfSearchInput) pdfSearchInput.value = '';
        searchQuery = '';
        renderList();
      });
    }

    // Modal close triggers
    if (modalCloseBtnTop) modalCloseBtnTop.addEventListener('click', closeModal);
    if (modalCloseBtnText) modalCloseBtnText.addEventListener('click', closeModal);

    if (pdfModal) {
      pdfModal.addEventListener('click', (e) => {
        if (e.target === pdfModal) closeModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !pdfModal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Social share clicks
    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);

    // Quick Clone button
    if (copyCloneBtn) {
      copyCloneBtn.addEventListener('click', () => {
        const cmd = 'git clone https://github.com/th3hubris/th3hubris.git';
        copyToClipboard(cmd, 'Clone command copied!');
        if (cloneMsg) {
          cloneMsg.textContent = '[+] git clone command copied to clipboard!';
          setTimeout(() => { cloneMsg.textContent = ''; }, 3000);
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
