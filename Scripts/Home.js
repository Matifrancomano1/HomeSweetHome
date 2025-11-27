/* =======================================================
   ARCHIVO ÚNICO: Home.js
   TODA la lógica para la página de inicio.
   ======================================================= */

// Variable global para guardar los alojamientos cargados
let allAccommodations = []; 

// --- 1. FUNCIÓN HELPER ---
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

        fetchConToken(`${API_BASE_URL}/users/${userId}`)
            .then(user => {
                usuarioBtn.textContent = `Hola, ${user.firstName}`; 
                // Guardamos nombre en localStorage para usarlo al reservar
                localStorage.setItem('usuarioName', user.firstName + ' ' + user.lastName);
            })
            .catch(error => {
                console.error("Error al cargar datos del usuario:", error);
                usuarioBtn.textContent = 'Mi Perfil';
            });

        logoutBtn.onclick = function () {
            localStorage.clear(); // Limpia todo para asegurar
            window.location.href = 'login.html'; 
        };
        usuarioBtn.onclick = function () {
             window.location.href = 'anfitrion.html'; 
        };
    } else {
        // Usuario NO LOGUEADO
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        usuarioBtn.style.display = 'none';
        loginBtn.onclick = function () {
            window.location.href = 'login.html';
        };
    }

    // --- REFERENCIA AL GRID ---
    const propertyGrid = document.querySelector('.properties-container .property-grid');

    // --- FUNCIÓN PARA DIBUJAR LAS TARJETAS (Render) ---
    function renderAccommodations(list) {
        if (!propertyGrid) return;
        
        propertyGrid.innerHTML = ''; // Limpiar grid

        if (list.length === 0) {
             propertyGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No se encontraron alojamientos con esos criterios.</p>';
             return;
        }

        list.forEach(accomodation => {
            const card = document.createElement('div');
            card.className = 'property-card';

            // 1. URL Imagen
            let imageUrl = 'https://placehold.co/600x400';
            if (accomodation.images && accomodation.images.length > 0) {
                imageUrl = accomodation.images[0].url; 
            }

            // 2. Rating
            let ratingAvg = "Sin reseñas";
            if (accomodation.reviews && accomodation.reviews.length > 0) {
                const sum = accomodation.reviews.reduce((acc, review) => acc + review.rating, 0);
                ratingAvg = `★ ${(sum / accomodation.reviews.length).toFixed(1)}`;
            }
            
            // 3. Amenities
            let amenitiesText = '';
            if (accomodation.amenities && accomodation.amenities.length > 0) {
                const amenitiesNames = accomodation.amenities
                    .slice(0, 3)
                    .map(a => a.name);
                
                amenitiesText = amenitiesNames.join(' · '); // Usé punto medio

                if (accomodation.amenities.length > 3) {
                    amenitiesText += '...';
                }
            }

            // 4. HTML
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
            
            card.addEventListener('click', function() {
                window.location.href = `reservar.html?id=${accomodation.id}`;
            });
            
            propertyGrid.appendChild(card);
        });
    }

    // --- CARGA INICIAL DE DATOS ---
    if (propertyGrid) {
        propertyGrid.innerHTML = '<p>Cargando alojamientos...</p>';

        fetch(`${API_BASE_URL}/accomodations`)
            .then(response => {
                if (!response.ok) throw new Error('No se pudieron cargar los alojamientos');
                return response.json();
            })
            .then(data => {
                // GUARDAMOS LOS DATOS EN LA VARIABLE GLOBAL
                allAccommodations = data;
                // Renderizamos todo al principio
                renderAccommodations(allAccommodations);
            })
            .catch(error => {
                console.error('Error al cargar alojamientos:', error);
                propertyGrid.innerHTML = '<p>Error al cargar alojamientos. Intente más tarde.</p>';
            });
    }

    // --- LÓGICA DEL BUSCADOR (NUEVA) ---
    const searchBtn = document.querySelector('.search-btn');
    const locationInputDOM = document.querySelector('#location');

    // 1. Función reutilizable que hace el filtro
    function ejecutarBusqueda() {
        // Obtenemos los valores de los inputs
        const locationVal = locationInputDOM.value.trim().toLowerCase();
        const guestsVal = parseInt(document.querySelector('#guests').value) || 0;
        
        // FILTRADO
        const filteredList = allAccommodations.filter(acc => {
            let matchesLocation = true;
            let matchesGuests = true;

            // Filtro por Ubicación
            if (locationVal) {
                const city = acc.location?.city?.toLowerCase() || '';
                const country = acc.location?.country?.toLowerCase() || '';
                const title = acc.title?.toLowerCase() || '';
                
                matchesLocation = city.includes(locationVal) || 
                                  country.includes(locationVal) || 
                                  title.includes(locationVal);
            }

            // Filtro por Huéspedes
            if (guestsVal > 0) {
                 if (acc.maxGuests) {
                    matchesGuests = acc.maxGuests >= guestsVal;
                 }
            }

            return matchesLocation && matchesGuests;
        });

        // Renderizar resultados
        renderAccommodations(filteredList);
    }

    // 2. Evento Click en el botón "Buscar"
    if (searchBtn) {
        searchBtn.addEventListener('click', ejecutarBusqueda);
    }

    // 3. Evento "Enter" en el input de ubicación
    if (locationInputDOM) {
        locationInputDOM.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                ejecutarBusqueda();
            }
        });
    }

    // --- UI HELPER: Borrar mensajes de error al escribir ---
    const inputs = document.querySelectorAll('.search-box input, .search-box select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
             resetSearchErrors();
        });
    });

    function resetSearchErrors() {
        const errorMessages = document.querySelectorAll('.search-box .error-message');
        errorMessages.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

    // --- LÓGICA DE CATEGORÍAS ---
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-name').textContent;
            
            // Ejemplo de filtro por categoría (simple)
            // Si tienes un campo "category" en tu objeto accommodation:
            /*
            const filtered = allAccommodations.filter(acc => 
                acc.category === categoryName
            );
            renderAccommodations(filtered);
            */
            alert(`Filtrando por categoría: ${categoryName} (Falta implementar campo categoría en backend)`);
        });
    });

    // --- TABS VISUALES ---
    const searchTabs = document.querySelectorAll('.search-tab');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            searchTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
