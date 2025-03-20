<h1 align="center">Content Sentinel</h1>

<div align="center">

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<img src="assets/baner.png" alt="baner">

</div>

## Description

This application allows you to monitor, generate, and manage GitHub repositories from [content-alchemist](https://github.com/think-root/content-alchemist) app.

## Features

- **Repository Management**: View, search, and filter GitHub repositories
- **Manual Generation**: Add repositories manually by URL
- **Auto Generation**: Automatically fetch trending GitHub repositories
- **Status Tracking**: Monitor which repositories have been posted to social media
- **Cron Jobs**: Schedule automatic repository generation and posting
- **Dark/Light Mode**: Toggle between dark and light themes

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React

## Screenshots

![alt text](assets/screenshot.png)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/think-root/dashboard.git
   cd dashboard
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Create an environment file
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your data

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:5173

### Building for Production

Create a production build:

```bash
npm run build
# or
yarn build
```

Preview the production build:

```bash
npm run preview
# or
yarn preview
```

## API Integration

The dashboard connects to a backend API with the following endpoints:

- `/api/get-repository/` - Fetch repositories with filtering options
- `/api/manual-generate/` - Manually add repositories by URL
- `/api/auto-generate/` - Automatically generate repositories from GitHub trending

All API requests include a Bearer token for authentication.

## Project Structure

- `src/` - Application source code
  - `components/` - React components
  - `api.ts` - API integration functions
  - `types.ts` - TypeScript type definitions
  - `App.tsx` - Main application component
- `public/` - Static assets
- `dist/` - Production build output

## License

This project is licensed under the terms found in the LICENSE file in the repository root.

