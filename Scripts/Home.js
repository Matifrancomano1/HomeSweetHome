document.addEventListener('DOMContentLoaded', function() {
    // Simple interactivity for category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-name').textContent;
            alert(`Mostrando alojamientos en la categoría: ${categoryName}`);
            // Aquí normalmente redirigirías o filtrarías los resultados
        });
    });
    
    // Property card click
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        card.addEventListener('click', function() {
            const propertyTitle = this.querySelector('.property-title').textContent;
            alert(`Mostrando detalles de: ${propertyTitle}`);
            // window.location.href = 'property-details.html';
        });
    });
    
    // Search tabs functionality
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
});