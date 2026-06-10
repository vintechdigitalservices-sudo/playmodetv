// ===== BLOG DATA =====
const blogPosts = [
    {
        id: 'live-streaming-sports-africa',
        title: 'How Live Streaming Is Changing Sports Broadcasting Across Africa',
        excerpt: 'Discover how live streaming technology is revolutionizing sports broadcasting across the African continent, bringing local games to global audiences.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
        date: 'June 5, 2026',
        author: 'Play Mode Africa',
        category: 'Sports Media',
        readTime: '5 min read'
    },
    {
        id: 'future-podcasting-africa',
        title: 'The Future of Podcasting in Africa: Opportunities for Creators and Businesses',
        excerpt: 'Explore the booming podcasting landscape in Africa and learn how creators and businesses can capitalize on this growing medium.',
        image: 'https://images.unsplash.com/photo-1573152143626-6b7c5e6b4e8f?auto=format&fit=crop&q=80&w=800',
        date: 'June 3, 2026',
        author: 'Play Mode Africa',
        category: 'Podcasting',
        readTime: '6 min read'
    },
    {
        id: 'video-marketing-african-business',
        title: 'Why Every African Business Should Use Video Marketing in 2026',
        excerpt: 'Video marketing is no longer optional. Here\'s why African businesses need to embrace video content to stay competitive in 2026.',
        image: 'https://images.unsplash.com/photo-1534009040890-a446a9c5b4a8?auto=format&fit=crop&q=80&w=800',
        date: 'June 1, 2026',
        author: 'Play Mode Africa',
        category: 'Business',
        readTime: '4 min read'
    },
    {
        id: 'young-africans-digital-media',
        title: 'How Young Africans Are Making Money Through Digital Media and Content Creation',
        excerpt: 'From YouTube to TikTok, young Africans are building careers in digital media. Learn the strategies and platforms driving this economic revolution.',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
        date: 'May 28, 2026',
        author: 'Play Mode Africa',
        category: 'Content Creation',
        readTime: '7 min read'
    },
    {
        id: 'video-marketing-african-business-2',
        title: 'Why Every African Business Should Use Video Marketing in 2026',
        excerpt: 'Video marketing is transforming how African businesses connect with customers. Discover the strategies that will define success in 2026.',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
        date: 'May 25, 2026',
        author: 'Play Mode Africa',
        category: 'Marketing',
        readTime: '5 min read'
    }
];

// ===== RENDER BLOG GRID =====
function renderBlogGrid() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    grid.innerHTML = blogPosts.map((post, index) => `
        <article class="blog-card" style="animation: fadeIn 0.6s ease ${index * 0.1}s both;">
            <div class="blog-card-image">
                <img src="${post.image}" alt="${post.title}" loading="lazy">
                <span class="blog-category">${post.category}</span>
            </div>
            <div class="blog-card-content">
                <div class="blog-meta">
                    <span class="blog-date"><i class="fa-regular fa-calendar"></i> ${post.date}</span>
                    <span class="blog-read-time"><i class="fa-regular fa-clock"></i> ${post.readTime}</span>
                </div>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt}</p>
                <div class="blog-footer">
                    <span class="blog-author">By ${post.author}</span>
                    <a href="blog-post.html?id=${post.id}" class="blog-read-more">
                        Read More
                        <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ===== NAV =====
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('open');
            this.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('active');
        }));
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks) {
            navLinks.classList.remove('open');
            if (hamburger) hamburger.classList.remove('active');
        }
    });

    renderBlogGrid();
});