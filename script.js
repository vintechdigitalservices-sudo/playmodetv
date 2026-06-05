// ===== CONFIG =====
const NEWS_API_KEY  = 'pub_48088daded4b4d86bac3ec31ad15a705';
const NEWS_API_BASE = 'https://newsdata.io/api/1/news';

// CACHE: 30-minute TTL in sessionStorage
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

// ===== CATEGORY DEFINITIONS (ordered as shown on page) =====
// Template cycles: 1→2→3→1→2→3→1→2
const CATEGORIES = [
    { key: 'business',    label: '💼 Business',   emoji: '💼', newsCategory: 'business',    q: 'africa business trade investment',     jsonFile: 'business.json'  },
    { key: 'discovery',   label: '✨ Discovery',   emoji: '✨', newsCategory: 'science',     q: 'africa science discovery research',    jsonFile: 'discovery.json' },
    { key: 'finance',     label: '📈 Finance',     emoji: '📈', newsCategory: 'business',    q: 'africa economy finance markets',       jsonFile: 'finance.json'   },
    { key: 'health',      label: '🏥 Health',      emoji: '🏥', newsCategory: 'health',      q: 'africa health disease medicine',       jsonFile: 'health.json'    },
    { key: 'politics',    label: '⚖️ Politics',    emoji: '⚖️', newsCategory: 'politics',    q: 'africa politics government elections', jsonFile: 'politics.json'  },
    { key: 'sports',      label: '⚽ Sports',      emoji: '⚽', newsCategory: 'sports',      q: 'africa sport football champions',      jsonFile: 'sports.json'    },
    { key: 'technology',  label: '🚀 Tech',        emoji: '🚀', newsCategory: 'technology',  q: 'africa technology AI innovation',      jsonFile: 'tech.json'      },
    { key: 'environment', label: '🌤️ Weather',     emoji: '🌤️', newsCategory: 'environment', q: 'africa climate weather flood',         jsonFile: 'weather.json'   },
];

// Template cycle (1-indexed, repeating 1→2→3)
const TEMPLATES = ['t1', 't2', 't3', 't1', 't2', 't3', 't1', 't2'];

// ===== DOM REFS =====
const filterBtns     = document.querySelectorAll('.filter-btn');
const hamburger      = document.getElementById('hamburger');
const navLinks       = document.getElementById('navLinks');
const featuredEl     = document.getElementById('featured-story');
const topVideosRow   = document.getElementById('top-videos-row');
const forYouList     = document.getElementById('for-you-list');
const loadingEl      = document.getElementById('loading-indicator');
const catSectionsEl  = document.getElementById('category-sections');
const topLayout      = document.getElementById('top-stories-layout');

// ===== 3D GLOBE CANVAS =====
(function initGlobe() {
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = W / 2 - 1;
    let angle = 0;

    // Simple land-mass dots approximation using lat/lon
    const landDots = [];
    for (let lat = -80; lat <= 80; lat += 12) {
        for (let lon = -180; lon <= 180; lon += 14) {
            // Rough land mask (Africa, Eurasia, Americas)
            const isLand = (
                (lon > -20 && lon < 55 && lat > -35 && lat < 38) || // Africa
                (lon > -15 && lon < 180 && lat > 35 && lat < 72) || // Eurasia
                (lon > -170 && lon < -50 && lat > 10 && lat < 72) || // N.America
                (lon > -85 && lon < -34 && lat > -60 && lat < 12)  || // S.America
                (lon > 110 && lon < 155 && lat > -45 && lat < -10)   // Australia
            );
            if (isLand) landDots.push({ lat: lat * Math.PI / 180, lon: lon * Math.PI / 180 });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // Globe sphere gradient
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        grad.addColorStop(0, '#1e5fa8');
        grad.addColorStop(0.5, '#0d3d6e');
        grad.addColorStop(1, '#071d36');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // Draw land dots
        landDots.forEach(({ lat, lon }) => {
            const rotLon = lon + angle;
            const x3 = Math.cos(lat) * Math.cos(rotLon);
            const z3 = Math.cos(lat) * Math.sin(rotLon);
            const y3 = Math.sin(lat);
            if (z3 < 0) return; // back side hidden
            const sx = cx + x3 * r;
            const sy = cy - y3 * r;
            const brightness = 0.4 + 0.6 * z3;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(34,197,94,${brightness})`;
            ctx.fill();
        });

        // Grid lines (latitude)
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 0.5;
        for (let lat = -60; lat <= 60; lat += 30) {
            const latR = lat * Math.PI / 180;
            const ry = Math.cos(latR) * r;
            const py = cy - Math.sin(latR) * r;
            ctx.beginPath();
            ctx.ellipse(cx, py, ry, ry * 0.2, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // Specular highlight
        const shine = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.2, cy - r * 0.2, r * 0.55);
        shine.addColorStop(0, 'rgba(255,255,255,0.18)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = shine;
        ctx.fill();

        angle += 0.012;
        requestAnimationFrame(draw);
    }
    draw();
})();

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
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        tzEl.textContent = (tz.includes('Lagos') || tz.includes('Africa/Lagos'))
            ? 'WAT'
            : now.toLocaleTimeString('en-US', { timeZoneName:'short' }).split(' ').pop();
    }
}
updateDateTime();
setInterval(updateDateTime, 1000);

// ===== DAILY VIDEO ROTATION =====
function getDailyVideos(list, count) {
    if (!list?.length) return [];
    const day = Math.floor((Date.now() - new Date(2024,0,1)) / 86400000);
    const start = (day * count) % list.length;
    const slice = list.slice(start, start + count);
    return slice.length < count ? [...slice, ...list.slice(0, count - slice.length)] : slice;
}

// ===== FETCH NEWS (cached) =====
async function fetchNews(category, q, size = 10) {
    const cKey = `news_${category}_${q}`;
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
        console.warn('NewsData API:', data);
        return [];
    } catch (err) {
        console.error('Fetch error:', err);
        return [];
    }
}

// ===== FETCH VIDEOS FROM JSON FILE =====
async function fetchVideosFromJson(jsonFile, count = 5) {
    const cKey = `vid_${jsonFile}`;
    const cached = cacheGet(cKey);
    if (cached) return getDailyVideos(cached, count);
    try {
        const res  = await fetch(`data/${jsonFile}`);
        const data = await res.json();
        const bank = data.random_bank || data.videos || data || [];
        cacheSet(cKey, bank);
        return getDailyVideos(bank, count);
    } catch {
        return [];
    }
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
const FALLBACK_BIG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80';

// ===== RENDER: FULL NEWS CARD =====
function newsCard(a, delay = 0, tall = false) {
    if (!a) return '';
    const img  = a.image_url || FALLBACK_IMG;
    const url  = buildArticleUrl(a);
    const src  = a.source_id || 'News';
    const t    = a.pubDate ? timeAgo(a.pubDate) : '';
    const tallClass = tall ? ' tall' : '';
    return `
    <a href="${url}" class="news-card${tallClass} animate-on-scroll" style="text-decoration:none;color:inherit;transition-delay:${delay}s">
        <div class="news-card-img-wrap">
            <img class="news-card-img" src="${img}" alt="" onerror="this.src='${FALLBACK_IMG}'" loading="lazy">
            <span class="card-type-badge news-type">Article</span>
        </div>
        <div class="news-card-body">
            <h3>${a.title||'Untitled'}</h3>
            <p>${a.description ? a.description.slice(0,100)+'…' : ''}</p>
            <div class="card-footer"><span class="card-source">${src}</span><span class="card-time">${t}</span></div>
        </div>
    </a>`;
}

// ===== RENDER: FULL VIDEO CARD =====
function videoCard(v, delay = 0, tall = false) {
    if (!v) return '';
    const thumb = `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`;
    const tallClass = tall ? ' tall' : '';
    return `
    <div class="news-card${tallClass} animate-on-scroll" onclick="goToWatchPage('${v.id}')" style="cursor:pointer;transition-delay:${delay}s">
        <div class="news-card-img-wrap">
            <img class="news-card-img" src="${thumb}" alt="" loading="lazy">
            <span class="card-type-badge video-type">▶ Video</span>
            <div class="play-overlay"><div class="play-circle"><svg width="12" height="14" viewBox="0 0 12 14" fill="white"><path d="M1 1l10 6-10 6z"/></svg></div></div>
        </div>
        <div class="news-card-body">
            <h3>${v.title||'Video'}</h3>
            <div class="card-footer"><span class="card-source">${v.source||'Video'}</span><span class="card-time">Video</span></div>
        </div>
    </div>`;
}

// ===== RENDER: SMALL HORIZONTAL CARD =====
function smallCard(item, delay = 0) {
    if (!item) return '';
    const isVideo = !!item.id && !item.link;
    const img   = isVideo ? `https://img.youtube.com/vi/${item.id}/mqdefault.jpg` : (item.image_url || FALLBACK_IMG);
    const title = item.title || (isVideo ? 'Video' : 'Untitled');
    const src   = isVideo ? (item.source||'Video') : (item.source_id||'News');
    const href  = isVideo ? '#' : buildArticleUrl(item);
    const clickAttr = isVideo ? `onclick="event.preventDefault();goToWatchPage('${item.id}')"` : '';
    return `
    <a href="${href}" ${clickAttr} class="small-card animate-on-scroll" style="text-decoration:none;color:inherit;transition-delay:${delay}s">
        <div class="small-card-img">
            <img src="${img}" alt="" onerror="this.src='${FALLBACK_IMG}'" loading="lazy">
            ${isVideo ? `<div class="sc-play"><div class="sc-play-circle"><svg width="7" height="9" viewBox="0 0 7 9" fill="white"><path d="M0 0l7 4.5L0 9z"/></svg></div></div>` : ''}
        </div>
        <div class="small-card-body">
            <h4>${title}</h4>
            <span class="sc-source">${src}</span>
            <span class="small-card-type">${isVideo ? '▶ Video' : 'Article'}</span>
        </div>
    </a>`;
}

// ===== RENDER: MAIN FEATURED STORY =====
function renderFeatured(a) {
    if (!a) {
        featuredEl.innerHTML = '<p style="padding:20px;color:var(--text-grey)">No featured story available right now.</p>';
        return;
    }
    const img  = a.image_url || FALLBACK_BIG;
    const url  = buildArticleUrl(a);
    const src  = a.source_id || 'News';
    const cat  = a.category?.[0] || 'News';
    const init = src.slice(0,2).toUpperCase();
    const desc = a.description ? a.description.slice(0,160)+'…' : '';
    featuredEl.innerHTML = `
        <div class="featured-img-wrap" style="cursor:pointer" onclick="window.location.href='${url}'">
            <img src="${img}" alt="" onerror="this.src='${FALLBACK_BIG}'">
            <div class="source-logo"><span>${src}</span></div>
        </div>
        <div class="featured-info">
            <div class="featured-meta">
                <span class="external-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    External article
                </span>
                <span class="featured-category">${cat}</span>
            </div>
            <h2 style="cursor:pointer" onclick="window.location.href='${url}'">${a.title||'Untitled'}</h2>
            <p>${desc}</p>
            <div class="featured-footer">
                <div class="source-info">
                    <div class="source-avatar">${init}</div>
                    <span class="source-name">${src}</span>
                </div>
                <a href="${url}" class="btn-read">
                    Read Full Story
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </a>
            </div>
        </div>`;
}

// ===== RENDER: FOR YOU SIDEBAR =====
function renderForYou(articles, videos) {
    if (!forYouList) return;
    const items = [];
    // 4 items: alternating video + article
    const picks = [articles[2], articles[5]].filter(Boolean);
    const vidPicks = videos.slice(0, 2);
    for (let i = 0; i < 2; i++) {
        if (vidPicks[i]) items.push(vidPicks[i]);
        if (picks[i])    items.push(picks[i]);
    }
    forYouList.innerHTML = items.slice(0,4).map((x,i) => smallCard(x, i*0.07)).join('');
}

// ===== RENDER: TOP VIDEOS ROW =====
function renderTopVideosRow(videos) {
    topVideosRow.innerHTML = videos.slice(0,3).map((v,i) => videoCard(v, i*0.08)).join('');
}

/*
 * CATEGORY SECTION TEMPLATES
 * Each category gets exactly 5 content items (mix of articles + videos)
 *
 * Template t1: 3-col grid
 *   Left  (1 tall card)  | Centre (3 stacked small cards) | Right (1 tall card)
 *   items[0]=left, items[1..3]=centre small, items[4]=right
 *
 * Template t2: 2-row grid
 *   Top: 2 wide cards side-by-side
 *   Bottom: 3 cards in a row
 *   items[0,1]=top, items[2,3,4]=bottom
 *
 * Template t3: 3-col grid
 *   Left (2 stacked) | Centre (1 tall) | Right (2 stacked)
 *   items[0,1]=left, items[2]=centre, items[3,4]=right
 */

function buildT1(items, catKey) {
    // items: array of 5 (mix articles/videos)
    const [i0, i1, i2, i3, i4] = items;
    return `
    <div class="cat-t1-grid">
        <div class="cat-t1-left">${renderItem(i0, 0, true)}</div>
        <div class="cat-t1-centre">
            ${smallCard(i1, 0.05)}
            ${smallCard(i2, 0.1)}
            ${smallCard(i3, 0.15)}
        </div>
        <div class="cat-t1-right">${renderItem(i4, 0.1, true)}</div>
    </div>`;
}

function buildT2(items, catKey) {
    const [i0, i1, i2, i3, i4] = items;
    return `
    <div class="cat-t2-top">
        ${renderItem(i0, 0)}
        ${renderItem(i1, 0.08)}
    </div>
    <div class="cat-t2-bottom">
        ${renderItem(i2, 0)}
        ${renderItem(i3, 0.07)}
        ${renderItem(i4, 0.14)}
    </div>`;
}

function buildT3(items, catKey) {
    const [i0, i1, i2, i3, i4] = items;
    return `
    <div class="cat-t3-grid">
        <div class="cat-t3-left">
            ${renderItem(i0, 0)}
            ${renderItem(i1, 0.07)}
        </div>
        <div class="cat-t3-centre">${renderItem(i2, 0.05, true)}</div>
        <div class="cat-t3-right">
            ${renderItem(i3, 0.1)}
            ${renderItem(i4, 0.15)}
        </div>
    </div>`;
}

// Renders an item as either newsCard or videoCard
function renderItem(item, delay = 0, tall = false) {
    if (!item) return '';
    const isVideo = !!item.id && !item.link;
    return isVideo ? videoCard(item, delay, tall) : newsCard(item, delay, tall);
}

// Mix articles + videos into 5 slots: prefer videos first, fill rest with articles
function mixItems(articles, videos) {
    // We want a good mix: ~2-3 videos, rest articles
    const mixed = [];
    let ai = 0, vi = 0;
    for (let i = 0; i < 5; i++) {
        // Place video at positions 0, 2, 4 if available, else article
        if ((i === 0 || i === 2 || i === 4) && vi < videos.length) {
            mixed.push(videos[vi++]);
        } else if (ai < articles.length) {
            mixed.push(articles[ai++]);
        } else if (vi < videos.length) {
            mixed.push(videos[vi++]);
        }
    }
    return mixed;
}

// ===== RENDER ALL CATEGORY SECTIONS =====
async function renderAllCategorySections(generalArticles) {
    catSectionsEl.innerHTML = ''; // clear

    for (let idx = 0; idx < CATEGORIES.length; idx++) {
        const cat      = CATEGORIES[idx];
        const template = TEMPLATES[idx]; // 't1','t2','t3' cycling

        // Fetch videos from JSON; articles from general pool offset
        const videosPromise  = fetchVideosFromJson(cat.jsonFile, 5);
        const articlesSlice  = generalArticles.slice(idx * 2, idx * 2 + 3); // 2-3 articles per cat from pool

        const videos   = await videosPromise;
        const items    = mixItems(articlesSlice, videos);

        // Build section HTML
        let innerHtml = '';
        if (template === 't1') innerHtml = buildT1(items, cat.key);
        if (template === 't2') innerHtml = buildT2(items, cat.key);
        if (template === 't3') innerHtml = buildT3(items, cat.key);

        const section = document.createElement('section');
        section.className = 'cat-section';
        section.id = `cat-${cat.key}`;
        section.dataset.template = template;
        section.innerHTML = `
            <div class="cat-header">
                <h2 class="cat-title">${cat.label}</h2>
                <span class="cat-view-all">View All →</span>
            </div>
            ${innerHtml}`;
        catSectionsEl.appendChild(section);
    }
}

// ===== RENDER FILTERED CATEGORY SECTIONS =====
async function renderFilteredCategory(filterKey) {
    const cat = CATEGORIES.find(c => c.key === filterKey || 
        (filterKey === 'science' && c.key === 'discovery') ||
        (filterKey === 'environment' && c.key === 'environment') ||
        (filterKey === 'technology' && c.key === 'technology'));
    
    if (!cat) return;

    catSectionsEl.innerHTML = '';
    const [articles, videos] = await Promise.all([
        fetchNews(cat.newsCategory, cat.q, 10),
        fetchVideosFromJson(cat.jsonFile, 5),
    ]);

    // Show more content when filtered: show 3 template blocks
    for (let pass = 0; pass < 3; pass++) {
        const artSlice = articles.slice(pass * 3, pass * 3 + 3);
        const vidSlice = videos.slice(pass % 2 === 0 ? 0 : 2, (pass % 2 === 0 ? 0 : 2) + 3);
        const items    = mixItems(artSlice, vidSlice.length ? vidSlice : videos);
        const template = TEMPLATES[pass];

        let innerHtml = '';
        if (template === 't1') innerHtml = buildT1(items, cat.key);
        if (template === 't2') innerHtml = buildT2(items, cat.key);
        if (template === 't3') innerHtml = buildT3(items, cat.key);

        const section = document.createElement('section');
        section.className = 'cat-section';
        section.innerHTML = `
            <div class="cat-header">
                <h2 class="cat-title">${cat.label}</h2>
            </div>
            ${innerHtml}`;
        catSectionsEl.appendChild(section);
    }
}

// ===== SKELETON =====
function showSkeleton() {
    featuredEl.innerHTML = `
        <div class="featured-skeleton">
            <div class="skeleton-img"></div>
            <div class="skeleton-text">
                <div class="skeleton-line wide"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>`;
    topVideosRow.innerHTML  = '';
}

// ===== MAIN LOAD =====
async function loadAllContent() {
    loadingEl.classList.add('visible');
    showSkeleton();

    // Fetch general Africa news + general videos for top section
    const [articles, generalVideos] = await Promise.all([
        fetchNews('', 'africa latest news today', 10),
        fetchVideosFromJson('sports.json', 3),
    ]);

    loadingEl.classList.remove('visible');

    if (!articles.length) {
        featuredEl.innerHTML = `
            <div style="padding:30px;color:var(--text-grey);text-align:center">
                <p style="font-size:1.1rem;margin-bottom:8px">📡 Live news temporarily unavailable</p>
                <p style="font-size:0.85rem">API limit reached or network issue. Videos still available below.</p>
            </div>`;
    } else {
        renderFeatured(articles[0]);
    }

    renderTopVideosRow(generalVideos);
    renderForYou(articles, generalVideos);

    // Render all category sections (async, fetches videos per cat)
    await renderAllCategorySections(articles);

    triggerAnimations();
}

// ===== FILTERED LOAD =====
async function loadFilteredContent(filterKey) {
    loadingEl.classList.add('visible');
    showSkeleton();

    // Map filter keys to category keys
    const keyMap = {
        sports: 'sports', politics: 'politics', finance: 'finance',
        business: 'business', technology: 'technology', health: 'health',
        environment: 'environment', science: 'discovery',
    };
    const catKey = keyMap[filterKey] || filterKey;
    const cat    = CATEGORIES.find(c => c.key === catKey);
    if (!cat) { loadingEl.classList.remove('visible'); return; }

    const [articles, videos] = await Promise.all([
        fetchNews(cat.newsCategory, cat.q, 10),
        fetchVideosFromJson(cat.jsonFile, 5),
    ]);

    loadingEl.classList.remove('visible');

    if (!articles.length) {
        featuredEl.innerHTML = `<div style="padding:30px;color:var(--text-grey);text-align:center"><p>📡 No articles found for this category right now.</p></div>`;
    } else {
        renderFeatured(articles[0]);
    }

    // Top 3 videos row
    renderTopVideosRow(videos.slice(0,3));
    renderForYou(articles, videos);

    // Category sections: 2 blocks of filtered content
    catSectionsEl.innerHTML = '';
    for (let pass = 0; pass < 2; pass++) {
        const artSlice = articles.slice(pass * 3, pass * 3 + 3);
        const vidSlice = getDailyVideos(videos, 3);
        const items    = mixItems(artSlice, vidSlice);
        const template = TEMPLATES[pass];

        let innerHtml = '';
        if (template === 't1') innerHtml = buildT1(items, cat.key);
        if (template === 't2') innerHtml = buildT2(items, cat.key);

        const section = document.createElement('section');
        section.className = 'cat-section';
        section.innerHTML = `
            <div class="cat-header">
                <h2 class="cat-title">${cat.label}</h2>
            </div>
            ${innerHtml}`;
        catSectionsEl.appendChild(section);
    }

    triggerAnimations();
}

// ===== WATCH PAGE NAV =====
function goToWatchPage(id) { window.location.href = `watch.html?v=${id}`; }

// ===== FILTER BUTTONS =====
filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const key = this.dataset.filter;
        if (key === 'all') loadAllContent();
        else loadFilteredContent(key);
    });
});

// ===== HAMBURGER =====
hamburger.addEventListener('click', function () {
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
}, { passive: true });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadAllContent();
    setTimeout(checkVisibility, 600);
});
