(() => {
  "use strict";

  // =========================
  // Intro: tap to skip
  // =========================
  const intro = document.getElementById("intro");
  const introVideo = document.getElementById("introVideo");
  const skipBtn = document.getElementById("skipBtn");

  function hideIntro() {
    if (!intro || intro.classList.contains("is-hidden")) return;
    intro.classList.add("is-hidden");
    try {
      introVideo && introVideo.pause();
    } catch (_) {}
    document.body.style.overflow = "";
  }

  if (intro) {
    document.body.style.overflow = "hidden";
    intro.addEventListener("click", hideIntro);
  }
  if (skipBtn) {
    skipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hideIntro();
    });
  }
  if (introVideo) {
    introVideo.addEventListener("ended", hideIntro);
    introVideo.addEventListener("error", hideIntro);
  }

  // =========================
  // Tabs
  // =========================
  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  function setActiveTab(id) {
    tabButtons.forEach((btn) => {
      const isOn = btn.dataset.tab === id;
      btn.classList.toggle("is-active", isOn);
      btn.setAttribute("aria-selected", String(isOn));
    });
    panels.forEach((p) => p.classList.toggle("is-active", p.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  });

  // Jump links inside cards (data-jump-tab)
  document.querySelectorAll("[data-jump-tab]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const id = el.getAttribute("data-jump-tab");
      if (!id) return;
      e.preventDefault();
      setActiveTab(id);
    });
  });

  // Re-trigger fadeLines when returning to Tab1 (if present)
  function reRunFadeLines() {
    const container = document.querySelector("#t1 .fadeLines[data-fade-lines]");
    if (!container) return;
    const spans = Array.from(container.querySelectorAll("span"));
    spans.forEach((s) => {
      s.style.animation = "none";
      void s.offsetHeight; // reflow
      s.style.animation = "";
    });
  }
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "t1") reRunFadeLines();
    });
  });

  // =========================
  // Bullet accordion (if present)
  // =========================
  (function initBulletAccordion() {
    const wrap = document.querySelector("[data-bullet-accord]");
    if (!wrap) return;

    const items = Array.from(wrap.querySelectorAll(".bulletCard"));

    // Sync aria-expanded with initial open states
    items.forEach((li) => {
      const btn = li.querySelector(".bulletCard__btn");
      if (!btn) return;
      btn.setAttribute("aria-expanded", String(li.classList.contains("is-open")));
    });

    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".bulletCard__btn");
      if (!btn) return;

      const li = btn.closest(".bulletCard");
      if (!li) return;

      const willOpen = !li.classList.contains("is-open");

      // Close all
      items.forEach((other) => {
        other.classList.remove("is-open");
        const b = other.querySelector(".bulletCard__btn");
        if (b) b.setAttribute("aria-expanded", "false");
      });

      // Open selected
      if (willOpen) {
        li.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        li.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  })();

  // =========================
  // Analytics (KT Plaza simple)
  // =========================
  const ANALYTICS_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxTL6tU-PwMX5MOX0AHQGTaBbMfju_wz8GelbeWdfdhAivqzG8P8xGYErRIVPj76B1Sjg/exec";

  function getUaSummary() {
    const ua = (navigator.userAgent || "").toLowerCase();
    const plat = (navigator.platform || "").toLowerCase();

    const isMobile = /mobi|android|iphone|ipad|ipod|iemobile|windows phone/.test(ua);
    const deviceType = isMobile ? "mobile" : "desktop";

    let os = "other";
    if (/android/.test(ua)) os = "android";
    else if (/iphone|ipad|ipod/.test(ua)) os = "ios";
    else if (/windows/.test(ua) || /win/.test(plat)) os = "windows";
    else if (/mac os|macintosh/.test(ua) || /mac/.test(plat)) os = "mac";
    else if (/linux/.test(ua) || /linux/.test(plat)) os = "linux";

    let browser = "other";
    if (/edg\//.test(ua)) browser = "edge";
    else if (/opr\//.test(ua) || /opera/.test(ua)) browser = "opera";
    else if (/samsungbrowser\//.test(ua)) browser = "samsung";
    else if (/chrome\//.test(ua) && !/chromium/.test(ua)) browser = "chrome";
    else if (/firefox\//.test(ua)) browser = "firefox";
    else if (/safari\//.test(ua) && !/chrome\//.test(ua) && !/crios\//.test(ua)) browser = "safari";

    return `${deviceType}|${os}|${browser}`;
  }

  function getSessionId() {
    const k = "ktplaza_sid";
    let sid = localStorage.getItem(k);
    if (!sid) {
      sid = "s_" + Math.random().toString(36).slice(2) + "_" + Date.now();
      localStorage.setItem(k, sid);
    }
    return sid;
  }

  const sid = getSessionId();
  const sessionStart = Date.now();

  let activeTab = "t1";
  let tabStart = Date.now();
  let didFlush = false;

  function sendEvent(payload) {
    const bodyObj = {
      ts: Date.now(),
      sessionId: sid,
      url: location.href,
      ua: getUaSummary(),
      ...payload,
    };

    const url = `${ANALYTICS_ENDPOINT}?path=collect`;
    const json = JSON.stringify(bodyObj);

    // 1) sendBeacon first
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([json], { type: "text/plain;charset=UTF-8" });
        const ok = navigator.sendBeacon(url, blob);
        if (ok) return;
      } catch (_) {}
    }

    // 2) fetch fallback
    fetch(url, {
      method: "POST",
      body: json,
      keepalive: true,
      mode: "no-cors",
      cache: "no-store",
    }).catch(() => {});
  }

  sendEvent({ event: "page_view" });

  function recordTabDwell(nextTab) {
    const now = Date.now();
    const dur = now - tabStart;
    if (dur > 300) sendEvent({ event: "tab_dwell", tab: activeTab, durationMs: dur });
    activeTab = nextTab;
    tabStart = now;
  }

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab-target") || btn.dataset.tab || "";
      if (target) recordTabDwell(target);
    });
  });

  // Consultant click
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-consultant]");
    if (!c) return;
    sendEvent({
      event: "consultant_click",
      targetType: "consultant",
      targetId: c.dataset.consultant || "unknown",
    });
  });

  // CTA click
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cta]");
    if (!a) return;
    sendEvent({
      event: "cta_click",
      targetType: "cta",
      targetId: a.dataset.cta || "unknown",
      cardId: a.dataset.card || "default",
    });
  });

  function flushOnExit() {
    if (didFlush) return;
    didFlush = true;

    const now = Date.now();

    // last tab dwell
    const dur = now - tabStart;
    if (dur > 300) sendEvent({ event: "tab_dwell", tab: activeTab, durationMs: dur });

    // session end
    const total = now - sessionStart;
    if (total > 300) sendEvent({ event: "session_end", durationMs: total });
  }

  window.addEventListener("pagehide", flushOnExit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnExit();
  });
  window.addEventListener("beforeunload", flushOnExit);

  // =========================
  // ClipCard: play YouTube inline (inside the card)
  // =========================
  function closeAllClipCards() {
    document.querySelectorAll(".clipCard.is-playing").forEach((card) => {
      const player = card.querySelector(".clipCard__player");
      const iframe = card.querySelector(".clipCard__iframe");
      if (player) player.classList.add("hidden");
      if (iframe) iframe.src = "";
      card.classList.remove("is-playing");
    });
  }

  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".js-close-video");
    if (closeBtn) {
      e.stopPropagation();
      const card = closeBtn.closest(".clipCard");
      if (!card) return;
      const player = card.querySelector(".clipCard__player");
      const iframe = card.querySelector(".clipCard__iframe");
      if (player) player.classList.add("hidden");
      if (iframe) iframe.src = "";
      card.classList.remove("is-playing");
      return;
    }

    const openBtn = e.target.closest(".js-open-video");
    if (!openBtn) return;

    const card = openBtn; // .clipCard 자체(버튼)
    const videoId = card.dataset.videoId;
    const player = card.querySelector(".clipCard__player");
    const iframe = card.querySelector(".clipCard__iframe");
    if (!player || !iframe || !videoId) return;

    closeAllClipCards();

    // iOS/모바일에서 autoplay가 소리 때문에 막힐 수 있어 mute=1 추가
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`;
    player.classList.remove("hidden");
    card.classList.add("is-playing");
  });
})();
