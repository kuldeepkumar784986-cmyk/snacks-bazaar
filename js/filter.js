document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.shop-grid .product-card');

  if (filterBtns.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      // Update active styling
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter products
      productCards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? 'block' : 'none';
      });
    });
  });
});
