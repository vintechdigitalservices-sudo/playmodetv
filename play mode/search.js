// ===== SEARCH ENGINE LIVE PARSING CONTROLLER =====
document.addEventListener('DOMContentLoaded', () => {
    // ACTIVE SYSTEM CREDENTIALS MATRIX
    const YOUTUBE_API_KEY = "AIzaSyDj2tm3W9wHxhtJfirc5E2L4lUw85Gi2sM";
    const NEWSDATA_API_KEY = "pub_48088daded4b4d86bac3ec31ad15a705";
    
    // UI Selectors
    const metaInfo = document.getElementById('searchMetaInfo');
    const loadingState = document.getElementById('searchLoadingState');
    const errorDisplay = document.getElementById('searchErrorDisplay');
    const videoGrid = document.getElementById('videoResultsGrid');
    const articleGrid = document.getElementById('articleResultsGrid');

    // Extract Query via URL Parameter Structure
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query || query.trim() === "") {
        metaInfo.textContent = "No query provided. Use the header search bar above.";
    } else {
        const cleanQuery = query.trim();
        metaInfo.textContent = `Showing verified multi-media distribution results matching: "${cleanQuery}"`;
        
        // Trigger Query Execution Engine
        executeUnifiedSearch(cleanQuery);
    }

    // ===== SEARCH FUNCTIONALITY FOR HEADER =====
    initSearchFunctionality();

    async function executeUnifiedSearch(searchTerm) {
        // Clear old grids and show loading state
        videoGrid.innerHTML = '';
        articleGrid.innerHTML = '';
        loadingState.style.display = 'block';
        errorDisplay.style.display = 'none';

        try {
            // Execute parallel network lookups using Promise.all to save crucial processing time
            const [videoData, articleData] = await Promise.all([
                fetchYouTubeVideos(searchTerm),
                fetchNewsArticles(searchTerm)
            ]);

            renderVideos(videoData);
            renderArticles(articleData);
        } catch (error) {
            console.error("Search Pipeline Exception:", error);
            errorDisplay.textContent = "A pipeline communication timeout occurred while fetching remote assets. Please check your credentials or API limits.";
            errorDisplay.style.display = 'block';
        } finally {
            loadingState.style.display = 'none';
        }
    }

    // Live Query Fetch Layer: YouTube Data Feed
    async function fetchYouTubeVideos(term) {
        if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes("YOUR_")) return [];
        
        // Restricts retrieval size down to 2 items to strictly conserve global data call quotas
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(term)}&maxResults=2&type=video&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("YouTube API Error");
        const data = await response.json();
        return data.items || [];
    }

    // Live Query Fetch Layer: NewsData.io News Feed
    async function fetchNewsArticles(term) {
        if (!NEWSDATA_API_KEY || NEWSDATA_API_KEY.includes("YOUR_")) return [];
        
        // Hardcaps data load parameters down to 3 articles, filtering for English matches
        const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(term)}&size=3&language=en`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("NewsData API Error");
        const data = await response.json();
        return data.results || [];
    }

    // Render Engine: Append Video Cards to Grid
    function renderVideos(videos) {
        if (!videos || videos.length === 0) {
            videoGrid.innerHTML = `<p style="color: var(--text-grey); grid-column: 1/-1;">No targeted broadcast video coverage found for this topic.</p>`;
            return;
        }

        videos.forEach(video => {
            const videoId = video.id.videoId;
            const title = video.snippet.title;
            const thumbnail = video.snippet.thumbnails.high.url;
            const channelTitle = video.snippet.channelTitle;

            const card = document.createElement('div');
            card.className = 'coverage-card animate-on-scroll visible';
            card.innerHTML = `
                <div class="about-image" style="margin-bottom:15px;">
                    <img src="${thumbnail}" alt="${title}" style="aspect-ratio: 16/9; object-fit: cover;">
                </div>
                <h3>${title}</h3>
                <p style="margin-bottom:15px; font-weight:600; color:var(--primary-red); font-size:0.75rem;">${channelTitle}</p>
                <a href="watch.html?v=${videoId}" class="btn-red" style="display:inline-block; font-size:0.8rem; padding:8px 16px;">Watch Video &rarr;</a>
            `;
            videoGrid.appendChild(card);
        });
    }

    // Render Engine: Append News Cards to Grid
    function renderArticles(articles) {
        if (!articles || articles.length === 0) {
            articleGrid.innerHTML = `<p style="color: var(--text-grey); grid-column: 1/-1;">No localized journalism briefings found matching this headline.</p>`;
            return;
        }

        articles.forEach((article, index) => {
            const title = article.title;
            const summary = article.description ? article.description.slice(0, 150) + '...' : "No content brief provided by publisher resource.";
            const source = article.source_id || "Global News Feed";
            // Uses unique base64/timestamp string generation to pass clean lookups to article.html
            const secureId = btoa(encodeURIComponent(title)).replace(/=/g, '').slice(0, 12);

            const card = document.createElement('div');
            card.className = 'coverage-card animate-on-scroll visible';
            card.innerHTML = `
                <div class="card-icon" style="font-size:1.2rem; margin-bottom:10px; color:var(--primary-red);">📰 ${source.toUpperCase()}</div>
                <h3>${title}</h3>
                <p style="margin-bottom:15px;">${summary}</p>
                <a href="article.html?id=${secureId}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}&link=${encodeURIComponent(article.link || '')}" class="btn-outline" style="display:inline-block; font-size:0.8rem; padding:8px 16px;">Read Summary &rarr;</a>
            `;
            articleGrid.appendChild(card);
        });
    }

    // ===== SEARCH FUNCTIONALITY (INTEGRATED) =====
    function initSearchFunctionality() {
        const searchIcon = document.getElementById('headerSearchIcon');
        const searchOverlay = document.getElementById('customSearchOverlay');
        const searchClose = document.getElementById('customSearchClose');
        const searchForm = document.getElementById('customSearchForm');
        const searchInput = document.getElementById('customSearchInput');

        if (searchIcon && searchOverlay && searchClose && searchForm && searchInput) {
            searchIcon.addEventListener('click', function(e) {
                e.preventDefault();
                searchOverlay.classList.add('active');
                searchInput.focus();
            });

            searchClose.addEventListener('click', function() {
                searchOverlay.classList.remove('active');
                searchInput.value = '';
            });

            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const searchQuery = searchInput.value;
                if (searchQuery && searchQuery.trim() !== "") {
                    window.location.href = `search.html?q=${encodeURIComponent(searchQuery.trim())}`;
                }
            });

            // Close search overlay on Escape key down
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                    searchOverlay.classList.remove('active');
                    searchInput.value = '';
                }
            });
        }
    }
});