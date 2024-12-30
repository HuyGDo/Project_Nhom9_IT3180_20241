// Slider
document.addEventListener("DOMContentLoaded", () => {
    const sliderList = document.querySelector(".slider__list");
    const sliderItems = document.querySelectorAll(".slider__item");
    const dots = document.querySelectorAll(".slider__dot");
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");

    let currentIndex = 0;
    const slideInterval = 3000; // 3 seconds

    // Function to change the slider
    function changeSlide(index) {
        // Update current index
        currentIndex = index;
        // Move the slider
        sliderList.style.transform = `translateX(-${index * 100}%)`;
        // Update the active dot
        updateDots();
    }

    // Function to update the active dot
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    // Automatically change slides
    function autoSlide() {
        currentIndex = (currentIndex + 1) % sliderItems.length;
        changeSlide(currentIndex);
    }

    let autoSlideInterval = setInterval(autoSlide, slideInterval);

    // Add click event to dots for manual slide change
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            clearInterval(autoSlideInterval); // Stop auto sliding
            changeSlide(index);
            autoSlideInterval = setInterval(autoSlide, slideInterval); // Restart auto sliding
        });
    });

    // Initialize
    changeSlide(currentIndex);
});
