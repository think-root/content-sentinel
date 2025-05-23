<h1 align="center">Content Sentinel</h1>

<div align="center">

![License](https://img.shields.io/github/license/think-root/content-sentinel?style=flat-square)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.2-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![GitHub Release](https://img.shields.io/github/v/release/think-root/content-sentinel?style=flat-square)](https://github.com/think-root/content-sentinel/releases)
[![Changelog](https://img.shields.io/badge/changelog-view-blue?style=flat-square)](https://github.com/think-root/content-sentinel/blob/main/CHANGELOG.md)

<img src="assets/baner.png" alt="baner">

</div>

## Description

In fact, this is a dashboard that allows you to monitor and manage the data of the [content-alchemist](https://github.com/think-root/content-alchemist) database and cron tasks of [content-maestro](https://github.com/think-root/content-maestro) using their APIs. Therefore, for this app to work correctly, you need to run both [content-alchemist](https://github.com/think-root/content-alchemist) and [content-maestro](https://github.com/think-root/content-maestro) first.

## Features

- **Posts Generation**: Manually generate posts by repository URL or from trending GitHub repositories
- **Status Tracking**: Monitor which repositories have been or will be posted to social media next
- **Posts Management**: View, search, and filter posts
- **Dark/Light Mode**: Toggle the interface between dark and light themes

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React

## Screenshots (may be outdated)

<details>
  <summary>Show me what's hidden</summary>
   
  ![alt text](assets/screenshot0.png)  
  
  ![alt text](assets/screenshot1.png)  
  
  ![alt text](assets/screenshot2.png)  
  
  ![alt text](assets/screenshot3.png)
  
</details>

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/think-root/content-sentinel.git
   cd content-sentinel
   ```

2. Install dependencies

   ```bash
   npm ci --production
   ```

3. Create an environment file

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your data

   ```bash
   PORT=3000
   ```

5. Build project

   ```bash
   npm run build
   ```

6. Start the preview server at http://localhost:4173/dashboard/

   ```bash
   npm run preview
   ```

7. Run production server at http://localhost:3000/dashboard/
   ```bash
   npm start
   ```

### Docker

Run via docker compose:

```bash
docker compose up -d
```

Or run the container directly:

```bash
docker run -d \
  --name content-sentinel \
  -p ${PORT:-3000}:${PORT:-3000} \
  --env-file .env \
  --restart unless-stopped \
  content-sentinel:latest
```

Access the application at http://localhost:3000/dashboard/

### Configuration Settings

For successful use, you must fill in some settings that can be found in the site header on the right, the “Settings” button.

| Tab                       | Setting          | Description                                                                                                                                                                                                                          |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **General**               | Date Format      | Choose your preferred date format. Available formats: `DD` (day), `MM` (month), `YYYY` (year), `HH` (24h), `hh` (12h), `mm` (minutes), `ss` (seconds), `A` (AM/PM uppercase), `a` (am/pm lowercase). **Default:** `DD.MM.YYYY HH:mm` |
|                           | Timezone         | Select your timezone (**default:** `Europe/Kyiv`)                                                                                                                                                                                    |
| **Content Alchemist API** | API Base URL     | Enter the URL of your Content Alchemist API                                                                                                                                                                                          |
|                           | API Bearer Token | Provide your authentication token for API access                                                                                                                                                                                     |
| **Content Maestro API**   | API Base URL     | Enter the URL of your Content Maestro API                                                                                                                                                                                            |
|                           | API Bearer Token | Provide your authentication token for API access                                                                                                                                                                                     |

All settings are automatically saved and persisted in your browser's local storage.

## Development

1. Install the development dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

2. Access the application at http://localhost:5173/dashboard/

## License

This project is licensed under the terms found in the [LICENSE](LICENSE) file in the repository root.
