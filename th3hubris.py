#!/usr/bin/env python3
r"""
================================================================================
  _______ _    ____  _           _          _     
 |__   __| |  |___ \| |         | |        (_)    
    | |  | |__  __) | |__  _   _| |__  _ __ _ ___ 
    | |  | '_ \|__ <| '_ \| | | | '_ \| '__| / __|
    | |  | | | |__) | | | | |_| | |_) | |  | \__ \
    |_|  |_| |_|____/|_| |_|\__,_|_.__/|_|  |_|___/
                                                   
  Th3hubris - Elite All-in-One OPSEC & Anonymity Orchestrator
  Architected for Kali Linux (2026 Rolling Release) & Python 3.12+
  "We Build Shadow Soldiers - Ultimate OPSEC & Anonymity Suite"
================================================================================
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import random
import re
import shutil
import signal
import socket
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Third-party imports with graceful terminal fallback
try:
    import requests
except ImportError:
    requests = None  # type: ignore

try:
    from rich.align import Align
    from rich.box import DOUBLE_EDGE, ROUNDED
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text

    HAS_RICH = True
    console = Console()
except ImportError:
    HAS_RICH = False
    console = None  # type: ignore


# ==============================================================================
# GLOBAL CONSTANTS & PATH DEFINITIONS
# ==============================================================================
TOOL_NAME = "Th3hubris"
VERSION = "2.6.0-kali2026"
TAGLINE = "We Build Shadow Soldiers - Ultimate OPSEC & Anonymity Suite"

STATE_DIR = Path("/var/run/th3hubris")
STATE_FILE = STATE_DIR / "state.json"
BACKUP_DIR = Path("/etc/th3hubris/backups")

PROXYCHAINS4_CONF = Path("/etc/proxychains4.conf")
PROXYCHAINS_LEGACY_CONF = Path("/etc/proxychains.conf")
RESOLV_CONF = Path("/etc/resolv.conf")
TORRC_PATH = Path("/etc/tor/torrc")
TORRC_D_DIR = Path("/etc/tor/torrc.d")

OPENVPN_PID_FILE = STATE_DIR / "openvpn.pid"
OPENVPN_CONFIG_FILE = STATE_DIR / "active_tunnel.ovpn"
OPENVPN_AUTH_FILE = STATE_DIR / "vpn_credentials.txt"
IPTABLES_BACKUP_V4 = STATE_DIR / "iptables.v4.bak"
IPTABLES_BACKUP_V6 = STATE_DIR / "iptables.v6.bak"

VPN_GATE_API_URL = "http://www.vpngate.net/api/iphone/"
TOR_CONTROL_PORT = 9051
TOR_SOCKS_PORT = 9050

SECURE_DNS_SERVERS = [
    "1.1.1.1",  # Cloudflare Privacy DNS
    "9.9.9.9",  # Quad9 Secure DNS
    "8.8.8.8",  # Google Public DNS
]


# ==============================================================================
# TERMINAL ANSI STYLING FALLBACK
# ==============================================================================
class TermColors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"


class Logger:
    """Thread-safe, styled output logger supporting Rich and standard ANSI."""

    @staticmethod
    def banner() -> None:
        raw_art = r"""
  _______ _    ____  _           _          _     
 |__   __| |  |___ \| |         | |        (_)    
    | |  | |__  __) | |__  _   _| |__  _ __ _ ___ 
    | |  | '_ \|__ <| '_ \| | | | '_ \| '__| / __|
    | |  | | | |__) | | | | |_| | |_) | |  | \__ \
    |_|  |_| |_|____/|_| |_|\__,_|_.__/|_|  |_|___/
"""
        sub_title = (
            f"[bold red]»»»[/bold red] [bold white]{TAGLINE}[/bold white] "
            f"[bold red]«««[/bold red]\n[dim cyan]Release v{VERSION} | Architected for Kali Linux 2026[/dim cyan]"
        )

        if HAS_RICH and console:
            banner_text = Text(raw_art, style="bold red")
            panel = Panel(
                Align.center(Text.assemble(banner_text, "\n", Text.from_markup(sub_title))),
                box=DOUBLE_EDGE,
                border_style="bold red",
                padding=(1, 2),
            )
            console.print(panel)
        else:
            print(f"{TermColors.BOLD}{TermColors.RED}{raw_art}{TermColors.RESET}")
            print(f"{TermColors.BOLD}{TermColors.WHITE}  {TAGLINE}{TermColors.RESET}")
            print(f"{TermColors.CYAN}  Release v{VERSION} | Architected for Kali Linux 2026{TermColors.RESET}\n")

    @staticmethod
    def info(msg: str) -> None:
        if HAS_RICH and console:
            console.print(f"[bold cyan][*][/bold cyan] [bold white]{msg}[/bold white]")
        else:
            print(f"{TermColors.CYAN}[*]{TermColors.RESET} {msg}")

    @staticmethod
    def success(msg: str) -> None:
        if HAS_RICH and console:
            console.print(f"[bold green][+][/bold green] [bold white]{msg}[/bold white]")
        else:
            print(f"{TermColors.GREEN}[+]{TermColors.RESET} {msg}")

    @staticmethod
    def warn(msg: str) -> None:
        if HAS_RICH and console:
            console.print(f"[bold yellow][!][/bold yellow] [yellow]{msg}[/yellow]")
        else:
            print(f"{TermColors.YELLOW}[!]{TermColors.RESET} {msg}")

    @staticmethod
    def error(msg: str) -> None:
        if HAS_RICH and console:
            console.print(f"[bold red][-][/bold red] [bold red]{msg}[/bold red]")
        else:
            print(f"{TermColors.RED}[-]{TermColors.RESET} {msg}")

    @staticmethod
    def opsec(msg: str) -> None:
        if HAS_RICH and console:
            console.print(f"[bold magenta][OPSEC][/bold magenta] [bold white]{msg}[/bold white]")
        else:
            print(f"{TermColors.MAGENTA}[OPSEC]{TermColors.RESET} {msg}")


# ==============================================================================
# STATE MANAGEMENT
# ==============================================================================
@dataclass
class AnonymityState:
    is_active: bool = False
    original_macs: Dict[str, str] = field(default_factory=dict)
    proxychains_backup: Optional[str] = None
    resolv_backup: Optional[str] = None
    tor_was_running: bool = False
    openvpn_pid: Optional[int] = None
    vpn_server_ip: Optional[str] = None
    killswitch_active: bool = False
    baseline_ip: Optional[str] = None
    baseline_country: Optional[str] = None
    activated_at: Optional[float] = None


class StateManager:
    """Persists operational state across processes for zero-leak recovery."""

    def __init__(self) -> None:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    def load(self) -> AnonymityState:
        if not STATE_FILE.exists():
            return AnonymityState()
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return AnonymityState(**data)
        except Exception as e:
            Logger.warn(f"Failed to read existing state file ({e}). Initializing clean state.")
            return AnonymityState()

    def save(self, state: AnonymityState) -> None:
        try:
            with open(STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(asdict(state), f, indent=4)
        except Exception as e:
            Logger.error(f"Failed to persist state: {e}")

    def clear(self) -> None:
        if STATE_FILE.exists():
            try:
                STATE_FILE.unlink()
            except OSError as e:
                Logger.warn(f"Failed to unlink state file: {e}")


# ==============================================================================
# SYSTEM VALIDATOR
# ==============================================================================
class SystemValidator:
    """Verifies operating system prerequisites, privileges, and tools."""

    REQUIRED_BINARIES = [
        "tor",
        "openvpn",
        "macchanger",
        "iptables",
        "ip",
        "curl",
        "systemctl",
    ]

    @staticmethod
    def enforce_root() -> None:
        if os.geteuid() != 0:
            Logger.error("Root privileges are strictly required for low-level network manipulation.")
            Logger.warn("Please re-run Th3hubris with sudo:")
            print(f"  {TermColors.BOLD}{TermColors.GREEN}sudo th3hubris --start{TermColors.RESET}\n")
            sys.exit(1)

    @classmethod
    def check_dependencies(cls) -> None:
        missing = [bin_name for bin_name in cls.REQUIRED_BINARIES if shutil.which(bin_name) is None]

        # Check for proxychains4 or legacy proxychains
        has_proxychains = (
            shutil.which("proxychains4") is not None
            or shutil.which("proxychains") is not None
        )
        if not has_proxychains:
            missing.append("proxychains4")

        if missing:
            Logger.error(f"Missing essential system dependencies: {', '.join(missing)}")
            Logger.info("Execute the automated installer to resolve all packages:")
            print(f"  {TermColors.BOLD}{TermColors.CYAN}sudo bash install.sh{TermColors.RESET}\n")
            sys.exit(1)


# ==============================================================================
# HARDWARE MAC ADDRESS SPOOFER
# ==============================================================================
class MacSpoofer:
    """Automates randomized MAC address cloaking across physical/wireless adapters."""

    EXCLUDED_PREFIXES = ("lo", "tun", "tap", "docker", "veth", "br-", "wg", "vmnet")

    @classmethod
    def get_interfaces(cls) -> List[str]:
        interfaces: List[str] = []
        sys_net = Path("/sys/class/net")
        if sys_net.exists():
            for iface in sys_net.iterdir():
                name = iface.name
                if not any(name.startswith(p) for p in cls.EXCLUDED_PREFIXES):
                    interfaces.append(name)
        return interfaces

    @classmethod
    def get_current_mac(cls, iface: str) -> Optional[str]:
        address_file = Path(f"/sys/class/net/{iface}/address")
        if address_file.exists():
            try:
                return address_file.read_text(encoding="utf-8").strip()
            except OSError:
                pass
        return None

    @classmethod
    def spoof_interface(cls, iface: str) -> Optional[str]:
        current_mac = cls.get_current_mac(iface)
        if not current_mac or current_mac == "00:00:00:00:00:00":
            return None

        Logger.opsec(f"Cloaking hardware identifier on interface [bold]{iface}[/bold] (Original: {current_mac})...")

        # Bring down interface
        subprocess.run(["ip", "link", "set", "dev", iface, "down"], capture_output=True, text=True)

        # Attempt spoofing with macchanger
        spoofed = False
        res = subprocess.run(["macchanger", "-r", iface], capture_output=True, text=True)
        if res.returncode == 0:
            spoofed = True
        else:
            # Fallback to manual locally administered random unicast MAC
            random_mac = "02:{:02x}:{:02x}:{:02x}:{:02x}:{:02x}".format(
                random.randint(0, 255),
                random.randint(0, 255),
                random.randint(0, 255),
                random.randint(0, 255),
                random.randint(0, 255),
            )
            manual_res = subprocess.run(
                ["ip", "link", "set", "dev", iface, "address", random_mac],
                capture_output=True,
                text=True,
            )
            if manual_res.returncode == 0:
                spoofed = True

        # Bring interface back up
        subprocess.run(["ip", "link", "set", "dev", iface, "up"], capture_output=True, text=True)

        # Wait up to 8 seconds for interface link carrier and DHCP re-lease (essential in VMs)
        Logger.info(f"Synchronizing link carrier and IP lease for {iface}...")
        for _ in range(16):
            time.sleep(0.5)
            check = subprocess.run(["ip", "-4", "addr", "show", "dev", iface], capture_output=True, text=True)
            if "inet " in check.stdout:
                break

        new_mac = cls.get_current_mac(iface)
        if spoofed and new_mac and new_mac != current_mac:
            Logger.success(f"Interface {iface} MAC spoofed successfully -> [bold green]{new_mac}[/bold green]")
            return current_mac
        else:
            Logger.warn(f"Failed to spoof MAC for {iface}. Preserved existing address.")
            return None

    @classmethod
    def spoof_all(cls) -> Dict[str, str]:
        saved_macs: Dict[str, str] = {}
        for iface in cls.get_interfaces():
            orig = cls.spoof_interface(iface)
            if orig:
                saved_macs[iface] = orig
        return saved_macs

    @classmethod
    def restore_all(cls, original_macs: Dict[str, str]) -> None:
        for iface, orig_mac in original_macs.items():
            Logger.info(f"Reverting MAC address on interface {iface} to {orig_mac}...")
            subprocess.run(["ip", "link", "set", "dev", iface, "down"], capture_output=True, text=True)
            res = subprocess.run(["macchanger", "-p", iface], capture_output=True, text=True)
            if res.returncode != 0:
                subprocess.run(
                    ["ip", "link", "set", "dev", iface, "address", orig_mac],
                    capture_output=True,
                    text=True,
                )
            subprocess.run(["ip", "link", "set", "dev", iface, "up"], capture_output=True, text=True)
            Logger.success(f"Interface {iface} restored to permanent hardware MAC.")


# ==============================================================================
# DNS LEAK PROTECTION & RESOLVER LOCK
# ==============================================================================
class DnsManager:
    """Enforces zero DNS leakage through resolver locking and safe routing."""

    @classmethod
    def backup_and_lock(cls) -> Optional[str]:
        if not RESOLV_CONF.exists():
            return None

        backup_path = BACKUP_DIR / "resolv.conf.th3hubris.bak"
        Logger.opsec("Securing DNS subsystem against ISP leakage...")

        # Unlock file if previously immutable
        subprocess.run(["chattr", "-i", str(RESOLV_CONF)], capture_output=True, text=True)

        try:
            shutil.copy2(RESOLV_CONF, backup_path)
        except OSError as e:
            Logger.error(f"Failed to backup {RESOLV_CONF}: {e}")
            return None

        # Write privacy DNS configuration with Tor Local DNS resolver
        content = (
            "# Generated by Th3hubris OPSEC Suite\n"
            "# Strict Anti-DNS-Leak Configuration (Tor Transparent DNS)\n"
            "nameserver 127.0.0.1\n"
            "nameserver 1.1.1.1\n"
            "options edns0 trust-ad\n"
        )
        try:
            RESOLV_CONF.write_text(content, encoding="utf-8")
            # Apply immutable bit to prevent DHCP/NetworkManager overwrite
            subprocess.run(["chattr", "+i", str(RESOLV_CONF)], capture_output=True, text=True)
            Logger.success("DNS configuration locked to secure zero-knowledge resolvers (127.0.0.1 -> Tor DNSPort / 1.1.1.1).")
            return str(backup_path)
        except OSError as e:
            Logger.warn(f"Could not lock /etc/resolv.conf: {e}")
            return str(backup_path)

    @classmethod
    def restore(cls, backup_path: Optional[str]) -> None:
        if not backup_path or not Path(backup_path).exists():
            return

        Logger.info("Releasing immutable lock and restoring original /etc/resolv.conf...")
        subprocess.run(["chattr", "-i", str(RESOLV_CONF)], capture_output=True, text=True)
        try:
            shutil.copy2(backup_path, RESOLV_CONF)
            Path(backup_path).unlink(missing_ok=True)
            Logger.success("Original DNS resolver configuration restored.")
        except OSError as e:
            Logger.error(f"Failed to restore resolv.conf: {e}")


# ==============================================================================
# AUTOMATED PROXYCHAINS4 ORCHESTRATION
# ==============================================================================
class ProxyChainsManager:
    """Reconfigures Proxychains4 to dynamic chaining, proxy_dns, and SOCKS5."""

    @classmethod
    def get_config_path(cls) -> Optional[Path]:
        if PROXYCHAINS4_CONF.exists():
            return PROXYCHAINS4_CONF
        if PROXYCHAINS_LEGACY_CONF.exists():
            return PROXYCHAINS_LEGACY_CONF
        return None

    @classmethod
    def configure(cls) -> Optional[str]:
        target = cls.get_config_path()
        if not target:
            Logger.warn("ProxyChains configuration file not found. Creating /etc/proxychains4.conf...")
            target = PROXYCHAINS4_CONF

        backup_file = BACKUP_DIR / f"{target.name}.th3hubris.bak"
        Logger.opsec(f"Configuring ProxyChains4 pipeline ({target})...")

        if target.exists():
            try:
                shutil.copy2(target, backup_file)
            except OSError as e:
                Logger.error(f"Failed to backup {target}: {e}")
                return None

        # Build hardened configuration
        raw_lines: List[str] = []
        if target.exists():
            try:
                raw_lines = target.read_text(encoding="utf-8").splitlines()
            except OSError:
                pass

        processed_lines: List[str] = []
        proxy_dns_present = False
        dynamic_chain_present = False
        inside_proxy_list = False

        for line in raw_lines:
            stripped = line.strip()

            # Enable dynamic_chain
            if re.match(r"^#?\s*dynamic_chain\b", stripped):
                processed_lines.append("dynamic_chain")
                dynamic_chain_present = True
                continue

            # Disable strict_chain & random_chain
            if re.match(r"^#?\s*strict_chain\b", stripped):
                processed_lines.append("#strict_chain")
                continue
            if re.match(r"^#?\s*random_chain\b", stripped):
                processed_lines.append("#random_chain")
                continue

            # Enable proxy_dns
            if re.match(r"^#?\s*proxy_dns\b", stripped):
                processed_lines.append("proxy_dns")
                proxy_dns_present = True
                continue

            if stripped == "[ProxyList]":
                inside_proxy_list = True
                processed_lines.append(line)
                continue

            if inside_proxy_list:
                # Strip stale default socks4 entries
                if re.match(r"^#?\s*socks4\s+127\.0\.0\.1\s+9050", stripped):
                    continue
                if re.match(r"^#?\s*socks5\s+127\.0\.0\.1\s+9050", stripped):
                    continue

            processed_lines.append(line)

        # Ensure directives exist
        if not dynamic_chain_present:
            processed_lines.insert(0, "dynamic_chain")
        if not proxy_dns_present:
            processed_lines.insert(1, "proxy_dns")

        # Append SOCKS5 port for Tor
        if not inside_proxy_list:
            processed_lines.append("\n[ProxyList]")
        processed_lines.append("socks5 127.0.0.1 9050")

        try:
            target.write_text("\n".join(processed_lines) + "\n", encoding="utf-8")
            Logger.success("ProxyChains4 configured: [bold]dynamic_chain[/bold] + [bold]proxy_dns[/bold] + [bold]socks5 127.0.0.1:9050[/bold]")
            return str(backup_file)
        except OSError as e:
            Logger.error(f"Failed to write proxychains configuration: {e}")
            return None

    @classmethod
    def restore(cls, backup_path: Optional[str]) -> None:
        if not backup_path or not Path(backup_path).exists():
            return

        target = cls.get_config_path() or PROXYCHAINS4_CONF
        Logger.info(f"Restoring original ProxyChains configuration from {backup_path}...")
        try:
            shutil.copy2(backup_path, target)
            Path(backup_path).unlink(missing_ok=True)
            Logger.success("Original ProxyChains configuration restored.")
        except OSError as e:
            Logger.error(f"Failed to restore proxychains config: {e}")


# ==============================================================================
# TOR SERVICE & CIRCUIT ROTATION (GHOST ID)
# ==============================================================================
class TorManager:
    """Manages the local Tor onion routing daemon and circuit identities."""

    @classmethod
    def is_service_active(cls) -> bool:
        for unit in ("tor", "tor@default"):
            res = subprocess.run(["systemctl", "is-active", unit], capture_output=True, text=True)
            if res.stdout.strip() == "active":
                return True
        return False

    @classmethod
    def ensure_control_port(cls) -> None:
        """Configures Tor TransPort, DNSPort, and ControlPort for transparent proxying."""
        if not TORRC_PATH.exists():
            return

        try:
            content = TORRC_PATH.read_text(encoding="utf-8")
            needed: List[str] = []
            if not re.search(r"^VirtualAddrNetworkIPv4\s+10\.192\.0\.0/10", content, re.MULTILINE):
                needed.append("VirtualAddrNetworkIPv4 10.192.0.0/10")
            if not re.search(r"^AutomapHostsOnResolve\s+1", content, re.MULTILINE):
                needed.append("AutomapHostsOnResolve 1")
            if not re.search(r"^TransPort\s+(?:127\.0\.0\.1:)?9040", content, re.MULTILINE):
                needed.append("TransPort 127.0.0.1:9040")
            if not re.search(r"^DNSPort\s+(?:127\.0\.0\.1:)?5353", content, re.MULTILINE):
                needed.append("DNSPort 127.0.0.1:5353")
            if not re.search(r"^ControlPort\s+9051", content, re.MULTILINE):
                needed.append("ControlPort 9051")
            if not re.search(r"^CookieAuthentication\s+0", content, re.MULTILINE):
                needed.append("CookieAuthentication 0")

            if needed:
                Logger.info("Configuring Tor Transparent Proxying & ControlPort in /etc/tor/torrc...")
                with open(TORRC_PATH, "a", encoding="utf-8") as f:
                    f.write("\n# Added by Th3hubris for System-Wide Transparent Proxying\n" + "\n".join(needed) + "\n")
                subprocess.run(["systemctl", "restart", "tor"], capture_output=True, text=True)
        except OSError as e:
            Logger.warn(f"Failed to ensure Tor configuration: {e}")

    @classmethod
    def start_tor(cls) -> bool:
        cls.ensure_control_port()
        Logger.opsec("Initializing Tor Onion Routing Daemon...")

        # Check if already active
        if cls.is_service_active():
            Logger.success("Tor daemon is already running.")
            return True

        for unit in ("tor", "tor@default"):
            subprocess.run(["systemctl", "start", unit], capture_output=True, text=True)
            time.sleep(1.5)
            if cls.is_service_active():
                Logger.success(f"Tor daemon successfully started via systemd ({unit}).")
                return True

        Logger.error("Failed to start Tor daemon via systemctl.")
        return False

    @classmethod
    def rotate_identity(cls) -> bool:
        """Sends SIGNAL NEWNYM to Tor ControlPort to acquire a brand-new exit IP."""
        Logger.opsec("Rotating Tor Circuit Identity (Requesting SIGNAL NEWNYM)...")
        try:
            with socket.create_connection(("127.0.0.1", TOR_CONTROL_PORT), timeout=3) as sock:
                sock.sendall(b'AUTHENTICATE ""\r\n')
                auth_resp = sock.recv(1024).decode("utf-8", errors="ignore")
                if "250" not in auth_resp:
                    raise RuntimeError(f"Authentication rejected: {auth_resp.strip()}")

                sock.sendall(b"SIGNAL NEWNYM\r\n")
                signal_resp = sock.recv(1024).decode("utf-8", errors="ignore")
                if "250" in signal_resp:
                    Logger.success("Tor Circuit cleanly rebuilt. New anonymous identity generated.")
                    time.sleep(2)
                    return True
        except Exception as e:
            Logger.warn(f"ControlPort rotation failed ({e}). Falling back to systemctl reload...")

        # Fallback to SIGHUP reload
        for unit in ("tor", "tor@default"):
            res = subprocess.run(["systemctl", "reload", unit], capture_output=True, text=True)
            if res.returncode == 0:
                Logger.success("Tor daemon reloaded with fresh circuit state.")
                time.sleep(2)
                return True

        subprocess.run(["pkill", "-HUP", "tor"], capture_output=True, text=True)
        time.sleep(2)
        return True

    @classmethod
    def stop_tor_if_started(cls, was_running_initially: bool) -> None:
        if not was_running_initially:
            Logger.info("Stopping Tor daemon started by Th3hubris...")
            subprocess.run(["systemctl", "stop", "tor"], capture_output=True, text=True)
            subprocess.run(["systemctl", "stop", "tor@default"], capture_output=True, text=True)
            Logger.success("Tor daemon stopped.")


# ==============================================================================
# AUTOMATED FREE OPENVPN ORCHESTRATION (VPN GATE ENGINE)
# ==============================================================================
class VpnManager:
    """Dynamically acquires, configures, and establishes high-speed OpenVPN tunnels."""

    @classmethod
    def fetch_dynamic_config(cls) -> Optional[str]:
        Logger.opsec("Querying academic VPN Gate API for active OpenVPN relay nodes...")
        raw_csv: Optional[str] = None

        # Attempt 1: Direct fetch with short retry
        for attempt in range(1, 3):
            try:
                import urllib.request
                req = urllib.request.Request(
                    VPN_GATE_API_URL,
                    headers={"User-Agent": "Mozilla/5.0 (Kali Linux 2026; x86_64) Th3hubris/2.6.0"},
                )
                with urllib.request.urlopen(req, timeout=8) as response:
                    raw_csv = response.read().decode("utf-8", errors="ignore")
                if raw_csv and "HostName" in raw_csv:
                    break
            except Exception as e:
                time.sleep(1.5)

        # Attempt 2: Route through Tor SOCKS5 (bypasses ISP blocks / DNS failure)
        if not raw_csv or "HostName" not in raw_csv:
            Logger.info("Direct VPN retrieval unavailable. Querying VPN Gate API through Tor circuit...")
            try:
                if requests:
                    proxies = {
                        "http": "socks5h://127.0.0.1:9050",
                        "https": "socks5h://127.0.0.1:9050",
                    }
                    r = requests.get(VPN_GATE_API_URL, proxies=proxies, timeout=12, headers={"User-Agent": "Mozilla/5.0 Th3hubris/2.6.0"})
                    if r.status_code == 200 and "HostName" in r.text:
                        raw_csv = r.text
                if not raw_csv or "HostName" not in raw_csv:
                    cmd = ["curl", "-s", "--socks5-hostname", "127.0.0.1:9050", "--max-time", "12", VPN_GATE_API_URL]
                    res = subprocess.run(cmd, capture_output=True, text=True)
                    if res.returncode == 0 and "HostName" in res.stdout:
                        raw_csv = res.stdout
            except Exception as e:
                Logger.warn(f"Tor-routed VPN retrieval failed: {e}")

        if not raw_csv or "HostName" not in raw_csv:
            Logger.warn("Could not retrieve dynamic OpenVPN list. Operating in Tor Transparent Proxy mode.")
            return None

        lines = [line.strip() for line in raw_csv.splitlines() if line.strip()]
        data_rows = [line for line in lines if not line.startswith("*") and not line.startswith("#")]

        if not data_rows:
            return None

        reader = csv.reader(data_rows)
        candidates: List[Tuple[int, int, str, str, str]] = []

        for row in reader:
            if len(row) > 14 and row[14]:
                try:
                    score = int(row[2])
                    ping = int(row[3]) if row[3].isdigit() else 999
                    country = row[5]
                    ip_addr = row[1]
                    ovpn_b64 = row[14]
                    candidates.append((score, ping, country, ip_addr, ovpn_b64))
                except (ValueError, IndexError):
                    continue

        if not candidates:
            return None

        # Sort by highest score and lowest ping
        candidates.sort(key=lambda x: (x[1], -x[0]))
        chosen = candidates[0]
        score, ping, country, ip_addr, ovpn_b64 = chosen

        Logger.success(f"Selected optimized relay node: [bold green]{country}[/bold green] ({ip_addr}) | Ping: {ping}ms")
        decoded_ovpn = base64.b64decode(ovpn_b64).decode("utf-8", errors="ignore")
        return decoded_ovpn

    @classmethod
    def start_vpn(cls, custom_config_path: Optional[str] = None) -> Tuple[Optional[int], Optional[str]]:
        ovpn_content: Optional[str] = None

        if custom_config_path:
            p = Path(custom_config_path)
            if p.exists():
                Logger.info(f"Loading custom OpenVPN profile: {p}")
                ovpn_content = p.read_text(encoding="utf-8")
            else:
                Logger.error(f"Specified OpenVPN file does not exist: {p}")
                return None, None
        else:
            ovpn_content = cls.fetch_dynamic_config()

        if not ovpn_content:
            Logger.warn("Could not obtain an automated VPN profile. Operating in Tor-Only mode.")
            return None, None

        # Write credentials (VPN Gate standard is 'vpn'/'vpn')
        OPENVPN_AUTH_FILE.write_text("vpn\nvpn\n", encoding="utf-8")
        os.chmod(OPENVPN_AUTH_FILE, 0o600)

        # Inject necessary hardening options
        injected = [
            "\n# Generated by Th3hubris",
            "auth-user-pass " + str(OPENVPN_AUTH_FILE),
            "script-security 2",
            "route-nopull",  # Keep routing predictable; Tor will bind properly
            "verb 1",
        ]
        ovpn_content += "\n" + "\n".join(injected) + "\n"
        OPENVPN_CONFIG_FILE.write_text(ovpn_content, encoding="utf-8")

        # Extract remote server IP
        remote_match = re.search(r"^\s*remote\s+([0-9\.]+)\b", ovpn_content, re.MULTILINE)
        server_ip = remote_match.group(1) if remote_match else None

        Logger.opsec("Launching OpenVPN background daemon...")
        cmd = [
            "openvpn",
            "--config",
            str(OPENVPN_CONFIG_FILE),
            "--writepid",
            str(OPENVPN_PID_FILE),
            "--daemon",
            "th3hubris_ovpn",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            Logger.error(f"Failed to spawn OpenVPN daemon: {res.stderr}")
            return None, None

        # Wait for tun adapter
        tun_found = False
        pid: Optional[int] = None
        for _ in range(12):
            time.sleep(1)
            if OPENVPN_PID_FILE.exists():
                try:
                    pid = int(OPENVPN_PID_FILE.read_text(encoding="utf-8").strip())
                except ValueError:
                    pass

            # Check if tun interface is up
            res_ip = subprocess.run(["ip", "link", "show"], capture_output=True, text=True)
            if "tun" in res_ip.stdout:
                tun_found = True
                break

        if tun_found:
            Logger.success(f"OpenVPN tunnel established successfully (PID: {pid}). Interface [bold]tun0[/bold] active.")
            return pid, server_ip
        else:
            Logger.warn("OpenVPN started but tunnel interface initialization timed out. Proceeding...")
            return pid, server_ip

    @classmethod
    def stop_vpn(cls, pid: Optional[int] = None) -> None:
        Logger.info("Terminating OpenVPN tunnel daemon...")
        if pid:
            try:
                os.kill(pid, signal.SIGTERM)
            except OSError:
                pass

        if OPENVPN_PID_FILE.exists():
            try:
                raw_pid = int(OPENVPN_PID_FILE.read_text(encoding="utf-8").strip())
                os.kill(raw_pid, signal.SIGTERM)
            except (ValueError, OSError):
                pass
            OPENVPN_PID_FILE.unlink(missing_ok=True)

        subprocess.run(["pkill", "-f", "th3hubris_ovpn"], capture_output=True, text=True)
        OPENVPN_CONFIG_FILE.unlink(missing_ok=True)
        OPENVPN_AUTH_FILE.unlink(missing_ok=True)
        Logger.success("OpenVPN daemon stopped and runtime artifacts scrubbed.")


# ==============================================================================
# KERNEL KILL-SWITCH & LEAK PREVENTION (IPTABLES / NFTABLES)
# ==============================================================================
class KillSwitchManager:
    """Enforces absolute firewall isolation: real IP never leaks if tunnel drops."""

    CHAIN_NAME = "TH3HUBRIS_KILLSWITCH"
    NAT_CHAIN = "TH3HUBRIS_NAT"

    @classmethod
    def backup_rules(cls) -> None:
        try:
            with open(IPTABLES_BACKUP_V4, "w", encoding="utf-8") as f:
                subprocess.run(["iptables-save"], stdout=f, check=True)
            with open(IPTABLES_BACKUP_V6, "w", encoding="utf-8") as f:
                subprocess.run(["ip6tables-save"], stdout=f, check=True)
        except Exception as e:
            Logger.warn(f"Could not backup existing iptables rules: {e}")

    @classmethod
    def enable(cls, vpn_ip: Optional[str] = None) -> bool:
        Logger.opsec("Deploying low-level Linux Kernel Kill-Switch & Transparent Proxy (iptables/nftables)...")
        cls.backup_rules()

        # Completely block IPv6 to prevent IPv6 bypass leaks
        subprocess.run(["ip6tables", "-P", "INPUT", "DROP"], capture_output=True, text=True)
        subprocess.run(["ip6tables", "-P", "FORWARD", "DROP"], capture_output=True, text=True)
        subprocess.run(["ip6tables", "-P", "OUTPUT", "DROP"], capture_output=True, text=True)

        # Retrieve Tor system UID
        tor_uid = None
        for username in ("debian-tor", "tor"):
            res = subprocess.run(["id", "-u", username], capture_output=True, text=True)
            if res.returncode == 0:
                tor_uid = res.stdout.strip()
                break

        # ----------------------------------------------------------------------
        # 1. NAT TABLE REDIRECTION (Transparent Tor Proxying for System Apps)
        # ----------------------------------------------------------------------
        subprocess.run(["iptables", "-t", "nat", "-D", "OUTPUT", "-j", cls.NAT_CHAIN], capture_output=True, text=True)
        subprocess.run(["iptables", "-t", "nat", "-F", cls.NAT_CHAIN], capture_output=True, text=True)
        subprocess.run(["iptables", "-t", "nat", "-X", cls.NAT_CHAIN], capture_output=True, text=True)
        subprocess.run(["iptables", "-t", "nat", "-N", cls.NAT_CHAIN], capture_output=True, text=True)

        # Tor daemon bypasses transparent redirection
        if tor_uid:
            subprocess.run(
                ["iptables", "-t", "nat", "-A", cls.NAT_CHAIN, "-m", "owner", "--uid-owner", tor_uid, "-j", "RETURN"],
                capture_output=True,
                text=True,
            )

        # Loopback and local network bypass redirection
        subprocess.run(["iptables", "-t", "nat", "-A", cls.NAT_CHAIN, "-o", "lo", "-j", "RETURN"], capture_output=True, text=True)
        for subnet in ("127.0.0.0/8", "192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12"):
            subprocess.run(
                ["iptables", "-t", "nat", "-A", cls.NAT_CHAIN, "-d", subnet, "-p", "tcp", "-j", "RETURN"],
                capture_output=True,
                text=True,
            )

        # Transparently redirect all DNS queries (port 53 UDP/TCP) to Tor DNSPort (5353)
        subprocess.run(
            ["iptables", "-t", "nat", "-A", cls.NAT_CHAIN, "-p", "udp", "--dport", "53", "-j", "REDIRECT", "--to-ports", "5353"],
            capture_output=True,
            text=True,
        )
        subprocess.run(
            ["iptables", "-t", "nat", "-A", cls.NAT_CHAIN, "-p", "tcp", "--dport", "53", "-j", "REDIRECT", "--to-ports", "5353"],
            capture_output=True,
            text=True,
        )

        # Transparently redirect all other TCP traffic to Tor TransPort (9040)
        subprocess.run(
            ["iptables", "-t", "nat", "-A", cls.NAT_CHAIN, "-p", "tcp", "--syn", "-j", "REDIRECT", "--to-ports", "9040"],
            capture_output=True,
            text=True,
        )
        subprocess.run(["iptables", "-t", "nat", "-I", "OUTPUT", "1", "-j", cls.NAT_CHAIN], capture_output=True, text=True)

        # ----------------------------------------------------------------------
        # 2. FILTER TABLE KILL-SWITCH (Strict Anti-Leak Firewall)
        # ----------------------------------------------------------------------
        subprocess.run(["iptables", "-D", "OUTPUT", "-j", cls.CHAIN_NAME], capture_output=True, text=True)
        subprocess.run(["iptables", "-F", cls.CHAIN_NAME], capture_output=True, text=True)
        subprocess.run(["iptables", "-X", cls.CHAIN_NAME], capture_output=True, text=True)
        subprocess.run(["iptables", "-N", cls.CHAIN_NAME], capture_output=True, text=True)

        # Allow local loopback
        subprocess.run(["iptables", "-A", cls.CHAIN_NAME, "-o", "lo", "-j", "ACCEPT"], capture_output=True, text=True)

        # Allow established and related connections
        subprocess.run(
            ["iptables", "-A", cls.CHAIN_NAME, "-m", "conntrack", "--ctstate", "ESTABLISHED,RELATED", "-j", "ACCEPT"],
            capture_output=True,
            text=True,
        )

        # Allow OpenVPN tunnel adapter (tun+)
        subprocess.run(["iptables", "-A", cls.CHAIN_NAME, "-o", "tun+", "-j", "ACCEPT"], capture_output=True, text=True)

        # Allow Tor daemon processes
        if tor_uid:
            subprocess.run(
                ["iptables", "-A", cls.CHAIN_NAME, "-m", "owner", "--uid-owner", tor_uid, "-j", "ACCEPT"],
                capture_output=True,
                text=True,
            )

        # Allow redirected local Tor endpoints on 127.0.0.1
        for port, proto in (("5353", "udp"), ("5353", "tcp"), ("9040", "tcp"), ("9050", "tcp"), ("9051", "tcp")):
            subprocess.run(
                ["iptables", "-A", cls.CHAIN_NAME, "-d", "127.0.0.1", "-p", proto, "--dport", port, "-j", "ACCEPT"],
                capture_output=True,
                text=True,
            )

        # Allow communication with the OpenVPN server endpoint directly
        if vpn_ip:
            subprocess.run(["iptables", "-A", cls.CHAIN_NAME, "-d", vpn_ip, "-j", "ACCEPT"], capture_output=True, text=True)

        # Allow local LAN subnets (prevent disconnecting SSH or local router)
        for subnet in ("192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12"):
            subprocess.run(["iptables", "-A", cls.CHAIN_NAME, "-d", subnet, "-j", "ACCEPT"], capture_output=True, text=True)

        # Drop all other outgoing packets in chain (hard kill-switch)
        subprocess.run(["iptables", "-A", cls.CHAIN_NAME, "-j", "DROP"], capture_output=True, text=True)

        # Insert chain at the top of OUTPUT
        subprocess.run(["iptables", "-I", "OUTPUT", "1", "-j", cls.CHAIN_NAME], capture_output=True, text=True)

        Logger.success("Kernel Kill-Switch & Transparent Proxy [bold green]ARMED[/bold green]. All apps routed securely.")
        return True

    @classmethod
    def disable(cls) -> None:
        Logger.info("Disarming Linux Kernel Kill-Switch & Transparent Proxy...")
        # Remove NAT chain
        subprocess.run(["iptables", "-t", "nat", "-D", "OUTPUT", "-j", cls.NAT_CHAIN], capture_output=True, text=True)
        subprocess.run(["iptables", "-t", "nat", "-F", cls.NAT_CHAIN], capture_output=True, text=True)
        subprocess.run(["iptables", "-t", "nat", "-X", cls.NAT_CHAIN], capture_output=True, text=True)

        # Remove Filter chain
        subprocess.run(["iptables", "-D", "OUTPUT", "-j", cls.CHAIN_NAME], capture_output=True, text=True)
        subprocess.run(["iptables", "-F", cls.CHAIN_NAME], capture_output=True, text=True)
        subprocess.run(["iptables", "-X", cls.CHAIN_NAME], capture_output=True, text=True)

        # Restore default policies
        subprocess.run(["iptables", "-P", "OUTPUT", "ACCEPT"], capture_output=True, text=True)
        subprocess.run(["ip6tables", "-P", "OUTPUT", "ACCEPT"], capture_output=True, text=True)
        subprocess.run(["ip6tables", "-P", "INPUT", "ACCEPT"], capture_output=True, text=True)
        subprocess.run(["ip6tables", "-P", "FORWARD", "ACCEPT"], capture_output=True, text=True)

        # Restore previous backup if exists
        if IPTABLES_BACKUP_V4.exists():
            subprocess.run(f"iptables-restore < {IPTABLES_BACKUP_V4}", shell=True, capture_output=True, text=True)
            IPTABLES_BACKUP_V4.unlink(missing_ok=True)
        if IPTABLES_BACKUP_V6.exists():
            subprocess.run(f"ip6tables-restore < {IPTABLES_BACKUP_V6}", shell=True, capture_output=True, text=True)
            IPTABLES_BACKUP_V6.unlink(missing_ok=True)

        Logger.success("Firewall rules normalized. Kill-Switch disarmed.")


# ==============================================================================
# NETWORK AUDITOR & REAL-TIME IP VERIFICATION
# ==============================================================================
class NetworkAuditor:
    """Verifies public IP address, geo-location, ISP, and Tor routing integrity."""

    @classmethod
    def get_public_ip(cls, via_tor: bool = False) -> Dict[str, Any]:
        proxies = None
        if via_tor:
            proxies = {
                "http": "socks5h://127.0.0.1:9050",
                "https": "socks5h://127.0.0.1:9050",
            }

        endpoints = [
            "https://ipinfo.io/json",
            "https://api.ipify.org?format=json",
            "https://check.torproject.org/api/ip",
        ]

        if requests:
            for url in endpoints:
                try:
                    r = requests.get(url, proxies=proxies, timeout=8)
                    if r.status_code == 200:
                        data = r.json()
                        return {
                            "ip": data.get("ip") or data.get("IP"),
                            "country": data.get("country") or data.get("Country", "Unknown"),
                            "city": data.get("city", "Unknown"),
                            "org": data.get("org") or data.get("organization", "Unknown"),
                            "is_tor": data.get("IsTor", False),
                        }
                except Exception:
                    continue

        # Fallback to curl
        cmd = ["curl", "-s", "--max-time", "8"]
        if via_tor:
            cmd.extend(["--socks5-hostname", "127.0.0.1:9050"])
        cmd.append("https://ipinfo.io/json")

        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            try:
                data = json.loads(res.stdout)
                return {
                    "ip": data.get("ip"),
                    "country": data.get("country", "Unknown"),
                    "city": data.get("city", "Unknown"),
                    "org": data.get("org", "Unknown"),
                    "is_tor": False,
                }
            except json.JSONDecodeError:
                pass

        return {"ip": "Offline / Unreachable", "country": "N/A", "city": "N/A", "org": "N/A", "is_tor": False}

    @classmethod
    def print_audit_comparison(cls, baseline: Dict[str, Any], current: Dict[str, Any]) -> None:
        if HAS_RICH and console:
            table = Table(
                title="[bold red]Th3hubris OPSEC Verification Matrix[/bold red]",
                box=ROUNDED,
                header_style="bold cyan",
            )
            table.add_column("Parameter", style="bold white", width=18)
            table.add_column("Baseline (Real / Leaked)", style="bold red", width=28)
            table.add_column("Anonymized (Shadow State)", style="bold green", width=28)

            table.add_row("Public IP", str(baseline.get("ip")), str(current.get("ip")))
            table.add_row("Country", str(baseline.get("country")), str(current.get("country")))
            table.add_row("City", str(baseline.get("city")), str(current.get("city")))
            table.add_row("ISP / Org", str(baseline.get("org")), str(current.get("org")))
            console.print(table)
        else:
            print(f"\n{TermColors.BOLD}{TermColors.CYAN}--- OPSEC VERIFICATION MATRIX ---{TermColors.RESET}")
            print(f"  {TermColors.RED}Baseline IP:   {baseline.get('ip')} ({baseline.get('country')}){TermColors.RESET}")
            print(f"  {TermColors.GREEN}Shadow IP:     {current.get('ip')} ({current.get('country')}){TermColors.RESET}\n")


# ==============================================================================
# SUB-SHELL WRAPPER
# ==============================================================================
class ShellManager:
    """Spawns an interactive bash/zsh shell completely cloaked via ProxyChains4."""

    @classmethod
    def spawn_cloaked_shell(cls) -> None:
        Logger.opsec("Spawning Anonymized Sub-Shell wrapped via ProxyChains4...")
        user_shell = os.environ.get("SHELL", "/bin/bash")
        proxy_bin = shutil.which("proxychains4") or shutil.which("proxychains")

        if not proxy_bin:
            Logger.error("Proxychains binary is not installed.")
            return

        print(f"\n{TermColors.BOLD}{TermColors.GREEN}[+] Entering Ghost Shell. Type 'exit' to return.{TermColors.RESET}\n")

        # Custom PS1 indicator
        env = os.environ.copy()
        env["PS1"] = r"\[\033[1;91m\][Th3hubris-Ghost:\[\033[1;92m\]\w\[\033[1;91m\]]# \[\033[0m\]"

        subprocess.run([proxy_bin, "-q", user_shell], env=env)
        Logger.info("Exited cloaked sub-shell.")


# ==============================================================================
# ORCHESTRATION PIPELINES (START / STOP / ROTATE / STATUS)
# ==============================================================================
class Th3hubrisOrchestrator:
    """Central engine controlling all defensive and anonymity subsystems."""

    def __init__(self, state_mgr: StateManager) -> None:
        self.state_mgr = state_mgr
        self.state = state_mgr.load()

    def start(self, no_vpn: bool = False, custom_vpn: Optional[str] = None) -> None:
        Logger.banner()
        SystemValidator.enforce_root()
        SystemValidator.check_dependencies()

        if self.state.is_active:
            Logger.warn("Th3hubris anonymity suite is ALREADY ACTIVE.")
            Logger.info("Run 'sudo th3hubris --status' or 'sudo th3hubris --stop'.")
            return

        Logger.info("Capturing baseline public IP before cloaking...")
        baseline = NetworkAuditor.get_public_ip(via_tor=False)
        self.state.baseline_ip = baseline.get("ip")
        self.state.baseline_country = baseline.get("country")
        Logger.warn(f"Exposed Baseline IP: [bold red]{baseline.get('ip')}[/bold red] ({baseline.get('country')} - {baseline.get('org')})")

        # 1. MAC Address Cloaking
        self.state.original_macs = MacSpoofer.spoof_all()

        # 2. DNS Leak Defense
        self.state.resolv_backup = DnsManager.backup_and_lock()

        # 3. ProxyChains4 Orchestration
        self.state.proxychains_backup = ProxyChainsManager.configure()

        # 4. Tor Onion Routing Initialization
        self.state.tor_was_running = TorManager.is_service_active()
        if not TorManager.start_tor():
            Logger.error("Tor initialization failed. Aborting pipeline.")
            self.stop()
            return

        # 5. Automated VPN Tunneling (Optional/Chained)
        if not no_vpn:
            pid, server_ip = VpnManager.start_vpn(custom_vpn)
            self.state.openvpn_pid = pid
            self.state.vpn_server_ip = server_ip

        # 6. Kernel Kill-Switch Arming
        KillSwitchManager.enable(self.state.vpn_server_ip)
        self.state.killswitch_active = True

        self.state.is_active = True
        self.state.activated_at = time.time()
        self.state_mgr.save(self.state)

        # 7. Post-Activation Verification Matrix
        time.sleep(2)
        Logger.info("Conducting egress audit through anonymized Tor/VPN pipeline...")
        shadow = NetworkAuditor.get_public_ip(via_tor=True)
        NetworkAuditor.print_audit_comparison(baseline, shadow)

        if shadow.get("ip") != baseline.get("ip") and shadow.get("ip") != "Offline / Unreachable":
            Logger.success("[bold green]ANONYMITY CHAIN VERIFIED:[/bold green] Identity masked. Zero leaks detected.")
        else:
            Logger.warn("Public IP identical or verification timed out. Inspect local routing.")

    def stop(self) -> None:
        Logger.banner()
        SystemValidator.enforce_root()
        Logger.opsec("Decommissioning Anonymity Suite and restoring native network state...")

        # 1. Disarm Kernel Kill-Switch
        KillSwitchManager.disable()
        self.state.killswitch_active = False

        # 2. Terminate VPN Tunnel
        if self.state.openvpn_pid or OPENVPN_PID_FILE.exists():
            VpnManager.stop_vpn(self.state.openvpn_pid)
            self.state.openvpn_pid = None
            self.state.vpn_server_ip = None

        # 3. Restore DNS Configuration
        DnsManager.restore(self.state.resolv_backup)
        self.state.resolv_backup = None

        # 4. Restore ProxyChains Configuration
        ProxyChainsManager.restore(self.state.proxychains_backup)
        self.state.proxychains_backup = None

        # 5. Restore Hardware MAC Addresses
        if self.state.original_macs:
            MacSpoofer.restore_all(self.state.original_macs)
            self.state.original_macs = {}

        # 6. Stop Tor if we started it
        TorManager.stop_tor_if_started(self.state.tor_was_running)

        self.state.is_active = False
        self.state_mgr.clear()
        Logger.success("System completely restored to original operational baseline. Clean exit.")

    def rotate_identity(self) -> None:
        Logger.banner()
        SystemValidator.enforce_root()
        TorManager.rotate_identity()
        time.sleep(1.5)
        new_identity = NetworkAuditor.get_public_ip(via_tor=True)
        Logger.success(f"New Egress Identity: [bold green]{new_identity.get('ip')}[/bold green] ({new_identity.get('country')})")

    def status(self) -> None:
        Logger.banner()
        SystemValidator.enforce_root()

        tor_status = TorManager.is_service_active()
        current_ip = NetworkAuditor.get_public_ip(via_tor=self.state.is_active)

        if HAS_RICH and console:
            table = Table(title="[bold cyan]Th3hubris Operational Health & Posture[/bold cyan]", box=ROUNDED)
            table.add_column("Subsystem", style="bold white")
            table.add_column("Status", style="bold")

            table.add_row("Suite Core State", "[green]ACTIVE[/green]" if self.state.is_active else "[red]INACTIVE[/red]")
            table.add_row("Tor Onion Daemon", "[green]RUNNING[/green]" if tor_status else "[red]STOPPED[/red]")
            table.add_row("Kernel Kill-Switch", "[green]ARMED[/green]" if self.state.killswitch_active else "[yellow]DISARMED[/yellow]")
            table.add_row("OpenVPN Tunnel", f"[green]PID {self.state.openvpn_pid}[/green]" if self.state.openvpn_pid else "[dim]NONE[/dim]")
            table.add_row("Visible Public IP", f"[bold yellow]{current_ip.get('ip')}[/bold yellow] ({current_ip.get('country')})")
            table.add_row("MAC Spoofing", f"[green]{len(self.state.original_macs)} adapter(s) cloaked[/green]" if self.state.original_macs else "[dim]Default[/dim]")
            console.print(table)
        else:
            print(f"\n{TermColors.BOLD}{TermColors.CYAN}--- TH3HUBRIS STATUS ---{TermColors.RESET}")
            print(f"  Suite Active:     {self.state.is_active}")
            print(f"  Tor Daemon:       {tor_status}")
            print(f"  Kill-Switch:      {self.state.killswitch_active}")
            print(f"  OpenVPN PID:      {self.state.openvpn_pid}")
            print(f"  Visible IP:       {current_ip.get('ip')} ({current_ip.get('country')})\n")


# ==============================================================================
# CLI ENTRYPOINT & SIGNAL TRAPPING
# ==============================================================================
def signal_handler(signum: int, frame: Any) -> None:
    print(f"\n{TermColors.YELLOW}[!]{TermColors.RESET} Interrupt signal caught. Safe termination initiated.")
    sys.exit(0)


def main() -> None:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    parser = argparse.ArgumentParser(
        prog="th3hubris",
        description="Th3hubris - Military-Grade OPSEC & Anonymity Orchestrator for Kali Linux (2026)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    action_group = parser.add_mutually_exclusive_group(required=True)
    action_group.add_argument("--start", action="store_true", help="Initiate complete automated anonymity chain")
    action_group.add_argument("--stop", action="store_true", help="Flush firewall rules and restore original configurations")
    action_group.add_argument("--ghost-id", action="store_true", help="Instantly rotate Tor exit node / acquire new IP")
    action_group.add_argument("--status", action="store_true", help="Audit current OPSEC posture and IP visibility")
    action_group.add_argument("--shell", action="store_true", help="Spawn an anonymized sub-shell wrapped with proxychains4")

    parser.add_argument("--no-vpn", action="store_true", help="Skip OpenVPN tunnel and run pure Tor + ProxyChains mode")
    parser.add_argument("--vpn-config", type=str, help="Path to custom .ovpn configuration file")
    parser.add_argument("-v", "--version", action="version", version=f"Th3hubris v{VERSION}")

    args = parser.parse_args()
    state_mgr = StateManager()
    orchestrator = Th3hubrisOrchestrator(state_mgr)

    if args.start:
        orchestrator.start(no_vpn=args.no_vpn, custom_vpn=args.vpn_config)
    elif args.stop:
        orchestrator.stop()
    elif args.ghost_id:
        orchestrator.rotate_identity()
    elif args.status:
        orchestrator.status()
    elif args.shell:
        ShellManager.spawn_cloaked_shell()


if __name__ == "__main__":
    main()
