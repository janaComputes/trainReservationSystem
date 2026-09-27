(function () {
  if (window.__trainReservationChatbotInitialized) {
    return;
  }
  window.__trainReservationChatbotInitialized = true;

  const faqEntries = [
    {
      title: "Signing in",
      keywords: ["login", "log in", "sign in", "signin", "access account", "username", "password"],
      answer:
        "Use the sign-in form on the home page to enter your username and password. If the credentials are correct, you can continue into the system and choose the role you need.",
    },
    {
      title: "Creating an account",
      keywords: ["sign up", "signup", "register", "create account", "new account", "join"],
      answer:
        "Use the Sign Up option on the login page, choose a role, agree to the Privacy Policy, and fill in a valid email address and password.",
    },
    {
      title: "Password rules",
      keywords: ["password requirements", "strong password", "password rule", "capital letter", "symbol", "number"],
      answer:
        "Passwords must be at least 8 characters long and include a number, a symbol, and a capital letter.",
    },
    {
      title: "Resetting a password",
      keywords: ["reset password", "forgot password", "password reset", "new password"],
      answer:
        "Use the Forgot Password link on the login page, then enter your username and a new password on the reset page.",
    },
    {
      title: "Privacy policy",
      keywords: ["privacy", "policy", "data", "store", "share", "sell"],
      answer:
        "The privacy policy says the system keeps basic account information locally for authentication and account management, and it is not shared, sold, or transferred to third parties.",
    },
    {
      title: "Roles",
      keywords: ["admin", "staff", "role", "dashboard"],
      answer:
        "The website supports Admin and Staff roles. Each role signs in from the same login page and is shown the tools relevant to that role.",
    },
    {
      title: "Reservations",
      keywords: ["reservation", "booking", "passenger", "train", "seat"],
      answer:
        "The dashboards are built to manage reservations, passengers, and trains. In the admin area, you can create reservations, manage passengers, and manage train details.",
    },
  ];

  const quickPrompts = [
    "How do I sign up?",
    "How do I reset my password?",
    "What does the privacy policy say?",
    "What can admins manage?",
  ];

  const fallbackAnswer =
    "I do not want to guess here. Please contact customer support for help with that question, and I can still help you with login, signup, password reset, privacy, or dashboard questions.";

  const style = document.createElement("style");
  style.textContent = `
    :root {
      --tr-chatbot-bg: #08111f;
      --tr-chatbot-surface: rgba(8, 17, 31, 0.92);
      --tr-chatbot-panel: #ffffff;
      --tr-chatbot-border: rgba(148, 163, 184, 0.28);
      --tr-chatbot-text: #0f172a;
      --tr-chatbot-muted: #5b6473;
      --tr-chatbot-brand: #1d4ed8;
      --tr-chatbot-brand-2: #0ea5a8;
      --tr-chatbot-brand-soft: rgba(29, 78, 216, 0.12);
      --tr-chatbot-shadow: 0 24px 60px rgba(15, 23, 42, 0.26);
    }

    .tr-chatbot-launcher {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483000;
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 10px;
      border: 0;
      border-radius: 999px;
      padding: 14px 18px;
      background: linear-gradient(135deg, var(--tr-chatbot-brand), var(--tr-chatbot-brand-2));
      color: #ffffff;
      font: 700 14px/1.1 "Segoe UI", Arial, sans-serif;
      box-shadow: var(--tr-chatbot-shadow);
      cursor: pointer;
    }

    .tr-chatbot-launcher.auth-page {
      right: 18px;
      bottom: 18px;
      padding: 7px 10px;
      gap: 6px;
      font-size: 12px;
      min-height: 34px;
    }

    html.dark-mode .tr-chatbot-launcher {
      background: linear-gradient(135deg, #22324a, #2f4158) !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 16px 30px rgba(2, 6, 23, 0.22) !important;
    }

    html.dark-mode .tr-chatbot-launcher-icon {
      background: rgba(96, 165, 250, 0.18);
      color: #dbeafe;
    }

    .tr-chatbot-launcher:focus-visible,
    .tr-chatbot-close:focus-visible,
    .tr-chatbot-send:focus-visible,
    .tr-chatbot-chip:focus-visible,
    .tr-chatbot-input:focus-visible {
      outline: 3px solid rgba(14, 165, 233, 0.45);
      outline-offset: 2px;
    }

    .tr-chatbot-launcher-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.18);
      font-size: 12px;
    }

    .tr-chatbot-panel {
      position: fixed;
      right: 20px;
      bottom: 76px;
      width: min(390px, calc(100vw - 28px));
      height: min(580px, calc(100vh - 112px));
      display: none;
      flex-direction: column;
      overflow: hidden;
      border-radius: 24px;
      border: 1px solid var(--tr-chatbot-border);
      background: var(--tr-chatbot-panel);
      box-shadow: var(--tr-chatbot-shadow);
      z-index: 2147483000;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--tr-chatbot-text);
    }

    .tr-chatbot-panel.open {
      display: flex;
      animation: trChatbotPop 160ms ease-out;
    }

    html.dark-mode .tr-chatbot-panel {
      background: #111827 !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
      box-shadow: 0 24px 60px rgba(2, 6, 23, 0.34) !important;
    }

    @keyframes trChatbotPop {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .tr-chatbot-header {
      padding: 18px 18px 16px;
      color: #ffffff;
      background: linear-gradient(135deg, var(--tr-chatbot-bg), #12203a 58%, #0f766e 140%);
    }

    html.dark-mode .tr-chatbot-header {
      background: linear-gradient(135deg, #111827, #172334 60%, #1e293b 140%) !important;
    }

    .tr-chatbot-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .tr-chatbot-kicker {
      margin: 0 0 4px;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.7);
    }

    .tr-chatbot-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }

    .tr-chatbot-subtitle {
      margin: 6px 0 0;
      font-size: 13px;
      line-height: 1.45;
      color: rgba(255, 255, 255, 0.82);
    }

    .tr-chatbot-close {
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      flex: 0 0 auto;
    }

    .tr-chatbot-body {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
      background:
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 28%),
        linear-gradient(180deg, #ffffff, #f8fbff);
    }

    html.dark-mode .tr-chatbot-body {
      background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
        linear-gradient(180deg, #111827, #0f1724) !important;
    }

    .tr-chatbot-messages {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }

    .tr-chatbot-message {
      display: flex;
      margin-bottom: 12px;
    }

    .tr-chatbot-message.user {
      justify-content: flex-end;
    }

    .tr-chatbot-bubble {
      max-width: 86%;
      border-radius: 18px;
      padding: 11px 14px;
      line-height: 1.5;
      font-size: 14px;
      white-space: pre-wrap;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
    }

    .tr-chatbot-message.bot .tr-chatbot-bubble {
      background: #ffffff;
      color: var(--tr-chatbot-text);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-top-left-radius: 6px;
    }

    html.dark-mode .tr-chatbot-message.bot .tr-chatbot-bubble {
      background: #0f1724 !important;
      color: #e2e8f0 !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
    }

    .tr-chatbot-message.user .tr-chatbot-bubble {
      background: linear-gradient(135deg, rgba(29, 78, 216, 0.94), rgba(14, 165, 233, 0.94));
      color: #ffffff;
      border-top-right-radius: 6px;
    }

    html.dark-mode .tr-chatbot-message.user .tr-chatbot-bubble {
      background: linear-gradient(135deg, #22324a, #33507a) !important;
      color: #ffffff !important;
    }

    .tr-chatbot-meta {
      margin-top: 5px;
      font-size: 11px;
      color: var(--tr-chatbot-muted);
    }

    .tr-chatbot-suggestions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 0 16px 12px;
    }

    .tr-chatbot-chip {
      border: 1px solid rgba(29, 78, 216, 0.16);
      background: var(--tr-chatbot-brand-soft);
      color: #153e75;
      border-radius: 999px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      width: fit-content;
    }

    html.dark-mode .tr-chatbot-chip {
      background: #1a2436 !important;
      color: #dbeafe !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
    }

    .tr-chatbot-input-row {
      display: flex;
      gap: 10px;
      padding: 14px 16px 16px;
      border-top: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(255, 255, 255, 0.96);
    }

    html.dark-mode .tr-chatbot-input-row {
      background: #111827 !important;
      border-top-color: rgba(148, 163, 184, 0.16) !important;
    }

    .tr-chatbot-input {
      flex: 1;
      border: 1px solid rgba(148, 163, 184, 0.32);
      border-radius: 14px;
      padding: 12px 14px;
      font: 14px/1.4 "Segoe UI", Arial, sans-serif;
      color: var(--tr-chatbot-text);
      background: #ffffff;
      box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
    }

    html.dark-mode .tr-chatbot-input {
      background: #0f1724 !important;
      color: #e2e8f0 !important;
      border-color: rgba(148, 163, 184, 0.18) !important;
      box-shadow: inset 0 1px 2px rgba(2, 6, 23, 0.18) !important;
    }

    .tr-chatbot-send {
      border: 0;
      border-radius: 14px;
      padding: 0 16px;
      width: auto;
      min-width: 72px;
      background: linear-gradient(135deg, var(--tr-chatbot-brand), var(--tr-chatbot-brand-2));
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
    }

    html.dark-mode .tr-chatbot-send {
      background: linear-gradient(135deg, #22324a, #33507a) !important;
      color: #ffffff !important;
    }

    @media (max-width: 480px) {
      .tr-chatbot-launcher {
        right: 14px;
        bottom: 14px;
        padding: 13px 16px;
      }

      .tr-chatbot-launcher.auth-page {
        right: 14px;
        bottom: 14px;
        padding: 6px 9px;
        gap: 5px;
        font-size: 12px;
        min-height: 32px;
      }

      .tr-chatbot-launcher.auth-page .tr-chatbot-launcher-icon {
        width: 20px;
        height: 20px;
        font-size: 10px;
      }

      .tr-chatbot-panel {
        right: 14px;
        bottom: 72px;
        width: calc(100vw - 28px);
        height: min(72vh, 620px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .tr-chatbot-panel.open {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "tr-chatbot-launcher";
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "tr-chatbot-panel");
  launcher.innerHTML = '<span class="tr-chatbot-launcher-icon" aria-hidden="true">AI</span><span>FAQ Assistant</span>';

  const panel = document.createElement("section");
  panel.id = "tr-chatbot-panel";
  panel.className = "tr-chatbot-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "FAQ assistant");
  panel.setAttribute("aria-modal", "false");

  panel.innerHTML = `
    <div class="tr-chatbot-header">
      <div class="tr-chatbot-header-row">
        <div>
          <p class="tr-chatbot-kicker">AI-powered FAQ help</p>
          <h2 class="tr-chatbot-title">Train Reservation Assistant</h2>
          <p class="tr-chatbot-subtitle">Ask about login, signup, password reset, privacy, or dashboard features. I only answer from this website's content.</p>
        </div>
        <button type="button" class="tr-chatbot-close" aria-label="Close chatbot">&times;</button>
      </div>
    </div>
    <div class="tr-chatbot-body">
      <div class="tr-chatbot-messages" aria-live="polite" aria-relevant="additions"></div>
      <div class="tr-chatbot-suggestions"></div>
      <form class="tr-chatbot-input-row" autocomplete="off">
        <input class="tr-chatbot-input" type="text" name="chatbot-question" placeholder="Ask a question..." aria-label="Ask the FAQ assistant a question">
        <button class="tr-chatbot-send" type="submit">Send</button>
      </form>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const messages = panel.querySelector(".tr-chatbot-messages");
  const suggestionsHost = panel.querySelector(".tr-chatbot-suggestions");
  const form = panel.querySelector("form");
  const input = panel.querySelector(".tr-chatbot-input");
  const closeButton = panel.querySelector(".tr-chatbot-close");

  function addMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `tr-chatbot-message ${sender}`;
    const bubble = document.createElement("div");
    bubble.className = "tr-chatbot-bubble";
    bubble.textContent = text;
    message.appendChild(bubble);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreEntry(message, entry) {
    const normalizedMessage = normalize(message);
    if (!normalizedMessage) return 0;

    let score = 0;
    for (const keyword of entry.keywords) {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword) continue;
      if (normalizedMessage === normalizedKeyword) {
        score += 6;
        continue;
      }
      if (normalizedMessage.includes(normalizedKeyword)) {
        score += normalizedKeyword.split(" ").length > 1 ? 4 : 2;
      }
    }

    const words = normalizedMessage.split(" ");
    for (const keyword of entry.keywords) {
      const keywordWords = normalize(keyword).split(" ");
      if (keywordWords.some((word) => words.includes(word))) {
        score += 1;
      }
    }

    return score;
  }

  function getBestMatch(message) {
    let bestEntry = null;
    let bestScore = 0;

    for (const entry of faqEntries) {
      const score = scoreEntry(message, entry);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    return { bestEntry, bestScore };
  }

  function getResponse(message) {
    const normalizedMessage = normalize(message);
    if (!normalizedMessage) {
      return "Please type a question about the website, and I will answer from the available FAQ content.";
    }

    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalizedMessage)) {
      return "Hello. I can help with login, signup, password reset, privacy, or dashboard questions. Ask me anything about the site.";
    }

    const { bestEntry, bestScore } = getBestMatch(message);
    if (bestEntry && bestScore >= 4) {
      return bestEntry.answer;
    }

    return fallbackAnswer;
  }

  function sendUserQuestion(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;
    addMessage(trimmedQuestion, "user");
    addMessage(getResponse(trimmedQuestion), "bot");
  }

  quickPrompts.forEach((prompt) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tr-chatbot-chip";
    chip.textContent = prompt;
    chip.addEventListener("click", () => {
      openPanel();
      sendUserQuestion(prompt);
      input.value = "";
      input.focus();
    });
    suggestionsHost.appendChild(chip);
  });

  function openPanel() {
    panel.classList.add("open");
    launcher.setAttribute("aria-expanded", "true");
    if (!messages.childElementCount) {
      addMessage("Hello. I can answer FAQs from this website and will avoid guessing when the answer is not available.", "bot");
    }
    window.setTimeout(() => input.focus(), 0);
  }

  function closePanel() {
    panel.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", () => {
    if (panel.classList.contains("open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeButton.addEventListener("click", closePanel);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendUserQuestion(input.value);
    input.value = "";
    input.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("open")) {
      closePanel();
    }
  });
})();