// ============================================================
// AUTO-SCROLL FUNCTIONALITY FOR HOMEPAGE
// ============================================================
(function () {
    let autoScrollInterval = null;
    let isUserScrolling = false;
    let userScrollTimeout = null;

    document.addEventListener("DOMContentLoaded", () => {
        // Wait for content to load
        setTimeout(() => {
            startAutoScroll();
        }, 2000);
    });

    function startAutoScroll() {
        const scrollSpeed = 2;
        const scrollInterval = 20;

        // Detect user scrolling with mouse wheel
        window.addEventListener('wheel', () => {
            isUserScrolling = true;
            clearInterval(autoScrollInterval);

            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                console.log("Resuming auto-scroll");
                isUserScrolling = false;
                startAutoScrollInterval();
            }, 3000);
        }, { passive: true });

        // Detect touch scrolling
        window.addEventListener('touchstart', () => {
            isUserScrolling = true;
            clearInterval(autoScrollInterval);
            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                startAutoScrollInterval();
            }, 3000);
        }, { passive: true });

        // Start auto-scroll
        startAutoScrollInterval();

        function startAutoScrollInterval() {
            console.log("🚀 Homepage auto-scroll started");

            autoScrollInterval = setInterval(() => {
                if (isUserScrolling) return;

                const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                const scrollHeight = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.offsetHeight
                );
                const clientHeight = window.innerHeight || document.documentElement.clientHeight;
                
                // Check if we're at or near the bottom (with 50px threshold)
                const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 50;

                if (isAtBottom) {
                    console.log("🔝 At bottom - jumping to top", { scrollTop, clientHeight, scrollHeight });
                    // Instant jump to top
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                } else {
                    // Keep scrolling down
                    window.scrollBy(0, scrollSpeed);
                }
            }, scrollInterval);
        }
    }
})();
