(function () {
  if (window.__trainReservationThemeToggleInitialized) {
    return;
  }
  window.__trainReservationThemeToggleInitialized = true;

  const storageKey = "trainReservationTheme";
  const root = document.documentElement;

  const style = document.createElement("style");
  style.textContent = `
    :root {
      color-scheme: light;
    }

    html.dark-mode {
      color-scheme: dark;
    }

    html.dark-mode body {
      background: #0f1724 !important;
      color: #e2e8f0 !important;
    }

    html.dark-mode .login-container,
    html.dark-mode .container,
    html.dark-mode .content,
    html.dark-mode .card,
    html.dark-mode .stat-card,
    html.dark-mode .report-stat-card,
    html.dark-mode .modal-box,
    html.dark-mode .modal-surface,
    html.dark-mode .topbar,
    html.dark-mode header,
    html.dark-mode .dashboard,
    html.dark-mode .table-wrapper table,
    html.dark-mode .table-wrapper,
    html.dark-mode table,
    html.dark-mode .quick-item,
    html.dark-mode .report-hero,
    html.dark-mode .profile-summary-card,
    html.dark-mode .profile-reservation-card,
    html.dark-mode .profile-empty-state,
    html.dark-mode .profile-body,
    html.dark-mode .profile-header {
      background-color: #111827 !important;
      color: #e2e8f0 !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
      box-shadow: 0 14px 32px rgba(2, 6, 23, 0.24) !important;
    }

    html.dark-mode .content,
    html.dark-mode .login-container,
    html.dark-mode .container,
    html.dark-mode .card,
    html.dark-mode .report-stat-card,
    html.dark-mode .modal-box,
    html.dark-mode .modal-surface,
    html.dark-mode .profile-summary-card,
    html.dark-mode .profile-reservation-card {
      background-image: linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 36, 0.98)) !important;
    }

    html.dark-mode .topbar,
    html.dark-mode header {
      background: linear-gradient(180deg, #0f1724, #111827) !important;
    }

    html.dark-mode .tab,
    html.dark-mode .report-filter-btn,
    html.dark-mode .quick-item,
    html.dark-mode .neutral-btn,
    html.dark-mode .action-btn,
    html.dark-mode .report-chip,
    html.dark-mode .report-hero-pill,
    html.dark-mode .profile-status,
    html.dark-mode .profile-badge {
      background: #1a2436 !important;
      color: #e2e8f0 !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
      box-shadow: none !important;
    }

    html.dark-mode .tab.active,
    html.dark-mode .report-filter-btn.active,
    html.dark-mode .action-btn.action-profile,
    html.dark-mode button:not(.tr-theme-toggle):not(.tr-theme-toggle-mobile) {
      background: linear-gradient(135deg, #22324a, #33507a) !important;
      color: #ffffff !important;
      border-color: #33507a !important;
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.22) !important;
    }

    html.dark-mode input,
    html.dark-mode select,
    html.dark-mode textarea {
      background: #0f172a !important;
      color: #e5eefb !important;
      border-color: rgba(148, 163, 184, 0.22) !important;
    }

    html.dark-mode input::placeholder,
    html.dark-mode textarea::placeholder {
      color: #94a3b8 !important;
    }

    html.dark-mode a {
      color: #93c5fd !important;
    }

    html.dark-mode th,
    html.dark-mode td,
    html.dark-mode h1,
    html.dark-mode h2,
    html.dark-mode h3,
    html.dark-mode h4,
    html.dark-mode p,
    html.dark-mode label,
    html.dark-mode .subtitle,
    html.dark-mode .report-hero p,
    html.dark-mode .report-card-note,
    html.dark-mode .profile-subtitle,
    html.dark-mode .profile-summary-card .label,
    html.dark-mode .profile-summary-card .value,
    html.dark-mode .profile-reservation-meta,
    html.dark-mode .profile-section-title span {
      color: #e2e8f0 !important;
    }

    html.dark-mode .report-eyebrow,
    html.dark-mode .profile-badge {
      background: rgba(37, 99, 235, 0.12) !important;
      color: #dbeafe !important;
    }

    html.dark-mode .report-hero,
    html.dark-mode .profile-header {
      background: linear-gradient(135deg, #111827, #172334) !important;
    }

    html.dark-mode .profile-empty-state {
      border-color: rgba(148, 163, 184, 0.24) !important;
    }

    .tr-theme-toggle {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 2147483001;
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 999px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.95);
      color: #1e3f74;
      font: 700 14px/1.1 "Segoe UI", Arial, sans-serif;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
      cursor: pointer;
      backdrop-filter: blur(10px);
    }

    .tr-theme-toggle.auth-page {
      left: 18px;
      top: 18px;
      bottom: auto;
      padding: 9px 12px;
      gap: 8px;
      font-size: 13px;
    }

    .tr-theme-toggle:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
    }

    .tr-theme-toggle-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #1e3f74, #2563eb);
      color: #ffffff;
      font-size: 12px;
      flex: 0 0 auto;
    }

    html.dark-mode .tr-theme-toggle {
      background: rgba(15, 23, 36, 0.92);
      color: #dbeafe;
      border-color: rgba(148, 163, 184, 0.16);
    }

    html.dark-mode .tr-theme-toggle-icon {
      background: linear-gradient(135deg, #93c5fd, #60a5fa);
      color: #0f172a;
    }

    .tr-theme-toggle:focus-visible {
      outline: 3px solid rgba(59, 130, 246, 0.35);
      outline-offset: 2px;
    }

    @media (max-width: 480px) {
      .tr-theme-toggle {
        left: 14px;
        bottom: 14px;
        padding: 11px 14px;
      }

      .tr-theme-toggle.auth-page {
        top: 14px;
        bottom: auto;
        padding: 8px 10px;
        gap: 6px;
        font-size: 12px;
      }

      .tr-theme-toggle.auth-page .tr-theme-toggle-icon {
        width: 22px;
        height: 22px;
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);

  function getPreferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") {
      return saved;
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    root.classList.toggle("dark-mode", isDark);
    localStorage.setItem(storageKey, theme);

    if (toggleButton) {
      toggleButton.setAttribute("aria-pressed", String(isDark));
      toggleButton.innerHTML = isDark
        ? '<span class="tr-theme-toggle-icon" aria-hidden="true">☀</span><span>Light mode</span>'
        : '<span class="tr-theme-toggle-icon" aria-hidden="true">☾</span><span>Dark mode</span>';
    }
  }

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "tr-theme-toggle";
  toggleButton.setAttribute("aria-label", "Toggle dark mode");
  toggleButton.addEventListener("click", () => {
    applyTheme(root.classList.contains("dark-mode") ? "light" : "dark");
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(toggleButton);
    applyTheme(getPreferredTheme());
  });
})();