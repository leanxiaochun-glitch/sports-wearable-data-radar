# Sports & Wearable External Data Radar

A zero-secret static dashboard for product managers tracking official sports, population, connectivity and wearable-platform signals. Every metric carries a direct primary-source link and six provenance fields: `source_name`, `source_url`, `article_title`, `published_date`, `retrieved_at`, and `method`.

## Architecture

```text
Official API ─┐
              ├─ scripts/update_data.py ─ data/metrics.json ─ static dashboard ─ GitHub Pages
Manual JSON ──┘             ▲
                            └─ scheduled / manually dispatched GitHub Action
```

The site is plain HTML, CSS and JavaScript, so it has no build step or runtime backend. `data/manual.json` is the reviewed source for reports and documentation that should not be scraped. `data/metrics.json` is the generated public dataset.

## Data sources and update method

| Source | Method | Default cadence |
|---|---|---|
| WHO | Reviewed official release/report in `manual.json` | Annual/release-based |
| UN World Population Prospects | Reviewed official release; CSV adapter can be added for selected countries | Revision-based |
| World Bank | Public JSON API (`SP.POP.TOTL`) | Weekly automation |
| ITU | Reviewed Facts and Figures report | Annual |
| Strava Year in Sport | Reviewed annual press/report data | Annual |
| Apple HealthKit / Developer | Reviewed developer documentation | WWDC/release-based |
| Android Health Connect | Reviewed developer documentation | I/O/release-based |

Annual-report values remain intentionally editorial: update `data/manual.json`, preserve the source URL and dates, then run the updater. This is more reliable and auditable than scraping changing campaign pages.

## Run locally

Python 3.10+ is sufficient; there are no third-party dependencies.

```bash
python3 scripts/update_data.py
python3 scripts/validate_data.py
python3 -m http.server 8000
```

Open `http://localhost:8000`. Do not open `index.html` directly because browsers restrict local JSON requests.

## Publish to GitHub Pages

1. Create a public GitHub repository and push this directory to its `main` branch.
2. If you fork the project, replace the repository URL in `data/config.json`. The deployed site also detects the repository automatically from its `github.io` URL.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
4. Run **Actions → Deploy dashboard to Pages → Run workflow** once, or push to `main`.

The intended deployed URL is `https://leanxiaochun-glitch.github.io/sports-wearable-data-radar/`.

## Refresh mechanism and security

The **Refresh latest data** button opens the repository's **Refresh latest data** Actions page. An authenticated collaborator can click **Run workflow** there. This design exposes no personal access token, webhook secret or privileged endpoint in browser code.

The same workflow runs every Monday at 03:17 UTC. It retrieves API-backed values, validates provenance, commits only changed `data/metrics.json`, and the push triggers Pages deployment. In repository **Settings → Actions → General**, keep workflow permissions set to **Read and write** so the bot can commit refreshed data.

For a true one-click in-page refresh, add an authenticated server-side broker (for example, a Cloudflare Worker with GitHub App credentials and strict origin/rate controls). Never put a PAT in this repository or frontend.

## Add a signal

Add report-based signals to `data/manual.json`, or implement a small adapter in `scripts/update_data.py` for a stable official API/CSV. Each record must include all provenance fields; validation fails otherwise.

## License and data terms

Project code may be used under the MIT License. Source data remains subject to each publisher's terms; the dashboard links to, rather than republishes, full reports.
