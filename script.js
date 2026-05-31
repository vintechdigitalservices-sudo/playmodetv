// ===== CONFIG =====
const NEWS_API_KEY = 'pub_48088daded4b4d86bac3ec31ad15a705';
const NEWS_API_BASE = 'https://newsdata.io/api/1/news';

// Map filter buttons to NewsData.io categories and video JSON categories
const CATEGORY_MAP = {
    all:         { newsCategory: '',             videoCategory: null },
    politics:    { newsCategory: 'politics',     videoCategory: 'politics' },
    finance:     { newsCategory: 'business',     videoCategory: 'finance' },
    business:    { newsCategory: 'business',     videoCategory: 'business' },
    technology:  { newsCategory: 'technology',   videoCategory: 'tech' },
    health:      { newsCategory: 'health',       videoCategory: 'health' },
    environment: { newsCategory: 'environment',  videoCategory: 'weather' },
    science:     { newsCategory: 'science',      videoCategory: 'discovery' },
};

// Video categories (maps to /data/*.json)
const VIDEO_CATEGORIES = ['politics', 'finance', 'business', 'tech', 'health', 'weather', 'discovery'];

// Live stream placeholder data (replace with real stream IDs when available)
const LIVE_STREAMS = [
    { title: 'Africa News Live', channel: 'Broadcast', thumb: 'https://i.ytimg.com/vi/CoMWX2QkDz8/mqdefault.jpg', id: 'CoMWX2QkDz8' },
    { title: 'Business Africa Stream', channel: 'Broadcast', thumb: 'https://i.ytimg.com/vi/86YLFOog4GM/mqdefault.jpg', id: '86YLFOog4GM' },
    { title: 'Politics Daily Live', channel: 'Broadcast', thumb: 'https://i.ytimg.com/vi/1R2-kJeBoGY/mqdefault.jpg', id: '1R2-kJeBoGY' },
];

// ===== DOM REFERENCES =====
const filterBtns    = document.querySelectorAll('.filter-btn');
const hamburger     = document.getElementById('hamburger');
const navLinks      = document.getElementById('navLinks');
const featuredEl    = document.getElementById('featured-story');
const mixedGridEl   = document.getElementById('mixed-grid');
const trendingEl    = document.getElementById('trending-videos');
const liveEl        = document.getElementById('live-streams');
const loadingEl     = document.getElementById('loading-indicator');

// ===== DAILY VIDEO FILTER =====
function getDailyVideos(videoList, count = 5) {
    const now   = new Date();
    const start = new Date(2024, 0, 1);
    const dayIndex = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const startIndex = (dayIndex * count) % videoList.length;
    // Wrap around if near end
    const slice = videoList.slice(startIndex, startIndex + count);
    if (slice.length < count) {
        return [...slice, ...videoList.slice(0, count - slice.length)];
    }
    return slice;
}

// ===== FETCH NEWS =====
async function fetchNews(category = '') {
    let url = `${NEWS_API_BASE}?apikey=${NEWS_API_KEY}&language=en&size=10`;
    if (category) url += `&category=${category}`;
    // Africa-focused
    url += '&q=africa';

    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (data.status === 'success' && data.results?.length) {
            return data.results;
        }
        return [];
    } catch (err) {
        console.error('News API error:', err);
        return [];
    }
}

// ===== FETCH VIDEOS FROM JSON =====
async function fetchVideos(categories) {
    const allVideos = [];
    for (const cat of categories) {
        try {
            const res  = await fetch(`data/${cat}.json`);
            const data = await res.json();
            if (data.random_bank) {
                const daily = getDailyVideos(data.random_bank, 3);
                daily.forEach(v => allVideos.push({ ...v, videoCategory: cat }));
            }
        } catch (err) {
            console.warn(`Could not load ${cat}.json`);
        }
    }
    return allVideos;
}

// ===== BUILD ARTICLE PAGE URL =====
function buildArticleUrl(article) {
    const params = new URLSearchParams({
        url:         article.link        || '',
        title:       article.title       || '',
        image:       article.image_url   || '',
        source:      article.source_id   || '',
        description: article.description || '',
        pubDate:     article.pubDate     || '',
        category:    article.category?.[0] || '',
    });
    return `article.html?${params.toString()}`;
}

// ===== RENDER FEATURED STORY =====
function renderFeatured(article) {
    if (!article) {
        featuredEl.innerHTML = '<p style="padding:20px;color:var(--text-grey)">No featured story available.</p>';
        return;
    }

    const img        = article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
    const title      = article.title || 'Untitled';
    const desc       = article.description ? article.description.slice(0, 160) + '...' : '';
    const source     = article.source_id || 'News';
    const category   = article.category?.[0] || 'News';
    const initials   = source.slice(0, 2).toUpperCase();
    const articleUrl = buildArticleUrl(article);

    featuredEl.innerHTML = `
        <div class="featured-img-wrap" style="cursor:pointer" onclick="window.location.href='${articleUrl}'">
            <img src="${img}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'">
            <div class="source-logo">
                <span>${source}</span>
            </div>
        </div>
        <div class="featured-info">
            <div class="featured-meta">
                <span class="external-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    External article
                </span>
                <span class="featured-category">${category}</span>
            </div>
            <h2 style="cursor:pointer" onclick="window.location.href='${articleUrl}'">${title}</h2>
            <p>${desc}</p>
            <div class="featured-footer">
                <div class="source-info">
                    <div class="source-avatar">${initials}</div>
                    <span class="source-name">${source}</span>
                </div>
                <a href="${articleUrl}" class="btn-read">
                    Read Full Story
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </a>
            </div>
        </div>
    `;
}

// ===== RENDER NEWS CARD =====
function renderNewsCard(article, delay = 0) {
    const img        = article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80';
    const title      = article.title || 'Untitled';
    const desc       = article.description ? article.description.slice(0, 100) + '...' : '';
    const source     = article.source_id || 'News';
    const time       = article.pubDate ? timeAgo(article.pubDate) : '';
    const articleUrl = buildArticleUrl(article);

    return `
        <a href="${articleUrl}" class="news-card animate-on-scroll" style="text-decoration:none;color:inherit;transition-delay:${delay}s">
            <div class="news-card-img-wrap">
                <img class="news-card-img" src="${img}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80'" loading="lazy">
                <span class="card-type-badge news-type">Article</span>
            </div>
            <div class="news-card-body">
                <h3>${title}</h3>
                <p>${desc}</p>
                <div class="card-footer">
                    <span class="card-source">${source}</span>
                    <span class="card-time">${time}</span>
                </div>
            </div>
        </a>
    `;
}

// ===== RENDER VIDEO CARD =====
function renderVideoCard(video, category, delay = 0) {
    const thumb  = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
    const title  = video.title || 'Video';
    const source = video.source || category;

    return `
        <div class="news-card animate-on-scroll" onclick="goToWatchPage('${video.id}')" style="transition-delay:${delay}s;cursor:pointer;">
            <div class="news-card-img-wrap">
                <img class="news-card-img" src="${thumb}" alt="${title}" loading="lazy">
                <span class="card-type-badge video-type">▶ Video</span>
                <div class="play-overlay">
                    <div class="play-circle">
                        <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><path d="M1 1l10 6-10 6z"/></svg>
                    </div>
                </div>
            </div>
            <div class="news-card-body">
                <h3>${title}</h3>
                <p></p>
                <div class="card-footer">
                    <span class="card-source">${source}</span>
                    <span class="card-time">Video</span>
                </div>
            </div>
        </div>
    `;
}

// ===== RENDER SIDEBAR TRENDING =====
function renderTrending(videos) {
    if (!videos.length) {
        trendingEl.innerHTML = '<p style="color:var(--text-grey);font-size:0.85rem">No videos available.</p>';
        return;
    }
    trendingEl.innerHTML = videos.slice(0, 5).map(v => `
        <div class="trending-item" onclick="goToWatchPage('${v.id}')">
            <div class="trending-thumb">
                <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy">
                <div class="mini-play">
                    <div class="mini-play-circle">
                        <svg width="7" height="9" viewBox="0 0 7 9" fill="white"><path d="M0 0l7 4.5L0 9z"/></svg>
                    </div>
                </div>
            </div>
            <div class="trending-info">
                <h4>${v.title}</h4>
                <span>${v.source || v.videoCategory || 'Video'}</span>
            </div>
        </div>
    `).join('');
}

// ===== RENDER LIVE STREAMS =====
function renderLiveStreams() {
    liveEl.innerHTML = LIVE_STREAMS.map((s, i) => `
        <div class="live-stream-item" onclick="goToWatchPage('${s.id}')">
            <div class="live-thumb">
                <img src="${s.thumb}" alt="${s.title}" loading="lazy" onerror="this.style.background='#333'">
            </div>
            <div class="live-info">
                <h4>${s.title}</h4>
                ${i < 2
                    ? `<span class="live-badge"><span class="live-badge-dot"></span>ACTIVE</span>`
                    : `<span class="live-badge" style="background:#555">LIVE</span>`
                }
                <br><span class="broadcast-label">● ${s.channel}</span>
            </div>
        </div>
    `).join('');
}

// ===== MAIN LOAD FUNCTION =====
async function loadContent(filterKey = 'all') {
    const map = CATEGORY_MAP[filterKey] || CATEGORY_MAP.all;

    // Show loading
    loadingEl.classList.add('visible');
    mixedGridEl.innerHTML = '';

    // Reset featured to skeleton
    featuredEl.innerHTML = `
        <div class="featured-skeleton">
            <div class="skeleton-img"></div>
            <div class="skeleton-text">
                <div class="skeleton-line wide"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>`;

    // Fetch news
    const articles = await fetchNews(map.newsCategory);

    // Fetch videos
    const videoCats = map.videoCategory ? [map.videoCategory] : VIDEO_CATEGORIES;
    const videos    = await fetchVideos(videoCats);

    // Hide loading
    loadingEl.classList.remove('visible');

    // Featured = first news article
    renderFeatured(articles[0] || null);

    // Sidebar trending from videos
    renderTrending(videos);

    // Mixed grid: interleave news (skip first/featured) + videos
    const newsItems  = articles.slice(1);  // skip featured
    const mixed      = [];
    const maxLen     = Math.max(newsItems.length, videos.length);

    for (let i = 0; i < maxLen; i++) {
        if (i < newsItems.length) mixed.push({ type: 'news', data: newsItems[i] });
        if (i < videos.length)    mixed.push({ type: 'video', data: videos[i] });
    }

    mixedGridEl.innerHTML = mixed.map((item, idx) => {
        const delay = (idx * 0.06).toFixed(2);
        if (item.type === 'news') {
            return renderNewsCard(item.data, delay);
        } else {
            return renderVideoCard(item.data, item.data.videoCategory, delay);
        }
    }).join('');

    // Trigger animations
    setTimeout(checkVisibility, 100);
}

// ===== NAVIGATION =====
function goToWatchPage(id) {
    window.location.href = `watch.html?v=${id}`;
}

// ===== FILTER BUTTONS =====
filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        loadContent(this.dataset.filter);
    });
});

// ===== HAMBURGER =====
hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    this.classList.toggle('active');
});
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
    });
});

// ===== SCROLL ANIMATIONS =====
function checkVisibility() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const r = heroContent.getBoundingClientRect();
        if (r.top < window.innerHeight - 100) heroContent.classList.add('visible');
    }
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight - 50 && r.bottom > 0) {
            el.classList.add('visible');
        }
    });
}

let rafId;
window.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(checkVisibility);
});
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
    }
});

// ===== TIME AGO HELPER =====
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 60)    return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)     return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    renderLiveStreams();
    loadContent('all');
    setTimeout(checkVisibility, 500);
});
