# Robert Bennethum IV — GitHub Showcase

A fast, responsive, and fully client‑side portfolio that pulls live data from the GitHub API to showcase repositories, languages, and activity.

## Live Site
- https://github.robertb.me
- https://robertbiv.github.io

## Features
- Dynamic repo grid with search, language filter, and sorting
- Language mix summary with usage percentages
- “View All” toggle when you have many repositories
- Mobile-friendly nav with hamburger menu
- Theme toggle with persistence
- Smooth scrolling, subtle scroll effects, and loading skeletons
- Copy-to-clipboard email with toast feedback

## Tech Stack
- HTML5, CSS3 (Grid/Flexbox, CSS variables, animations)
- Vanilla JavaScript (ES6+, Fetch API)
- GitHub REST API v3
- Hosted on GitHub Pages (user site)

## Local Preview
```bash
# From the repo root
python -m http.server 8000
# Visit http://localhost:8000
```

## Configuration
Update these values near the top of `script.js` as needed:
- `username`: Your GitHub username (currently `robertbiv`)
- `emailOverride`: Email shown in the contact section (currently `github@robertb.me`)
- `HIGHLIGHT_REPOS`: Array of repo names to feature

## Deployment (GitHub Pages)
This repository is a user site (`robertbiv.github.io`). GitHub Pages automatically publishes from the `main` branch — no GitHub Actions required.

First push (if not already done):
```bash
git branch -M main
git remote add origin https://github.com/robertbiv/robertbiv.github.io.git
git commit -m "Initial commit: Dynamic GitHub portfolio"
git push -u origin main
```

## Notes
- The app is static and uses the browser to call the GitHub API directly.
- A `.gitignore` avoids committing local Python virtual environments and editor files.

## License
Provided as-is for personal site use.