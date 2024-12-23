document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".slider__list");
    const slides = document.querySelectorAll(".slider__item");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const dots = document.querySelectorAll(".slider__dot");

    let currentSlide = 0;
    const slideCount = slides.length;
    let slideInterval;

    // Functions
    const updateSlider = () => {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update dots
        dots.forEach((dot) => dot.classList.remove("active"));
        dots[currentSlide].classList.add("active");
    };

    const nextSlide = () => {
        currentSlide = (currentSlide + 1) % slideCount;
        updateSlider();
    };

    const prevSlide = () => {
        currentSlide = (currentSlide - 1 + slideCount) % slideCount;
        updateSlider();
    };

    const startAutoSlide = () => {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    };

    const stopAutoSlide = () => {
        clearInterval(slideInterval);
    };

    // Event Listeners
    prevBtn.addEventListener("click", () => {
        prevSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    nextBtn.addEventListener("click", () => {
        nextSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            currentSlide = index;
            updateSlider();
            stopAutoSlide();
            startAutoSlide();
        });
    });

    // Start auto sliding
    startAutoSlide();

    // Pause auto sliding when hovering over slider
    slider.parentElement.addEventListener("mouseenter", stopAutoSlide);
    slider.parentElement.addEventListener("mouseleave", startAutoSlide);
});
