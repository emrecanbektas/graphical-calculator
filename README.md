# 📐 Graphical Calculator

> An interactive **scientific calculator** with **animated function plotting**, built in **React 19 + TypeScript**. Type any mathematical expression and watch it draw itself across the screen in real time — all in your browser, no backend required.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)
![math.js](https://img.shields.io/badge/math.js-Expression_Parser-FF6B6B)
![Recharts](https://img.shields.io/badge/Recharts-Charts-22B5BF)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 About The Project

The **Graphical Calculator** is a modern, web-based scientific calculator that combines **mathematical computation** and **2D function graphing** in a single tool. Whether you're a student studying calculus, an engineer prototyping equations, or just curious about how functions look, this app lets you:

- 🧮 Perform scientific calculations (trig, logs, powers, roots, factorials)
- 📈 Plot any `f(x)` function with smooth, animated drawing
- 🔍 Zoom, pan, and interactively explore your graphs
- 💾 Keep a persistent history of your work — even after refreshing the page

No installation on the user's machine, no servers — everything runs **client-side in the browser**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔬 **Scientific Calculator** | Trigonometric functions (sin, cos, tan + inverses), logarithms, roots, factorials, powers, and mathematical constants (π, e) |
| 📊 **Function Graphing** | Plot any `f(x)` expression with smooth animated rendering |
| 🖱️ **Zoom & Pan** | Scroll wheel to zoom, click-and-drag to pan; axes update in real time |
| 🎯 **Evaluate at x** | Click any point on the graph to see the exact `f(x)` value with domain error explanations |
| ⚠️ **Singularity Detection** | Automatically marks asymptotes and domain boundaries |
| 📥 **Import Panel** | Paste formulas with support for Unicode math, implicit multiplication, `ln`, `arcsin`, `tg`, and `f(x)=` prefixes |
| 🖼️ **Export PNG** | Download your current graph as a high-quality 2× resolution image |
| 💾 **Persistent History** | Calculation and graph history saved in `localStorage` — survives refresh |
| ⌨️ **Full Keyboard Support** | Numbers, operators, `x`, `^`, Enter, Backspace, and Escape all bound |

---

## 🛠️ Tech Stack

- **[React 19](https://react.dev/)** — UI framework
- **[TypeScript](https://www.typescriptlang.org/)** — type-safe JavaScript
- **[Vite 6](https://vitejs.dev/)** — lightning-fast build tool and dev server
- **[Tailwind CSS v4](https://tailwindcss.com/)** — utility-first styling
- **[math.js](https://mathjs.org/)** — mathematical expression parsing and evaluation
- **[Recharts](https://recharts.org/)** — animated line chart rendering

---

## 🚀 Getting Started

Follow these steps to get a local copy up and running in just a few minutes.

### Prerequisites

You'll need the following installed on your machine:

- **[Node.js](https://nodejs.org/)** version **18 or higher** (LTS recommended)
- **npm** (comes bundled with Node.js) — or alternatively `yarn` / `pnpm`
- **[Git](https://git-scm.com/)** for cloning the repository

Verify your installations:

```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x.x or higher
git --version
```

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Baransalis42/graphical-calculator.git
```

**2. Navigate into the project folder**

```bash
cd graphical-calculator
```

**3. Install dependencies**

```bash
npm install
```

This installs all packages listed in `package.json` (React, Vite, math.js, Recharts, Tailwind, and dev tools).

### Running the App

**Start the development server:**

```bash
npm run dev
```

Open your browser and visit:

```
http://localhost:5173
```

The app supports **hot module replacement** — any code changes you make will reflect instantly without a full reload.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

This runs the TypeScript compiler (`tsc`) and bundles everything with Vite. The output goes into the `dist/` folder.

**Preview the production build locally:**

```bash
npm run preview
```

---

## 🌐 Deployment

### Deploying to GitHub Pages

This project deploys easily to GitHub Pages in four steps.

**Step 1 — Configure the base path**

Open `vite.config.ts` and add the `base` field that matches your repo name:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/graphical-calculator/',
  plugins: [react(), tailwindcss()],
})
```

**Step 2 — Install the deploy helper**

```bash
npm install --save-dev gh-pages
```

**Step 3 — Add a deploy script to `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "deploy": "npm run build && gh-pages -d dist"
}
```

**Step 4 — Deploy!**

```bash
npm run deploy
```

Your site will be live at:

```
https://<your-github-username>.github.io/graphical-calculator/
```

> 💡 **Tip:** In your GitHub repo settings, make sure GitHub Pages is set to deploy from the `gh-pages` branch.

### Other Deployment Options

The project is a static SPA, so it works on any static host:

- **Vercel** — connect your repo, click Deploy, done
- **Netlify** — drag-and-drop the `dist/` folder, or connect via Git
- **Cloudflare Pages** — connect repo, set build command to `npm run build`, output to `dist`
- **Firebase Hosting** — run `firebase init hosting`, set public folder to `dist`

---

## 📁 Project Structure

```
graphical-calculator/
├── src/                    # Application source code (React + TypeScript)
├── index.html              # Entry HTML file
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # App-specific TS config
├── tsconfig.node.json      # Node-specific TS config (for Vite)
└── README.md               # You're reading it!
```

---

## 🎮 Usage Examples

Once the app is running, try entering expressions like:

| Expression | What it does |
|------------|--------------|
| `2 + 3 * sin(pi/4)` | Scientific calculation |
| `x^2 - 4` | Plot a parabola |
| `sin(x) * cos(x)` | Plot a wave |
| `1/x` | See singularity detection in action |
| `ln(x)` | Natural log, with domain handling |
| `sqrt(x^2 + 1)` | Square root curve |

Use the **mouse scroll** to zoom in/out, **click-and-drag** to pan, and **click on the curve** to evaluate `f(x)` at any point.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [math.js](https://mathjs.org/) for the powerful expression parser
- [Recharts](https://recharts.org/) for elegant chart rendering
- [Vite](https://vitejs.dev/) for the blazing-fast dev experience

---

## 📬 Contact

**Emrecan Bektas** — [@emrecanbektas](https://github.com/emrecanbektas)

**Project Link:** — https://github.com/emrecanbektas/graphical-calculator

---

<p align="center">⭐ If you found this project useful, please consider giving it a star!</p>
