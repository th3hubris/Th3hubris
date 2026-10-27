/**
 * TH3HUBRIS - Interactive Kali Linux Web Terminal Engine (2026)
 * Supports: Trilingual i18n (EN, FR, AR), In-Page PDF Modal, Social Sharing, Live Grep Filter
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. DATA REPOSITORY: PDF ACADEMIC MODULES
  // Add or remove lessons easily by adding objects to this list!
  // ============================================================================
  const PDF_VAULT = [
    {
      id: "opsec-2026",
      filename: "01_Advanced_OPSEC_and_Anonymity.pdf",
      url: "pdfs/01_Advanced_OPSEC_and_Anonymity.pdf",
      size: "2.4 MB",
      category: "opsec",
      perm: "-rwxr-xr-x",
      title: {
        en: "01_Advanced_OPSEC_and_Anonymity_2026.pdf",
        fr: "01_OPSEC_Avancé_et_Anonymat_2026.pdf",
        ar: "01_هندسة_التخفي_والعمليات_الأمنية_OPSEC_2026.pdf"
      },
      displayName: {
        en: "Advanced OPSEC & Anonymity Orchestration (Kali 2026)",
        fr: "Orchestration Avancée OPSEC & Anonymat (Kali 2026)",
        ar: "هندسة التخفي والعمليات الأمنية المتقدمة (كالي لينيكس 2026)"
      },
      desc: {
        en: "System-wide Tor Transparent TCP proxying (port 9040), isolated DNSPort 9053, OpenVPN dynamic failover, and Linux kernel firewall kill-switch implementation.",
        fr: "Proxy transparent Tor à l'échelle du système (port 9040), DNSPort 9053 isolé, basculement OpenVPN dynamique et coupe-circuit iptables au niveau du noyau.",
        ar: "توجيه نظام كالي كاملاً عبر شبكة Tor (منفذ 9040)، حماية استعلامات DNS (منفذ 9053)، دمج شبكات OpenVPN وتفعيل قاطع اتصال النواة ضد أي تسريب."
      }
    },
    {
      id: "pentest-recon",
      filename: "02_Network_Penetration_Testing.pdf",
      url: "pdfs/02_Network_Penetration_Testing.pdf",
      size: "3.1 MB",
      category: "pentest",
      perm: "-rwxr-xr-x",
      title: {
        en: "02_Network_Penetration_Testing_Manual.pdf",
        fr: "02_Manuel_Tests_Intrusion_Reseau.pdf",
        ar: "02_دليل_اختبار_اختراق_الشبكات_والاستطلاع.pdf"
      },
      displayName: {
        en: "Tactical Network Penetration Testing & Reconnaissance",
        fr: "Tests d'Intrusion Réseau & Reconnaissance Tactique",
        ar: "دليل اختبار اختراق الشبكات والاستطلاع الميداني التكتيكي"
      },
      desc: {
        en: "Offensive methodologies for stealth Nmap port scanning, banner grabbing, service enumeration, vulnerability assessment, and bypass of modern IDS/IPS.",
        fr: "Méthodologies offensives pour scans Nmap furtifs, capture de bannières, énumération de services et contournement des IDS/IPS modernes.",
        ar: "منهجيات هجومية متقدمة لفحص المنافذ خفية عبر Nmap، جمع البصمات، اكتشاف الثغرات وتجاوز أنظمة كشف ومنع التسلل IDS/IPS الحديثة."
      }
    },
    {
      id: "kali-hardening",
      filename: "03_Kali_Linux_Hardening_Manual.pdf",
      url: "pdfs/03_Kali_Linux_Hardening_Manual.pdf",
      size: "1.8 MB",
      category: "hardening",
      perm: "-rwxr-xr-x",
      title: {
        en: "03_Kali_Linux_Enterprise_Hardening.pdf",
        fr: "03_Durcissement_Kali_Linux_Entreprise.pdf",
        ar: "03_دليل_تحصين_وتأمين_كالي_لينيكس_المؤسسي.pdf"
      },
      displayName: {
        en: "Kali Linux System & Browser Security Hardening",
        fr: "Durcissement Système & Sécurité Navigateur Kali Linux",
        ar: "دليل تحصين نظام كالي لينيكس وتأمين المتصفحات المتقدم"
      },
      desc: {
        en: "Mitigating Mozilla Firefox DoH leaks via enterprise policies, disabling KDE connect & mDNS broadcasts, MAC address cloaking, and immutable resolv.conf locks.",
        fr: "Suppression des fuites Firefox DoH via politiques d'entreprise, désactivation de mDNS, masquage des adresses MAC et verrouillage de resolv.conf.",
        ar: "إغلاق تسريبات DoH في متصفح فايرفوكس، تعطيل بروتوكولات mDNS المعرضة للكشف، تمويه بطاقات الشبكة MAC وتجميد ملفات النظام الأساسية."
      }
    },
    {
      id: "redteam-ops",
      filename: "04_Red_Teaming_Offensive_Ops.pdf",
      url: "pdfs/04_Red_Teaming_Offensive_Ops.pdf",
      size: "4.5 MB",
      category: "redteam",
      perm: "-rwxr-xr-x",
      title: {
        en: "04_Red_Teaming_Offensive_Operations_2026.pdf",
        fr: "04_Operations_Offensives_Red_Team_2026.pdf",
        ar: "04_عمليات_الفريق_الأحمر_الهجومية_المحاكاة_2026.pdf"
      },
      displayName: {
        en: "Red Team Operations & Adversary Emulation Framework",
        fr: "Opérations Red Team & Émulation d'Adversaires",
        ar: "عمليات الفريق الأحمر المتقدمة ومحاكاة الهجمات المعقدة"
      },
      desc: {
        en: "Pivoting via multi-hop SSH & Tor socks chains, covert egress channels, credential access, lateral movement, and counter-forensic evasion tactics.",
        fr: "Pivoting via chaînes SSH et proxys Tor SOCKS, canaux de sortie dissimulés, accès aux identifiants et évasion anti-forensique.",
        ar: "تقنيات الانتقال والتخفي الشبكي عبر مسارات متعددة، استخراج بيانات الاعتماد، التحرك الجانبي داخل البنية التحتية ومسح الآثار الرقمية."
      }
    }
  ];

  // ============================================================================
  // 2. TRILINGUAL DICTIONARY (EN, FR, AR)
  // ============================================================================
  const I18N = {
    en: {
      langLabel: "LANG:",
      tagline: "We Build Shadow Soldiers - Ultimate OPSEC & Anonymity Suite",
      engineLabel: "Engine:",
      targetLabel: "Target:",
      statusVerified: "Zero-Leak Verified",
      bioRole: "Identity:",
      bioDesc: "Cybersecurity Engineer & Ethical Hacker",
      missionLabel: "Focus:",
      missionDesc: "Advanced OPSEC, Network Penetration Testing, Red Teaming & Linux Kernel Hardening",
      vaultLabel: "Academic Vault:",
      vaultDesc: "All PDF training manuals and cheatsheets are freely accessible below.",
      noticeLabel: "Notice:",
      noticeDesc: "Click any PDF module to read inside the interactive terminal viewer or share.",
      matrixTitle: "Th3hubris Security Verification Matrix",
      thParameter: "Parameter",
      thBaseline: "Baseline (Standard)",
      thShadow: "Hardened (Shadow State)",
      paramIp: "IP / Egress DNS",
      paramIpExposed: "Exposed / ISP Logged",
      paramIpShielded: "100% Tor + VPN Multipath (0 Leak)",
      paramKillswitch: "Kernel Kill-Switch",
      paramDisabled: "Disabled",
      paramArmed: "ARMED (iptables drop-all)",
      paramAcademy: "Educational Vault",
      paramPublic: "OPEN ACCESS (PDF Modules)",
      pdfVaultHeading: "ACADEMIC VAULT // PDF LESSONS & MANUALS",
      searchPlaceholder: "filter by name, topic, or keyword...",
      catAll: "ALL",
      catOpsec: "OPSEC",
      catPentest: "PENTEST",
      catHardening: "HARDENING",
      catRedteam: "RED_TEAM",
      vaultHint: "Tip: Click on any lesson link to open it inside the embedded Kali terminal viewer without leaving the site.",
      openViewerBtn: "[ VIEW IN TERMINAL ]",
      directDownloadBtn: "DIRECT DOWNLOAD",
      githubHeading: "GITHUB ARSENAL & REPOSITORIES",
      githubIntro: "Open-source tactical tools engineered for offensive security, anonymity, and penetration testing on Kali Linux:",
      viewRepoBtn: "[ ↗ REPOSITORY ]",
      quickCloneLabel: "QUICK GIT CLONE:",
      allToolsBtn: "⚡ VIEW ALL TOOLS ON GITHUB (@th3hubris)",
      contactTitle: "COMMUNICATION & CHANNELS:",
      downloadPdfBtn: "DOWNLOAD PDF",
      openTabBtn: "RAW VIEW",
      shareLabel: "SHARE LESSON:",
      copyLinkBtn: "[ 📋 COPY LINK ]",
      copiedToast: "Link copied to clipboard successfully!",
      cloneCopiedToast: "git clone command copied to clipboard!",
      noResults: "No matching PDF modules found for query.",
      toolTh3hubrisDesc: "Ultimate military-grade OPSEC & anonymity orchestrator for Kali Linux. Automated Tor Transparent TCP 9040, DNSPort 9053, and Kernel Kill-Switch.",
      toolShadowDesc: "Automated stealth reconnaissance and attack surface discovery engine utilizing low-emission DNS probes and multi-source OSINT.",
      toolZeroLeakDesc: "Kernel-level firewall rule-setter enforcing complete IPv6 packet dropping and strict outbound interface whitelisting."
    },
    fr: {
      langLabel: "LANGUE :",
      tagline: "Nous Formons les Soldats de l'Ombre - Suite Ultime d'OPSEC et d'Anonymat",
      engineLabel: "Moteur :",
      targetLabel: "Cible :",
      statusVerified: "Zéro Fuite Vérifié",
      bioRole: "Identité :",
      bioDesc: "Ingénieur en Cybersécurité & Hacker Éthique",
      missionLabel: "Spécialité :",
      missionDesc: "OPSEC Avancé, Tests d'Intrusion Réseau, Red Teaming & Durcissement du Noyau Linux",
      vaultLabel: "Coffre Académique :",
      vaultDesc: "Tous les manuels de formation et cheatsheets PDF sont librement accessibles ci-dessous.",
      noticeLabel: "Info :",
      noticeDesc: "Cliquez sur n'importe quel cours PDF pour l'ouvrir dans la visionneuse intégrée ou le partager.",
      matrixTitle: "Matrice de Vérification de Sécurité Th3hubris",
      thParameter: "Paramètre",
      thBaseline: "Standard (Non Sécurisé)",
      thShadow: "Durci (État Fantôme)",
      paramIp: "IP / Résolution DNS",
      paramIpExposed: "Exposé / FAI Journalisé",
      paramIpShielded: "100% Tor + VPN Multipath (0 Fuite)",
      paramKillswitch: "Coupe-Circuit Noyau",
      paramDisabled: "Désactivé",
      paramArmed: "ARMÉ (iptables drop-all)",
      paramAcademy: "Coffre Éducatif",
      paramPublic: "ACCÈS LIBRE (Modules PDF)",
      pdfVaultHeading: "COFFRE ACADÉMIQUE // COURS & MANUELS PDF",
      searchPlaceholder: "filtrer par nom, sujet ou mot-clé...",
      catAll: "TOUS",
      catOpsec: "OPSEC",
      catPentest: "PENTEST",
      catHardening: "DURCISSEMENT",
      catRedteam: "RED_TEAM",
      vaultHint: "Astuce : Cliquez sur un module pour l'ouvrir dans la visionneuse terminal intégrée sans quitter la page.",
      openViewerBtn: "[ LIRE DANS LE TERMINAL ]",
      directDownloadBtn: "TÉLÉCHARGEMENT DIRECT",
      githubHeading: "ARSENAL GITHUB & OUTILS",
      githubIntro: "Outils tactiques open-source conçus pour la sécurité offensive, l'anonymat et le pentest sur Kali Linux :",
      viewRepoBtn: "[ ↗ DÉPÔT GITHUB ]",
      quickCloneLabel: "CLONAGE GIT RAPIDE :",
      allToolsBtn: "⚡ VOIR TOUS LES OUTILS SUR GITHUB (@th3hubris)",
      contactTitle: "COMMUNICATION & CANAUX :",
      downloadPdfBtn: "TÉLÉCHARGER LE PDF",
      openTabBtn: "VUE BRUTE",
      shareLabel: "PARTAGER CE COURS :",
      copyLinkBtn: "[ 📋 COPIER LE LIEN ]",
      copiedToast: "Lien copié dans le presse-papiers avec succès !",
      cloneCopiedToast: "Commande git clone copiée dans le presse-papiers !",
      noResults: "Aucun document PDF ne correspond à votre recherche.",
      toolTh3hubrisDesc: "Orchestrateur militaire d'OPSEC et d'anonymat pour Kali Linux. Tor Transparent TCP 9040, DNSPort 9053 et coupe-circuit noyau.",
      toolShadowDesc: "Moteur de reconnaissance discrète et de cartographie de surface d'attaque exploitant l'OSINT et des sondes DNS furtives.",
      toolZeroLeakDesc: "Règles pare-feu au niveau noyau assurant le blocage total d'IPv6 et le filtrage strict des interfaces sortantes."
    },
    ar: {
      langLabel: "اللغة:",
      tagline: "نبني جنود الظل - المنظومة الشاملة للعمليات الأمنية والتخفي الرقمي",
      engineLabel: "المحرك:",
      targetLabel: "الهدف:",
      statusVerified: "معتمد ضد أي تسريب (Zero-Leak)",
      bioRole: "الهوية:",
      bioDesc: "مهندس أمن سيبراني وخبير اختبار اختراق (هكر أخلاقي)",
      missionLabel: "المجال:",
      missionDesc: "العمليات الأمنية المتقدمة (OPSEC)، اختبار اختراق الشبكات، محاكاة الهجمات (Red Teaming) وتحصين نواة لينيكس",
      vaultLabel: "الخزينة التعليمية:",
      vaultDesc: "جميع الدروس والمناهج وملفات الـ PDF متاحة للتحميل والقراءة مجاناً بالأسفل.",
      noticeLabel: "ملاحظة:",
      noticeDesc: "اضغط على أي درس لفتحه داخل نافذة طرفية كالي التفاعلية داخل الموقع ومشاركته مباشرة.",
      matrixTitle: "مصفوفة التحقق الأمني - Th3hubris Matrix",
      thParameter: "المعيار الأمني",
      thBaseline: "الوضع العادي (غير المحمي)",
      thShadow: "الوضع المعزول (Shadow State)",
      paramIp: "عنوان الـ IP واستعلامات DNS",
      paramIpExposed: "مكشوف ومسجل لدى مزود الخدمة",
      paramIpShielded: "تشفير كامل عبر مسارات Tor + VPN (صفر تسريب)",
      paramKillswitch: "قاطع اتصال النواة (Kill-Switch)",
      paramDisabled: "معطل",
      paramArmed: "مفعل وجاهز (إسقاط فوري لأي تسريب)",
      paramAcademy: "المستودع التعليمي",
      paramPublic: "متاح ومفتوح المصدر (دروس PDF)",
      pdfVaultHeading: "المستودع الأكاديمي // الدروس والملفات التخصصية [PDF]",
      searchPlaceholder: "ابحث بالاسم أو الموضوع أو الكلمة الدلالية...",
      catAll: "الكل",
      catOpsec: "تخفي_OPSEC",
      catPentest: "اختبار_اختراق",
      catHardening: "تحصين_الأنظمة",
      catRedteam: "فريق_أحمر",
      vaultHint: "إرشاد: عند النقر على أي ملف سيتم فتحه في صندوق عرض تفاعلي مباشر داخل الموقع دون مغادرة الصفحة.",
      openViewerBtn: "[ فتح واستعراض في الموقع ]",
      directDownloadBtn: "تحميل مباشر",
      githubHeading: "ترسانة الأدوات على GITHUB",
      githubIntro: "أدوات هجومية ودفاعية مفتوحة المصدر مخصصة للأمن السيبراني، التخفي الرقمي واختبار الاختراق على كالي لينيكس:",
      viewRepoBtn: "[ ↗ معاينة الأداة على GITHUB ]",
      quickCloneLabel: "استنساخ الأداة سريعاً عبر GIT:",
      allToolsBtn: "⚡ تصفح كامل المستودعات والأدوات على GITHUB (@th3hubris)",
      contactTitle: "قنوات الاتصال والتواصل المباشر:",
      downloadPdfBtn: "تحميل ملف PDF",
      openTabBtn: "فتح كصفحة مستقلة",
      shareLabel: "مشاركة هذا الدرس:",
      copyLinkBtn: "[ 📋 نسخ الرابط ]",
      copiedToast: "تم نسخ رابط الدرس بنجاح إلى الحافظة!",
      cloneCopiedToast: "تم نسخ أمر git clone بنجاح إلى الحافظة!",
      noResults: "لم يتم العثور على أي ملف يطابق كلمات البحث.",
      toolTh3hubrisDesc: "المنظومة الاحترافية لأتمتة التخفي وإدارة مسارات Tor الشفافة وقطع اتصالات النواة عند أي تسريب.",
      toolShadowDesc: "محرك استطلاع صامت واستكشاف هجومي متقدم لبصمات البنية التحتية عبر تحليلات OSINT.",
      toolZeroLeakDesc: "برمجية قواعد حماية النواة لإسقاط حزم IPv6 كلياً وحصر البيانات على المنافذ الموثوقة فقط."
    }
  };

  // State
  let currentLang = localStorage.getItem('th3hubris_lang') || 'en';
  let activeCategory = 'all';
  let searchQuery = '';
  let activeModalPdf = null;

  // DOM Elements Cache
  const pdfFileList = document.getElementById('pdfFileList');
  const pdfSearchInput = document.getElementById('pdfSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryPills = document.querySelectorAll('.pill-btn');
  const langButtons = document.querySelectorAll('.lang-btn');
  const bootScreen = document.getElementById('bootScreen');
  const bootProgress = document.getElementById('bootProgress');

  // Modal Elements
  const pdfModal = document.getElementById('pdfModal');
  const pdfFrame = document.getElementById('pdfFrame');
  const modalFileName = document.getElementById('modalFileName');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const modalExternalBtn = document.getElementById('modalExternalBtn');
  const modalCloseBtnTop = document.getElementById('modalCloseBtnTop');
  const modalCloseBtnText = document.getElementById('modalCloseBtnText');

  // Share Buttons
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareLinkedIn = document.getElementById('shareLinkedIn');
  const shareX = document.getElementById('shareX');
  const shareTelegram = document.getElementById('shareTelegram');
  const shareCopyLink = document.getElementById('shareCopyLink');

  // Clone Box
  const copyCloneBtn = document.getElementById('copyCloneBtn');
  const cloneFeedback = document.getElementById('cloneFeedback');
  const cyberToast = document.getElementById('cyberToast');
  const toastMsg = document.getElementById('toastMsg');

  // ============================================================================
  // 3. INITIALIZATION & BOOT LOADER
  // ============================================================================
  function init() {
    setLanguage(currentLang);
    renderPdfList();
    setupEventListeners();
    triggerBootSequence();
  }

  function triggerBootSequence() {
    if (!bootScreen) return;
    setTimeout(() => {
      if (bootProgress) bootProgress.style.width = '100%';
    }, 150);

    setTimeout(() => {
      bootScreen.classList.add('fade-out');
    }, 900);
  }

  // ============================================================================
  // 4. LANGUAGE HANDLING (i18n & RTL)
  // ============================================================================
  function setLanguage(lang) {
    if (!I18N[lang]) lang = 'en';
    currentLang = lang;
    localStorage.setItem('th3hubris_lang', lang);

    const isArabic = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';

    // Update Language Buttons Active State
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update Static DOM Elements
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    elementsToTranslate.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[lang] && I18N[lang][key]) {
        el.textContent = I18N[lang][key];
      }
    });

    // Update Placeholders
    const inputsWithPlaceholder = document.querySelectorAll('[data-i18n-placeholder]');
    inputsWithPlaceholder.forEach(inp => {
      const key = inp.getAttribute('data-i18n-placeholder');
      if (I18N[lang] && I18N[lang][key]) {
        inp.placeholder = I18N[lang][key];
      }
    });

    // Re-render PDF items with updated language titles and descriptions
    renderPdfList();

    // If modal is open, refresh its title
    if (activeModalPdf) {
      modalFileName.textContent = activeModalPdf.filename;
    }
  }

  // ============================================================================
  // 5. PDF VAULT RENDERING & FILTERING
  // ============================================================================
  function renderPdfList() {
    if (!pdfFileList) return;

    const filtered = PDF_VAULT.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (item.title[currentLang] || item.title.en).toLowerCase().includes(q);
      const displayMatch = (item.displayName[currentLang] || item.displayName.en).toLowerCase().includes(q);
      const descMatch = (item.desc[currentLang] || item.desc.en).toLowerCase().includes(q);
      const fileMatch = item.filename.toLowerCase().includes(q);
      return titleMatch || displayMatch || descMatch || fileMatch;
    });

    if (filtered.length === 0) {
      pdfFileList.innerHTML = `
        <div class="pdf-file-item" style="text-align: center; color: var(--c-yellow); padding: 1.5rem;">
          <span class="c-yellow">[-]</span> ${I18N[currentLang].noResults}
        </div>
      `;
      return;
    }

    pdfFileList.innerHTML = filtered.map(item => {
      const titleText = item.displayName[currentLang] || item.displayName.en;
      const descText = item.desc[currentLang] || item.desc.en;
      const categoryTag = item.category.toUpperCase();

      return `
        <article class="pdf-file-item" data-id="${item.id}">
          <div class="pdf-item-top">
            <span class="pdf-perm-badge">${item.perm} <span class="c-white">[PDF]</span> <span class="c-cyan">${item.size}</span></span>
            <span class="pdf-category-tag">#${categoryTag}</span>
          </div>

          <h3 class="pdf-title-container">
            <a href="javascript:void(0)" class="pdf-title-link cyber-hover" data-open-modal="${item.id}" title="${titleText}">
              📄 ${titleText}
            </a>
          </h3>

          <p class="pdf-item-desc">${descText}</p>

          <div class="pdf-item-actions">
            <button type="button" class="btn-open-modal cyber-hover" data-open-modal="${item.id}">
              <span>⚡</span> ${I18N[currentLang].openViewerBtn}
            </button>
            <span class="c-gray">|</span>
            <a href="${item.url}" download="${item.filename}" class="btn-direct-download cyber-hover">
              ⬇ ${I18N[currentLang].directDownloadBtn}
            </a>
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to open modal
    const openTriggers = pdfFileList.querySelectorAll('[data-open-modal]');
    openTriggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-open-modal');
        const selected = PDF_VAULT.find(p => p.id === id);
        if (selected) openPdfModal(selected);
      });
    });
  }

  // ============================================================================
  // 6. IN-PAGE PDF MODAL & SOCIAL SHARING (Opens inside the site)
  // ============================================================================
  function openPdfModal(pdfItem) {
    activeModalPdf = pdfItem;
    modalFileName.textContent = pdfItem.filename;

    // Load PDF in iframe
    pdfFrame.src = pdfItem.url;
    modalDownloadBtn.href = pdfItem.url;
    modalDownloadBtn.setAttribute('download', pdfItem.filename);
    modalExternalBtn.href = pdfItem.url;

    // Show Modal
    pdfModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    modalCloseBtnTop.focus();
  }

  function closePdfModal() {
    pdfModal.classList.add('hidden');
    pdfFrame.src = '';
    activeModalPdf = null;
    document.body.style.overflow = '';
  }

  // Social Share URL Builders
  function getShareDetails() {
    if (!activeModalPdf) return { title: 'TH3HUBRIS Cybersecurity Vault', url: window.location.href };
    const title = activeModalPdf.displayName[currentLang] || activeModalPdf.displayName.en;
    // Build absolute URL for current page with hash or direct file URL
    const fileUrl = new URL(activeModalPdf.url, window.location.href).href;
    return { title, url: fileUrl };
  }

  function shareOnWhatsAppHandler() {
    const { title, url } = getShareDetails();
    const text = `⚔️ ${title} | TH3HUBRIS Cybersecurity & OPSEC Vault: ${url}`;
    const target = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  function shareOnLinkedInHandler() {
    const { url } = getShareDetails();
    const target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(target, '_blank', 'noopener,noreferrer,width=650,height=600');
  }

  function shareOnXHandler() {
    const { title, url } = getShareDetails();
    const tweet = `Check out this lesson: "${title}" by @th3hubris #Cybersecurity #OPSEC #KaliLinux`;
    const target = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
    window.open(target, '_blank', 'noopener,noreferrer,width=650,height=500');
  }

  function shareOnTelegramHandler() {
    const { title, url } = getShareDetails();
    const target = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  function copyLinkHandler() {
    const { url } = getShareDetails();
    copyTextToClipboard(url, I18N[currentLang].copiedToast);
  }

  // ============================================================================
  // 7. UTILITY: TOASTS & CLIPBOARD
  // ============================================================================
  function showToast(message) {
    if (!cyberToast || !toastMsg) return;
    toastMsg.textContent = message;
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
    } catch (err) {
      showToast('Error copying link.');
    }
    document.body.removeChild(textarea);
  }

  // ============================================================================
  // 8. EVENT LISTENERS
  // ============================================================================
  function setupEventListeners() {
    // Language Switcher Buttons
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (lang) setLanguage(lang);
      });
    });

    // Category Filter Pills
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.getAttribute('data-cat') || 'all';
        renderPdfList();
      });
    });

    // Grep Search Input
    if (pdfSearchInput) {
      pdfSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderPdfList();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (pdfSearchInput) pdfSearchInput.value = '';
        searchQuery = '';
        renderPdfList();
      });
    }

    // Modal Close Triggers
    if (modalCloseBtnTop) modalCloseBtnTop.addEventListener('click', closePdfModal);
    if (modalCloseBtnText) modalCloseBtnText.addEventListener('click', closePdfModal);

    // Close on overlay backdrop click
    if (pdfModal) {
      pdfModal.addEventListener('click', (e) => {
        if (e.target === pdfModal) closePdfModal();
      });
    }

    // Close on Escape key press
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !pdfModal.classList.contains('hidden')) {
        closePdfModal();
      }
    });

    // Social Sharing Suite Click Handlers
    if (shareWhatsApp) shareWhatsApp.addEventListener('click', shareOnWhatsAppHandler);
    if (shareLinkedIn) shareLinkedIn.addEventListener('click', shareOnLinkedInHandler);
    if (shareX) shareX.addEventListener('click', shareOnXHandler);
    if (shareTelegram) shareTelegram.addEventListener('click', shareOnTelegramHandler);
    if (shareCopyLink) shareCopyLink.addEventListener('click', copyLinkHandler);

    // Git Clone Copy Button
    if (copyCloneBtn) {
      copyCloneBtn.addEventListener('click', () => {
        const cmd = 'git clone https://github.com/th3hubris/th3hubris.git';
        copyTextToClipboard(cmd, I18N[currentLang].cloneCopiedToast);
        if (cloneFeedback) {
          cloneFeedback.textContent = '[+] ' + I18N[currentLang].cloneCopiedToast;
          setTimeout(() => {
            cloneFeedback.textContent = '';
          }, 3000);
        }
      });
    }
  }

  // Self Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
