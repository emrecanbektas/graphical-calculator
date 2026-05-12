# Graphical Calculator

A scientific calculator that can evaluate expressions and plot functions — all in the browser, no backend needed. Built it because I wanted a single tool that handles both quick calculations and graph visualization without switching apps.

## Features

- **Scientific calculator** — trig (sin/cos/tan + inverses), logarithms, roots, factorials, powers, constants (π, e)
- **Function graphing** — plot any f(x) expression with animated drawing
- **Zoom & pan** — scroll to zoom, drag to pan the graph; axes update in real time
- **Evaluate at x** — click a point on the graph to see the exact f(x) value with domain error explanations
- **Singularity detection** — automatically marks asymptotes and domain boundaries on the chart
- **Import panel** — paste any formula (supports Unicode math, implicit multiplication, `ln`, `arcsin`, `tg`, `f(x)=` prefixes, and more)
- **Export PNG** — download the current graph as a 2× resolution image
- **Persistent history** — calculation and graph history survives page refresh (localStorage)
- **Full keyboard support** — numbers, operators, `x`, `^`, Enter, Backspace, Escape all work

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- [math.js](https://mathjs.org/) for expression parsing and evaluation
- [Recharts](https://recharts.org/) for the animated line chart

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build (runs tsc + vite)
npm run preview # preview the production build locally
```

## Deploying to GitHub Pages

1. Add the `base` option to `vite.config.ts`:

```ts
export default defineConfig({
  base: '/graphical-calculator/',
  plugins: [react(), tailwindcss()],
})
```

2. Install the deploy helper:

```bash
npm install --save-dev gh-pages
```

3. Add a deploy script to `package.json`:

```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

4. Push your code and run:

```bash
npm run deploy
```

The site will be live at `https://<your-username>.github.io/graphical-calculator/`.
