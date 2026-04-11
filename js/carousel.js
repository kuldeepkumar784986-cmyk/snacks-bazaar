document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.review-slide');
  if (slides.length === 0) return;
  
  let currentSlide = 0;
  
  // Set initial active state
  slides.forEach((slide, index) => {
    if (index === currentSlide) {
      slide.style.display = 'flex';
      slide.classList.add('active');
    } else {
      slide.style.display = 'none';
      slide.classList.remove('active');
    }
  });

  const nextBtn = document.querySelector('.carousel-btn--next');
  const prevBtn = document.querySelector('.carousel-btn--prev');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      slides[currentSlide].style.display = 'none';
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].style.display = 'flex';
      slides[currentSlide].classList.add('active');
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      slides[currentSlide].style.display = 'none';
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      slides[currentSlide].style.display = 'flex';
      slides[currentSlide].classList.add('active');
    });
  }
});
