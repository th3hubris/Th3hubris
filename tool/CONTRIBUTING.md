# Contributing to Th3hubris

First off, thank you for considering contributing to **Th3hubris**! People like you make Th3hubris a formidable, bulletproof tool for the cybersecurity community.

---

## 🛡️ Code of Conduct

By participating in this project, you agree to maintain a respectful and welcoming environment for everyone. We operate under strict ethical hacking guidelines: Th3hubris is developed exclusively for authorized penetration testing, privacy research, and operational security defensive applications.

---

## 🛠️ How Can I Contribute?

### Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/th3hubris/th3hubris/issues).
- If you're unable to find an open issue addressing the problem, open a new one.
- Include a clear title and description, the Kali Linux release version (`cat /etc/os-release`), Python version (`python3 --version`), and relevant logs.

### Suggesting Enhancements
- Open an Issue with the tag `[FEATURE REQUEST]`.
- Explain why this enhancement would be useful to OPSEC specialists and penetration testers.
- Detail the proposed architecture or networking changes (e.g., WireGuard chaining, additional DNS over HTTPS options).

### Pull Requests
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/stealth-improvement
   ```
2. Ensure strict adherence to **Python 3.12+** typing standards and clean code conventions (PEP 8, Black formatting).
3. Test all system-level network manipulations (`iptables`, `resolv.conf`, `torrc`, `proxychains4`) inside a sandboxed Kali Linux virtual machine or container.
4. Verify that state recovery (`sudo th3hubris --stop`) cleanly reverts all configuration files to their original baseline without leaving residual firewall drops.
5. Submit your PR with a thorough explanation of changes.

---

## 🧪 Testing Guidelines

Before opening a pull request:
- Run syntax verification:
  ```bash
  python3 -m py_compile th3hubris.py
  ```
- Run formatting and linting:
  ```bash
  flake8 th3hubris.py --max-line-length=120
  ```
- Test all CLI arguments:
  ```bash
  sudo python3 th3hubris.py --start
  sudo python3 th3hubris.py --status
  sudo python3 th3hubris.py --ghost-id
  sudo python3 th3hubris.py --stop
  ```

Thank you for helping build shadow soldiers!
