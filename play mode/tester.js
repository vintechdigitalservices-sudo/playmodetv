// ===== DOM ELEMENTS =====
const filterBtns = document.querySelectorAll('.filter-btn');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

// New: List of categories to fetch from /data folder
const categories = ['politics', 'finance', 'business', 'tech', 'health', 'weather', 'discovery'];

// ===== RENDER VIDEOS FROM JSON =====
async function displayVideos(filter = 'all') {
    const sections = document.querySelectorAll('.video-section');
    
    for (let section of sections) {
        const grid = section.querySelector('.video-grid');
        const category = grid.dataset.category;
        
        // Determine if this section should be shown
        if (filter === 'all' || filter === category) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
            continue; // Skip fetching if section is hidden
        }
        
        try {
            // Fetch the specific JSON file from /data folder
            const response = await fetch(`data/${category}.json`);
            const data = await response.json();
            const videoList = data.random_bank;
            
            grid.innerHTML = '';
            
            videoList.forEach((video, index) => {
                const thumbUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
                
                // Using your original video-card HTML structure and classes
                const card = `
                    <div class="video-card animate-on-scroll" onclick="goToWatchPage('${video.id}')" style="transition-delay: ${index * 0.1}s">
                        <img src="${thumbUrl}" alt="${video.title}" loading="lazy">
                        <div class="card-info">
                            <h3>${video.title}</h3>
                            <span class="category-badge">${video.source || category}</span>
                        </div>
                    </div>
                `;
                grid.innerHTML += card;
            });
        } catch (error) {
            console.error(`Error loading category ${category}:`, error);
        }
    }
    // Re-trigger visibility check after content loads
    setTimeout(checkVisibility, 200);
}

// ===== NAVIGATION =====
function goToWatchPage(id) {
    window.location.href = `watch.html?v=${id}`;
}

// ===== FILTER LOGIC =====
filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        displayVideos(this.dataset.filter);
    });
});

// ===== HAMBURGER MENU =====
hamburger.addEventListener('click', function() {
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
    const elements = document.querySelectorAll('.animate-on-scroll');
    const heroContent = document.querySelector('.hero-content');
    
    if (heroContent) {
        const heroRect = heroContent.getBoundingClientRect();
        if (heroRect.top < window.innerHeight - 100) {
            heroContent.classList.add('visible');
        }
    }
    
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 50 && rect.bottom > 0;
        if (isVisible) {
            el.classList.add('visible');
        } else {
            el.classList.remove('visible');
        }
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    displayVideos();
});

// Listen for scroll events
let scrollTimeout;
window.addEventListener('scroll', function() {
    if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(function() {
        checkVisibility();
    });
});

// Resize check
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
    }
});
