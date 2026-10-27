# Th3hubris ⚔️
### *We Build Shadow Soldiers - Ultimate OPSEC & Anonymity Suite*

[![Platform: Kali Linux 2026](https://img.shields.io/badge/Platform-Kali%20Linux%202026-blue?logo=kalilinux&logoColor=white)](https://www.kali.org/)
[![Python: 3.12+](https://img.shields.io/badge/Python-3.12%2B-yellow?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security: Zero-Leak](https://img.shields.io/badge/Security-Kernel%20Kill--Switch-red.svg)](SECURITY.md)
[![Anonymity: Chained Tor + VPN](https://img.shields.io/badge/Anonymity-Tor%20%2B%20OpenVPN-purple.svg)](#architecture)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

```text
  _______ _    ____  _           _          _     
 |__   __| |  |___ \| |         | |        (_)    
    | |  | |__  __) | |__  _   _| |__  _ __ _ ___ 
    | |  | '_ \|__ <| '_ \| | | | '_ \| '__| / __|
    | |  | | | |__) | | | | |_| | |_) | |  | \__ \
    |_|  |_| |_|____/|_| |_|\__,_|_.__/|_|  |_|___/
```

> **Th3hubris** is a military-grade, fully automated anonymity and OPSEC orchestrator engineered specifically for **Kali Linux (2026 Rolling Release)** and **Python 3.12+**. It automates the entire offensive and defensive anonymity chain in a **single command** — requiring zero manual editing of configuration files, zero manual Tor restarts, and zero configuration friction.

---

## 🏛️ Tactical Architecture

Th3hubris combines multiple defense layers into a unified, non-conflicting routing pipeline. It prevents data exposure by chaining **Hardware Cloaking**, **Zero-Knowledge DNS Locking**, **Dynamic OpenVPN Tunneling**, **Tor Onion Routing**, **Dynamic ProxyChains4**, and a **Low-Level Linux Kernel Kill-Switch**.

```text
+------------------------------------------------------------------------------------------------+
|                                    TARGET MACHINE (KALI LINUX)                                  |
|                                                                                                |
|   [ User Terminal / Security Tool ] (e.g. nmap, curl, hydra, python, firefox)                 |
|                                 |                                                              |
|                                 v                                                              |
|   [ ProxyChains-NG (proxy_dns) ] ---> Dynamic SOCKS5 Interception (127.0.0.1:9050)             |
|                                 |                                                              |
|                                 v                                                              |
|   [ Local Tor Daemon (tor.service) ] ---> Multipath Onion Circuit (ControlPort 9051 Rotation)   |
|                                 |                                                              |
|                                 v                                                              |
|   [ OpenVPN Daemon (tun0) ] --------> Encrypted Tunnel Payload (VPN Gate Academic Network)     |
|                                 |                                                              |
|   ===================== KERNEL FIREWALL KILL-SWITCH (iptables / nftables) ==================    |
|   * Drops all non-tun0 / non-Tor outgoing IPv4 traffic                                         |
|   * Drops 100% of IPv6 traffic (Input / Output / Forward)                                      |
|   * Locks /etc/resolv.conf with immutable attribute (chattr +i)                                |
|   * Randomizes Physical / Wireless MAC addresses (02:xx:xx:xx:xx:xx)                           |
+------------------------------------------------------------------------------------------------+
                                  |
                                  v
                        [ Encrypted Public WAN ]
                                  |
               +------------------+------------------+
               |                                     |
               v                                     v
       [ OpenVPN Relay Node ]              [ Tor Guard Node ]
       (ISP only sees VPN traffic)                   |
                                                     v
                                           [ Tor Middle Relay ]
                                                     |
                                                     v
                                           [ Tor Exit Node ]
                                                     |
                                                     v
                                         [ Target Remote Server ]
                                    (Server only sees Tor Exit IP)
```

---

## ⚡ Core Operational Features

1. **Massive Aggressive ASCII Banner:**
   - Displays a custom, glowing terminal banner with real-time OPSEC status and version indicators upon execution.
2. **Automated ProxyChains4 Reconfiguration:**
   - Automatically parses and backs up `/etc/proxychains4.conf` (and `/etc/proxychains.conf`).
   - Enables `dynamic_chain`, disables `strict_chain` and `random_chain`, enforces `proxy_dns` to stop remote DNS leaks, and configures `socks5 127.0.0.1 9050`.
3. **Tor Service Management & Instant Identity Rotation (`--ghost-id`):**
   - Automatically starts, verifies, and health-checks `tor.service` / `tor@default.service`.
   - Rotates circuits and generates brand-new exit node identities instantly on demand via the Tor ControlPort (`SIGNAL NEWNYM`).
4. **Dynamic Free OpenVPN Integration:**
   - Interacts directly with live academic VPN feeds (VPN Gate API) to parse top-rated, low-ping relay servers worldwide.
   - Automatically decodes configuration, injects non-conflicting routing options, writes ephemeral credentials, and spawns OpenVPN in daemon mode.
   - Seamlessly supports custom `.ovpn` files via `--vpn-config <path>`.
5. **Hardware MAC Address Cloaking:**
   - Discovers all active physical and wireless network adapters (e.g., `eth0`, `wlan0`, `enp*`, `wlp*`).
   - Automatically randomizes hardware MAC addresses with locally administered unicast identifiers (`02:xx:xx:xx:xx:xx`) and restores factory hardware addresses upon shutdown.
6. **Immutable DNS Leak Prevention:**
   - Backs up existing resolvers, points `/etc/resolv.conf` to zero-knowledge DNS providers (Cloudflare 1.1.1.1, Quad9 9.9.9.9), and applies an immutable lock (`chattr +i`) to prevent NetworkManager or DHCP overrides.
7. **Kernel-Level Kill-Switch (iptables / nftables):**
   - Completely drops all IPv6 traffic across all interfaces to eliminate IPv6 bypasses.
   - Drops all unencrypted outbound IPv4 traffic if the VPN or Tor tunnel drops.
   - Only permits loopback, established connections, Tor process UID, and the encrypted OpenVPN gateway.
8. **Real-Time OPSEC Status Matrix:**
   - Pulls and cross-compares visible IP, Country, Region, ISP, and Tor exit validation before and after activation in an interactive styled table.
9. **Interactive Cloaked Sub-Shell (`--shell`):**
   - Spawns a dedicated sub-shell (`[Th3hubris-Ghost]# `) wrapped under ProxyChains4, routing all commands and penetration testing binaries through the anonymity pipeline.
10. **Zero-Trace State Restoration (`--stop`):**
    - Flushes firewall rules, disarms the kill-switch, restores original MAC addresses, restores original DNS configurations, and restores original proxychains configurations to their exact pre-run state.

---

## 🚀 Installation

Th3hubris is packaged with a fully automated, one-step installer script designed for **Kali Linux 2026**.

```bash
# Clone the repository
git clone https://github.com/th3hubris/th3hubris.git
cd th3hubris

# Execute the automated installer with root privileges
sudo bash install.sh
```

The installer automatically:
- Installs required system utilities (`tor`, `proxychains4`, `openvpn`, `macchanger`, `iptables`, `curl`, `e2fsprogs`).
- Installs Python 3.12+ dependencies (`rich`, `requests`, `urllib3`) adhering to PEP 668 standards.
- Pre-configures Tor ControlPort access in `/etc/tor/torrc`.
- Creates a global symbolic link at `/usr/local/bin/th3hubris` so you can run `sudo th3hubris` from any terminal directory.

---

## 💻 CLI Commands & Usage Guide

Th3hubris requires `sudo` privileges for low-level socket, packet filtering, and interface management.

| Command | Description |
| :--- | :--- |
| `sudo th3hubris --start` | **Full Chain Activation:** Spoofs MACs, locks DNS, connects VPN, starts Tor, configures ProxyChains, arms Kill-Switch, and displays before/after IP matrix. |
| `sudo th3hubris --stop` | **Safe Recovery:** Disarms Kill-Switch, terminates VPN daemon, restores DNS, restores ProxyChains, restores original MACs, and cleans temporary state. |
| `sudo th3hubris --ghost-id` | **Instant IP Rotation:** Discards current Tor circuits and acquires a brand-new exit identity (`SIGNAL NEWNYM`). |
| `sudo th3hubris --status` | **Posture Audit:** Displays active operational health, running tunnels, visible IP, ISP, and kill-switch state. |
| `sudo th3hubris --shell` | **Cloaked Sub-Shell:** Spawns an interactive bash terminal with all outbound traffic dynamically routed through ProxyChains. |
| `sudo th3hubris --start --no-vpn` | **Tor-Only Mode:** Activates MAC spoofing, Tor SOCKS5, ProxyChains, DNS lock, and Kill-Switch without launching OpenVPN. |
| `sudo th3hubris --start --vpn-config <path.ovpn>` | **Custom VPN Mode:** Uses a private or corporate `.ovpn` configuration file instead of dynamic public relays. |

---

## 🔍 Threat Model & Leak Prevention Analysis

| Threat Vector | Exposure Risk | How Th3hubris Mitigates It |
| :--- | :--- | :--- |
| **ISP Egress Logging** | ISP records destination IPs and DNS queries | Traffic is fully encapsulated inside an OpenVPN tunnel; ISP only sees an encrypted flow to a foreign VPN relay. |
| **DNS Leakage** | Applications query default ISP resolvers directly in plaintext | `/etc/resolv.conf` is locked with `chattr +i` to 1.1.1.1/9.9.9.9, and ProxyChains `proxy_dns` forces DNS lookups through Tor. |
| **IPv6 Bypass** | Dual-stack networks bypass IPv4 VPN/Tor rules | `ip6tables` policies are set to strict `DROP` on `INPUT`, `OUTPUT`, and `FORWARD`. |
| **Connection Drop (Real IP Leak)** | Tunnel collapses and apps reconnect over raw interface | Low-level kernel kill-switch drops any packet not routed through `tun0` or originating from Tor's UID. |
| **Local WiFi MAC Fingerprinting** | Captive portals and routers track device hardware ID | Active adapters have their MAC addresses randomized upon startup and restored upon clean exit. |
| **Target Website Profiling** | Target logs actual origin IP address | Target only sees rotating Tor exit node IPs or VPN relays. |

---

## 🇸🇦 ملخص شامل ودليل الاستخدام باللغة العربية

### ما هي أداة Th3hubris؟
أداة **Th3hubris** هي جناح أمني وتكتيكي متكامل (All-in-One OPSEC Suite) تم تطويره خصيصاً لخبراء الأمن السيبراني واختبار الاختراق على توزيعة **Kali Linux (إصدار 2026 Rolling)** باستخدام **Python 3.12+**. تقوم الأداة بأتمتة سلسلة التخفي وتأمين الاتصال بالكامل عبر **أمر واحد فقط** دون الحاجة إلى تعديل ملفات التكوين يدوياً أو تشغيل الخدمات بشكل منفصل.

### 🌟 أبرز مميزات الأداة:
1. **تغيير عنوان الماك (MAC Address Spoofing):** كشف وتغيير عناوين الماك لكافة كروت الشبكة النشطة تلقائياً لتفادي التعقب على الشبكات المحلية.
2. **تأمين نظام أسماء النطاقات (DNS Leak Protection):** منع تسريب استعلامات الـ DNS عبر قفل ملف `/etc/resolv.conf` وجعله غير قابل للتعديل (`chattr +i`) مع توجيهه لسيرفرات آمنة ومحمية.
3. **أتمتة ProxyChains4 بالكامل:** ضبط إعدادات `dynamic_chain` وتفعيل `proxy_dns` وربطها تلقائياً مع شبكة Tor عبر المنفذ SOCKS5 `127.0.0.1:9050`.
4. **تكامل VPN مجاني وديناميكي:** جلب وتشفير الاتصال عبر سيرفرات OpenVPN مجانية عالية السرعة تلقائياً، مع دعم ملفات `.ovpn` المخصصة.
5. **مفتاح القتل على مستوى النواة (Kernel Kill-Switch):** استخدام جدار الحماية `iptables/nftables` لمنع خروج أي حزمة بيانات في حال انقطاع النفق المشفر، مع حظر بروتوكول IPv6 بالكامل لمنع أي تسريب جانبي.
6. **تبديل الهوية فوريًا (Ghost-ID):** الحصول على عنوان IP وهوية جديدة تماماً بلمح البصر عبر إرسال إشارة `SIGNAL NEWNYM` لمنفذ تحكم Tor.
7. **صدفة طرفية مشفرة (Cloaked Sub-Shell):** فتح سطر أوامر تفاعلي معزول تمر كافة برامجه وأوامره عبر نفق التخفي تلقائياً.
8. **استعادة كاملة للنظام (Clean Recovery):** عند إيقاف الأداة، يتم إرجاع عناوين الماك، وتفريغ قواعد جدار الحماية، واستعادة ملفات الشبكة لوضعها الأصلي تماماً.

### 📋 جدول أوامر التشغيل السريع:

```bash
# تثبيت الأداة وحزمها تلقائياً
sudo bash install.sh

# تفعيل منظومة التخفي الكاملة وفحص الـ IP
sudo th3hubris --start

# التحقق من حالة التخفي وعنوان الـ IP الظاهر
sudo th3hubris --status

# تغيير عنوان الـ IP والحصول على مسار Tor جديد فوراً
sudo th3hubris --ghost-id

# الدخول في طرفية تفاعلية مشفرة عبر ProxyChains
sudo th3hubris --shell

# تشغيل الأداة عبر Tor فقط دون VPN
sudo th3hubris --start --no-vpn

# تشغيل الأداة مع ملف OpenVPN خارجي خاص بك
sudo th3hubris --start --vpn-config /path/to/custom.ovpn

# إيقاف الأداة واستعادة الوضع الافتراضي للنظام بالكامل
sudo th3hubris --stop
```

---

## ⚖️ Legal & Ethical Disclaimer

**IMPORTANT NOTICE:**
Th3hubris is created solely for educational purposes, authorized security testing, privacy defense research, and academic evaluations within networks where the operator has explicit, documented permission. 

The authors and contributors assume **NO LIABILITY** and are not responsible for any misuse, damage, or illegal activities conducted with this software. Any unauthorized access to computer systems, disruption of services, or breach of international cyber laws is strictly prohibited. Always ensure strict compliance with local, national, and international laws before deployment.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).  
Copyright (c) 2026 **Th3hubris**. All Rights Reserved.
