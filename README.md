# Matching Game Scaffold

## Dev

```
yarn

yarn dev
```

## Build (for GitHub Pages or similar)

```
BASE_PATH=/your-repo-name/ yarn build
```

Vite outputs the static site to `dist/`. Upload that folder to GitHub Pages (or any static host).

If your host uses the root path (not a subpath), omit `BASE_PATH`.

## Data source (CSV)

By default the app reads `public/data/emily.csv`. You can override with:

```
VITE_SHEET_CSV_URL=/data/your-file.csv
```

Or point to a public Google Sheet CSV:

```
VITE_SHEET_ID=your_sheet_id
VITE_SHEET_GID=0
```
