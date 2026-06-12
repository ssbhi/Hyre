# Deploying True Hire to the hackathon box

Follows the TrueBalance hackathon deploy playbook (Recipe B: Docker Compose).
The box already has Docker, Compose, and Git. Port **8080** is the only
internet-facing port and is auto-routed to `https://<team-slug>.hackathon.afinit.dev`.

## 0. Prerequisites (one-time, on your laptop)

1. Push the latest code to GitHub (`github.com/ssbhi/Hyre`). The box can reach
   github.com (NOT github.balancehero.cc).
2. Have the SSH key (`hackathon2026.pem`) and the box IP from Slack.

## 1. SSH to the box

```bash
ssh -i hackathon2026.pem ec2-user@<public-ip>
```

## 2. Get the code

```bash
git clone https://github.com/ssbhi/Hyre.git app
cd app
```

(Repo is private? Use a GitHub personal access token as the password, or `scp` the folder.)

## 3. Create the production .env

`.env` is gitignored, so create it on the box:

```bash
cat > .env <<'EOF'
# REQUIRED — long random string; signs session cookies.
AUTH_SECRET=REPLACE_WITH_A_LONG_RANDOM_STRING

# OPTIONAL — Google Sheet backend (leave blank to disable sheet sync).
SHEETS_WEBAPP_URL=
SHEETS_SHARED_SECRET=
EOF
```

Generate a strong secret: `openssl rand -hex 32`

## 4. Build & start

```bash
docker compose up -d --build
```

First boot creates `./data/prod.db` (SQLite) and seeds demo data
(jobs, candidates, users — all demo logins use password `hyre1234`).
`./data` and `./uploads` are volumes, so the database and uploaded
resumes/JDs survive rebuilds and restarts.

## 5. Verify (60 seconds)

```bash
curl -s localhost:8080/ | head -c 200   # app answers locally
curl -s localhost/                       # through on-host ingress
curl -s localhost/__hk                   # confirms your team's box
```

If the first one returns HTML, the public domain works:
`https://<team-slug>.hackathon.afinit.dev`

## 6. Updating after a new push

```bash
cd ~/app
git pull
docker compose up -d --build
```

Data is preserved (volumes). To wipe and reseed: `docker compose down`,
`rm -rf data`, `docker compose up -d`.

## Logs & troubleshooting

```bash
docker compose logs -f web      # app logs
ss -tlnp | grep 8080            # who holds port 8080
```

- "warming up" on the domain → nothing on 8080; check `docker compose ps`.
- Don't stop `hk-ingress`, `komodo-periphery`, `vector`, or `hk-firewall`.
- HTTPS is terminated by the platform — the app sees plain HTTP (fine).
- Requests >60s may time out at the proxy.
- Infra questions → Slack `#temp_hackathon_infra`.

## Notes

- SQLite + local uploads are fine here because this is a persistent VM
  (50 GB disk), not serverless. The repo/storage abstractions still allow a
  Postgres/blob swap later.
- Optional Slack login gate: `hackathon.afinit.dev/authctl` (path exceptions
  supported, e.g. for the Apps Script sheet sync callbacks if you enable them).
