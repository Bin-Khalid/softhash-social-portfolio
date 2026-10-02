// Seed data used the first time the store is read (before any admin save)
// and as the local-dev fallback when no Redis env vars are configured.
// Edit these through /admin once the site is live — not by hand.

function id() {
  return Math.random().toString(36).slice(2, 10);
}

const facebook = [
  {
    id: id(),
    name: "Facebook Page 1",
    handle: "@handle1",
    url: "https://facebook.com/",
    followers: 12500,
    posts: 340,
    likes: 11800,
    engagementRate: 4.2,
    reach: 85000,
  },
];

const instagram = [
  {
    id: id(),
    name: "Instagram Account 1",
    handle: "@handle1",
    url: "https://instagram.com/",
    followers: 18200,
    posts: 620,
    likes: 24500,
    engagementRate: 6.3,
    reach: 112000,
  },
];

const ads = [
  {
    id: id(),
    name: "Meta Ads Account 1",
    accountId: "act_000000000",
    url: "https://adsmanager.facebook.com/",
    spend: 2400,
    currency: "USD",
    impressions: 410000,
    clicks: 9200,
    ctr: 2.2,
    results: 310,
    costPerResult: 7.74,
  },
];

export const defaultData = { facebook, instagram, ads };
