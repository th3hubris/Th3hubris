#!/usr/bin/env bash
# ==============================================================================
#   _______ _    ____  _           _          _     
#  |__   __| |  |___ \| |         | |        (_)    
#     | |  | |__  __) | |__  _   _| |__  _ __ _ ___ 
#     | |  | '_ \|__ <| '_ \| | | | '_ \| '__| / __|
#     | |  | | | |__) | | | | |_| | |_) | |  | \__ \
#     |_|  |_| |_|____/|_| |_|\__,_|_.__/|_|  |_|___/
#
#   Th3hubris - Root Deployment & Installation Forwarder
#   "We Build Shadow Soldiers - Ultimate OPSEC & Anonymity Suite"
# ==============================================================================

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/tool/install.sh" ]]; then
    exec bash "$SCRIPT_DIR/tool/install.sh" "$@"
elif [[ -f "$SCRIPT_DIR/install.sh" ]]; then
    exec bash "$SCRIPT_DIR/install.sh" "$@"
else
    echo "[-] Error: Installer script not found."
    exit 1
fi
