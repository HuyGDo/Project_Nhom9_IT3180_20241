document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".slider__list");
    const slides = document.querySelectorAll(".slider__item");
    const prevBtn = document.querySelector(".slider__nav--prev");
    const nextBtn = document.querySelector(".slider__nav--next");
    const dots = document.querySelectorAll(".slider__dot");

    let currentSlide = 0;
    const slideCount = slides.length;
    let slideInterval;
    let isTransitioning = false;

    // Functions
    const updateSlider = () => {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentSlide);
        });

        // Update aria-label for accessibility
        slides.forEach((slide, index) => {
            slide.setAttribute("aria-hidden", index !== currentSlide);
        });
    };

    const nextSlide = () => {
        if (isTransitioning) return;
        isTransitioning = true;

        currentSlide = (currentSlide + 1) % slideCount;
        updateSlider();

        // Reset transition lock after animation completes
        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    };

    const prevSlide = () => {
        if (isTransitioning) return;
        isTransitioning = true;

        currentSlide = (currentSlide - 1 + slideCount) % slideCount;
        updateSlider();

        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    };

    const goToSlide = (index) => {
        if (isTransitioning || currentSlide === index) return;
        isTransitioning = true;

        currentSlide = index;
        updateSlider();

        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    };

    const startAutoSlide = () => {
        stopAutoSlide();
        slideInterval = setInterval(nextSlide, 5000);
    };

    const stopAutoSlide = () => {
        clearInterval(slideInterval);
    };

    // Event Listeners
    prevBtn.addEventListener("click", () => {
        prevSlide();
        startAutoSlide();
    });

    nextBtn.addEventListener("click", () => {
        nextSlide();
        startAutoSlide();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            goToSlide(index);
            startAutoSlide();
        });
    });

    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener(
        "touchstart",
        (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        },
        { passive: true },
    );

    slider.addEventListener(
        "touchend",
        (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoSlide();
        },
        { passive: true },
    );

    const handleSwipe = () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    };

    // Start auto sliding
    startAutoSlide();

    // Pause auto sliding when hovering
    slider.parentElement.addEventListener("mouseenter", stopAutoSlide);
    slider.parentElement.addEventListener("mouseleave", startAutoSlide);

    // Pause when tab is inactive
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoSlide();
        } else {
            startAutoSlide();
        }
    });
});
