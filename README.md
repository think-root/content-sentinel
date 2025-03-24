<h1 align="center">Content Sentinel</h1>

<div align="center">

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.2-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
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
   git clone https://github.com/think-root/content-sentinel.git
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
   - `API_BASE_URL` - URL of the content-alchemist API
   - `API_BEARER_TOKEN` - Authentication token for API access
   - `PORT` - Port for the application to run on (default: 3000)
   - `DATE_FORMAT` - Format for displaying dates (e.g., DD.MM.YYYY HH:mm:ss)
   - `TIMEZONE` - Timezone for date display (e.g., Europe/Kiev)
   - `VITE_AUTH0_DOMAIN` - Your Auth0 application domain
   - `VITE_AUTH0_CLIENT_ID` - Your Auth0 application client ID
   - `VITE_APP_URL` - Your application URL

### Auth0 Setup

1. Create an Auth0 Account
   - Go to [Auth0](https://auth0.com/) and sign up for an account if you don't have one
   - Navigate to the Auth0 Dashboard

2. Create a New Application
   - In the Auth0 Dashboard, go to "Applications" → "Create Application"
   - Choose "Single Page Web Application"
   - Click "Create"

3. Configure Application Settings
   - In your Auth0 application settings, find the "Domain" and "Client ID"
   - Add these values to your `.env` file:
     ```
     VITE_AUTH0_DOMAIN=your-domain.region.auth0.com
     VITE_AUTH0_CLIENT_ID=your-client-id
     ```

4. Configure Allowed URLs
   - In the "Application URIs" section, add the following:
     - Allowed Callback URLs: `http://localhost:3000, https://your-production-domain.com`
     - Allowed Logout URLs: `http://localhost:3000, https://your-production-domain.com`
     - Allowed Web Origins: `http://localhost:3000, https://your-production-domain.com`

5. Save all changes in the Auth0 Dashboard

### Development

Start the development server:

```bash
npm run dev
```

## Docker

1. Make sure you have a `.env` file with the necessary environment variables:
   ```
   API_BASE_URL=your_api_url
   API_BEARER_TOKEN=your_token
   PORT=3000
   DATE_FORMAT=DD.MM.YYYY HH:mm:ss
   TIMEZONE=Europe/Kiev
   VITE_AUTH0_DOMAIN=your-domain.region.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   VITE_APP_URL=your-domain
   ```

2. Run the container:
   ```bash
   docker run -d \
     --name content-sentinel \
     -p 3000:3000 \
     -e API_BASE_URL=your_api_url \
     -e API_BEARER_TOKEN=your_token \
     -e PORT=3000 \
     -e DATE_FORMAT=preferred_format \
     -e TIMEZONE=preferred_timezone \
     -e VITE_AUTH0_DOMAIN=your-domain.region.auth0.com \
     -e VITE_AUTH0_CLIENT_ID=your-client-id \
     -e VITE_APP_URL=your-domain \
     content-sentinel:latest
   ```