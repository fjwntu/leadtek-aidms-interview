# Leadtek AIDMS — System Monitoring Assessment

This project contains a reusable **ChartComponents** library built with **React**, **TypeScript**, **MUI**, and **MUI X Charts**, plus a **DemoApp** that demonstrates a live system monitoring dashboard backed by a small **Express** API.

## Repository layout

- `ChartComponents/src/` — `LineChart`, `BarChart`, `GaugeChart`, shared `ChartData` types, validation, and responsive sizing helpers.
- `DemoApp/src/` — dashboard UI that polls `/api/metrics`.
- `DemoApp/server.js` — Express server exposing CPU, memory, and disk usage.

## Installation

From the repository root:

```bash
cd ChartComponents && npm install
cd ../DemoApp && npm install
```

The demo links the library via `"@leadtek/chart-components": "file:../ChartComponents"`; installing both folders ensures TypeScript and Vite resolve MUI packages for the linked source.

## Execution

Copy env template first (optional if you want non-default ports):

```bash
cd DemoApp
cp .env.example .env
```

Set `FRONTEND_PORT` and `API_PORT` in `.env` as needed.

Run the backend and frontend in **two terminals** (the UI proxies `/api` to the metrics server).

**Terminal 1 — backend**

```bash
cd DemoApp
node server.js
```

You should see: `Metrics API listening on http://localhost:4000`.

**Terminal 2 — frontend**

```bash
cd DemoApp
npm run dev
```

(`npm start` runs the same Vite dev server.) The app defaults to **http://localhost:3000** and proxies `/api` to the metrics server on port **4000**; override with `.env` keys `FRONTEND_PORT` and `API_PORT`.

## Testing

### ChartComponents unit tests

Run the test suite once:

```bash
cd ChartComponents
npm test
```

Run tests in watch mode during development:

```bash
cd ChartComponents
npm run test:watch
```

### DemoApp build check

Validate the demo app production build:

```bash
cd DemoApp
npm run build
```

### CI (GitHub Actions)

The workflow in `.github/workflows/ci.yml` runs on every push and pull request:

1. `ChartComponents`: `npm ci` + `npm test`
2. `DemoApp`: `npm ci` + `npm run build`

To reproduce CI locally from the repo root:

```bash
cd ChartComponents && npm ci && npm test
cd ../DemoApp && npm ci && npm run build
```

## Test scenarios (DemoApp)

Use the **Test scenario** radio group on the dashboard:

1. **Normal data** — polls `/api/metrics` every 2 seconds and updates line, bar, and gauge charts.
2. **Empty / loading** — forces the chart components into their `loading` state (info alert placeholders).
3. **Malformed data** — passes intentionally invalid `ChartData` so each chart shows the library’s in-component validation message.

## Validation checklist

### Responsiveness

- Open DevTools (**Toggle device toolbar**) and switch between mobile and desktop widths.
- Confirm charts reflow with the container: the library uses a `ResizeObserver` on the chart wrapper and passes an explicit pixel width into MUI X Charts.
- Resize the browser window and verify line/bar/gauge content scales without horizontal clipping.

### Page load under 2 seconds (local)

- Open **Chrome DevTools → Network**, enable **Disable cache**, reload the page.
- Select the **Document** (or main HTML) request and check **Time** (or the waterfall **Load** event).
- With the backend optional for first paint, the SPA shell should load quickly; for end-to-end monitoring, start `server.js` first so `/api/metrics` does not wait on retries. In typical local runs, **DOMContentLoaded / Load** should stay **well under 2s** on a warm cache; use the **Performance** panel if you need a precise navigation trace.

### Error handling

- Select **3. Malformed data** and confirm each chart region shows a clear **MUI `Alert`** describing what is wrong (e.g. non-numeric points, label length mismatch, invalid gauge value).
- Stop the backend and use **Normal data** to see the dashboard’s API error banner; chart components surface library validation errors when series are empty after a failed fetch.

## Implementation notes

- **CPU** — sampled from `os.cpus()` deltas over a short interval.
- **Memory** — derived from `os.freemem()` / `os.totalmem()`.
- **Disk** — uses `fs.statfs('/')` when available, with a random fallback if the call fails (e.g. unsupported environment).

## Production build

```bash
cd DemoApp
npm run build
npm run preview
```
