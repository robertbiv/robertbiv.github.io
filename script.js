const username = "robertbiv";
const highlightRepos = ["robertbiv.github.io", "sdr-tracker", "aoc-2025"];
const emailOverride = "github@robertb.me";

const els = {
  name: document.getElementById("name"),
  bio: document.getElementById("bio"),
  location: document.getElementById("location"),
  website: document.getElementById("website"),
  header: document.querySelector("header"),
  repoCount: document.getElementById("repoCount"),
  followers: document.getElementById("followers"),
  stars: document.getElementById("stars"),
  repoGrid: document.getElementById("repoGrid"),
  languageGrid: document.getElementById("languageGrid"),
  languageSelect: document.getElementById("languageSelect"),
  sortSelect: document.getElementById("sortSelect"),
  searchInput: document.getElementById("searchInput"),
  emptyState: document.getElementById("emptyState"),
  highlightChips: document.getElementById("highlightChips"),
  heroGithub: document.getElementById("githubLink"),
  emailLink: document.getElementById("emailLink"),
  emailText: document.getElementById("emailText"),
  themeToggle: document.getElementById("themeToggle"),
  menuToggle: document.getElementById("menuToggle"),
  navActions: document.getElementById("navActions"),
  scrollTopBtn: document.getElementById("scrollTop"),
  lastUpdated: document.getElementById("lastUpdated"),
  loadingState: document.getElementById("loadingState"),
  errorState: document.getElementById("errorState"),
  copyEmail: document.getElementById("copyEmail"),
  toast: document.getElementById("toast"),
  viewAllBtn: document.getElementById("viewAllBtn"),
  viewAllContainer: document.getElementById("viewAllContainer"),
};

const state = {
  repos: [],
  filtered: [],
  languages: new Map(),
  showAll: false,
};

function fmtNumber(n) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function setTheme(nextTheme) {
  const theme = nextTheme || (document.documentElement.dataset.theme === "light" ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  els.themeToggle.textContent = theme === "light" ? "Dark" : "Light";
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
  setTheme(saved || "dark");
  els.themeToggle.addEventListener("click", () => setTheme());
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub request failed: ${res.status}`);
  return res.json();
}

async function loadData() {
  showLoading(true);
  try {
    const [user, repos] = await Promise.all([
      fetchJson(`https://api.github.com/users/${username}`),
      fetchJson(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
    ]);

    state.repos = repos.filter((r) => !r.fork);
    renderProfile(user);
    buildLanguageMap();
    hydrateFilters();
    renderHighlights();
    applyFilters();
    updateTimestamp();
    showLoading(false);
  } catch (err) {
    console.error(err);
    showLoading(false);
    showError(true);
    els.bio.textContent = "Could not load profile data.";
  }
}

function renderProfile(user) {
  els.name.textContent = `@${user.login}`;
  els.bio.textContent = user.bio || "Hey, I’m Robert  — a computer science enthusiast who loves building cool things!";
  if (user.location) {
    els.location.textContent = user.location;
    els.location.hidden = false;
  } else {
    els.location.hidden = true;
  }

  const website = user.blog || user.html_url;
  const displayText = website.replace(/https?:\/\//, "");
  els.website.innerHTML = `<a class="badge-chip" href="${website}" target="_blank" rel="noreferrer">${displayText}</a>`;
  els.heroGithub.href = user.html_url;

  els.repoCount.textContent = user.public_repos;
  els.followers.textContent = fmtNumber(user.followers);
  els.stars.textContent = fmtNumber(state.repos.reduce((sum, r) => sum + r.stargazers_count, 0));

  const noreply = user.id ? `${user.id}+${user.login}@users.noreply.github.com` : null;
  const email = emailOverride || user.email || noreply;
  els.emailLink.href = `mailto:${email}`;
  els.emailText.textContent = email;
}

function buildLanguageMap() {
  const map = new Map();
  state.repos.forEach((repo) => {
    if (!repo.language) return;
    map.set(repo.language, (map.get(repo.language) || 0) + 1);
  });
  state.languages = map;
  renderLanguageGrid();
}

function renderLanguageGrid() {
  const total = Array.from(state.languages.values()).reduce((a, b) => a + b, 0) || 1;
  els.languageGrid.innerHTML = "";
  
  // Sort languages by count (descending)
  const sorted = Array.from(state.languages.entries()).sort((a, b) => b[1] - a[1]);
  
  sorted.forEach(([lang, count]) => {
    const percent = Math.round((count / total) * 100);
    const card = document.createElement("div");
    card.className = "lang-card";
    card.innerHTML = `
      <h3>${lang}</h3>
      <p class="repo__meta">${count} repos</p>
      <div class="progress"><span style="width:${percent}%"></span></div>
      <p class="repo__meta">${percent}% of codebase mix</p>
    `;
    els.languageGrid.appendChild(card);
  });
}

function hydrateFilters() {
  const langs = ["all", ...new Set(state.repos.map((r) => r.language).filter(Boolean))];
  els.languageSelect.innerHTML = "";
  langs.forEach((lang) => {
    const opt = document.createElement("option");
    opt.value = lang;
    opt.textContent = lang === "all" ? "All" : lang;
    els.languageSelect.appendChild(opt);
  });

  els.languageSelect.addEventListener("change", applyFilters);
  els.sortSelect.addEventListener("change", applyFilters);
  els.searchInput.addEventListener("input", applyFilters);
}

function renderHighlights() {
  const set = new Set(highlightRepos.map((r) => r.toLowerCase()));
  els.highlightChips.innerHTML = "";
  state.repos
    .filter((r) => set.has(r.name.toLowerCase()))
    .slice(0, 4)
    .forEach((repo) => {
      const chip = document.createElement("a");
      chip.className = "chip";
      chip.href = repo.html_url;
      chip.target = "_blank";
      chip.rel = "noreferrer";
      chip.textContent = `${repo.name} · ${fmtNumber(repo.stargazers_count)}★`;
      els.highlightChips.appendChild(chip);
    });
}

function applyFilters() {
  const query = els.searchInput.value.toLowerCase();
  const lang = els.languageSelect.value;
  const sort = els.sortSelect.value;

  let list = [...state.repos];
  if (lang !== "all") list = list.filter((r) => (r.language || "").toLowerCase() === lang.toLowerCase());
  if (query) list = list.filter((r) => r.name.toLowerCase().includes(query) || (r.description || "").toLowerCase().includes(query));

  if (sort === "updated") list.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  if (sort === "stars") list.sort((a, b) => b.stargazers_count - a.stargazers_count);
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

  state.filtered = list;
  renderRepos();
}

function renderRepos() {
  els.repoGrid.innerHTML = "";
  if (!state.filtered.length) {
    els.emptyState.hidden = false;
    if (els.viewAllContainer) els.viewAllContainer.hidden = true;
    return;
  }
  els.emptyState.hidden = true;

  const limit = state.showAll ? state.filtered.length : 20;
  const toShow = state.filtered.slice(0, limit);
  
  // Show/hide view all button
  if (els.viewAllContainer && els.viewAllBtn) {
    if (state.filtered.length > 20) {
      els.viewAllContainer.hidden = false;
      els.viewAllBtn.textContent = state.showAll ? 'Show Less' : `View All ${state.filtered.length} Repositories`;
    } else {
      els.viewAllContainer.hidden = true;
    }
  }

  toShow.forEach((repo) => {
    const card = document.createElement("a");
    card.className = "repo";
    card.href = repo.html_url;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.innerHTML = `
      <div class="repo__top">
        <div>
          <h3 class="repo__name">${repo.name}</h3>
          <p class="repo__desc">${repo.description || "Description Coming Soon!"}</p>
        </div>
      </div>
      <div class="repo__meta">
        <span class="tag">${repo.language || "Mixed"}</span>
        <span>★ ${fmtNumber(repo.stargazers_count)}</span>
        <span>Forks ${fmtNumber(repo.forks_count)}</span>
        <span>Updated ${fmtDate(repo.pushed_at)}</span>
      </div>
    `;
    els.repoGrid.appendChild(card);
  });
}

function init() {
  initTheme();
  loadData();
  initScrollBackground();
  initMobileMenu();
  initScrollTop();
  initCopyEmail();
  initViewAll();
}

document.addEventListener("DOMContentLoaded", init);

function initScrollBackground() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const bg = document.querySelector('.bg-canvas');
  const blobs = Array.from(document.querySelectorAll('.bg-blob'));
  if (!bg) return;

  let ticking = false;
  let max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const small = () => window.innerWidth <= 640;

  function update() {
    const y = window.scrollY || window.pageYOffset;
    const p = Math.min(1, Math.max(0, y / max));
    const hue = Math.round(p * 240 * (small() ? 0.6 : 1));
    bg.style.filter = `hue-rotate(${hue}deg)`;

    if (blobs.length) {
      const k = small() ? 0.5 : 1;
      const a = (p * 60 * k);
      const b = (-p * 40 * k);
      const c = (p * 30 * k);
      blobs[0] && (blobs[0].style.transform = `translate3d(0, ${a}px, 0)`);
      blobs[1] && (blobs[1].style.transform = `translate3d(0, ${b}px, 0)`);
      blobs[2] && (blobs[2].style.transform = `translate3d(0, ${c}px, 0)`);
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    onScroll();
  });
  update();
}

function initMobileMenu() {
  if (!els.menuToggle || !els.header) return;
  function setOpen(open) {
    els.header.dataset.menu = open ? 'open' : '';
    els.menuToggle.setAttribute('aria-expanded', String(open));
  }
  els.menuToggle.addEventListener('click', () => {
    const open = els.header.dataset.menu !== 'open';
    setOpen(open);
  });
  // Close on nav click (for in-page anchors)
  els.navActions && els.navActions.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.closest('a')) setOpen(false);
  });
  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) setOpen(false);
  });
}

function initScrollTop() {
  if (!els.scrollTopBtn) return;
  els.scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function updateTimestamp() {
  if (!els.lastUpdated) return;
  const now = new Date();
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  els.lastUpdated.textContent = `Updated ${date} at ${time}.`;
}

function showLoading(show) {
  if (!els.loadingState || !els.repoGrid) return;
  if (show) {
    els.loadingState.style.display = 'grid';
    els.repoGrid.style.display = 'none';
    if (els.emptyState) els.emptyState.hidden = true;
    if (els.errorState) els.errorState.hidden = true;
  } else {
    els.loadingState.style.display = 'none';
    els.repoGrid.style.display = 'grid';
  }
}

function showError(show) {
  if (!els.errorState) return;
  els.errorState.hidden = !show;
  if (show) {
    els.repoGrid.hidden = true;
    els.emptyState.hidden = true;
    els.loadingState.hidden = true;
  }
}

function initCopyEmail() {
  if (!els.copyEmail) return;
  els.copyEmail.addEventListener('click', async () => {
    const email = els.emailText.textContent;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard!');
    } catch (err) {
      showToast('Could not copy email.');
    }
  });
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.hidden = false;
  setTimeout(() => {
    els.toast.hidden = true;
  }, 2500);
}

function initViewAll() {
  if (!els.viewAllBtn) return;
  els.viewAllBtn.addEventListener('click', () => {
    state.showAll = !state.showAll;
    renderRepos();
    if (state.showAll) {
      // Scroll to where the new content starts
      els.viewAllContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}
