<h1 align="center">Content Sentinel</h1>

<div align="center">

![License](https://img.shields.io/github/license/think-root/content-sentinel?style=flat-square)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![GitHub Release](https://img.shields.io/github/v/release/think-root/content-sentinel?style=flat-square)](https://github.com/think-root/content-sentinel/releases)
[![Changelog](https://img.shields.io/badge/changelog-view-blue?style=flat-square)](https://github.com/think-root/content-sentinel/blob/main/CHANGELOG.md)

<img src="assets/baner.png" alt="baner">

</div>

## Description

A dashboard to monitor and manage the [content-alchemist](https://github.com/think-root/content-alchemist) repository database and the [content-maestro](https://github.com/think-root/content-maestro) cron jobs and integrations through their APIs. Both services have to be running for the dashboard to work.

## Features

- **Overview**: the next and the latest post, active cron jobs and integrations, repository totals, cron success rate and trends, and the technologies trending among collected repositories
- **Repositories**: generate posts from repository URLs or collect them from GitHub trending; search, filter and sort posts; edit a post's text, publish it next or right away, archive or delete it
- **Archive**: browse archived posts with filters, and archive published posts older than a given number of days, with a preview first
- **Cron**: change job schedules, enable or disable jobs, browse the run history and re-send a publication to the integrations it missed
- **Integrations**: add, edit and remove the social networks posts are published to
- **AI Settings**: LLM provider (OpenAI, Mistral API, OpenRouter), model, temperature, output languages and the prompt used to write posts
- Light and dark theme, and a mobile layout with bottom navigation

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS and Radix UI
- **Charts**: Recharts
- **Build Tool**: Vite
- **Tests**: Vitest

## Screenshots

<details>
  <summary>Show me what's hidden</summary>

  ![Overview](assets/screenshot-overview.png)

  ![Overview charts](assets/screenshot-overview-charts.png)

  ![Repositories](assets/screenshot-repositories.png)

  ![Cron](assets/screenshot-cron.png)

  ![Mobile](assets/screenshot-mobile.png)

</details>

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/think-root/content-sentinel.git
   cd content-sentinel
   ```

2. Install dependencies

   ```bash
   npm ci
   ```

3. Create an environment file

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your data

   ```bash
   PORT=3000
   ```

5. Build the project

   ```bash
   npm run build
   ```

6. Start the production server at http://localhost:3000/

   ```bash
   npm start
   ```

   Or preview the build with Vite at http://localhost:4173/

   ```bash
   npm run preview
   ```

### Docker

```bash
cp .env.example .env
docker compose up -d --build
```

The dashboard is served on the `PORT` from `.env` (3000 by default).

### Development

```bash
npm run dev        # dev server with hot reload
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm test           # unit tests
```

### Configuration Settings

For successful use, you must fill in some settings that can be found in the site header on the right, the "Settings" button.

| Tab         | Setting                   | Description                                                                                                                                                        |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **General** | Date Format               | Pick a format from the list, e.g. `DD.MM.YYYY HH:mm`, `MM/DD/YYYY hh:mm A` or `YYYY-MM-DD HH:mm`; formats with time can also show seconds. **Default:** `DD.MM.YYYY HH:mm` |
|             | Timezone                  | IANA timezone the dates are shown in (**default:** `Europe/Kyiv`)                                                                                                    |
| **API**     | Content Alchemist API     | Base URL and bearer token of your Content Alchemist                                                                                                               |
|             | Language Code             | [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) code of the post texts to display (**default:** `uk`)                                                         |
|             | Content Maestro API       | Base URL and bearer token of your Content Maestro                                                                                                                 |
| **Cache**   | Clear API Cache           | Drops cached API responses and reloads the data                                                                                                                    |

All settings are automatically saved and persisted in your browser's local storage.

## License

This project is licensed under the terms found in the [LICENSE](LICENSE) file in the repository root.
