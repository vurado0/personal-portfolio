---
title: SSH keys and ~/.ssh/config done right
category: linux
tags: [ssh, cheat-sheet, security]
skills: [linux, security]
summary: Generate modern Ed25519 keys, use the agent, and stop typing long ssh commands with a tidy config file.
updated: 2026-09-28
difficulty: beginner
---

> PLACEHOLDER article — replace with your own notes. It shows every feature: headings, code, tables, links.

## Generate a key

Ed25519 keys are short, fast and secure. Always set a passphrase.

```bash
ssh-keygen -t ed25519 -C "laptop-2026" -f ~/.ssh/id_ed25519
```

Copy the public key to a server:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server.example.com
```

## Use the agent

On macOS the agent can store the passphrase in the keychain:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

## A tidy `~/.ssh/config`

```ssh-config
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentitiesOnly yes

Host lab
  HostName 10.0.0.12
  User student
  Port 2222
  IdentityFile ~/.ssh/id_ed25519
```

Now `ssh lab` is all you need.

### Permissions

| Path | Mode |
| --- | --- |
| `~/.ssh` | `700` |
| `~/.ssh/id_ed25519` | `600` |
| `~/.ssh/config` | `600` |

## Harden the server

Disable password logins in `/etc/ssh/sshd_config` once your key works — see also [Docker networking](/knowhow/docker/docker-networking-basics) for exposing services safely.

```bash
sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload ssh
```
