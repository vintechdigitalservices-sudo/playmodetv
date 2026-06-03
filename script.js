// script.js

// ===== CONFIG =====
const NEWS_API_KEY  = 'pub_48088daded4b4d86bac3ec31ad15a705';
const NEWS_API_BASE = 'https://newsdata.io/api/1/news';

const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheGet(key) {
    try {
        const raw = sessionStorage.getItem('pma_' + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem('pma_' + key); return null; }
        return data;
    } catch { return null; }
}
function cacheSet(key, data) {
    try { sessionStorage.setItem('pma_' + key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ===== CATEGORY CONFIG =====
// Each category has 5 content slots. We mix articles from NewsData API 
// and videos from JSON files.
const CATEGORIES = [
    { key: 'business',    label: '💼 Business',    newsQ: 'africa business trade investment',       newsCat: 'business',    videoFile: 'business' },
    { key: 'discovery',   label: '✨ Discovery',    newsQ: 'africa science discovery research',      newsCat: 'science',     videoFile: 'discovery' },
    { key: 'finance',     label: '📈 Finance',      newsQ: 'africa economy finance markets',         newsCat: 'business',    videoFile: 'finance' },
    { key: 'health',      label: '🏥 Health',       newsQ: 'africa health disease outbreak',         newsCat: 'health',      videoFile: 'health' },
    { key: 'politics',    label: '⚖️ Politics',     newsQ: 'africa nigeria politics government',     newsCat: 'politics',    videoFile: 'politics' },
    { key: 'sports',      label: '⚽ Sports',       newsQ: 'africa sport football champions',        newsCat: 'sports',      videoFile: 'sports' },
    { key: 'tech',        label: '🚀 Tech',         newsQ: 'africa technology AI innovation',        newsCat: 'technology',  videoFile: 'tech' },
    { key: 'weather',     label: '🌤️ Weather',      newsQ: 'africa climate weather flood',           newsCat: 'environment', videoFile: 'weather' },
];

// Template assignment loops: 1,2,3,1,2,3,1,2
const TEMPLATES = [1, 2, 3, 1, 2, 3, 1, 2];

const CATEGORY_MAP = {};
CATEGORIES.forEach(c => {
    CATEGORY_MAP[c.key] = c;
});
CATEGORY_MAP.all = { newsQ: 'africa latest news today', newsCat: '', videoFile: null };

// ===== DOM REFS =====
const filterBtns      = document.querySelectorAll('.filter-btn');
const hamburger       = document.getElementById('hamburger');
const navLinks        = document.getElementById('navLinks');
const topStoriesRow   = document.getElementById('top-stories-row');
const topVideosRow    = document.getElementById('top-videos-row');
const forYouList      = document.getElementById('for-you-list');
const loadingEl       = document.getElementById('loading-indicator');
const catSections     = document.getElementById('category-sections');
const topLayout       = document.getElementById('top-stories-layout');

// ===== LOGO ANIMATION =====
(function initLogoAnim() {
    const frames = document.querySelectorAll('.logo-frame');
    if (!frames.length) return;
    let current = 0;
    setInterval(() => {
        frames[current].classList.remove('active');
        current = (current + 1) % frames.length;
        frames[current].classList.add('active');
    }, 5000);
})();

// ===== DATE & TIME BAR =====
function updateDateTime() {
    const now    = new Date();
    const dateEl = document.getElementById('date-display');
    const timeEl = document.getElementById('time-display');
    const tzEl   = document.getElementById('tz-label');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }).toUpperCase();
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    if (tzEl) {
        const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        tzEl.textContent = (tz.includes('Lagos') || tz.includes('Africa/Lagos'))
            ? 'WAT'
            : now.toLocaleTimeString('en-US', { timeZoneName:'short' }).split(' ').pop();
    }
}
updateDateTime();
setInterval(updateDateTime, 1000);

// ===== DAILY VIDEO ROTATION =====
function getDailyVideos(list, count = 5) {
    if (!list?.length) return [];
    const day   = Math.floor((Date.now() - new Date(2024,0,1)) / 86400000);
    const start = (day * count) % list.length;
    const slice = list.slice(start, start + count);
    return slice.length < count ? [...slice, ...list.slice(0, count - slice.length)] : slice;
}

// ===== FETCH NEWS (with cache) =====
async function fetchNews(category = '', q = 'africa', size = 10) {
    const cKey = `news_${category}_${q}_${size}`;
    const cached = cacheGet(cKey);
    if (cached) return cached;

    const url = `${NEWS_API_BASE}?apikey=${NEWS_API_KEY}&language=en&size=${size}&q=${encodeURIComponent(q)}`
              + (category ? `&category=${category}` : '');
    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (data.status === 'success' && data.results?.length) {
            cacheSet(cKey, data.results);
            return data.results;
        }
        console.warn('NewsData API response:', data);
        return [];
    } catch (err) {
        console.error('Fetch error:', err);
        return [];
    }
}

// ===== FETCH VIDEOS FROM JSON =====
async function fetchVideos(videoFile) {
    if (!videoFile) return [];
    try {
        const res  = await fetch(`data/${videoFile}.json`);
        const data = await res.json();
        if (data.random_bank) {
            const vids = getDailyVideos(data.random_bank, 5);
            return vids.map(v => ({...v, videoCategory: videoFile, isVideo: true}));
        }
        return [];
    } catch (err) {
        console.warn(`Could not load data/${videoFile}.json:`, err);
        return [];
    }
}

// ===== FETCH ALL VIDEOS =====
async function fetchAllVideos() {
    const all = [];
    for (const cat of CATEGORIES) {
        const vids = await fetchVideos(cat.videoFile);
        all.push(...vids);
    }
    return all;
}

// ===== HELPERS =====
function buildArticleUrl(a) {
    return `article.html?${new URLSearchParams({
        url: a.link||'', title: a.title||'', image: a.image_url||'',
        source: a.source_id||'', description: a.description||'',
        pubDate: a.pubDate||'', category: a.category?.[0]||'',
    })}`;
}
function timeAgo(d) {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 60)   return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
}
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80';

function isVideo(item) {
    return item.isVideo === true || (!!item.id && !item.link);
}

// ===== RENDER: FULL NEWS/VIDEO CARD =====
function newsCard(item, delay = 0, extraClass = '') {
    if (!item) return '';
    const video = isVideo(item);
    const img = video 
        ? `https://img.youtube.com/vi/${item.id}/mqdefault.jpg` 
        : (item.image_url || FALLBACK_IMG);
    const url = video ? '#' : buildArticleUrl(item);
    const clickAttr = video ? `onclick="goToWatchPage('${item.id}')"` : '';
    const typeClass = video ? 'video-type' : 'news-type';
    const typeText = video ? '▶ Video' : 'Article';
    const src = video ? (item.source || item.videoCategory || 'Video') : (item.source_id || 'News');
    const t = !video && item.pubDate ? timeAgo(item.pubDate) : '';
    const title = item.title || (video ? 'Video' : 'Untitled');
    const desc = !video && item.description ? item.description.slice(0,90)+'…' : '';

    return `
    <a href="${url}" ${clickAttr} class="news-card ${extraClass} animate-on-scroll" style="text-decoration:none;color:inherit;transition-delay:${delay}s">
        <div class="news-card-img-wrap">
            <img class="news-card-img" src="${img}" alt="" onerror="this.src='${FALLBACK_IMG}'" loading="lazy">
            <span class="card-type-badge ${typeClass}">${typeText}</span>
            ${video ? `<div class="play-overlay"><div class="play-circle"><svg width="12" height="14" viewBox="0 0 12 14" fill="white"><path d="M1 1l10 6-10 6z"/></svg></div></div>` : ''}
        </div>
        <div class="news-card-body">
            <h3>${title}</h3>
            ${desc ? `<p>${desc}</p>` : ''}
            <div class="card-footer"><span class="card-source">${src}</span>${t ? `<span class="card-time">${t}</span>` : ''}</div>
        </div>
    </a>`;
}

// ===== RENDER: SMALL HORIZONTAL CARD (For You) =====
function smallCard(item, delay = 0) {
    if (!item) return '';
    const video = isVideo(item);
    const img = video 
        ? `https://img.youtube.com/vi/${item.id}/mqdefault.jpg` 
        : (item.image_url || FALLBACK_IMG);
    const title = item.title || (video ? 'Video' : 'Untitled');
    const src = video ? (item.source || item.videoCategory || 'Video') : (item.source_id || 'News');
    const href = video ? '#' : buildArticleUrl(item);
    const clickAttr = video ? `onclick="goToWatchPage('${item.id}')"` : '';

    return `
    <a href="${href}" ${clickAttr} class="small-card animate-on-scroll" style="text-decoration:none;color:inherit;transition-delay:${delay}s">
        <div class="small-card-img">
            <img src="${img}" alt="" onerror="this.src='${FALLBACK_IMG}'" loading="lazy">
            ${video ? `<div class="sc-play"><div class="sc-play-circle"><svg width="7" height="9" viewBox="0 0 7 9" fill="white"><path d="M0 0l7 4.5L0 9z"/></svg></div></div>` : ''}
        </div>
        <div class="small-card-body">
            <h4>${title}</h4>
            <span>${src}</span>
            <span class="small-card-type">${video ? '▶ Video' : 'Article'}</span>
        </div>
    </a>`;
}

// ===== RENDER: STRUCTURE 1 =====
// Left tall | Middle 3 stacked | Right tall
function renderStructure1(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    // items[0] = left tall, items[1-3] = middle stacked, items[4] = right tall
    const left = items[0] ? newsCard(items[0], 0) : '';
    const mid = items.slice(1, 4).map((item, i) => newsCard(item, i * 0.07)).join('');
    const right = items[4] ? newsCard(items[4], 0.14) : '';
    
    el.innerHTML = `
        <div class="cat-s1-left">${left}</div>
        <div class="cat-s1-middle">${mid}</div>
        <div class="cat-s1-right">${right}</div>
    `;
}

// ===== RENDER: STRUCTURE 2 =====
// 2 large top | 3 cards bottom
function renderStructure2(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    // items[0-1] = top row, items[2-4] = bottom row
    const top = items.slice(0, 2).map((item, i) => newsCard(item, i * 0.08, 'large')).join('');
    const bottom = items.slice(2, 5).map((item, i) => newsCard(item, i * 0.07)).join('');
    
    el.innerHTML = `
        <div class="cat-s2-top">${top}</div>
        <div class="cat-s2-bottom">${bottom}</div>
    `;
}

// ===== RENDER: STRUCTURE 3 =====
// Left 2 stacked | Centre tall | Right 2 stacked
function renderStructure3(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    // items[0-1] = left, items[2] = centre, items[3-4] = right
    const left = items.slice(0, 2).map((item, i) => newsCard(item, i * 0.07)).join('');
    const centre = items[2] ? newsCard(items[2], 0.14) : '';
    const right = items.slice(3, 5).map((item, i) => newsCard(item, i * 0.07 + 0.21)).join('');
    
    el.innerHTML = `
        <div class="cat-s3-left">${left}</div>
        <div class="cat-s3-centre">${centre}</div>
        <div class="cat-s3-right">${right}</div>
    `;
}

// ===== MIX ARTICLES AND VIDEOS FOR A CATEGORY =====
// Each category needs exactly 5 items, mixed between articles and videos
function mixCategoryContent(articles, videos, maxItems = 5) {
    const mixed = [];
    let aIdx = 0, vIdx = 0;
    
    // Alternate: start with article if available, then video
    for (let i = 0; i < maxItems; i++) {
        if (i % 2 === 0 && aIdx < articles.length) {
            mixed.push(articles[aIdx++]);
        } else if (vIdx < videos.length) {
            mixed.push(videos[vIdx++]);
        } else if (aIdx < articles.length) {
            mixed.push(articles[aIdx++]);
        } else if (vIdx < videos.length) {
            mixed.push(videos[vIdx++]);
        }
    }
    
    return mixed.slice(0, maxItems);
}

// ===== RENDER: TOP STORIES SECTION =====
function renderTopStories(articles, videos) {
    // 2 large cards: article + video
    const largeItems = [
        articles[0] || null,
        videos[0] || articles[1] || null
    ].filter(Boolean);
    topStoriesRow.innerHTML = largeItems.map((item, i) => newsCard(item, i * 0.08, 'large')).join('');
    
    // 3 cards below
    const rowItems = [
        videos[1] || articles[2] || null,
        articles[3] || videos[2] || null,
        videos[3] || articles[4] || null
    ].filter(Boolean);
    topVideosRow.innerHTML = rowItems.slice(0, 3).map((item, i) => newsCard(item, i * 0.07)).join('');
}

// ===== RENDER: FOR YOU SIDEBAR =====
function renderForYou(articles, videos) {
    if (!forYouList) return;
    
    // Take 2 videos + 2 articles, interleaved
    const items = [];
    for (let i = 0; i < 2; i++) {
        if (videos[i]) items.push(videos[i]);
        if (articles[i + 2]) items.push(articles[i + 2]);
    }
    
    forYouList.innerHTML = items.slice(0, 4).map((x, i) => smallCard(x, i * 0.07)).join('');
}

// ===== RENDER: ALL CATEGORY SECTIONS =====
async function renderCategorySections() {
    for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = CATEGORIES[i];
        const template = TEMPLATES[i];
        
        // Fetch articles and videos for this category
        const [articles, videos] = await Promise.all([
            fetchNews(cat.newsCat, cat.newsQ, 5),
            fetchVideos(cat.videoFile)
        ]);
        
        const mixed = mixCategoryContent(articles, videos, 5);
        const layoutId = `cat-${cat.key}-layout`;
        
        if (template === 1) {
            renderStructure1(layoutId, mixed);
        } else if (template === 2) {
            renderStructure2(layoutId, mixed);
        } else if (template === 3) {
            renderStructure3(layoutId, mixed);
        }
    }
}

// ===== SKELETON =====
function showSkeleton() {
    const skeletonCard = `
        <div class="news-card" style="background:transparent;border:none;">
            <div class="skeleton-img" style="aspect-ratio:16/9;border-radius:12px;"></div>
            <div style="padding:12px 0;">
                <div class="skeleton-line" style="width:80%;margin-bottom:8px;"></div>
                <div class="skeleton-line" style="width:50%;"></div>
            </div>
        </div>`;
    
    topStoriesRow.innerHTML = skeletonCard + skeletonCard;
    topVideosRow.innerHTML = skeletonCard + skeletonCard + skeletonCard;
}

// ===== MAIN LOAD =====
async function loadAllContent() {
    loadingEl.classList.add('visible');
    showSkeleton();
    
    // Fetch general news + all videos in parallel
    const [articles, allVideos] = await Promise.all([
        fetchNews('', 'africa latest news today', 10),
        fetchAllVideos()
    ]);
    
    loadingEl.classList.remove('visible');
    
    if (!articles.length) {
        topStoriesRow.innerHTML = `
            <div style="grid-column:1/-1;padding:30px;color:var(--text-grey);text-align:center">
                <p style="font-size:1.1rem;margin-bottom:8px">📡 Live news temporarily unavailable</p>
                <p style="font-size:0.85rem">API limit reached or network issue. Videos still available below.</p>
            </div>`;
    } else {
        renderTopStories(articles, allVideos);
    }
    
    renderForYou(articles, allVideos);
    
    catSections.style.display = 'block';
    topLayout.style.display = 'grid';
    
    // Render categories (each makes its own API call, cached)
    await renderCategorySections();
    
    triggerAnimations();
}

// ===== FILTERED LOAD =====
async function loadFilteredContent(filterKey) {
    const map = CATEGORY_MAP[filterKey] || CATEGORY_MAP.all;
    loadingEl.classList.add('visible');
    showSkeleton();
    
    const [articles, videos] = await Promise.all([
        fetchNews(map.newsCat, map.newsQ, 10),
        map.videoFile ? fetchVideos(map.videoFile) : fetchAllVideos()
    ]);
    
    loadingEl.classList.remove('visible');
    
    catSections.style.display = 'none';
    topLayout.style.display = 'grid';
    
    if (!articles.length) {
        topStoriesRow.innerHTML = `
            <div style="grid-column:1/-1;padding:30px;color:var(--text-grey);text-align:center">
                <p>📡 No articles found for this category right now.</p>
            </div>`;
        topVideosRow.innerHTML = '';
    } else {
        renderTopStories(articles, videos);
    }
    
    renderForYou(articles, videos);
    triggerAnimations();
}

// ===== NAV =====
function goToWatchPage(id) { window.location.href = `watch.html?v=${id}`; }

// ===== FILTER BUTTONS =====
filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const key = this.dataset.filter;
        if (key === 'all') loadAllContent();
        else loadFilteredContent(key);
    });
});

// ===== HAMBURGER =====
hamburger.addEventListener('click', function() {
    navLinks.classList.toggle('open');
    this.classList.toggle('active');
});
navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
}));
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) { navLinks.classList.remove('open'); hamburger.classList.remove('active'); }
});

// ===== SCROLL ANIMATIONS =====
function triggerAnimations() { setTimeout(checkVisibility, 120); }
function checkVisibility() {
    const hero = document.querySelector('.hero-content');
    if (hero) { const r = hero.getBoundingClientRect(); if (r.top < window.innerHeight - 100) hero.classList.add('visible'); }
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight - 40 && r.bottom > 0) el.classList.add('visible');
    });
}
let rafId;
window.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(checkVisibility);
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadAllContent();
    setTimeout(checkVisibility, 600);
});
