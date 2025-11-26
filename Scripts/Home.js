/* =======================================================
   ARCHIVO ÚNICO: Home.js
   TODA la lógica para la página de inicio.
   ======================================================= */

// --- 1. FUNCIÓN HELPER (va primero, fuera de todo) ---
async function fetchConToken(url, options = {}) {
    const token = localStorage.getItem('jwtToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {...options, headers: headers};
    const response = await fetch(url, config);

    // if (response.status === 401 || response.status === 403) {
    //     localStorage.clear();
    //     alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
    //     window.location.href = 'login.html'; // (Ajusta la ruta si es necesario)
    //     throw new Error('No autorizado');
    // }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en la petición');
    }
    return response.status === 204 ? null : response.json();
}

// --- 2. ÚNICO LISTENER 'DOMContentLoaded' ---
document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DE SESIÓN (NAVBAR) ---
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwtToken');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');
    const usuarioBtn = document.getElementById('usuario-btn');

    if (userId && token) {
        // Usuario LOGUEADO
        usuarioBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
        loginBtn.style.display = 'none';

        fetchConToken(`${API_BASE_URL}/api/users/${userId}`)
            .then(user => {
                usuarioBtn.textContent = `Hola, ${user.firstName}`; 
            })
            .catch(error => {
                console.error("Error al cargar datos del usuario:", error);
                usuarioBtn.textContent = 'Mi Perfil';
            });

        // Solucion temporal
        // const userEmail = localStorage.getItem('userEmail');
        
        // if (userEmail) {
        //     // Mostramos la parte del email antes del "@"
        //     usuarioBtn.textContent = `Hola, ${userEmail.split('@')[0]}`;
        // } else {
        //     usuarioBtn.textContent = 'Mi Perfil'; // Fallback
        // }
        //----------------------------

        logoutBtn.onclick = function () {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html'; // (Ajusta la ruta)
        };
        usuarioBtn.onclick = function () {
             window.location.href = 'anfitrion.html'; // (Ajusta la ruta)
        };
    } else {
        // Usuario NO LOGUEADO
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        usuarioBtn.style.display = 'none';
        loginBtn.onclick = function () {
            window.location.href = 'login.html'; // (Ajusta la ruta)
        };
    }

    // --- LÓGICA DE CARGA DE ALOJAMIENTOS (PROPERTIES) ---
    const propertyGrid = document.querySelector('.properties-container .property-grid');
    if (propertyGrid) {
        propertyGrid.innerHTML = '<p>Cargando alojamientos...</p>';

        // Endpoint público, no necesita fetchConToken
        fetch(`${API_BASE_URL}/accomodations`)
            .then(response => {
                if (!response.ok) throw new Error('No se pudieron cargar los alojamientos');
                return response.json();
            })
            .then(accomodations => {
                propertyGrid.innerHTML = ''; // Limpiar "Cargando..."
                if (accomodations.length === 0) {
                     propertyGrid.innerHTML = '<p>No hay alojamientos disponibles.</p>';
                     return;
                }

                accomodations.forEach(accomodation => {
                    const card = document.createElement('div');
                    card.className = 'property-card';

                    // 1. Determinar la URL de la imagen
                    let imageUrl = 'https://placehold.co/600x400'; // Imagen por defecto
                    if (accomodation.images && accomodation.images.length > 0) {
                        imageUrl = accomodation.images[0].url; 
                    }

                    // 2. Determinar el Rating (opcional pero bueno)
                    // Calculemos el promedio de estrellas de las reseñas (reviews)
                    let ratingAvg = "Sin reseñas";
                    if (accomodation.reviews && accomodation.reviews.length > 0) {
                        const sum = accomodation.reviews.reduce((acc, review) => acc + review.rating, 0);
                        ratingAvg = `★ ${(sum / accomodation.reviews.length).toFixed(1)}`; // Ej: "★ 4.5"
                    }
                    
                    //Amenities
                    let amenitiesText = '';
                    if (accomodation.amenities && accomodation.amenities.length > 0) {
                        const amenitiesNames = accomodation.amenities
                            .slice(0, 3)
                            .map(a => a.name);
                        
                        amenitiesText = amenitiesNames.join(' . ')

                        if (accomodation.amenities.length > 3) {
                            amenitiesText += '...';
                        }
                    }

                    // 3. Crear el HTML de la tarjeta con los datos reales
                    card.innerHTML = `
                        <div class="property-image" style="background-image: url('${imageUrl}')"></div>
                        <div class="property-info">
                            <div class="property-type">${accomodation.location?.city || 'Alojamiento'}</div>
                            <h3 class="property-title">${accomodation.title}</h3>

                            <div class="property-amenities" style="color: #666; font-size: 0.9em; margin-bottom: 8px;">
                                ${amenitiesText}
                            </div>

                            <div class="property-price">$${accomodation.pricePerNight} noche</div>
                            <div class="property-rating">${ratingAvg}</div>
                        </div>
                    `;
                    
                    // --- FIN DE LA MODIFICACIÓN ---
                    
                    // (La lógica del click se mantiene igual)
                    card.addEventListener('click', function() {
                        window.location.href = `reservar.html?id=${accomodation.id}`;
                    });
                    
                    propertyGrid.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error al cargar alojamientos:', error);
                propertyGrid.innerHTML = '<p>Error al cargar alojamientos. Intente más tarde.</p>';
            });
    }

    // --- LÓGICA DE CATEGORÍAS (Tu código original) ---
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-name').textContent;
            alert(`Mostrando alojamientos en la categoría: ${categoryName}`);
        });
    });
    
    // --- LÓGICA DE PESTAÑAS DE BÚSQUEDA (Tu código original) ---
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // --- LÓGICA DEL FORMULARIO DE BÚSQUEDA (Tu código original) ---
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            const location = document.querySelector('#location').value.trim();
            const checkin = document.querySelector('#checkin').value.trim();
            const checkout = document.querySelector('#checkout').value.trim();
            const guests = document.querySelector('#guests').value.trim();
            let isValid = true; // movido para estar accesible

            resetSearchErrors();
            
            // ... (Validaciones) ...
            if (!location) {
                showSearchError('location', 'Por favor ingresa una ubicación');
                isValid = false;
            }
            if (!checkin) {
                 showSearchError('checkin', 'Por favor selecciona una fecha de llegada');
                 isValid = false;
            }
            // ... (etc.) ...
            
            if (isValid) {
                 // (Tu lógica de redirección)
                 window.location.href = 'reservar.html'; // (Ajusta la ruta)
            }
        });
    }

    // Funciones auxiliares para la búsqueda
    function showSearchError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function resetSearchErrors() {
        const errorMessages = document.querySelectorAll('.search-box .error-message');
        errorMessages.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }
});
