# ISAA Autism Assessment Tool - Offline Usage & Deployment

This application is a standalone, professional-grade tool for the Indian Scale for Assessment of Autism (ISAA). It is designed to work completely offline once built.

## How to use Offline (Local Machine)

1.  **Download the Project:** In Google AI Studio, go to the **Settings** (gear icon) or the menu and select **Export to ZIP**.
2.  **Extract the ZIP:** Unzip the downloaded file to a folder on your computer.
3.  **Install Dependencies:**
    *   Open a terminal/command prompt in that folder.
    *   Run: `npm install`
4.  **Build the App:**
    *   Run: `npm run build`
5.  **Run Locally:**
    *   You can now run a local server to view the app: `npx serve dist`
    *   Alternatively, you can open the `dist/index.html` file in your browser (though some features like JSON loading might require a local server due to browser security).

## How to Deploy to GitHub Pages

1.  **Create a GitHub Repository:** Create a new repository on GitHub.
2.  **Push your code:**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```
3.  **Configure GitHub Actions (Recommended):**
    *   Create a file at `.github/workflows/deploy.yml` with the following content:
    ```yaml
    name: Deploy to GitHub Pages
    on:
      push:
        branches: [main]
    jobs:
      build-and-deploy:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - uses: actions/setup-node@v3
            with:
              node-version: 18
          - run: npm install
          - run: npm run build
          - uses: JamesIves/github-pages-deploy-action@v4
            with:
              folder: dist
    ```
4.  **Enable Pages:** In your GitHub repository settings, go to **Pages** and set the source to the `gh-pages` branch (which the action will create).

## Features
- **100% Offline:** No internet required for assessment, scoring, or PDF generation.
- **Data Privacy:** All data stays in your browser. Nothing is uploaded to any server.
- **Portable Data:** Save and load assessments using JSON files.
- **Professional Reports:** Export detailed PDF reports for clinical records.
