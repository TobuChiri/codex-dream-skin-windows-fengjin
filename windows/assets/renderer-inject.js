((cssText, artDataUrl, theme) => {
  const STATE_KEY = "__CODEX_DREAM_SKIN_STATE__";
  const STYLE_ID = "codex-dream-skin-style";
  const CHROME_ID = "codex-dream-skin-chrome";
  const CHROME_SCHEMA = "3";
  window.__CODEX_DREAM_SKIN_DISABLED__ = false;

  const previous = window[STATE_KEY];
  if (previous?.observer) previous.observer.disconnect();
  if (previous?.timer) clearInterval(previous.timer);
  if (previous?.scheduler?.timeout) clearTimeout(previous.scheduler.timeout);
  previous?.homeClickAbort?.abort?.();
  if (previous?.artUrl) URL.revokeObjectURL(previous.artUrl);
  const artUrl = (() => {
    const comma = artDataUrl.indexOf(",");
    const mime = artDataUrl.slice(5, artDataUrl.indexOf(";")) || "image/png";
    const binary = atob(artDataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  })();
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.textContent = cssText;
    existingStyle.dataset.dreamVersion = "1";
  }

  const initialHomeCandidate = document.querySelector('[role="main"]:has([data-testid="home-icon"])');
  const initialComposerText = document.querySelector(".ProseMirror")?.textContent?.trim() ?? "";
  const resumedActionShell = Boolean(initialHomeCandidate && initialComposerText &&
    !initialHomeCandidate.querySelector('.group\\/home-suggestions'));
  const persistedActionShell = document.documentElement?.dataset?.dreamActionShell === "true" || resumedActionShell;
  const persistedHome = persistedActionShell ? initialHomeCandidate : null;
  const homeState = {
    dismissed: persistedActionShell,
    dismissedHome: persistedHome,
    actionShell: persistedActionShell,
  };
  const dismissHome = () => {
    homeState.dismissed = true;
    homeState.dismissedHome = document.querySelector(".dream-home");
    homeState.actionShell = true;
    document.documentElement?.setAttribute("data-dream-action-shell", "true");
    document.querySelectorAll(".dream-home").forEach((node) => node.classList.remove("dream-home"));
    document.querySelectorAll(".dream-home-shell").forEach((node) => node.classList.remove("dream-home-shell"));
    document.querySelector("main.main-surface")?.classList.add("dream-action-shell");
    const chrome = document.getElementById(CHROME_ID);
    chrome?.classList.remove("dream-home-shell");
    chrome?.classList.add("dream-action-shell");
  };
  const homeClickAbort = typeof AbortController === "function" ? new AbortController() : null;
  document.addEventListener?.("click", (event) => {
    const button = event.target?.closest?.('.group\\/home-suggestions button');
    if (!button?.closest?.(".dream-home")) return;
    // A suggestion starts a task in-place.  Its old landing DOM can remain
    // mounted for a moment, so it must not keep the landing-page skin alive.
    dismissHome();
  }, homeClickAbort ? { capture: true, signal: homeClickAbort.signal } : true);

  const clearSkinDom = () => {
    document.documentElement?.classList.remove("codex-dream-skin");
    document.documentElement?.style.removeProperty("--dream-art");
    document.documentElement?.style.removeProperty("--dream-tagline");
    document.documentElement?.style.removeProperty("--dream-hero-title");
    document.documentElement?.style.removeProperty("--dream-project-prefix");
    document.documentElement?.style.removeProperty("--dream-project-label");
    document.documentElement?.style.removeProperty("--dream-focal-x");
    document.documentElement?.style.removeProperty("--dream-focal-y");
    document.documentElement?.style.removeProperty("--dream-hero-height");
    document.documentElement?.style.removeProperty("--dream-corner-radius");
    document.documentElement?.style.removeProperty("--dream-card-radius");
    document.documentElement?.style.removeProperty("--dream-decoration-opacity");
    document.documentElement?.style.removeProperty("--dream-overlay-strength");
    document.documentElement?.style.removeProperty("--dream-accent-glyph");
    document.documentElement?.removeAttribute("data-dream-text-side");
    document.documentElement?.removeAttribute("data-dream-decoration");
    document.documentElement?.removeAttribute("data-dream-polaroid");
    document.documentElement?.removeAttribute("data-dream-motif");
    document.documentElement?.removeAttribute("data-dream-emblem");
    document.documentElement?.removeAttribute("data-dream-theme");
    document.documentElement?.removeAttribute("data-dream-action-shell");
    document.querySelectorAll('[data-dream-icon-centered="true"]').forEach((svg) => {
      svg.style.removeProperty("--dream-icon-shift-x");
      svg.style.removeProperty("--dream-icon-shift-y");
      delete svg.dataset.dreamIconCentered;
    });
    document.querySelectorAll(".dream-themed-icon").forEach((node) => node.remove());
    document.querySelectorAll(".dream-new-task").forEach((node) => node.classList.remove("dream-new-task"));
    document.querySelectorAll(".dream-composer-wrap").forEach((node) => node.classList.remove("dream-composer-wrap"));
    document.querySelectorAll(".dream-nav-scheduled,.dream-nav-skills,.dream-nav-sites,.dream-nav-pulls,.dream-nav-chat")
      .forEach((node) => node.classList.remove("dream-nav-scheduled", "dream-nav-skills", "dream-nav-sites", "dream-nav-pulls", "dream-nav-chat"));
    document.querySelectorAll(".dream-home").forEach((node) => node.classList.remove("dream-home"));
    document.querySelectorAll(".dream-home-shell").forEach((node) => node.classList.remove("dream-home-shell"));
    document.querySelectorAll(".dream-action-shell").forEach((node) => node.classList.remove("dream-action-shell"));
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CHROME_ID)?.remove();
  };

  const centerSuggestionIcons = (home) => {
    const clamp = (value, limit = 10) => Math.max(-limit, Math.min(limit, value));
    for (const svg of home?.querySelectorAll?.('.group\\/home-suggestions button svg') ?? []) {
      const button = svg.closest?.("button");
      const badge = button?.querySelector?.(":scope > span:first-child > span:first-child") ?? svg.parentElement;
      if (!badge) continue;
      svg.style.setProperty("--dream-icon-shift-x", "0px");
      svg.style.setProperty("--dream-icon-shift-y", "0px");
      const graphics = [...svg.querySelectorAll("path,circle,ellipse,line,polyline,polygon,rect,use")]
        .map((node) => node.getBoundingClientRect())
        .filter((box) => box.width > 0 || box.height > 0);
      if (!graphics.length) continue;
      const target = badge.getBoundingClientRect();
      const left = Math.min(...graphics.map((box) => box.left));
      const right = Math.max(...graphics.map((box) => box.right));
      const top = Math.min(...graphics.map((box) => box.top));
      const bottom = Math.max(...graphics.map((box) => box.bottom));
      const correctionLimit = Math.max(10, Math.min(18, target.width * .32));
      const shiftX = clamp(target.left + target.width / 2 - (left + right) / 2, correctionLimit);
      const shiftY = clamp(target.top + target.height / 2 - (top + bottom) / 2, correctionLimit);
      svg.style.setProperty("--dream-icon-shift-x", `${Math.round(shiftX * 100) / 100}px`);
      svg.style.setProperty("--dream-icon-shift-y", `${Math.round(shiftY * 100) / 100}px`);
      svg.dataset.dreamIconCentered = "true";
    }
  };

  const suggestionIconMarkup = [
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7-5 5 5 5M15 7l5 5-5 5M14 4l-4 16"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h3a2.5 2.5 0 1 1 5 0v3h3v4a2.5 2.5 0 1 0 0 5v4h-4a2.5 2.5 0 1 0-5 0H7v-4H4a2.5 2.5 0 1 1 0-5h3V7h2Z"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5V3h6v2M7 5h10a2 2 0 0 1 2 2v13H5V7a2 2 0 0 1 2-2Z"/><path d="m8.5 13 2.2 2.2 4.8-5"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 19 6.7-6.7M13.4 7.6l3-3 3 3-3 3M14 10l6 6-4 4-6-6M4.3 4.3l3.4 1.1 1 3.3-3.3-1Z"/></svg>',
  ];

  const ensureSuggestionIcons = (home) => {
    const buttons = home?.querySelectorAll?.('.group\\/home-suggestions button') ?? [];
    for (let index = 0; index < buttons.length && index < suggestionIconMarkup.length; index += 1) {
      const badge = buttons[index].querySelector?.(":scope > span:first-child > span:first-child");
      if (!badge || badge.querySelector?.(".dream-themed-icon")) continue;
      const icon = document.createElement("span");
      icon.className = "dream-themed-icon";
      icon.innerHTML = suggestionIconMarkup[index];
      badge.appendChild(icon);
    }
  };

  const ensure = () => {
    if (window.__CODEX_DREAM_SKIN_DISABLED__) return;
    const root = document.documentElement;
    if (!root || !document.body) return;

    const shellMain = document.querySelector("main.main-surface");
    const shellSidebar = document.querySelector("aside.app-shell-left-panel");
    if (!shellMain || !shellSidebar) {
      clearSkinDom();
      return;
    }

    root.classList.add("codex-dream-skin");
    root.style.setProperty("--dream-art", `url("${artUrl}")`);
    root.style.setProperty("--dream-tagline", JSON.stringify(theme.tagline));
    root.style.setProperty("--dream-hero-title", JSON.stringify(theme.heroTitle));
    root.style.setProperty("--dream-project-prefix", JSON.stringify(theme.projectPrefix));
    root.style.setProperty("--dream-project-label", JSON.stringify(theme.projectLabel));
    root.style.setProperty("--dream-focal-x", `${Math.round(theme.design.focalX * 1000) / 10}%`);
    root.style.setProperty("--dream-focal-y", `${Math.round(theme.design.focalY * 1000) / 10}%`);
    root.style.setProperty("--dream-hero-height", `${Math.round(theme.design.heroHeight)}px`);
    root.style.setProperty("--dream-corner-radius", `${Math.round(theme.design.cornerRadius)}px`);
    root.style.setProperty("--dream-card-radius", `${Math.round(theme.design.cardRadius)}px`);
    root.style.setProperty("--dream-decoration-opacity", `${theme.design.decorationDensity}`);
    root.style.setProperty("--dream-overlay-strength", `${Math.round(theme.design.overlayStrength * 100)}%`);
    root.style.setProperty("--dream-accent-glyph", JSON.stringify(theme.motifs.accentGlyph));
    root.setAttribute("data-dream-text-side", theme.design.textSide);
    root.setAttribute("data-dream-decoration", theme.design.decoration);
    root.setAttribute("data-dream-polaroid", theme.design.showPolaroid ? "show" : "hide");
    root.setAttribute("data-dream-motif", theme.motifs.pattern);
    root.setAttribute("data-dream-emblem", theme.motifs.emblem);
    root.setAttribute("data-dream-theme", theme.id);

    for (const button of document.querySelectorAll("aside.app-shell-left-panel button")) {
      const label = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
      button.classList.toggle("dream-new-task", /^(新建任务|New task)/i.test(label));
      button.classList.toggle("dream-nav-scheduled", /^(已安排|Scheduled)/i.test(label));
      button.classList.toggle("dream-nav-skills", /^(插件|技能|Plugins?|Skills?)/i.test(label));
      button.classList.toggle("dream-nav-sites", /^(站点|Sites?)/i.test(label));
      button.classList.toggle("dream-nav-pulls", /^(拉取请求|Pull requests?)/i.test(label));
      button.classList.toggle("dream-nav-chat", /^(聊天|Chat)/i.test(label));
    }

    const composer = document.querySelector(".composer-surface-chrome");
    const composerWrap = composer?.parentElement?.parentElement?.parentElement?.parentElement ?? null;
    for (const candidate of document.querySelectorAll(".dream-composer-wrap")) {
      if (candidate !== composerWrap) candidate.classList.remove("dream-composer-wrap");
    }
    composerWrap?.classList.add("dream-composer-wrap");

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || root).appendChild(style);
    }
    if (style.dataset.dreamVersion !== "1") {
      style.textContent = cssText;
      style.dataset.dreamVersion = "1";
    }

    const homeCandidate = document.querySelector('[role="main"]:has([data-testid="home-icon"])');
    const currentComposerText = document.querySelector(".ProseMirror")?.textContent?.trim() ?? "";
    const returnedToLanding = Boolean(homeState.dismissed && homeCandidate === homeState.dismissedHome &&
      !currentComposerText && homeCandidate?.querySelector('.group\\/home-suggestions'));
    if (homeCandidate && (homeCandidate !== homeState.dismissedHome || returnedToLanding)) {
      homeState.dismissed = false;
      homeState.dismissedHome = null;
      homeState.actionShell = false;
      root.removeAttribute("data-dream-action-shell");
    }
    const home = homeState.dismissed ? null : homeCandidate;
    for (const candidate of document.querySelectorAll('[role="main"].dream-home')) {
      if (candidate !== home) candidate.classList.remove("dream-home");
    }
    if (home) home.classList.add("dream-home");

    shellMain.classList.toggle("dream-home-shell", Boolean(home));
    shellMain.classList.toggle("dream-action-shell", homeState.actionShell && !home);
    let chrome = document.getElementById(CHROME_ID);
    if (!chrome || chrome.parentElement !== document.body || chrome.dataset.dreamSchema !== CHROME_SCHEMA) {
      chrome?.remove();
      chrome = document.createElement("div");
      chrome.id = CHROME_ID;
      chrome.dataset.dreamSchema = CHROME_SCHEMA;
      chrome.setAttribute("aria-hidden", "true");
      chrome.innerHTML = `
        <div class="dream-brand"><span class="dream-note" data-dream-field="motif-brand-glyph"></span><span><b data-dream-field="brand-title"></b><small data-dream-field="brand-subtitle"></small></span></div>
        <div class="dream-signature" data-dream-field="signature"></div>
        <div class="dream-sparkles"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="dream-geometry"><i></i><i></i><i></i><i></i></div>
        <div class="dream-ribbon"><span>♡</span>🎀<span>✦</span></div>
        <div class="dream-polaroid"></div>
        <div class="dream-motif-layer">
          <div class="dream-motif-corner" data-dream-field="motif-corner"></div>
          <div class="dream-motif-badge" data-dream-field="motif-badge"></div>
          <div class="dream-motif-code" data-dream-field="motif-code"></div>
          <div class="dream-equalizer"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="dream-circuit"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="dream-wave"><i></i><i></i><i></i></div>
          <div class="dream-floral"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="dream-rainbow"><i></i><i></i><i></i><i></i></div>
          <div class="dream-motif-emblem"><i></i><i></i></div>
          <div class="dream-motif-glyphs"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>`;
      document.body.appendChild(chrome);
    }
    const setField = (name, value) => {
      const node = chrome.querySelector?.(`[data-dream-field="${name}"]`);
      if (node) node.textContent = value;
    };
    setField("brand-title", theme.brandTitle);
    setField("brand-subtitle", theme.brandSubtitle);
    setField("signature", theme.signature);
    setField("motif-corner", theme.motifs.cornerMark);
    setField("motif-badge", theme.motifs.badge);
    setField("motif-code", theme.motifs.code);
    setField("motif-brand-glyph", theme.motifs.brandGlyph);
    const glyphNodes = chrome.querySelectorAll?.(".dream-motif-glyphs i") ?? [];
    for (let index = 0; index < glyphNodes.length; index += 1) {
      const value = theme.motifs.glyphs[index] ?? "";
      glyphNodes[index].textContent = value;
      glyphNodes[index].style.display = value ? "block" : "none";
    }
    chrome.dataset.dreamTheme = theme.id;
    const shellBox = shellMain.getBoundingClientRect();
    chrome.style.left = `${Math.round(shellBox.left)}px`;
    chrome.style.top = `${Math.round(shellBox.top)}px`;
    chrome.style.width = `${Math.round(shellBox.width)}px`;
    chrome.style.height = `${Math.round(shellBox.height)}px`;
    chrome.classList.toggle("dream-home-shell", Boolean(home));
    chrome.classList.toggle("dream-action-shell", homeState.actionShell && !home);
    if (home) {
      ensureSuggestionIcons(home);
      (window.requestAnimationFrame ?? ((callback) => callback()))(() => centerSuggestionIcons(home));
    }
  };

  const cleanup = () => {
    window.__CODEX_DREAM_SKIN_DISABLED__ = true;
    clearSkinDom();
    const state = window[STATE_KEY];
    state?.observer?.disconnect();
    if (state?.timer) clearInterval(state.timer);
    if (state?.scheduler?.timeout) clearTimeout(state.scheduler.timeout);
    state?.homeClickAbort?.abort?.();
    if (state?.artUrl) URL.revokeObjectURL(state.artUrl);
    delete window[STATE_KEY];
    return true;
  };

  const scheduler = { timeout: null };
  const scheduleEnsure = () => {
    if (scheduler.timeout) clearTimeout(scheduler.timeout);
    scheduler.timeout = setTimeout(() => {
      scheduler.timeout = null;
      ensure();
    }, 180);
  };
  const observer = new MutationObserver(scheduleEnsure);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const timer = setInterval(ensure, 5000);
  window[STATE_KEY] = { ensure, cleanup, dismissHome, observer, timer, scheduler, homeClickAbort, artUrl, themeId: theme.id, version: "1.8.4" };
  ensure();
  return { installed: true, version: "1.8.4", themeId: theme.id };
})(__DREAM_CSS_JSON__, __DREAM_ART_JSON__, __DREAM_THEME_JSON__)
