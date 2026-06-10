// ===== ARCHITECTURE VIEW SYSTEM ENGINE =====
document.addEventListener('DOMContentLoaded', () => {
    initViewRouter();
    initDateTimeTracker();
    initMiniGlobeCanvas();
    initMobileHamburgerMenu();
    initScrollViewportAnimations();
    checkForUrlHashParameters();
    initLogoAnim();
    initSearchFunctionality();
});

// ROUTING MATRIX: Switch perspectives without buying extra domains or hosting
function initViewRouter() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const viewWrappers = document.querySelectorAll('.about-view-wrapper');
    const switchSgBtns = document.querySelectorAll('.switch-to-sg');
    const switchSgPure = document.querySelectorAll('.switch-to-sg-pure');
    const switchPmaPure = document.querySelectorAll('.switch-to-pma-pure');

    function switchView(targetViewId) {
        // Deactivate all views
        viewWrappers.forEach(view => view.classList.remove('active'));
        tabButtons.forEach(btn => btn.classList.remove('active'));

        // Target target DOM view array
        const selectedView = document.getElementById(targetViewId);
        if (selectedView) {
            selectedView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Keep active navigation states accurate
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetViewId) {
                btn.classList.add('active');
            }
        });
        
        // Trigger check visibility for immediate content viewing
        setTimeout(checkVisibility, 150);
    }

    // Assign event listeners across tab elements
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.getAttribute('data-target');
            switchView(target);
            window.location.hash = target === 'sg-view' ? 'streamguys' : 'playmode';
        });
    });

    // Cross-links conversion elements inside components
    switchSgBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView('sg-view');
            window.location.hash = 'streamguys';
        });
    });
    switchSgPure.forEach(lnk => {
        lnk.addEventListener('click', () => { switchView('sg-view'); });
    });
    switchPmaPure.forEach(lnk => {
        lnk.addEventListener('click', () => { switchView('pma-view'); });
    });
}

// Ensure URL internal hashes match active view containers seamlessly
function checkForUrlHashParameters() {
    const internalHash = window.location.hash;
    if (internalHash === '#streamguys' || internalHash === '#sg-view') {
        const sgTabBtn = document.querySelector('[data-target="sg-view"]');
        if (sgTabBtn) sgTabBtn.click();
    }
}

// ===== DATE & TIME GENERATOR SYSTEM =====
function initDateTimeTracker() {
    function refreshClocks() {
        const currentTimeInstance = new Date();
        const dateContainers = document.querySelectorAll('.date-display');
        const timeContainers = document.querySelectorAll('.time-display');
        
        const formattedDateString = currentTimeInstance.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }).toUpperCase();

        const formattedTimeString = currentTimeInstance.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        dateContainers.forEach(container => container.textContent = formattedDateString);
        timeContainers.forEach(container => container.textContent = formattedTimeString);
    }
    refreshClocks();
    setInterval(refreshClocks, 1000);
}

// ===== HIGH-PERFORMANCE 2D GLOBE MATRIX OVERLAY =====
function initMiniGlobeCanvas() {
    const canvasElement = document.getElementById('globeCanvasPMA');
    if (!canvasElement) return;
    
    const context = canvasElement.getContext('2d');
    const width = canvasElement.width, height = canvasElement.height;
    const centerPointX = width / 2, centerPointY = height / 2;
    const sphereRadius = width / 2 - 1;
    let rotationAngle = 0;

    const landDotsCoordinatesArray = [];
    for (let latitude = -80; latitude <= 80; latitude += 12) {
        for (let longitude = -180; longitude <= 180; longitude += 14) {
            // Rough geographic approximation calculation for Africa boundary vectors
            const isLandMass = (
                (longitude > -20 && longitude < 55 && latitude > -35 && latitude < 38) || // Africa core
                (longitude > -15 && longitude < 180 && latitude > 35 && latitude < 72)     // Eurasia span
            );
            if (isLandMass) {
                landDotsCoordinatesArray.push({
                    latRad: latitude * Math.PI / 180,
                    lonRad: longitude * Math.PI / 180
                });
            }
        }
    }

    function renderLoop() {
        context.clearRect(0, 0, width, height);
        
        // Sphere Gradient Setup
        const backgroundGradient = context.createRadialGradient(
            centerPointX - sphereRadius * 0.3, centerPointY - sphereRadius * 0.3, sphereRadius * 0.1,
            centerPointX, centerPointY, sphereRadius
        );
        backgroundGradient.addColorStop(0, '#1e5fa8');
        backgroundGradient.addColorStop(0.5, '#0d3d6e');
        backgroundGradient.addColorStop(1, '#071d36');
        
        context.beginPath();
        context.arc(centerPointX, centerPointY, sphereRadius, 0, Math.PI * 2);
        context.fillStyle = backgroundGradient;
        context.fill();

        context.save();
        context.beginPath();
        context.arc(centerPointX, centerPointY, sphereRadius, 0, Math.PI * 2);
        context.clip();

        // Project and trace individual points onto projection coordinate grid
        landDotsCoordinatesArray.forEach(({ latRad, lonRad }) => {
            const currentRotatedLongitude = lonRad + rotationAngle;
            const positionX3D = Math.cos(latRad) * Math.cos(currentRotatedLongitude);
            const positionZ3D = Math.cos(latRad) * Math.sin(currentRotatedLongitude);
            const positionY3D = Math.sin(latRad);

            if (positionZ3D < 0) return; // Cull pixels on reverse side of globe sphere

            const screenPositionX = centerPointX + positionX3D * sphereRadius;
            const screenPositionY = centerPointY - positionY3D * sphereRadius;
            const calculationBrightnessValue = 0.4 + 0.6 * positionZ3D;

            context.beginPath();
            context.arc(screenPositionX, screenPositionY, 1.3, 0, Math.PI * 2);
            context.fillStyle = `rgba(211,30,36,${calculationBrightnessValue})`; // Unified theme-red points
            context.fill();
        });

        context.restore();
        rotationAngle += 0.010;
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
}

// ===== MOBILE INTERACTION DISPATCHER =====
function initMobileHamburgerMenu() {
    const mobileHamburgerIcon = document.getElementById('hamburger');
    const linksNavigationMenu = document.getElementById('navLinks');

    if (!mobileHamburgerIcon || !linksNavigationMenu) return;

    mobileHamburgerIcon.addEventListener('click', () => {
        linksNavigationMenu.classList.toggle('open');
        mobileHamburgerIcon.classList.toggle('active');
    });

    linksNavigationMenu.querySelectorAll('a').forEach(anchorLink => {
        anchorLink.addEventListener('click', () => {
            linksNavigationMenu.classList.remove('open');
            mobileHamburgerIcon.classList.remove('active');
        });
    });
}

// ===== IN-VIEWPORT ANIMATION SYSTEMS =====
function initScrollViewportAnimations() {
    setTimeout(checkVisibility, 200);
    window.addEventListener('scroll', () => {
        requestAnimationFrame(checkVisibility);
    }, { passive: true });
}

function checkVisibility() {
    const contentElementsToAnimate = document.querySelectorAll('.animate-on-scroll, .about-hero-content, .sg-hero-content');
    contentElementsToAnimate.forEach(element => {
        const boundingRectangle = element.getBoundingClientRect();
        if (boundingRectangle.top < window.innerHeight - 50 && boundingRectangle.bottom > 0) {
            element.classList.add('visible');
        }
    });
}

// ===== LOGO ANIMATION =====
function initLogoAnim() {
    const frames = document.querySelectorAll('.logo-frame');
    if (!frames.length) return;
    let current = 0;
    setInterval(() => {
        frames[current].classList.remove('active');
        current = (current + 1) % frames.length;
        frames[current].classList.add('active');
    }, 5000);
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