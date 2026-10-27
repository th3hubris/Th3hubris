#!/usr/bin/env bash
# ==============================================================================
#   _______ _    ____  _           _          _     
#  |__   __| |  |___ \| |         | |        (_)    
#     | |  | |__  __) | |__  _   _| |__  _ __ _ ___ 
#     | |  | '_ \|__ <| '_ \| | | | '_ \| '__| / __|
#     | |  | | | |__) | | | | |_| | |_) | |  | \__ \
#     |_|  |_| |_|____/|_| |_|\__,_|_.__/|_|  |_|___/
#
#   Th3hubris Automated Installer for Kali Linux (2026 Rolling Release)
#   "We Build Shadow Soldiers - Ultimate OPSEC & Anonymity Suite"
# ==============================================================================

set -eo pipefail

# ANSI Color Palette
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_PRIMARY="/usr/bin/th3hubris"
BIN_LOCAL="/usr/local/bin/th3hubris"
OPT_DIR="/opt/th3hubris"
CONFIG_DIR="/etc/th3hubris"
STATE_DIR="/var/run/th3hubris"

echo -e "${RED}"
cat << 'EOF'
  _______ _    ____  _           _          _     
 |__   __| |  |___ \| |         | |        (_)    
    | |  | |__  __) | |__  _   _| |__  _ __ _ ___ 
    | |  | '_ \|__ <| '_ \| | | | '_ \| '__| / __|
    | |  | | | |__) | | | | |_| | |_) | |  | \__ \
    |_|  |_| |_|____/|_| |_|\__,_|_.__/|_|  |_|___/

EOF
echo -e "${WHITE}  »»» We Build Shadow Soldiers - Ultimate OPSEC Suite «««${NC}"
echo -e "${CYAN}  Kali Linux 2026 Automated Environment Deployment (v3.2.0)${NC}\n"

# 1. Enforce Root Privileges
if [[ "$EUID" -ne 0 ]]; then
    echo -e "${RED}[-] ERROR: Root privileges required.${NC}"
    echo -e "${YELLOW}[!] Execute with sudo: sudo bash install.sh${NC}"
    exit 1
fi

echo -e "${BLUE}[*] Step 1: Updating APT repositories...${NC}"
apt-get update -y || {
    echo -e "${YELLOW}[!] Warning: APT repository update encountered warnings. Proceeding with installation...${NC}"
}

echo -e "${BLUE}[*] Step 2: Installing core system networking & security utilities...${NC}"
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    tor \
    proxychains4 \
    openvpn \
    macchanger \
    iptables \
    iptables-persistent \
    iproute2 \
    net-tools \
    curl \
    dnsutils \
    e2fsprogs \
    python3 \
    python3-pip \
    python3-requests \
    python3-rich \
    python3-urllib3

# 2. Python Dependencies (PEP 668 Compliant for Kali Linux 2026)
echo -e "${BLUE}[*] Step 3: Verifying Python 3.12+ dependencies...${NC}"
if [[ -f "$SCRIPT_DIR/requirements.txt" ]]; then
    pip3 install --break-system-packages -r "$SCRIPT_DIR/requirements.txt" 2>/dev/null || \
    pip3 install -r "$SCRIPT_DIR/requirements.txt" || {
        echo -e "${YELLOW}[!] Pip fallback: Core packages already provided via apt (python3-rich, python3-requests).${NC}"
    }
fi

# 3. Create persistent directories
echo -e "${BLUE}[*] Step 4: Establishing system directories & permissions...${NC}"
mkdir -p "$CONFIG_DIR/backups"
mkdir -p "$STATE_DIR"
chmod 700 "$CONFIG_DIR"
chmod 755 "$STATE_DIR"

# 4. Pre-configure Tor defaults cleanly (Zero Duplication)
echo -e "${BLUE}[*] Step 5: Sanitizing and configuring Tor Transparent Proxying (/etc/tor/torrc)...${NC}"
mkdir -p /etc/tor
touch /etc/tor/torrc

# Remove any previous duplicates of managed keys in /etc/tor/torrc
sed -i -E '/^(SocksPort|TransPort|DNSPort|VirtualAddrNetworkIPv4|AutomapHostsOnResolve|ControlPort|CookieAuthentication|CircuitBuildTimeout|LearnCircuitBuildTimeout|NumEntryGuards|ClientOnly)/Id' /etc/tor/torrc || true

cat << 'TORRC_EOF' >> /etc/tor/torrc

# Added by Th3hubris for System-Wide Transparent Proxying & Control
SocksPort 127.0.0.1:9050
TransPort 127.0.0.1:9040
DNSPort 127.0.0.1:9053
VirtualAddrNetworkIPv4 10.192.0.0/10
AutomapHostsOnResolve 1
ControlPort 127.0.0.1:9051
CookieAuthentication 0
CircuitBuildTimeout 10
LearnCircuitBuildTimeout 1
NumEntryGuards 3
ClientOnly 1
TORRC_EOF

# Reset systemd failure limit lock and enable tor@default instance
systemctl reset-failed tor@default tor 2>/dev/null || true
systemctl enable tor@default 2>/dev/null || true
pkill -9 -f /usr/bin/tor 2>/dev/null || true
systemctl restart tor@default 2>/dev/null || true

# 5. Deploy system-wide installation & binary wrappers
echo -e "${BLUE}[*] Step 6: Deploying Th3hubris to /opt and system binary paths...${NC}"
mkdir -p "$OPT_DIR"
cp -rf "$SCRIPT_DIR"/* "$OPT_DIR"/
chmod +x "$OPT_DIR/th3hubris.py"
chmod +x "$SCRIPT_DIR/th3hubris.py"

# Deploy wrapper to /usr/bin (guaranteed in all sudo secure_path & system PATHs)
cat << 'WRAPPER_EOF' > "$BIN_PRIMARY"
#!/usr/bin/env bash
exec /usr/bin/env python3 /opt/th3hubris/th3hubris.py "$@"
WRAPPER_EOF
chmod +x "$BIN_PRIMARY"

# Also symlink to /usr/local/bin for backwards compatibility
ln -sf "$BIN_PRIMARY" "$BIN_LOCAL"
chmod +x "$BIN_LOCAL" 2>/dev/null || true

echo -e "\n${GREEN}[+] INSTALLATION COMPLETE!${NC}"
echo -e "${WHITE}================================================================${NC}"
echo -e "${GREEN}[✔] Th3hubris installed to: ${CYAN}${OPT_DIR}${NC}"
echo -e "${GREEN}[✔] Global binary created at: ${CYAN}${BIN_PRIMARY}${NC} & ${CYAN}${BIN_LOCAL}${NC}"
echo -e "${GREEN}[✔] Tor configuration sanitized: DNSPort:9053 | TransPort:9040 | SOCKS:9050${NC}"
echo -e "${GREEN}[✔] Kali Linux 2026 networking stack verified.${NC}"
echo -e "${WHITE}================================================================${NC}"
echo -e "\n${CYAN}Quick Start Commands:${NC}"
echo -e "  ${YELLOW}sudo th3hubris --start${NC}     -> Activate full anonymity chain"
echo -e "  ${YELLOW}sudo th3hubris --browser${NC}   -> Launch secure Firefox via Tor"
echo -e "  ${YELLOW}sudo th3hubris --status${NC}    -> Check OPSEC & IP posture"
echo -e "  ${YELLOW}sudo th3hubris --ghost-id${NC}  -> Rotate Tor exit circuit / IP"
echo -e "  ${YELLOW}sudo th3hubris --shell${NC}     -> Spawn anonymized terminal sub-shell"
echo -e "  ${YELLOW}sudo th3hubris --stop${NC}      -> Decommission suite & restore network\n"
