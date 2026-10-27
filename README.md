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

Th3hubris combines multiple defense layers into a unified, non-conflicting routing pipeline inspired by gold-standard Linux transparent proxy architectures (`kalitorify`, `kali-anonsurf`). It prevents data exposure by chaining **Hardware MAC Spoofing**, **Tor Transparent DNS (DNSPort 5353)**, **Tor Transparent TCP Interception (TransPort 9040)**, **Mozilla Enterprise Policy (DNS-over-HTTPS Blocker)**, **Dynamic OpenVPN Tunneling**, **ProxyChains4**, and a **Low-Level Linux Kernel Kill-Switch**.

```text
+------------------------------------------------------------------------------------------------+
|                                    TARGET MACHINE (KALI LINUX)                                  |
|                                                                                                |
|   [ System Applications & Web Browsers ] (Firefox, Chrome, curl, nmap, hydra, python)          |
|                                 |                                                              |
|                                 +------------------------------+                               |
|                                 |                              |                               |
|                          (DNS: UDP/TCP 53)              (TCP: Any Port)                        |
|                                 |                              |                               |
|                                 v                              v                               |
|                 [ IPTABLES NAT REDIRECTION ]    [ IPTABLES NAT REDIRECTION ]                   |
|                 Redirected to 127.0.0.1:5353    Redirected to 127.0.0.1:9040                   |
|                                 |                              |                               |
|                                 v                              v                               |
|                     [ Tor Daemon DNSPort ]          [ Tor Daemon TransPort ]                   |
|                     (Remote Onion Resolver)         (Transparent TCP Proxy)                    |
|                                 |                              |                               |
|                                 +--------------+---------------+                               |
|                                                |                                               |
|                                                v                                               |
|                             [ Tor Multipath Onion Circuit ]                                    |
|                                                |                                               |
|                                                v                                               |
|                             [ OpenVPN Tunnel (tun0) - Optional ]                               |
|                                                |                                               |
|   ===================== KERNEL FIREWALL KILL-SWITCH (iptables) =============================   |
|   * Drops 100% of non-Tor / non-VPN outbound packets (Hard Kill-Switch)                       |
|   * Drops 100% of IPv6 traffic (Input / Output / Forward)                                      |
|   * Locks /etc/resolv.conf and disables NetworkManager DNS overwrites                          |
|   * Enforces Mozilla Enterprise Policy (policies.json) disabling Firefox DNS-over-HTTPS (DoH)  |
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
                      (ISP only sees VPN/Tor)                       |
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
2. **Tor Transparent Proxying (System-Wide TransPort 9040):**
   - Automatically reconfigures `torrc` with `TransPort 127.0.0.1:9040`, `DNSPort 127.0.0.1:9053`, `VirtualAddrNetworkIPv4 10.192.0.0/10`, and `AutomapHostsOnResolve 1`.
   - Transparently intercepts all outbound TCP connections from any system application (browsers, scripts, CLI tools) and routes them through the Tor network without requiring manual proxy settings.
3. **Zero-Leak Tor DNS Resolution (DNSPort 9053):**
   - Redirects all port 53 DNS queries to Tor's anonymous remote resolver on port `9053` (isolated from system mDNS / kdeconnectd).
   - Prevents NetworkManager and DHCP from overriding `/etc/resolv.conf` by deploying a `dns=none` drop-in and setting the kernel immutable bit (`chattr +i`).
4. **Mozilla Enterprise Policy Hardening (Firefox DoH Killer):**
   - Automatically writes system-wide `/etc/firefox/policies/policies.json` disabling Firefox's **DNS-over-HTTPS (DoH)** feature.
   - Resolves the infamous *"Server Not Found"* error in Firefox by ensuring browser DNS lookups route through the Tor transparent resolver rather than attempting to reach Cloudflare over HTTPS.
5. **Dynamic Multi-Route VPN Failover Engine (15s Health Probe):**
   - Automatically harvests top-rated candidate OpenVPN relays across multiple mirrors.
   - Tests each candidate with a strict 15-second connectivity audit. If a node fails or times out, seamlessly fails over to the next best candidate.
6. **Tor Multipath Circuit Optimization & Instant Rotation (`--ghost-id`):**
   - Enforces optimal circuit build timeouts (`CircuitBuildTimeout 10`, `NumEntryGuards 3`) and verifies active internet throughput before locking the circuit.
   - Rotates circuits and generates brand-new exit node identities instantly on demand via the Tor ControlPort (`SIGNAL NEWNYM`).
6. **Automated ProxyChains4 Reconfiguration:**
   - Automatically parses and backs up `/etc/proxychains4.conf`.
   - Enables `dynamic_chain`, disables `strict_chain` and `random_chain`, enforces `proxy_dns`, and configures `socks5 127.0.0.1 9050`.
7. **Dynamic Free OpenVPN Integration:**
   - Interacts directly with live academic VPN feeds (VPN Gate API) to parse top-rated, low-ping relay servers worldwide.
   - Chained optionally before Tor for layered ISP concealment. Supports custom `.ovpn` files via `--vpn-config <path>`.
8. **Hardware MAC Address Cloaking:**
   - Discovers all active physical and wireless network adapters (e.g., `eth0`, `wlan0`, `enp*`, `wlp*`).
   - Automatically randomizes hardware MAC addresses with locally administered unicast identifiers (`02:xx:xx:xx:xx:xx`) and restores factory hardware addresses upon shutdown.
9. **Kernel-Level Kill-Switch (iptables):**
   - Completely drops all IPv6 traffic across all interfaces to eliminate IPv6 bypasses.
   - Drops all unencrypted outbound IPv4 traffic if the tunnel drops.
10. **Secure Browser Launcher (`--browser` / `--firefox`):**
    - Seamlessly spawns a hardened Firefox instance operating cleanly under the active desktop user via the transparent Tor proxy.

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
- Installs required system utilities (`tor`, `proxychains4`, `openvpn`, `macchanger`, `iptables`, `curl`, `dnsutils`, `e2fsprogs`).
- Installs Python 3.12+ dependencies (`rich`, `requests`, `urllib3`) adhering to PEP 668 standards.
- Pre-configures Tor TransPort, DNSPort, and ControlPort access in `/etc/tor/torrc`.
- Deploys binary wrappers to `/usr/bin/th3hubris` and `/usr/local/bin/th3hubris`.

---

## 💻 CLI Commands & Usage Guide

Th3hubris requires `sudo` privileges for low-level socket, packet filtering, and interface management.

| Command | Description |
| :--- | :--- |
| `sudo th3hubris --start` | **Full Chain Activation:** Spoofs MACs, locks DNS to Tor, applies Firefox DoH policy, starts Tor TransPort/DNSPort, arms Kill-Switch, and displays before/after IP matrix. |
| `sudo th3hubris --browser` | **Launch Hardened Browser:** Spawns Firefox as the active desktop user verified through Tor transparent proxy. |
| `sudo th3hubris --stop` | **Safe Recovery:** Disarms Kill-Switch, restores DNS, restores Firefox policies, restores ProxyChains, restores original MACs, and cleans temporary state. |
| `sudo th3hubris --ghost-id` | **Instant IP Rotation:** Discards current Tor circuits and acquires a brand-new exit identity (`SIGNAL NEWNYM`). |
| `sudo th3hubris --status` | **Posture Audit:** Displays active operational health, running tunnels, visible IP, ISP, and kill-switch state. |
| `sudo th3hubris --shell` | **Cloaked Sub-Shell:** Spawns an interactive bash terminal with all outbound traffic dynamically routed through ProxyChains. |
| `sudo th3hubris --start --no-vpn` | **Tor-Only Mode:** Activates transparent Tor proxy, DNS lock, MAC spoofing, and Kill-Switch without OpenVPN chaining. |
| `sudo th3hubris --start --vpn-config <path.ovpn>` | **Custom VPN Mode:** Uses a private or corporate `.ovpn` configuration file instead of dynamic public relays. |

---

## 🔍 Threat Model & Leak Prevention Analysis

| Threat Vector | Exposure Risk | How Th3hubris Mitigates It |
| :--- | :--- | :--- |
| **ISP Egress Logging** | ISP records destination IPs and DNS queries | Traffic is fully encapsulated inside Tor / OpenVPN; ISP only sees encrypted flows to Tor guards or VPN relays. |
| **DNS Leakage** | Applications query default ISP resolvers directly in plaintext | `/etc/resolv.conf` is locked to `127.0.0.1`, intercepted by iptables NAT, and resolved anonymously via Tor `DNSPort 5353`. |
| **Firefox DoH Bypass** | Firefox ignores system DNS and queries Cloudflare over HTTPS | Mozilla Enterprise Policy (`policies.json`) disables DNS-over-HTTPS system-wide, forcing standard Tor transparent DNS. |
| **IPv6 Bypass** | Dual-stack networks bypass IPv4 VPN/Tor rules | `ip6tables` policies are set to strict `DROP` on `INPUT`, `OUTPUT`, and `FORWARD`. |
| **Connection Drop (Real IP Leak)** | Tunnel collapses and apps reconnect over raw interface | Low-level kernel kill-switch drops any packet not routed through `tun0` or originating from Tor's UID. |
| **Local WiFi MAC Fingerprinting** | Captive portals and routers track device hardware ID | Active adapters have their MAC addresses randomized upon startup and restored upon clean exit. |

---

## 🇸🇦 ملخص شامل ودليل الاستخدام باللغة العربية (الإصدار 3.0.0)

### ما هي أداة Th3hubris؟
أداة **Th3hubris** هي جناح أمني وتكتيكي متكامل (All-in-One OPSEC Suite) تم تطويره وهندسته لخبراء الأمن السيبراني واختبار الاختراق على توزيعة **Kali Linux (إصدار 2026 Rolling)** باستخدام **Python 3.12+**. تقوم الأداة بأتمتة سلسلة التخفي وتأمين الاتصال بالكامل عبر **أمر واحد فقط** وفق أحدث معايير التوجيه الشفاف (Transparent Proxy) المعتمدة عالمياً في أدوات مثل `kalitorify` و `anonsurf`.

### 🌟 أبرز التحديثات والمميزات في الإصدار 3.0.0:
1. **التوجيه الشفاف لكامل النظام (Transparent Proxy):**
   - توجيه كافة اتصالات الـ TCP تلقائياً عبر منفذ Tor TransPort `9040` دون الحاجة لضبط البروكسي يدوياً في المتصفحات أو البرامج.
2. **حل مشكلة "Server Not Found" في متصفح Firefox:**
   - تعطيل ميزة DNS-over-HTTPS (DoH) تلقائياً عبر سياسات موزيلا للمؤسسات (`/etc/firefox/policies/policies.json`) لمنع المتصفح من تجاوز نظام الـ DNS الآمن لـ Tor.
3. **تأمين نظام أسماء النطاقات (Zero-Leak Tor DNS):**
   - إعادة توجيه كافة استعلامات الـ DNS (المنفذ 53) إلى منفذ Tor DNSPort `5353` عبر جدار الحماية، مع تعطيل قدرة NetworkManager على الكتابة فوق `/etc/resolv.conf` وقفل الملف بخاصية `chattr +i`.
4. **مفتاح القتل الصارم (Kernel Kill-Switch):**
   - قواعد `iptables` محكمة تسقط أي حزم بيانات غير مشفرة أو حزم IPv6 بشكل كامل لمنع أي تسريب حقيقي للـ IP.
5. **إطلاق آمن للمتصفح (`--browser`):**
   - أمر مباشر لتشغيل متصفح Firefox بهوية المستخدم الحالية ليعمل مباشرة وبكل سلاسة عبر شبكة Tor الشفافة.
6. **تغيير عنوان الماك (MAC Address Spoofing):**
   - كشف وتغيير عناوين الماك لكافة كروت الشبكة النشطة تلقائياً لتفادي التعقب على الشبكات المحلية والافتراضية.

### 📋 جدول أوامر التشغيل السريع:

```bash
# 1. تحديث المستودع وتثبيت البيئة المحدثة
cd ~/th3hubris
sudo th3hubris --stop
git pull
sudo bash install.sh

# 2. تشغيل منظومة التخفي الكاملة
sudo th3hubris --start

# 3. فتح متصفح Firefox الآمن وتصفح المواقع مباشرة
sudo th3hubris --browser

# 4. تغيير هوية ومسار Tor فوراً (حصول على IP جديد)
sudo th3hubris --ghost-id

# 5. فحص الحالة والـ IP الظاهر
sudo th3hubris --status

# 6. إيقاف الأداة واستعادة الوضع الافتراضي للشبكة
sudo th3hubris --stop
```

---

## ⚖️ Legal & Ethical Disclaimer

**IMPORTANT NOTICE:**
Th3hubris is created solely for educational purposes, authorized security testing, privacy defense research, and academic evaluations within networks where the operator has explicit, documented permission. 

The authors and contributors assume **NO LIABILITY** and are not responsible for any misuse, damage, or illegal activities conducted with this software. Always ensure strict compliance with local, national, and international laws before deployment.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).  
Copyright (c) 2026 **Th3hubris**. All Rights Reserved.
