document.addEventListener('DOMContentLoaded', function() {

    // Interactividad para las tarjetas de categorías
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-name').textContent;
            alert(`Mostrando alojamientos en la categoría: ${categoryName}`);
            // Aquí puedes redirigir o filtrar los resultados según la categoría
            // Ejemplo de redirección a una página de resultados filtrados:
            // window.location.href = `alojamientos.html?category=${categoryName}`;
        });
    });
    
    // Interactividad para las tarjetas de propiedades
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        card.addEventListener('click', function() {
            const propertyTitle = this.querySelector('.property-title').textContent;
            alert(`Mostrando detalles de: ${propertyTitle}`);
            // Aquí puedes redirigir a una página con los detalles de la propiedad
            // Ejemplo de redirección:
            // window.location.href = `detalle-propiedad.html?title=${encodeURIComponent(propertyTitle)}`;
        });
    });
    
    // Funcionalidad de las pestañas de búsqueda
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Eliminar la clase "active" de todas las pestañas
            searchTabs.forEach(t => t.classList.remove('active'));
            
            // Añadir la clase "active" a la pestaña seleccionada
            this.classList.add('active');
            
            // Aquí podrías agregar una lógica para mostrar/ocultar diferentes tipos de campos según la pestaña seleccionada
            // Por ejemplo, cambiar los campos de búsqueda según la categoría seleccionada (alojamiento, experiencias, etc.)
            // Si se hace esto, tal vez necesites agregar una estructura HTML adicional que se muestre/oculte
        });
    });

    // Extra: Si alguna vez decides usar el campo de búsqueda, puedes añadir un listener para hacer búsquedas:
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const location = document.querySelector('#location').value;
            const checkin = document.querySelector('#checkin').value;
            const checkout = document.querySelector('#checkout').value;
            const guests = document.querySelector('#guests').value;

            // Puedes redirigir a una página de resultados pasando estos parámetros como query string
            // Ejemplo:
            window.location.href = `resultados.html?location=${encodeURIComponent(location)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`;
        });
    }
});
