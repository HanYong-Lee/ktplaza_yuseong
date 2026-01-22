(() => {
  // ---------- Intro: tap to skip ----------
  const intro = document.getElementById("intro");
  const introVideo = document.getElementById("introVideo");
  const skipBtn = document.getElementById("skipBtn");

  const hideIntro = () => {
    if (!intro || intro.classList.contains("is-hidden")) return;
    intro.classList.add("is-hidden");
    try { introVideo && introVideo.pause(); } catch (e) {}
    document.body.style.overflow = "";
  };

  // Lock scroll while intro is showing
  if (intro) document.body.style.overflow = "hidden";

  // If video ends, auto-hide
  if (introVideo) {
    introVideo.addEventListener("ended", hideIntro);
    introVideo.addEventListener("error", hideIntro); // fail-safe
  }

  // Tap anywhere to skip
  if (intro) intro.addEventListener("click", hideIntro);
  if (skipBtn) skipBtn.addEventListener("click", (e) => { e.stopPropagation(); hideIntro(); });

  // ---------- Tabs ----------
  const tabButtons = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  const setActiveTab = (id) => {
    tabButtons.forEach(btn => {
      const isOn = btn.dataset.tab === id;
      btn.classList.toggle("is-active", isOn);
      btn.setAttribute("aria-selected", String(isOn));
    });
    panels.forEach(p => p.classList.toggle("is-active", p.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  });

  // Jump links inside cards (data-jump-tab)
  document.querySelectorAll("[data-jump-tab]").forEach(el => {
    el.addEventListener("click", (e) => {
      const id = el.getAttribute("data-jump-tab");
      if (!id) return;
      e.preventDefault();
      setActiveTab(id);
    });
  });

  // ---------- Fade lines: re-trigger when returning to Tab1 ----------
  const reRunFadeLines = () => {
    const container = document.querySelector("#t1 .fadeLines[data-fade-lines]");
    if (!container) return;
    const spans = Array.from(container.querySelectorAll("span"));
    spans.forEach((s) => {
      s.style.animation = "none";
      s.offsetHeight; // reflow
      s.style.animation = "";
    });
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "t1") reRunFadeLines();
    });
  });
})();

(function () {
  const wrap = document.querySelector("[data-bullet-accord]");
  if (!wrap) return;

  const items = Array.from(wrap.querySelectorAll(".bulletCard"));

  // 초기 aria 동기화
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

    // 하나만 열리게
    items.forEach((other) => {
      other.classList.remove("is-open");
      const b = other.querySelector(".bulletCard__btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });

    // 선택한 것만 토글
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
const ANALYTICS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxTL6tU-PwMX5MOX0AHQGTaBbMfju_wz8GelbeWdfdhAivqzG8P8xGYErRIVPj76B1Sjg/exec";

// ✅ UA 요약(축약) 함수: raw UA 전체를 저장하지 않음
function getUaSummary(){
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();

  // deviceType
  const isMobile =
    /mobi|android|iphone|ipad|ipod|iemobile|windows phone/.test(ua);
  const deviceType = isMobile ? "mobile" : "desktop";

  // os
  let os = "other";
  if (/android/.test(ua)) os = "android";
  else if (/iphone|ipad|ipod/.test(ua)) os = "ios";
  else if (/windows/.test(ua) || /win/.test(plat)) os = "windows";
  else if (/mac os|macintosh/.test(ua) || /mac/.test(plat)) os = "mac";
  else if (/linux/.test(ua) || /linux/.test(plat)) os = "linux";

  // browser
  let browser = "other";
  // order matters
  if (/edg\//.test(ua)) browser = "edge";
  else if (/opr\//.test(ua) || /opera/.test(ua)) browser = "opera";
  else if (/samsungbrowser\//.test(ua)) browser = "samsung";
  else if (/chrome\//.test(ua) && !/chromium/.test(ua)) browser = "chrome";
  else if (/firefox\//.test(ua)) browser = "firefox";
  else if (/safari\//.test(ua) && !/chrome\//.test(ua) && !/crios\//.test(ua)) browser = "safari";

  return `${deviceType}|${os}|${browser}`;
}

function getSessionId(){
  const k = "ktplaza_sid";
  let sid = localStorage.getItem(k);
  if (!sid) {
    sid = "s_" + Math.random().toString(36).slice(2) + "_" + Date.now();
    localStorage.setItem(k, sid);
  }
  return sid;
}

const sid = getSessionId();
let sessionStart = Date.now();

let activeTab = "t1";
let tabStart = Date.now();

// 중복 전송 방지
let didFlush = false;

function sendEvent(payload){
  const bodyObj = {
    ts: Date.now(),
    sessionId: sid,
    url: location.href,
    // ✅ raw UA 대신 요약값만 저장
    ua: getUaSummary(),
    ...payload
  };

  const url = `${ANALYTICS_ENDPOINT}?path=collect`;
  const json = JSON.stringify(bodyObj);

  // sendBeacon 우선 (페이지 이탈 시에도 비교적 안정)
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([json], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    } catch (e) {}
  }

  // fallback fetch
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true
  }).catch(() => {});
}

// 탭 전환 dwell 기록: .tab 버튼을 기준으로
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const now = Date.now();
    const dwell = now - tabStart;

    // 이전 탭 dwell 기록
    sendEvent({ event: "tab_dwell", tab: activeTab, durationMs: dwell });

    // 현재 탭 업데이트
    activeTab = btn.dataset.tab || activeTab;
    tabStart = now;
  });
});

// 카드/CTA 클릭 로그 (필요한 클래스/데이터 속성이 있을 때만)
document.addEventListener("click", (e) => {
  const cta = e.target.closest("[data-cta]");
  if (cta) {
    sendEvent({
      event: "cta_click",
      targetType: cta.dataset.targetType || "cta",
      targetId: cta.dataset.targetId || "",
      cardId: cta.dataset.cardId || ""
    });
  }

  const consultant = e.target.closest("[data-consultant]");
  if (consultant) {
    sendEvent({
      event: "consultant_click",
      targetType: "consultant",
      targetId: consultant.dataset.consultant || "",
      cardId: consultant.dataset.cardId || ""
    });
  }
});

// 세션 종료 시 stay time 기록
function flushOnExit(){
  if (didFlush) return;
  didFlush = true;

  const now = Date.now();

  // 마지막 탭 dwell
  const dwell = now - tabStart;
  sendEvent({ event: "tab_dwell", tab: activeTab, durationMs: dwell });

  // 세션 총 체류 시간
  sendEvent({ event: "session_end", durationMs: now - sessionStart });
}

window.addEventListener("pagehide", flushOnExit);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushOnExit();
});

window.addEventListener("beforeunload", flushOnExit);

// =========================
// ClipCard (Option A): 카드 내부에서 유튜브 쇼츠 재생
// =========================
document.addEventListener("click", (e) => {
  // Option A: clipCard 내부에서 바로 재생 (새 탭/유튜브 앱으로 안 넘어가게)
  const card = e.target.closest(".clipCard");
  if (!card) return;

  // 이미 재생 중이면 무시(원하면 토글로 바꿔도 됨)
  if (card.classList.contains("is-playing")) return;

  // 링크 기본동작 방지 (a태그일 때)
  e.preventDefault();

  // 1) videoId 추출 (data-video-id 우선, 없으면 href에서 추출)
  let videoId = card.dataset.videoId || "";

  if (!videoId) {
    const href = card.getAttribute("href") || "";
    // 가능한 케이스: /embed/ID, watch?v=ID, youtu.be/ID, shorts/ID
    const patterns = [
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i,
      /youtu\.be\/([a-zA-Z0-9_-]{6,})/i,
      /[?&]v=([a-zA-Z0-9_-]{6,})/i
    ];
    for (const p of patterns) {
      const mm = href.match(p);
      if (mm && mm[1]) { videoId = mm[1]; break; }
    }
  }

  if (!videoId) {
    console.warn("[clipCard] videoId를 찾지 못했습니다. data-video-id 또는 href를 확인하세요.");
    return;
  }

  // 2) 썸네일 영역에 iframe 삽입
  const thumb = card.querySelector(".clipCard__thumb");
  if (!thumb) return;

  // 기존 img를 숨김(나중에 되돌릴 수도 있어서 제거 대신 숨김)
  const img = thumb.querySelector("img");
  if (img) img.style.display = "none";

  // play 아이콘 숨김
  const play = thumb.querySelector(".clipCard__play");
  if (play) play.style.display = "none";

  // 이미 iframe이 있으면 재사용, 없으면 생성
  let iframe = thumb.querySelector("iframe.clipCard__iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.className = "clipCard__iframe";
    iframe.setAttribute("title", card.querySelector(".clipCard__title")?.textContent?.trim() || "YouTube video");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "");
    // iOS에서 전체화면/앱 전환 최소화
    iframe.setAttribute("playsinline", "1");
    thumb.appendChild(iframe);
  }

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  card.classList.add("is-playing");
});
