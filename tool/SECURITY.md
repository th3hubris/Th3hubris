# Security Policy

## 🔒 Supported Versions

We take the security and integrity of **Th3hubris** very seriously. The following versions are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.6.x   | :white_check_mark: |
| < 2.5   | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or potential OPSEC leak (such as an unhandled IPv6 leakage, DNS fallback bypass, or race condition in iptables rules), please report it responsibly:

1. **DO NOT** create a public issue on GitHub.
2. Send an encrypted email or report to the security contact team at:
   `security@th3hubris.org` (or open a Private Security Advisory via GitHub's Security tab).
3. Include detailed steps to reproduce the leak or vulnerability:
   - Packet capture (PCAP) showing traffic egress outside the tunnel or proxy.
   - Operating system and kernel version (`uname -a`).
   - Relevant excerpts from system firewall logs.

We will acknowledge receipt within 24 hours and coordinate a patch within 72 hours.

---

## 🛡️ Threat Model & OPSEC Scope

Th3hubris is designed to mitigate:
- **ISP / Local Gateway Snooping**: Complete payload and metadata encryption via OpenVPN + Tor SOCKS5.
- **Hardware Tracking**: Physical and virtual MAC address cloaking.
- **DNS Hijacking & Leaks**: Immutable lock on trusted zero-knowledge DNS resolvers and ProxyChains `proxy_dns` interception.
- **Connection Drops**: Linux kernel-level Kill-Switch via `iptables`/`nftables` ensuring zero egress packets leave unencrypted.
- **IPv6 Leaks**: Complete drop of all incoming, outgoing, and forwarded IPv6 traffic.

*Note: Th3hubris does not protect against user-level operational negligence, such as logging into personally identifiable accounts (Google, Facebook, banking) within an anonymized session.*
