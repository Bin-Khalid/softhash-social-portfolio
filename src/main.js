import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

function renderAccountCard(account, platform) {
  const card = document.createElement("div");
  card.className = `account-card ${platform}`;

  card.innerHTML = `
    <a href="${account.url || "#"}" target="_blank" rel="noopener" class="account-card-head">
      <div class="account-avatar">${initials(account.name)}</div>
      <div>
        <div class="account-name">${account.name}</div>
        <div class="account-handle">${account.handle || ""}</div>
      </div>
    </a>
    <div class="account-stats">
      <div class="stat">
        <span class="stat-num" data-target="${account.followers}">0</span>
        <span class="stat-label">Followers</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-target="${account.reach}">0</span>
        <span class="stat-label">Reach</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-target="${account.likes}">0</span>
        <span class="stat-label">Likes</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-target="${account.posts}">0</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="engagement-bar">
        <div class="stat-label" style="margin-bottom:0.35rem;">
          Engagement <span class="stat-num eng-num" data-target="${account.engagementRate}" data-decimals="1" style="font-size:0.85rem;">0</span>%
        </div>
        <div class="engagement-track">
          <div class="engagement-fill" data-fill="${account.engagementRate}"></div>
        </div>
      </div>
    </div>
  `;

  return card;
}

function renderAdsCard(account) {
  const card = document.createElement("div");
  card.className = "account-card ads";

  card.innerHTML = `
    <a href="${account.url || "#"}" target="_blank" rel="noopener" class="account-card-head">
      <div class="account-avatar">${initials(account.name)}</div>
      <div>
        <div class="account-name">${account.name}</div>
        <div class="account-handle">${account.accountId || ""}${account.costPerResult ? ` · ${account.currency || "USD"} ${formatNumber(account.costPerResult, 2)}/result` : ""}</div>
      </div>
    </a>
    <div class="account-stats">
      <div class="stat">
        <span class="stat-num" data-target="${account.spend}">0</span>
        <span class="stat-label">Spend (${account.currency || "USD"})</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-target="${account.impressions}">0</span>
        <span class="stat-label">Impressions</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-target="${account.clicks}">0</span>
        <span class="stat-label">Clicks</span>
      </div>
      <div class="stat">
        <span class="stat-num" data-target="${account.results}">0</span>
        <span class="stat-label">Results</span>
      </div>
      <div class="engagement-bar">
        <div class="stat-label" style="margin-bottom:0.35rem;">
          CTR <span class="stat-num eng-num" data-target="${account.ctr}" data-decimals="1" style="font-size:0.85rem;">0</span>%
        </div>
        <div class="engagement-track">
          <div class="engagement-fill" data-fill="${account.ctr}"></div>
        </div>
      </div>
    </div>
  `;

  return card;
}

function renderAccounts(data) {
  const fbGrid = document.getElementById("facebook-grid");
  const igGrid = document.getElementById("instagram-grid");
  const adsGrid = document.getElementById("ads-grid");

  (data.facebook || []).forEach((acc) => fbGrid.appendChild(renderAccountCard(acc, "fb")));
  (data.instagram || []).forEach((acc) => igGrid.appendChild(renderAccountCard(acc, "ig")));
  (data.ads || []).forEach((acc) => adsGrid.appendChild(renderAdsCard(acc)));
}

function setTotals(data) {
  const all = [...(data.facebook || []), ...(data.instagram || [])];
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
}

function animateCountUp(el) {
  const target = Number(el.dataset.target);
  const decimals = Number(el.dataset.decimals || 0);
  const obj = { val: 0 };

  gsap.to(obj, {
    val: target,
    duration: 1.8,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = formatNumber(obj.val, decimals);
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

function wireDataAnimations() {
  gsap.utils.toArray(".total-num").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => animateCountUp(el),
    });
  });

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
        const fill = card.querySelector(".engagement-fill");
        const pct = Math.min(Number(fill.dataset.fill) * 10, 100);
        gsap.to(fill, { width: `${pct}%`, duration: 1.4, ease: "power2.out" });
      },
    });
  });
}

function initHeroEntrance() {
  gsap.set([".eyebrow", ".hero-title .line", ".hero-sub", ".hero-scroll"], {
    opacity: 0,
    y: 24,
  });
  gsap.to(".eyebrow", { opacity: 1, y: 0, duration: 0.8, delay: 0.1 });
  gsap.to(".hero-title .line", {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.12,
    delay: 0.25,
    ease: "power3.out",
  });
  gsap.to(".hero-sub", { opacity: 1, y: 0, duration: 0.9, delay: 0.55 });
  gsap.to(".hero-scroll", { opacity: 1, y: 0, duration: 0.9, delay: 0.75 });
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
    ScrollTrigger.refresh();
  } catch (err) {
    console.error("Failed to load account data:", err);
  }
}

initHeroEntrance();
wireRevealAnimations();
parallaxOrbs();
loadAndRender();
