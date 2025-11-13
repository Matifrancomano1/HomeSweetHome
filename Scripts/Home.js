

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
    searchBtn.addEventListener('click', function () {
        const location = document.querySelector('#location').value.trim();
        const checkin = document.querySelector('#checkin').value.trim();
        const checkout = document.querySelector('#checkout').value.trim();
        const guests = document.querySelector('#guests').value.trim();

        // Resetear errores
        resetSearchErrors();

        // Validación
        if (!location && (!checkin || !checkout || !guests)) {
            showSearchError('location', 'Por favor ingresa una ubicación');
            return;
        }

        if (location && !checkin && !checkout && !guests) {
            // Solo ubicación: ir a reservar.html
            window.location.href = `reservar.html`;
            return;
        }

        let isValid = true;

        if (!location) {
            showSearchError('location', 'Por favor ingresa una ubicación');
            isValid = false;
        }

        if (!checkin) {
            showSearchError('checkin', 'Por favor selecciona una fecha de llegada');
            isValid = false;
        }

        if (!checkout) {
            showSearchError('checkout', 'Por favor selecciona una fecha de salida');
            isValid = false;
        }

        if (!guests) {
            showSearchError('guests', 'Por favor selecciona la cantidad de huéspedes');
            isValid = false;
        }

        if (isValid) {
            // Todos los campos están completos: ir a resultados.html
            //window.location.href = `resultados.html?location=${encodeURIComponent(location)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`;
            window.location.href = 'reservar.html'
        }
    });
}

// Función para mostrar error
function showSearchError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Función para ocultar todos los errores
function resetSearchErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}
});
