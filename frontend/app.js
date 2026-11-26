(() => {
  const API_KEY = "educonnect.apiBase";
  const TOKEN_KEY = "educonnect.token";
  const USER_KEY = "educonnect.user";
  const THEME_KEY = "educonnect.theme";
  const DEFAULT_API = "https://educonnect123456789.vercel.app/api";
  const PREVIOUS_DEFAULT_API = "http://localhost:5000/api";
  const app = document.getElementById("app");
  const modal = document.getElementById("modal");
  const state = {
    token: localStorage.getItem(TOKEN_KEY),
    user: readStoredUser(),
    page: "Dashboard",
    authMode: "login",
    theme: localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    search: "",
    data: { courses: [], assignments: [], results: [], attendance: { records: [], percentage: 0 }, announcements: [], users: [] },
    errors: [],
    loading: false,
    notifications: [],
    notificationsLoaded: false,
    notificationsOpen: false,
    notificationError: "",
    notificationLoading: false,
    notificationTimer: null,
    toastTimer: null
  };

  const icons = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    courses: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5v15M8 7h8M8 11h7"/>',
    assignments: '<path d="M8 4h11a2 2 0 0 1 2 2v14H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1"/><path d="M8 2h7v4H8zM8 11h9M8 15h9"/>',
    results: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M17 6h3v3"/>',
    attendance: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18M8 14l2 2 5-5"/>',
    announcements: '<path d="M3 11v2a2 2 0 0 0 2 2h2l9 5V4l-9 5H5a2 2 0 0 0-2 2Z"/><path d="m9 15 2 6h3l-2.5-4.6M18 9l3-2M18 15l3 2"/>',
    settings: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.7Z" transform="translate(-1 -2)"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
  };

  function readStoredUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
    catch { return null; }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ""}</svg>`;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
  }

  function themeToggleMarkup() {
    const dark = state.theme === "dark";
    const target = dark ? "light" : "dark";
    return `<button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to ${target} mode" aria-pressed="${dark}" title="Switch to ${target} mode">${icon(dark ? "sun" : "moon")}<span>${dark ? "Light" : "Dark"} mode</span></button>`;
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, state.theme);
    applyTheme();
    if (state.token && state.user) renderShell();
    else renderAuth();
    if (state.token && state.user) renderPage();
  }

  function apiBase() {
    const savedApi = (localStorage.getItem(API_KEY) || "").replace(/\/+$/, "");
    const hostname = window.location.hostname;
    const localApi = hostname === "localhost" || hostname === "127.0.0.1"
      ? `${window.location.origin}/api`
      : "";
    if (savedApi === PREVIOUS_DEFAULT_API) {
      if (localApi) return localApi;
      localStorage.setItem(API_KEY, DEFAULT_API);
      return DEFAULT_API;
    }
    return savedApi || localApi || DEFAULT_API;
  }

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    let response;
    try {
      response = await fetch(`${apiBase()}${path}`, { ...options, headers });
    } catch (error) {
      throw new Error(`Could not reach ${apiBase()}. Start the backend and check the API URL in Settings.`);
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `Request failed (${response.status})`);
    return result;
  }

  function formatDate(date, options = { month: "short", day: "numeric" }) {
    if (!date) return "Date not set";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Date not set";
    return parsed.toLocaleDateString(undefined, options);
  }

  function initials(name) {
    return String(name || "Student").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function roleOf(user) {
    return String(user && user.role || "").trim().toLowerCase();
  }

  function roleLabel(role) {
    const value = roleOf({ role });
    return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "User";
  }

  function roleDashboardPath(role) {
    const value = roleOf({ role });
    return ["admin", "teacher", "student"].includes(value) ? `/${value}/dashboard` : "/";
  }

  function syncDashboardRoute() {
    const destination = roleDashboardPath(state.user);
    if (window.location.protocol !== "file:" && destination !== "/" && window.location.pathname !== destination) {
      window.history.replaceState(null, "", destination);
    }
  }

  function safeAvatarUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function avatarMarkup(user, className) {
    const src = safeAvatarUrl(user.avatar);
    return `<div class="${className}" data-avatar>${src ? `<img data-avatar-image src="${esc(src)}" alt="">` : esc(initials(user.name))}</div>`;
  }

  function bindAvatarFallbacks(scope) {
    scope.querySelectorAll("[data-avatar-image]").forEach((image) => {
      image.addEventListener("error", () => {
        const avatar = image.closest("[data-avatar]");
        if (avatar) avatar.textContent = initials(state.user && state.user.name);
      }, { once: true });
    });
  }

  function navItems() {
    const items = [
      ["Dashboard", "dashboard"], ["Courses", "courses"], ["Assignments", "assignments"],
      ["Results", "results"], ["Attendance", "attendance"], ["Announcements", "announcements"],
      ["Profile", "profile"], ["Settings", "settings"]
    ];
    const role = roleOf(state.user);
    if (role === "admin" || role === "teacher") {
      items.splice(2, 0, [role === "admin" ? "People" : "Students", "people"]);
    }
    return items;
  }

  function renderAuth() {
    const isRegister = state.authMode === "register";
    app.innerHTML = `
      <main class="auth-page">
        ${themeToggleMarkup()}
        <aside class="auth-aside">
          <a class="brand" href="#" aria-label="EduConnect home"><span class="brand-mark">${icon("courses")}</span><span>Edu<em>Connect</em></span></a>
          <div class="auth-aside-copy">
            <div class="eyebrow">One space. Every possibility.</div>
            <h1>Make learning<br>feel connected.</h1>
            <p>Bring classes, assignments, and progress together in one thoughtful space built for your learning journey.</p>
          </div>
          <div class="auth-footnote">A calmer way to learn, teach, and grow.</div>
        </aside>
        <section class="auth-main">
          <div class="auth-card">
            <div class="eyebrow">Welcome to EduConnect</div>
            <h2>${isRegister ? "Create your account" : "Welcome back"}</h2>
            <p>${isRegister ? "Set up your profile to get started with your learning space." : "Sign in to pick up right where you left off."}</p>
            <div class="auth-toggle" role="tablist">
              <button type="button" data-auth-mode="login" class="${isRegister ? "" : "active"}">Sign in</button>
              <button type="button" data-auth-mode="register" class="${isRegister ? "active" : ""}">Create account</button>
            </div>
            <div id="auth-error" class="auth-error" role="alert"></div>
            <form id="auth-form" class="form-grid">
              ${isRegister ? `<div class="field"><label for="auth-name">Full name</label><input id="auth-name" name="name" autocomplete="name" placeholder="Your name" required></div>` : ""}
              <div class="field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@school.edu" required></div>
              <div class="field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" minlength="${isRegister ? 6 : 1}" placeholder="Enter your password" required></div>
              <button class="primary-button auth-submit" type="submit">${isRegister ? "Create account" : "Sign in"} <span aria-hidden="true">→</span></button>
            </form>
            <p class="auth-note">Your school workspace, all in one place.</p>
          </div>
        </section>
      </main>`;
    app.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      renderAuth();
    }));
    app.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme);
    document.getElementById("auth-form").addEventListener("submit", authenticate);
  }

  async function authenticate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const errorBox = document.getElementById("auth-error");
    const submit = event.currentTarget.querySelector("button[type=submit]");
    submit.disabled = true;
    submit.textContent = "Please wait…";
    errorBox.classList.remove("visible");
    try {
      const result = await request(`/auth/${state.authMode}`, { method: "POST", body: JSON.stringify(payload) });
      state.token = result.token;
      state.user = result;
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      await initialize();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.add("visible");
      submit.disabled = false;
      submit.textContent = state.authMode === "register" ? "Create account" : "Sign in";
    }
  }

  function renderShell() {
    const date = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const nav = navItems().map(([label, glyph]) => `
      <button class="nav-item ${state.page === label ? "active" : ""}" type="button" data-page="${label}" aria-label="${esc(label)}">
        ${icon(glyph)}<span>${label}</span>
      </button>`).join("");
    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <a class="brand" href="#" aria-label="EduConnect dashboard"><span class="brand-mark">${icon("courses")}</span><span>Edu<em>Connect</em></span></a>
          <div class="nav-label">Workspace</div>
          <nav class="nav-list" aria-label="Main navigation">${nav}</nav>
          <div class="sidebar-spacer"></div>
          <div class="sidebar-note"><strong>Your learning, in sync</strong><p>Keep track of classes, deadlines, and progress — all in one place.</p></div>
          <div class="sidebar-footer">
            <button type="button" class="sidebar-profile ${state.page === "Profile" ? "active" : ""}" data-page="Profile" aria-label="Open profile">
              ${avatarMarkup(state.user, "avatar")}
              <span class="profile-meta"><strong>${esc(state.user.name)}</strong><span>${esc(roleLabel(state.user.role))}</span></span>
            </button>
            <button type="button" class="logout-button" data-logout aria-label="Log out" title="Log out">${icon("logout")}<span>Log out</span></button>
          </div>
        </aside>
        <main class="main-area">
          <header class="topbar">
            <button class="mobile-menu" type="button" data-mobile-menu aria-label="Open navigation">${icon("menu")}</button>
            <div class="breadcrumbs">Workspace <span aria-hidden="true">/</span> <strong>${esc(state.page)}</strong></div>
            <div class="topbar-actions">
              <label class="search-box">${icon("search")}<input id="search-input" type="search" value="${esc(state.search)}" placeholder="Search ${esc(state.page.toLowerCase())}..." aria-label="Search current page"></label>
              <div class="date-pill">${esc(date)}</div>
              <div class="notification-wrap">
                <button type="button" class="notification-toggle" data-notifications aria-label="Notifications" aria-expanded="false">
                  ${icon("bell")}<span class="notification-count" id="notification-count" hidden></span>
                </button>
                <div class="notification-popover" id="notification-popover" hidden></div>
              </div>
              ${themeToggleMarkup()}
              <button type="button" class="topbar-logout" data-logout aria-label="Log out" title="Log out">${icon("logout")}<span>Log out</span></button>
            </div>
          </header>
          <div id="page-content" class="page-content">${loadingMarkup()}</div>
        </main>
      </div>`;
    bindAvatarFallbacks(app);
    app.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.page)));
    app.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", logout));
    app.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme);
    app.querySelector("[data-notifications]").addEventListener("click", () => {
      state.notificationsOpen = !state.notificationsOpen;
      updateNotificationUI();
    });
    app.querySelector("[data-mobile-menu]").addEventListener("click", () => {
      const side = app.querySelector(".sidebar");
      side.classList.toggle("mobile-open");
    });
    document.getElementById("search-input").addEventListener("input", (event) => {
      state.search = event.target.value;
      renderPage();
    });
    updateNotificationUI();
  }

  function loadingMarkup() {
    return `<div class="loading-screen"><div><div class="spinner"></div>Loading your workspace…</div></div>`;
  }

  async function initialize() {
    state.loading = true;
    syncDashboardRoute();
    renderShell();
    try {
      const current = await request("/auth/me");
      if (current) {
        state.user = current;
        localStorage.setItem(USER_KEY, JSON.stringify(current));
        syncDashboardRoute();
        renderShell();
      }
    } catch (error) {
      if (/token|authorized|user not found|role/i.test(error.message)) {
        logout();
        return;
      }
      state.errors = [error.message];
    }
    await loadData();
    startNotificationPolling();
  }

  function startNotificationPolling() {
    if (state.notificationTimer) clearInterval(state.notificationTimer);
    loadNotifications(false);
    state.notificationTimer = setInterval(() => {
      if (!document.hidden) loadNotifications(true);
    }, 15000);
  }

  async function loadNotifications(announceNew) {
    if (state.notificationLoading || !state.token) return;
    const token = state.token;
    state.notificationLoading = true;
    try {
      const notifications = await request("/notifications");
      if (token !== state.token) return;
      const previousIds = new Set(state.notifications.map((item) => String(item._id)));
      const newItems = state.notificationsLoaded && announceNew
        ? notifications.filter((item) => !item.isRead && !previousIds.has(String(item._id)))
        : [];
      state.notifications = notifications;
      state.notificationsLoaded = true;
      state.notificationError = "";
      if (newItems.length) showNotificationToast(newItems[0].message);
    } catch (error) {
      if (token === state.token) state.notificationError = error.message;
    } finally {
      state.notificationLoading = false;
      updateNotificationUI();
    }
  }

  function updateNotificationUI() {
    const button = app.querySelector("[data-notifications]");
    const count = document.getElementById("notification-count");
    const unread = state.notifications.filter((item) => !item.isRead).length;
    if (button && count) {
      count.textContent = unread > 99 ? "99+" : String(unread);
      count.hidden = unread === 0;
      button.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
      button.setAttribute("aria-expanded", String(state.notificationsOpen));
    }

    const panel = document.getElementById("notification-popover");
    if (!panel) return;
    panel.hidden = !state.notificationsOpen;
    if (!state.notificationsOpen) return;
    panel.innerHTML = `
      <div class="notification-header"><strong>Notifications</strong><button type="button" data-mark-all-read ${unread ? "" : "disabled"}>Mark all read</button></div>
      ${state.notificationError ? `<p class="notification-error">${esc(state.notificationError)}</p>` : ""}
      ${state.notifications.length ? `<div class="notification-list">${state.notifications.map((item) => `
        <button type="button" class="notification-item ${item.isRead ? "" : "unread"}" data-read-notification="${esc(item._id)}">
          <span>${esc(item.message)}</span><small>${esc(formatDate(item.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</small>
        </button>`).join("")}</div>` : `<div class="notification-empty">You're all caught up.</div>`}`;
    panel.querySelector("[data-mark-all-read]").addEventListener("click", markAllNotificationsRead);
    panel.querySelectorAll("[data-read-notification]").forEach((item) => {
      item.addEventListener("click", () => markNotificationRead(item.dataset.readNotification));
    });
  }

  async function markNotificationRead(id) {
    try {
      await request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" });
      await loadNotifications(false);
    } catch (error) {
      state.notificationError = error.message;
      updateNotificationUI();
    }
  }

  async function markAllNotificationsRead() {
    try {
      await request("/notifications/read-all", { method: "PUT" });
      await loadNotifications(false);
    } catch (error) {
      state.notificationError = error.message;
      updateNotificationUI();
    }
  }

  function showNotificationToast(message) {
    let toast = document.getElementById("notification-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "notification-toast";
      toast.className = "notification-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("visible"), 4200);
  }

  async function loadData() {
    state.loading = true;
    const role = roleOf(state.user);
    const student = role === "student";
    const calls = [
      ["courses", student ? "/courses/enrolled" : "/courses", []],
      ["assignments", "/assignments", []],
      ["results", "/results", []],
      ["attendance", "/attendance", { records: [], percentage: 0, total: 0 }],
      ["announcements", "/announcements", []]
    ];
    if (role === "admin") calls.push(["users", "/users", []]);
    if (role === "teacher") calls.push(["users", "/users?role=student", []]);
    const settled = await Promise.all(calls.map(async ([key, path, fallback]) => {
      try { return [key, await request(path), null]; }
      catch (error) { return [key, fallback, `${key[0].toUpperCase()}${key.slice(1)}: ${error.message}`]; }
    }));
    state.errors = settled.map(([, , error]) => error).filter(Boolean);
    for (const [key, value] of settled) state.data[key] = value;
    state.loading = false;
    renderPage();
  }

  function navigate(page) {
    state.page = page;
    state.search = "";
    if (page === "Dashboard") syncDashboardRoute();
    renderShell();
    renderPage();
  }

  function filtered(items, fields) {
    const term = state.search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => fields.some((field) => String(field(item) || "").toLowerCase().includes(term)));
  }

  function pageHeading(title, subtitle, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${esc(roleLabel(state.user.role))} workspace</div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
  }

  function actionButton(label, action) {
    return `<button type="button" class="primary-button" data-action="${action}">${icon("plus")}${label}</button>`;
  }

  function statCard(label, value, note, color, glyph) {
    return `<article class="stat-card"><div class="stat-icon ${color}">${icon(glyph)}</div><div class="stat-meta"><span>${label}</span><strong>${value}</strong><small>${note}</small></div></article>`;
  }

  function courseRows(items) {
    if (!items.length) return emptyState("No courses yet", "Your courses will appear here once they are available.");
    return `<div class="course-list">${items.map((course, index) => `
      <article class="course-row">
        <div class="course-color color-${index % 4}">${esc(String(course.code || course.title || "EC").slice(0, 2).toUpperCase())}</div>
        <div class="row-main"><strong>${esc(course.title || "Untitled course")}</strong><span>${esc(course.teacher && course.teacher.name ? course.teacher.name : course.description || "Course")}</span></div>
        <span class="course-code">${esc(course.code || "COURSE")}</span>
      </article>`).join("")}</div>`;
  }

  function assignmentRows(items, limit) {
    const list = (limit ? items.slice(0, limit) : items).sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    if (!list.length) return emptyState("Nothing due right now", "New assignments will show up here.");
    return `<div class="assignment-list">${list.map((assignment) => {
      const courseName = assignment.course && (assignment.course.code || assignment.course.title) || "Course";
      const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
      const overdue = due && due < new Date();
      return `<article class="assignment-row"><div class="course-color">${icon("assignments")}</div><div class="row-main"><strong>${esc(assignment.title || "Assignment")}</strong><span>${esc(courseName)}${assignment.description ? ` · ${esc(assignment.description)}` : ""}</span></div><div class="due-date"><strong>${esc(formatDate(assignment.dueDate))}</strong><span class="badge ${overdue ? "danger" : "warning"}">${overdue ? "Past due" : "Due date"}</span></div>${roleOf(state.user) === "student" ? `<button type="button" class="secondary-button" data-submit-assignment="${esc(assignment._id)}">Submit</button>` : ""}</article>`;
    }).join("")}</div>`;
  }

  function announcementRows(items, limit) {
    const list = limit ? items.slice(0, limit) : items;
    if (!list.length) return emptyState("No announcements yet", "Updates from your school will appear here.");
    return `<div class="announcement-list">${list.map((item) => `
      <article class="announcement-row"><div class="announcement-avatar">${esc(initials(item.author && item.author.name || "EC"))}</div><div class="row-main"><strong>${esc(item.title || "Announcement")}</strong><span>${esc(item.content || "")}</span><div class="announcement-meta">${esc(item.author && item.author.name || "EduConnect")} · ${esc(formatDate(item.createdAt, { month: "short", day: "numeric", year: "numeric" }))}${item.course && item.course.title ? ` · ${esc(item.course.title)}` : ""}</div></div></article>`).join("")}</div>`;
  }

  function emptyState(title, message) {
    return `<div class="empty-state"><strong>${title}</strong>${message}</div>`;
  }

  function dashboard() {
    if (roleOf(state.user) === "admin") return adminDashboard();
    if (roleOf(state.user) === "teacher") return teacherDashboard();
    return studentDashboard();
  }

  function studentDashboard() {
    const { courses, assignments, results, attendance, announcements, users } = state.data;
    const average = results.length ? Math.round(results.reduce((sum, item) => sum + (Number(item.marksObtained) / Math.max(1, Number(item.totalMarks))) * 100, 0) / results.length) : 0;
    const upcoming = assignments.filter((item) => !item.dueDate || new Date(item.dueDate) >= new Date());
    const people = roleOf(state.user) === "student" ? "Your learning at a glance" : `${roleLabel(state.user.role)} overview`;
    const attendancePct = Number(attendance.percentage || 0);
    const stats = [
      statCard(roleOf(state.user) === "student" ? "Enrolled courses" : "Courses", courses.length, "In your workspace", "blue", "courses"),
      statCard("Assignments", assignments.length, `${upcoming.length} upcoming`, "orange", "assignments"),
      roleOf(state.user) === "student"
        ? statCard("Average score", results.length ? `${average}%` : "—", results.length ? "Across recorded results" : "No results yet", "green", "results")
        : statCard("Students", state.data.users.length, "In your workspace", "green", "attendance"),
      statCard("Attendance", `${attendancePct}%`, `${attendance.total || 0} records`, "pink", "attendance")
    ].join("");
    const matchingCourses = filtered(courses, [(item) => item.title, (item) => item.code, (item) => item.description]);
    const matchingAssignments = filtered(assignments, [(item) => item.title, (item) => item.description, (item) => item.course && item.course.title]);
    const matchingAnnouncements = filtered(announcements, [(item) => item.title, (item) => item.content]);
    return `
      ${pageHeading("Your learning, in sync", people)}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="welcome-card"><div class="welcome-copy"><div class="eyebrow">Your dashboard</div><h1>Good ${greeting()}, ${esc(state.user.name.split(" ")[0])}.</h1><p>Here’s what’s happening across your learning space. Let’s make today count.</p></div><div class="welcome-date"><span>Today is</span><strong>${esc(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</strong></div></section>
      <section class="stats-grid">${stats}</section>
      <section class="content-grid">
        <div>
          <article class="panel"><div class="panel-header"><div><h2>${roleOf(state.user) === "student" ? "Your courses" : "Courses"}</h2><p>A quick look at your learning lineup</p></div><button class="text-button" type="button" data-page="Courses">View all <span aria-hidden="true">→</span></button></div><div class="panel-body">${courseRows(matchingCourses.slice(0, 4))}</div></article>
          <article class="panel"><div class="panel-header"><div><h2>Upcoming assignments</h2><p>Stay ahead of what’s due</p></div><button class="text-button" type="button" data-page="Assignments">View all <span aria-hidden="true">→</span></button></div><div class="panel-body">${assignmentRows(matchingAssignments, 4)}</div></article>
        </div>
        <div>
          <article class="panel"><div class="panel-header"><div><h2>Attendance</h2><p>Your overall class presence</p></div><span class="badge success">On track</span></div><div class="panel-body"><div class="progress-wrap"><div class="ring" style="--progress:${Math.max(0, Math.min(100, attendancePct))}%"><span>${attendancePct}%</span></div><div class="progress-copy"><strong>Keep showing up</strong><p>Every class is a chance to move forward. Your attendance is looking good.</p></div></div><div class="progress-legend"><span><i class="legend-dot"></i>Present</span><span>${Number(attendance.presentCount || 0)} of ${Number(attendance.total || 0)} classes</span></div></div></article>
          <article class="panel"><div class="panel-header"><div><h2>Latest updates</h2><p>News from your learning community</p></div><button class="text-button" type="button" data-page="Announcements">All updates →</button></div><div class="panel-body">${announcementRows(matchingAnnouncements, 3)}</div></article>
        </div>
      </section>`;
  }

  function adminDashboard() {
    const { courses, assignments, announcements, users } = state.data;
    const students = users.filter((user) => roleOf(user) === "student").length;
    const teachers = users.filter((user) => roleOf(user) === "teacher").length;
    const upcoming = assignments.filter((item) => !item.dueDate || new Date(item.dueDate) >= new Date());
    const matchingAnnouncements = filtered(announcements, [(item) => item.title, (item) => item.content]);
    return `
      ${pageHeading("Administration", "A school-wide view of people, courses, and activity.", `${actionButton("Add user", "user")}${actionButton("Add course", "course")}${actionButton("New assignment", "assignment")}`)}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="welcome-card"><div class="welcome-copy"><div class="eyebrow">Admin dashboard</div><h1>Good ${greeting()}, ${esc(state.user.name.split(" ")[0])}.</h1><p>Keep your school workspace organized and up to date.</p></div><div class="welcome-date"><span>Today is</span><strong>${esc(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</strong></div></section>
      <section class="stats-grid">
        ${statCard("Total users", users.length, "Across all roles", "blue", "attendance")}
        ${statCard("Students", students, "Student accounts", "green", "dashboard")}
        ${statCard("Teachers", teachers, "Teacher accounts", "pink", "courses")}
        ${statCard("Courses", courses.length, `${assignments.length} assignments · ${upcoming.length} upcoming`, "orange", "assignments")}
      </section>
      <section class="content-grid">
        <div>
          <article class="panel"><div class="panel-header"><div><h2>Course catalog</h2><p>Courses across the school</p></div><button class="text-button" type="button" data-page="Courses">View courses →</button></div><div class="panel-body">${courseRows(filtered(courses, [(item) => item.title, (item) => item.code]).slice(0, 5))}</div></article>
          <article class="panel"><div class="panel-header"><div><h2>Upcoming assignments</h2><p>${upcoming.length} to keep an eye on</p></div><button class="text-button" type="button" data-page="Assignments">View assignments →</button></div><div class="panel-body">${assignmentRows(filtered(upcoming, [(item) => item.title, (item) => item.description]), 5)}</div></article>
        </div>
        <div>
          <article class="panel"><div class="panel-header"><div><h2>Community snapshot</h2><p>Accounts by role</p></div></div><div class="panel-body">
            <div class="role-summary"><span>Students</span><strong>${students}</strong></div>
            <div class="role-summary"><span>Teachers</span><strong>${teachers}</strong></div>
            <div class="role-summary"><span>Admins</span><strong>${users.filter((user) => roleOf(user) === "admin").length}</strong></div>
          </div></article>
          <article class="panel"><div class="panel-header"><div><h2>School announcements</h2><p>Latest community updates</p></div><button class="text-button" type="button" data-page="Announcements">All updates →</button></div><div class="panel-body">${announcementRows(matchingAnnouncements, 3)}</div></article>
        </div>
      </section>`;
  }

  function teacherDashboard() {
    const { courses, assignments, attendance, announcements, users } = state.data;
    const courseIds = new Set(courses.map((course) => String(course._id)));
    const teachingAssignments = assignments.filter((item) => item.course && courseIds.has(String(item.course._id)));
    const upcoming = teachingAssignments.filter((item) => !item.dueDate || new Date(item.dueDate) >= new Date());
    const attendancePct = Number(attendance.percentage || 0);
    const matchingAnnouncements = filtered(announcements, [(item) => item.title, (item) => item.content]);
    return `
      ${pageHeading("Teaching workspace", "Your classes, assignments, and student activity.", `${actionButton("New assignment", "assignment")}${actionButton("Post update", "announcement")}`)}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="welcome-card"><div class="welcome-copy"><div class="eyebrow">Teacher dashboard</div><h1>Good ${greeting()}, ${esc(state.user.name.split(" ")[0])}.</h1><p>Here’s a focused view of the courses and work you manage.</p></div><div class="welcome-date"><span>Today is</span><strong>${esc(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}</strong></div></section>
      <section class="stats-grid">
        ${statCard("Courses you teach", courses.length, "Assigned to your account", "blue", "courses")}
        ${statCard("Assignments", teachingAssignments.length, `${upcoming.length} upcoming`, "orange", "assignments")}
        ${statCard("Students", users.length, "Registered student accounts", "green", "attendance")}
        ${statCard("Attendance", `${attendancePct}%`, `${attendance.total || 0} records`, "pink", "attendance")}
      </section>
      <section class="content-grid">
        <div>
          <article class="panel"><div class="panel-header"><div><h2>Your courses</h2><p>Classes assigned to you</p></div><button class="text-button" type="button" data-page="Courses">View all →</button></div><div class="panel-body">${courseRows(filtered(courses, [(item) => item.title, (item) => item.code]).slice(0, 5))}</div></article>
          <article class="panel"><div class="panel-header"><div><h2>Assignments to manage</h2><p>Work for your courses</p></div><button class="text-button" type="button" data-page="Assignments">View all →</button></div><div class="panel-body">${assignmentRows(filtered(teachingAssignments, [(item) => item.title, (item) => item.description]), 5)}</div></article>
        </div>
        <div>
          <article class="panel"><div class="panel-header"><div><h2>Attendance overview</h2><p>Recorded across your workspace</p></div></div><div class="panel-body"><div class="progress-wrap"><div class="ring" style="--progress:${Math.max(0, Math.min(100, attendancePct))}%"><span>${attendancePct}%</span></div><div class="progress-copy"><strong>Class attendance</strong><p>${Number(attendance.presentCount || 0)} of ${Number(attendance.total || 0)} recorded sessions are marked present.</p></div></div></div></article>
          <article class="panel"><div class="panel-header"><div><h2>School updates</h2><p>Latest announcements</p></div><button class="text-button" type="button" data-page="Announcements">All updates →</button></div><div class="panel-body">${announcementRows(matchingAnnouncements, 3)}</div></article>
        </div>
      </section>`;
  }

  function peoplePage() {
    const isAdmin = roleOf(state.user) === "admin";
    const users = filtered(state.data.users, [(user) => user.name, (user) => user.email, (user) => user.role]);
    const heading = isAdmin ? "People" : "Students";
    const description = isAdmin ? "Manage the accounts and roles in your school." : "Students in your teaching workspace.";
    const rows = users.map((user) => {
      const isSelf = String(user._id) === String(state.user._id);
      const actions = isAdmin && !isSelf
        ? `<button type="button" class="secondary-button" data-edit-user="${esc(user._id)}">Edit</button><button type="button" class="secondary-button" data-delete-user="${esc(user._id)}">Remove</button>`
        : isSelf ? "Current account" : "";
      return `<tr><td class="table-title">${esc(user.name)}</td><td>${esc(user.email)}</td><td><span class="badge">${esc(roleLabel(user.role))}</span></td><td>${actions}</td></tr>`;
    }).join("");
    return `${pageHeading(heading, description, isAdmin ? actionButton("Add user", "user") : "")}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="panel"><div class="panel-header"><div><h2>${users.length} ${users.length === 1 ? "account" : "accounts"}</h2><p>${isAdmin ? "Students, teachers, and administrators" : "Your registered students"}</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">${emptyState("No accounts found", "Accounts matching your search will appear here.")}</td></tr>`}</tbody></table></div>
      </section>`;
  }

  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  }

  function coursesPage() {
    const courses = filtered(state.data.courses, [(item) => item.title, (item) => item.code, (item) => item.description]);
    const canCreate = roleOf(state.user) === "admin";
    return `${pageHeading("Courses", "Explore the classes in your learning space.", canCreate ? actionButton("Add course", "course") : "")}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="panel"><div class="panel-header"><div><h2>${courses.length} ${courses.length === 1 ? "course" : "courses"}</h2><p>Course catalog and class details</p></div></div><div class="panel-body">${courseRows(courses)}</div></section>`;
  }

  function assignmentsPage() {
    const assignments = filtered(state.data.assignments, [(item) => item.title, (item) => item.description, (item) => item.course && item.course.title]);
    const canCreate = ["admin", "teacher"].includes(roleOf(state.user));
    return `${pageHeading("Assignments", "Keep deadlines in view and make steady progress.", canCreate ? actionButton("New assignment", "assignment") : "")}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="panel"><div class="panel-header"><div><h2>All assignments</h2><p>${assignments.length} assignments in your workspace</p></div></div><div class="panel-body">${assignmentRows(assignments)}</div></section>`;
  }

  function resultsPage() {
    const results = filtered(state.data.results, [(item) => item.examName, (item) => item.course && item.course.title, (item) => item.grade]);
    const average = results.length ? Math.round(results.reduce((sum, item) => sum + (Number(item.marksObtained) / Math.max(1, Number(item.totalMarks))) * 100, 0) / results.length) : 0;
    const canPublish = ["admin", "teacher"].includes(roleOf(state.user));
    return `${pageHeading("Results", canPublish ? "Publish scores for a student in one of your courses." : "A clear view of your academic progress.", canPublish ? actionButton("Publish result", "result") : "")}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="stats-grid">${statCard("Recorded results", results.length, "Published assessments", "blue", "results")}${statCard("Average score", results.length ? `${average}%` : "—", "Across available results", "green", "attendance")}</section>
      <section class="panel"><div class="panel-header"><div><h2>Assessment results</h2><p>Scores and grades shared with you</p></div></div><div class="table-wrap"><table><thead><tr><th>Assessment</th><th>Course</th><th>Score</th><th>Grade</th><th>Date</th></tr></thead><tbody>${results.length ? results.map((item) => `<tr><td class="table-title">${esc(item.examName || "Assessment")}</td><td>${esc(item.course && (item.course.code || item.course.title) || "Course")}</td><td>${esc(item.marksObtained)} / ${esc(item.totalMarks)}</td><td><span class="badge ${Number(item.marksObtained) / Math.max(1, Number(item.totalMarks)) >= .6 ? "success" : "danger"}">${esc(item.grade || "—")}</span></td><td>${esc(formatDate(item.createdAt, { month: "short", day: "numeric", year: "numeric" }))}</td></tr>`).join("") : `<tr><td colspan="5">${emptyState("No results yet", "When results are published, they’ll show up here.")}</td></tr>`}</tbody></table></div></section>`;
  }

  function attendancePage() {
    const attendance = state.data.attendance;
    const records = filtered(attendance.records || [], [(item) => item.course && item.course.title, (item) => item.status, (item) => item.student && item.student.name]);
    const canRecord = ["admin", "teacher"].includes(roleOf(state.user));
    return `${pageHeading("Attendance", canRecord ? "Record attendance for a student in one of your courses." : "See your attendance record at a glance.", canRecord ? actionButton("Record attendance", "attendance") : "")}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="stats-grid">${statCard("Attendance rate", `${Number(attendance.percentage || 0)}%`, "Across all recorded sessions", "green", "attendance")}${statCard("Classes attended", `${Number(attendance.presentCount || 0)} / ${Number(attendance.total || 0)}`, "Present records", "blue", "courses")}</section>
      <section class="panel"><div class="panel-header"><div><h2>Attendance history</h2><p>Most recent sessions first</p></div></div><div class="table-wrap"><table><thead><tr><th>Course</th><th>Date</th><th>Status</th>${roleOf(state.user) !== "student" ? "<th>Student</th>" : ""}</tr></thead><tbody>${records.length ? records.map((item) => `<tr><td class="table-title">${esc(item.course && (item.course.code || item.course.title) || "Course")}</td><td>${esc(formatDate(item.date, { month: "short", day: "numeric", year: "numeric" }))}</td><td><span class="badge ${item.status === "Present" ? "success" : item.status === "Late" ? "warning" : "danger"}">${esc(item.status)}</span></td>${roleOf(state.user) !== "student" ? `<td>${esc(item.student && item.student.name || "Student")}</td>` : ""}</tr>`).join("") : `<tr><td colspan="${roleOf(state.user) === "student" ? 3 : 4}">${emptyState("No attendance records", "Your attendance history will appear here.")}</td></tr>`}</tbody></table></div></section>`;
  }

  function announcementsPage() {
    const announcements = filtered(state.data.announcements, [(item) => item.title, (item) => item.content]);
    const canCreate = ["admin", "teacher"].includes(roleOf(state.user));
    return `${pageHeading("Announcements", "The latest news from your learning community.", canCreate ? actionButton("Post update", "announcement") : "")}
      ${state.errors.length ? `<div class="error-banner">${state.errors.map(esc).join(" · ")}</div>` : ""}
      <section class="panel"><div class="panel-header"><div><h2>Recent updates</h2><p>Announcements from your school and courses</p></div></div><div class="panel-body">${announcementRows(announcements)}</div></section>`;
  }

  function settingsPage() {
    return `${pageHeading("Settings", "Configure how EduConnect connects to your backend.")}
      <section class="panel settings-card"><div class="eyebrow">Connection</div><h2 style="font:700 15px Manrope;margin:0 0 7px">Backend API</h2><p>EduConnect connects to the API at <strong>${esc(apiBase())}</strong>. Change this if your API runs at a different address.</p><form id="api-settings"><label for="api-url">API base URL</label><input id="api-url" type="url" value="${esc(apiBase())}" placeholder="https://educonnect123456789.vercel.app/api" required><p>Use the address ending in <code>/api</code>. Your current session will be retained.</p><button class="primary-button" type="submit">Save connection</button></form></section>`;
  }

  function profilePage() {
    const user = state.user;
    return `${pageHeading("My profile", "Manage your account details and profile image.")}
      <section class="panel profile-card">
        <div class="profile-overview">
          <div id="profile-avatar-preview">${avatarMarkup(user, "profile-avatar")}</div>
          <div><h2>${esc(user.name)}</h2><p>${esc(roleLabel(user.role))} account · ${esc(user.email)}</p></div>
        </div>
        <form id="profile-form" class="profile-form">
          <div class="profile-fields">
            <div class="field"><label for="profile-name">Full name</label><input id="profile-name" name="name" value="${esc(user.name)}" autocomplete="name" required></div>
            <div class="field"><label for="profile-email">Email address</label><input id="profile-email" type="email" value="${esc(user.email)}" readonly></div>
            <div class="field"><label for="profile-phone">Phone</label><input id="profile-phone" name="phone" type="tel" value="${esc(user.phone || "")}" autocomplete="tel"></div>
            <div class="field"><label for="profile-avatar-url">Profile image URL</label><input id="profile-avatar-url" name="avatar" type="url" value="${esc(user.avatar || "")}" placeholder="https://example.com/photo.jpg"><small>Use a public HTTP or HTTPS image link.</small></div>
            <div class="field profile-bio"><label for="profile-bio">About me</label><textarea id="profile-bio" name="bio" placeholder="A short introduction">${esc(user.bio || "")}</textarea></div>
          </div>
          <div id="profile-feedback" class="form-feedback" role="status"></div>
          <div class="profile-actions"><button type="submit" class="primary-button">Save profile</button></div>
        </form>
      </section>`;
  }

  async function saveProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.getElementById("profile-feedback");
    const submit = form.querySelector("button[type=submit]");
    const payload = Object.fromEntries(new FormData(form).entries());
    if (payload.avatar && !safeAvatarUrl(payload.avatar)) {
      feedback.textContent = "Enter an image URL that starts with http:// or https://.";
      feedback.classList.add("visible");
      return;
    }

    submit.disabled = true;
    submit.textContent = "Saving…";
    feedback.classList.remove("visible", "success");
    try {
      const updated = await request("/auth/profile", { method: "PUT", body: JSON.stringify(payload) });
      state.user = { ...state.user, ...updated };
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      renderShell();
      renderPage();
      const success = document.getElementById("profile-feedback");
      success.textContent = "Profile updated.";
      success.classList.add("visible", "success");
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add("visible");
      submit.disabled = false;
      submit.textContent = "Save profile";
    }
  }

  function renderPage() {
    if (!state.token || !state.user) { renderAuth(); return; }
    const views = {
      Dashboard: dashboard,
      Courses: coursesPage,
      People: peoplePage,
      Students: peoplePage,
      Assignments: assignmentsPage,
      Results: resultsPage,
      Attendance: attendancePage,
      Announcements: announcementsPage,
      Profile: profilePage,
      Settings: settingsPage
    };
    const page = document.getElementById("page-content");
    if (!page) return;
    if (!["admin", "teacher", "student"].includes(roleOf(state.user))) {
      page.innerHTML = `<div class="error-banner">This account is missing a valid role. Set its MongoDB role to admin, teacher, or student, then sign in again.</div>`;
      return;
    }
    page.innerHTML = (views[state.page] || dashboard)();
    bindAvatarFallbacks(page);
    page.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.page)));
    page.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => openForm(button.dataset.action)));
    page.querySelectorAll("[data-submit-assignment]").forEach((button) => button.addEventListener("click", () => openForm("submission", button.dataset.submitAssignment)));
    page.querySelectorAll("[data-edit-user]").forEach((button) => button.addEventListener("click", () => openForm("user", button.dataset.editUser)));
    page.querySelectorAll("[data-delete-user]").forEach((button) => button.addEventListener("click", () => deleteUser(button.dataset.deleteUser)));
    const settings = document.getElementById("api-settings");
    if (settings) settings.addEventListener("submit", saveSettings);
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
      profileForm.addEventListener("submit", saveProfile);
      profileForm.querySelector("#profile-avatar-url").addEventListener("input", (event) => {
        const preview = document.getElementById("profile-avatar-preview");
        const src = safeAvatarUrl(event.target.value);
        preview.innerHTML = src ? `<img data-avatar-image src="${esc(src)}" alt="">` : esc(initials(state.user.name));
        bindAvatarFallbacks(preview);
      });
    }
  }

  async function deleteUser(userId) {
    const user = state.data.users.find((item) => String(item._id) === String(userId));
    if (!user || !window.confirm(`Remove ${user.name}'s account?`)) return;
    try {
      await request(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
      await loadData();
    } catch (error) {
      window.alert(error.message);
    }
  }

  function openForm(kind, recordId = "") {
    let title = "", description = "", fields = "", endpoint = "", method = "POST", submitLabel = "Save";
    const courseOptions = state.data.courses.map((course) => `<option value="${esc(course._id)}">${esc(course.code ? `${course.code} — ` : "")}${esc(course.title)}</option>`).join("");
    const existingUser = kind === "user" ? state.data.users.find((user) => String(user._id) === String(recordId)) : null;
    const studentOptions = state.data.users.filter((user) => roleOf(user) === "student")
      .map((user) => `<option value="${esc(user._id)}">${esc(user.name)} — ${esc(user.email)}</option>`).join("");
    if (kind === "result") {
      title = "Publish a result"; description = "Record an assessment score for a student in one of your courses.";
      fields = `<div class="field"><label for="result-course">Course</label><select id="result-course" name="courseId" required><option value="">Select a course</option>${courseOptions}</select></div><div class="field"><label for="result-student">Student</label><select id="result-student" name="studentId" required><option value="">Select a student</option>${studentOptions}</select></div><div class="field"><label for="result-name">Assessment name</label><input id="result-name" name="examName" placeholder="e.g. Midterm exam" required></div><div class="field"><label for="result-marks">Marks earned</label><input id="result-marks" name="marksObtained" type="number" min="0" step="any" required></div><div class="field"><label for="result-total">Total marks</label><input id="result-total" name="totalMarks" type="number" min="0.01" step="any" required></div>`;
      endpoint = "/results";
    } else if (kind === "attendance") {
      title = "Record attendance"; description = "Save today's attendance for a student in one of your courses.";
      fields = `<div class="field"><label for="attendance-course">Course</label><select id="attendance-course" name="courseId" required><option value="">Select a course</option>${courseOptions}</select></div><div class="field"><label for="attendance-student">Student</label><select id="attendance-student" name="studentId" required><option value="">Select a student</option>${studentOptions}</select></div><div class="field"><label for="attendance-date">Date</label><input id="attendance-date" name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div><div class="field"><label for="attendance-status">Status</label><select id="attendance-status" name="status" required><option>Present</option><option>Absent</option><option>Late</option></select></div>`;
      endpoint = "/attendance";
    } else if (kind === "user") {
      const roles = ["student", "teacher", "admin"];
      title = existingUser ? "Edit user" : "Add a user";
      description = existingUser ? "Update this account's details and role." : "Create a school account and assign its role.";
      fields = `<div class="field"><label for="user-name">Full name</label><input id="user-name" name="name" value="${esc(existingUser && existingUser.name)}" required></div><div class="field"><label for="user-email">Email address</label><input id="user-email" name="email" type="email" value="${esc(existingUser && existingUser.email)}" required></div><div class="field"><label for="user-role">Role</label><select id="user-role" name="role" required>${roles.map((role) => `<option value="${role}" ${roleOf(existingUser) === role ? "selected" : ""}>${roleLabel(role)}</option>`).join("")}</select></div><div class="field"><label for="user-password">Temporary password${existingUser ? " (leave blank to keep current)" : ""}</label><input id="user-password" name="password" type="password" minlength="6" ${existingUser ? "" : "required"} autocomplete="new-password"></div>`;
      endpoint = existingUser ? `/users/${encodeURIComponent(recordId)}` : "/users";
      method = existingUser ? "PUT" : "POST";
      submitLabel = existingUser ? "Save changes" : "Create user";
    } else if (kind === "course") {
      title = "Add a course"; description = "Create a new course in your workspace.";
      fields = `<div class="field"><label for="course-code">Course code</label><input id="course-code" name="code" placeholder="e.g. BIO 204" required></div><div class="field"><label for="course-title">Course title</label><input id="course-title" name="title" placeholder="e.g. Human Biology" required></div><div class="field"><label for="course-description">Description</label><textarea id="course-description" name="description" placeholder="A short overview of the course"></textarea></div><div class="field"><label for="course-teacher">Teacher</label><select id="course-teacher" name="teacherId"><option value="">Not assigned</option>${state.data.users.filter((user) => roleOf(user) === "teacher").map((user) => `<option value="${esc(user._id)}">${esc(user.name)}</option>`).join("")}</select></div>`;
      endpoint = "/courses";
    } else if (kind === "assignment") {
      title = "Create an assignment"; description = "Share the details and choose a due date.";
      fields = `<div class="field"><label for="assignment-title">Assignment title</label><input id="assignment-title" name="title" placeholder="e.g. Chapter 4 reflection" required></div><div class="field"><label for="assignment-course">Course</label><select id="assignment-course" name="courseId" required><option value="">Select a course</option>${courseOptions}</select></div><div class="field"><label for="assignment-due">Due date</label><input id="assignment-due" name="dueDate" type="date" required></div><div class="field"><label for="assignment-description">Instructions</label><textarea id="assignment-description" name="description" placeholder="What should students know?"></textarea></div>`;
      endpoint = "/assignments";
    } else if (kind === "announcement") {
      title = "Post an update"; description = "Share an announcement with your learning community.";
      fields = `<div class="field"><label for="announcement-title">Headline</label><input id="announcement-title" name="title" placeholder="What’s the update?" required></div><div class="field"><label for="announcement-content">Message</label><textarea id="announcement-content" name="content" placeholder="Write your announcement…" required></textarea></div><div class="field"><label for="announcement-course">Course (optional)</label><select id="announcement-course" name="courseId"><option value="">General announcement</option>${courseOptions}</select></div>`;
      endpoint = "/announcements";
    } else if (kind === "submission") {
      title = "Submit your work"; description = "Paste a shareable link to your assignment file.";
      fields = `<div class="field"><label for="submission-link">File link</label><input id="submission-link" name="fileUrl" type="url" placeholder="https://…" required></div>`;
      endpoint = "/assignments/submit";
    }
    modal.innerHTML = `<div class="modal-header"><div><h2>${title}</h2><p>${description}</p></div><button type="button" class="modal-close" data-close aria-label="Close">×</button></div><form class="modal-form" id="modal-form">${fields}<div class="form-feedback" id="form-feedback" role="alert"></div><div class="modal-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button type="submit" class="primary-button">${submitLabel}</button></div></form>`;
    modal.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => modal.close()));
    modal.querySelector("#modal-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = event.currentTarget.querySelector("button[type=submit]");
      const feedback = document.getElementById("form-feedback");
      const body = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (kind === "submission") body.assignmentId = recordId;
      if (kind === "attendance") body.records = [{ studentId: body.studentId, status: body.status }];
      if (kind === "announcement" && !body.courseId) delete body.courseId;
      if (kind === "user" && existingUser && !body.password) delete body.password;
      submit.disabled = true;
      submit.textContent = "Saving…";
      feedback.classList.remove("visible");
      try {
        await request(endpoint, { method, body: JSON.stringify(body) });
        modal.close();
        await loadData();
      } catch (error) {
        feedback.textContent = error.message;
        feedback.classList.add("visible");
        submit.disabled = false;
        submit.textContent = submitLabel;
      }
    });
    modal.showModal();
  }

  function saveSettings(event) {
    event.preventDefault();
    const value = document.getElementById("api-url").value.trim().replace(/\/+$/, "");
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Use an http or https API URL.");
      localStorage.setItem(API_KEY, value);
      const button = event.currentTarget.querySelector("button");
      button.textContent = "Saved";
      setTimeout(() => { button.textContent = "Save connection"; }, 1600);
    } catch (error) {
      window.alert(error.message || "Enter a valid API URL.");
    }
  }

  function logout() {
    if (state.notificationTimer) clearInterval(state.notificationTimer);
    if (state.toastTimer) clearTimeout(state.toastTimer);
    const toast = document.getElementById("notification-toast");
    if (toast) toast.remove();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    state.token = null;
    state.user = null;
    state.page = "Dashboard";
    state.data = { courses: [], assignments: [], results: [], attendance: { records: [], percentage: 0 }, announcements: [], users: [] };
    state.notifications = [];
    state.notificationsLoaded = false;
    state.notificationsOpen = false;
    state.notificationError = "";
    state.notificationTimer = null;
    if (window.location.protocol !== "file:" && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    renderAuth();
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  applyTheme();
  if (state.token && state.user) initialize();
  else renderAuth();
})();
