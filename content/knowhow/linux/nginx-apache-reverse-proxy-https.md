---
title: "Nginx, Apache, reverse proxy and HTTPS"
category: linux
tags: [nginx, apache, linux, https, systemd]
skills: [linux, networking, security]
summary: "Setting up a Linux web server from scratch — Apache and Nginx virtual hosts, Nginx as a reverse proxy in front of Apache and Node.js, HTTPS with a self-signed certificate and a Node app running as a systemd service."
updated: 2026-04-20
difficulty: intermediate
---

From the web server lab in *Web Service Development* (FH JOANNEUM, summer 2026). I worked over SSH and VPN on a Debian VM in the university's OpenStack cloud.

## Virtual hosts

Several sites on one server, chosen by the `Host` header:

```nginx
server {
    listen 80;
    server_name www.swd-webservice.at;
    root /var/www/www;
    error_page 404 /404.html;
}
```

Check the syntax before every reload: `sudo nginx -t && sudo systemctl reload nginx`. For Apache, use `apachectl configtest` and `a2ensite` / `a2dissite`.

## Reverse proxy

Nginx is the only server reachable from outside (port 80/443) and forwards each request by host:

```nginx
server {
    server_name blog.swd-webservice.at;
    location / {
        proxy_pass http://127.0.0.1:7080;   # Apache, local only
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

The same pattern works for `api.…` → Node.js on `:8080`. The backends listen on `127.0.0.1` only, so nobody can bypass the proxy.

## HTTPS

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/site.key -out /etc/nginx/ssl/site.crt
```

Use one server block on `443 ssl` with `ssl_certificate` / `ssl_certificate_key`, and one on port 80 that only does `return 301 https://$host$request_uri;`. A self-signed certificate encrypts but proves no identity (browser warning), so use Let's Encrypt in production.

## Keep a Node app running: systemd

```ini
[Unit]
Description=Simple Node Webserver
After=network.target

[Service]
User=student
WorkingDirectory=/srv/node/
Environment=PORT=8080
ExecStart=/usr/bin/node /srv/node/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nodews
journalctl -u nodews -f        # live logs
```

`Restart=always` brings the app back after a crash, and `enable` starts it on boot. Run it as a normal user, never as root.

## SSH convenience

Put an entry in `~/.ssh/config` (`Host`, `HostName`, `User`, `IdentityFile`), and `ssh swd-vm` replaces the long command, even through the VPN.
