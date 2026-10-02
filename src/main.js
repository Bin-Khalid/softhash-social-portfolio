import "@fontsource-variable/unbounded";
import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

function initials(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatNumber(value, decimals = 0) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const PLATFORM_SECTION = { fb: "#facebook", ig: "#instagram", li: "#linkedin", ads: "#ads" };

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function safeUrl(value) {
  try {
    const u = new URL(value);
    return /^https?:$/.test(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

function platformSvg(platform) {
  const svg = document.querySelector(`${PLATFORM_SECTION[platform]} .platform-icon svg`);
  return svg ? svg.outerHTML : "";
}

function watermark(platform) {
  return platformSvg(platform).replace("<svg", '<svg class="card-watermark" aria-hidden="true"');
}

function ringHtml(value, label) {
  const v = Number(value) || 0;
  return `
    <div class="ring">
      <div class="ring-gauge">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle class="ring-track" cx="22" cy="22" r="18"></circle>
          <circle class="ring-progress" cx="22" cy="22" r="18" data-fill="${v}"></circle>
        </svg>
        <div class="ring-center"><span class="stat-num eng-num" data-target="${v}" data-decimals="1">0</span>%</div>
      </div>
      <span class="ring-label">${esc(label)}</span>
    </div>`;
}

function createCard({ platform, name, sub, url, heroValue, heroLabel, ringValue, ringLabel, mini, foot }) {
  const href = safeUrl(url);
  const card = document.createElement(href ? "a" : "div");
  card.className = `account-card ${platform}`;
  if (href) {
    card.href = href;
    card.target = "_blank";
    card.rel = "noopener";
    card.setAttribute("aria-label", `${name} — open profile`);
  }

  card.innerHTML = `
    ${watermark(platform)}
    <div class="card-top">
      <div class="account-avatar">${esc(initials(name))}</div>
      <div class="card-id">
        <div class="account-name">${esc(name)}</div>
        <div class="account-handle">${esc(sub)}</div>
      </div>
      ${href ? '<span class="card-arrow" aria-hidden="true">↗</span>' : ""}
    </div>
    <div class="card-hero">
      <div class="hero-metric">
        <span class="hero-num stat-num" data-target="${Number(heroValue) || 0}" data-compact="hero">0</span>
        <span class="hero-label">${esc(heroLabel)}</span>
      </div>
      ${ringHtml(ringValue, ringLabel)}
    </div>
    <div class="card-mini">
      ${mini
        .map(
          (m) => `
        <div class="mini">
          <span class="stat-num" data-target="${Number(m.value) || 0}" data-compact="mini">0</span>
          <span class="stat-label">${esc(m.label)}</span>
        </div>`
        )
        .join("")}
    </div>
    ${foot ? `<div class="card-foot">${esc(foot)}</div>` : ""}
  `;

  return card;
}

function renderAccountCard(account, platform) {
  return createCard({
    platform,
    name: account.name,
    sub: account.handle,
    url: account.url,
    heroValue: account.followers,
    heroLabel: "Followers",
    ringValue: account.engagementRate,
    ringLabel: "Engagement",
    mini: [
      { value: account.reach, label: "Reach" },
      { value: account.likes, label: platform === "li" ? "Reactions" : "Likes" },
      { value: account.posts, label: "Posts" },
    ],
  });
}

function renderAdsCard(account) {
  const currency = account.currency || "USD";
  return createCard({
    platform: "ads",
    name: account.name,
    sub: account.accountId,
    url: account.url,
    heroValue: account.spend,
    heroLabel: `Spend · ${currency}`,
    ringValue: account.ctr,
    ringLabel: "CTR",
    mini: [
      { value: account.impressions, label: "Impressions" },
      { value: account.clicks, label: "Clicks" },
      { value: account.results, label: "Results" },
    ],
    foot: account.costPerResult ? `${currency} ${formatNumber(account.costPerResult, 2)} per result` : "",
  });
}

function renderAccounts(data) {
  const fbGrid = document.getElementById("facebook-grid");
  const igGrid = document.getElementById("instagram-grid");
  const liGrid = document.getElementById("linkedin-grid");
  const adsGrid = document.getElementById("ads-grid");

  (data.facebook || []).forEach((acc) => fbGrid.appendChild(renderAccountCard(acc, "fb")));
  (data.instagram || []).forEach((acc) => igGrid.appendChild(renderAccountCard(acc, "ig")));
  (data.linkedin || []).forEach((acc) => liGrid.appendChild(renderAccountCard(acc, "li")));
  (data.ads || []).forEach((acc) => adsGrid.appendChild(renderAdsCard(acc)));
}

function setTotals(data) {
  const all = [...(data.facebook || []), ...(data.instagram || []), ...(data.linkedin || [])];
  const totals = {
    followers: all.reduce((s, a) => s + (a.followers || 0), 0),
    reach: all.reduce((s, a) => s + (a.reach || 0), 0),
    likes: all.reduce((s, a) => s + (a.likes || 0), 0),
    engagement: all.length
      ? all.reduce((s, a) => s + (a.engagementRate || 0), 0) / all.length
      : 0,
  };

  const nums = document.querySelectorAll(".total-num");
  nums[0].dataset.target = totals.followers;
  nums[1].dataset.target = totals.reach;
  nums[2].dataset.target = totals.likes;
  nums[3].dataset.target = totals.engagement.toFixed(1);

  const ring = document.querySelector(".big-ring-progress");
  if (ring) ring.dataset.fill = totals.engagement.toFixed(1);
  const chip = document.getElementById("totals-chip");
  if (chip && all.length) chip.textContent = `Across ${all.length} account${all.length === 1 ? "" : "s"}`;
}

const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const COMPACT_FROM = { hero: 1_000_000, mini: 10_000, total: 1_000_000 };

function animateCountUp(el) {
  const target = Number(el.dataset.target);
  const decimals = Number(el.dataset.decimals || 0);
  const compact = target >= (COMPACT_FROM[el.dataset.compact] ?? Infinity);
  const obj = { val: 0 };

  gsap.to(obj, {
    val: target,
    duration: 1.8,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = compact ? compactFormat.format(obj.val) : formatNumber(obj.val, decimals);
    },
  });
}

function wireRevealAnimations() {
  gsap.utils.toArray(".reveal").forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: i * 0.08,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });
}

const THEMES = {
  top: { "--page-bg": "#fff6ec", "--orb-1": "#ffb347", "--orb-2": "#1d155b", "--orb-3": "#d62976", "--bar": "#dc8215" },
  totals: { "--page-bg": "#fff6ec", "--orb-1": "#ffb347", "--orb-2": "#1d155b", "--orb-3": "#d62976", "--bar": "#dc8215" },
  facebook: { "--page-bg": "#eaf2ff", "--orb-1": "#1877f2", "--orb-2": "#4f8cff", "--orb-3": "#8ab4ff", "--bar": "#1877f2" },
  instagram: { "--page-bg": "#ffeef5", "--orb-1": "#d62976", "--orb-2": "#962fbf", "--orb-3": "#feda75", "--bar": "#d62976" },
  linkedin: { "--page-bg": "#e8f2fb", "--orb-1": "#0a66c2", "--orb-2": "#5aa2e6", "--orb-3": "#1d155b", "--bar": "#0a66c2" },
  ads: { "--page-bg": "#fff2e0", "--orb-1": "#dc8215", "--orb-2": "#1d155b", "--orb-3": "#ffb347", "--bar": "#dc8215" },
  cta: { "--page-bg": "#ece8fa", "--orb-1": "#1d155b", "--orb-2": "#962fbf", "--orb-3": "#ffb347", "--bar": "#1d155b" },
};

function wireColorTheme() {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const applyTheme = (name) => {
    gsap.to(root, {
      ...THEMES[name],
      duration: reduceMotion ? 0 : 1.2,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  Object.keys(THEMES).forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 55%",
      onEnter: () => applyTheme(id),
      onEnterBack: () => applyTheme(id),
    });
  });

  const bar = document.querySelector(".scroll-progress");
  if (bar) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
    });
  }
}

function wireDataAnimations() {
  gsap.utils.toArray(".total-num").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => animateCountUp(el),
    });
  });

  const bigRing = document.querySelector(".big-ring-progress");
  if (bigRing) {
    ScrollTrigger.create({
      trigger: bigRing,
      start: "top 88%",
      once: true,
      onEnter: () => {
        const pct = Math.min(Number(bigRing.dataset.fill) * 10, 100);
        gsap.to(bigRing, { strokeDashoffset: 150.8 * (1 - pct / 100), duration: 1.6, ease: "power2.out" });
      },
    });
  }

  gsap.utils.toArray(".account-card").forEach((card, i) => {
    gsap.fromTo(
      card,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: (i % 5) * 0.08,
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      }
    );

    ScrollTrigger.create({
      trigger: card,
      start: "top 85%",
      once: true,
      onEnter: () => {
        card.querySelectorAll(".stat-num").forEach(animateCountUp);
        const ring = card.querySelector(".ring-progress");
        if (ring) {
          const pct = Math.min(Number(ring.dataset.fill) * 10, 100);
          gsap.to(ring, { strokeDashoffset: 113.1 * (1 - pct / 100), duration: 1.6, ease: "power2.out" });
        }
      },
    });
  });
}

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((word, i) => {
    const outer = document.createElement("span");
    outer.className = "word";
    const inner = document.createElement("span");
    inner.className = "word-inner";
    inner.textContent = word;
    outer.appendChild(inner);
    el.appendChild(outer);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  el.classList.add("is-split");
}

function initHeroEntrance() {
  const lines = gsap.utils.toArray(".hero-title .line");
  lines.forEach(splitWords);
  gsap.set(lines, { opacity: 1 });
  gsap.set([".eyebrow", ".hero-sub", ".hero-scroll"], { opacity: 0, y: 24 });

  if (!reduceMotion) {
    gsap.from(".hero-title .word-inner", {
      yPercent: 115,
      rotate: 6,
      opacity: 0,
      duration: 1.1,
      stagger: 0.09,
      delay: 0.25,
      ease: "power4.out",
    });
  }
  gsap.to(".eyebrow", { opacity: 1, y: 0, duration: 0.8, delay: 0.1 });
  gsap.to(".hero-sub", { opacity: 1, y: 0, duration: 0.9, delay: 0.75 });
  gsap.to(".hero-scroll", { opacity: 1, y: 0, duration: 0.9, delay: 0.95 });
}

function initFloaters() {
  if (reduceMotion) return;
  const hero = document.querySelector(".hero");
  const layer = document.createElement("div");
  layer.className = "hero-floaters";
  layer.setAttribute("aria-hidden", "true");

  const specs = [
    { from: "#facebook", left: "11%", top: "24%", mLeft: "8%", mTop: "2%", depth: 46 },
    { from: "#instagram", left: "85%", top: "20%", mLeft: "76%", mTop: "0%", depth: 30 },
    { from: "#linkedin", left: "7%", top: "66%", mLeft: "9%", mTop: "78%", depth: 24 },
    { from: "#ads", left: "88%", top: "64%", mLeft: "76%", mTop: "70%", depth: 54 },
  ];

  const floaters = specs.map((spec) => {
    const icon = document.querySelector(`${spec.from} .platform-icon`).cloneNode(true);
    const outer = document.createElement("span");
    outer.className = "floater";
    outer.style.setProperty("--l", spec.left);
    outer.style.setProperty("--t", spec.top);
    outer.style.setProperty("--ml", spec.mLeft);
    outer.style.setProperty("--mt", spec.mTop);
    const inner = document.createElement("span");
    inner.className = "floater-inner";
    inner.appendChild(icon);
    outer.appendChild(inner);
    layer.appendChild(outer);
    return { outer, inner, depth: spec.depth };
  });
  hero.prepend(layer);

  gsap.from(floaters.map((f) => f.outer), {
    scale: 0,
    opacity: 0,
    duration: 1,
    stagger: 0.15,
    delay: 1,
    ease: "back.out(2)",
  });

  floaters.forEach((f) => {
    gsap.to(f.inner, {
      y: gsap.utils.random(14, 26),
      rotate: gsap.utils.random(-9, 9),
      duration: gsap.utils.random(2.6, 4),
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  });

  if (!finePointer) return;
  const movers = floaters.map((f) => ({
    x: gsap.quickTo(f.outer, "x", { duration: 0.9, ease: "power3.out" }),
    y: gsap.quickTo(f.outer, "y", { duration: 0.9, ease: "power3.out" }),
    depth: f.depth,
  }));
  hero.addEventListener("pointermove", (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    movers.forEach((m) => {
      m.x(-nx * m.depth * 2);
      m.y(-ny * m.depth * 2);
    });
  });
}

function initMarquee() {
  const track = document.querySelector(".marquee-track");
  if (!track) return;
  const group = track.firstElementChild;

  const items = [
    { label: "Facebook", key: "fb" },
    { label: "Instagram", key: "ig" },
    { label: "LinkedIn", key: "li" },
    { label: "Meta Ads", key: "ads" },
  ];
  const once = items
    .map((it) => `<span class="mq-item ${it.key}"><span class="mq-icon">${platformSvg(it.key)}</span>${it.label}</span><i class="mq-sep"></i>`)
    .join("");
  group.innerHTML = once + once;

  if (reduceMotion) return;
  track.appendChild(group.cloneNode(true));

  const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
  let settle;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 9);
      loop.timeScale(boost * (self.direction || 1));
      settle?.kill();
      settle = gsap.to(loop, { timeScale: 1, duration: 1, ease: "power2.out", delay: 0.05 });
    },
  });
}

function wireTilt() {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll(".account-card, .total-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      gsap.to(card, {
        rotateY: (px - 0.5) * 12,
        rotateX: -(py - 0.5) * 12,
        y: -6,
        transformPerspective: 900,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
    card.addEventListener("pointerleave", () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.7, ease: "power3.out", overwrite: "auto" });
    });
  });
}

function wireMagnetic() {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll(".nav-cta, .cta-btn").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - (r.left + r.width / 2)) * 0.35,
        y: (e.clientY - (r.top + r.height / 2)) * 0.35,
        duration: 0.3,
        ease: "power2.out",
      });
    });
    btn.addEventListener("pointerleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
    });
  });
}

function wirePops() {
  if (reduceMotion) return;
  gsap.utils.toArray(".platform-head").forEach((head) => {
    gsap.from(head.querySelector(".platform-icon"), {
      scale: 0,
      rotate: -140,
      duration: 1,
      ease: "back.out(2.2)",
      scrollTrigger: { trigger: head, start: "top 85%" },
    });
  });
  gsap.from(".total-card", {
    scale: 0.85,
    duration: 1,
    stagger: 0.12,
    ease: "back.out(1.6)",
    scrollTrigger: { trigger: ".totals-grid", start: "top 85%" },
  });
}

function parallaxOrbs() {
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    document.querySelectorAll(".orb").forEach((orb, i) => {
      const speed = 0.08 + i * 0.04;
      orb.style.transform = `translateY(${y * speed}px)`;
    });
  });
}

async function loadAndRender() {
  try {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    renderAccounts(data);
    setTotals(data);
    wireDataAnimations();
    wireTilt();
    ScrollTrigger.refresh();
  } catch (err) {
    console.error("Failed to load account data:", err);
  }
}

initHeroEntrance();
initFloaters();
initMarquee();
wireMagnetic();
wirePops();
wireRevealAnimations();
wireColorTheme();
parallaxOrbs();
loadAndRender();
