/* =======================================================
   ARCHIVO: Anfitrion.js
   Lógica del Panel de Anfitrión con integración al Backend
   ======================================================= */

// --- 1. CONFIGURACIÓN Y VARIABLES GLOBALES ---
const CACHE_KEY = 'host_dashboard_lite'; // Cambiamos nombre para evitar conflictos viejos
let currentUser = null;
let myAccommodations = [];
let myReservations = [];

// Variable global del calendario
let currentCalendarDate = new Date(); 

// --- HELPER FETCH ---
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

    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
        throw new Error('Sesión expirada');
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en la petición');
    }
    return response.status === 204 ? null : response.json();
}

document.addEventListener('DOMContentLoaded', async function () {
    
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwtToken');

    if (!userId || !token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 3. CARGA DE DATOS (ESTRATEGIA HÍBRIDA) ---
    async function loadData() {
        try {
            // A. CARGA RÁPIDA (Solo datos livianos desde Caché)
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            let needToFetchLightData = true;

            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    // Verificación de seguridad (que el caché sea del usuario actual)
                    if (data.user && String(data.user.id) === String(userId)) {
                        console.log("⚡ Cargando datos livianos desde caché...");
                        currentUser = data.user;
                        myReservations = data.reservations || [];
                        
                        // Renderizamos lo que tenemos (Usuario, Stats parciales, Reservas)
                        // Aún no tenemos alojamientos, así que las stats de rating esperarán un poco
                        updateUIUser(currentUser);
                        renderReservations();
                        renderCalendar();
                        
                        needToFetchLightData = false; // Ya tenemos lo básico
                    }
                } catch (e) {
                    sessionStorage.removeItem(CACHE_KEY);
                }
            }

            // B. CARGA PESADA (Alojamientos + Fotos) - SIEMPRE DESDE LA RED
            // Esto evita el error de QuotaExceededError
            console.log("🌐 Descargando alojamientos (imágenes)...");
            
            // Hacemos el fetch de alojamientos en paralelo a lo demás si es necesario
            const promises = [];

            // 1. Promesa de Alojamientos (Pesado)
            const accommodationsPromise = fetchConToken(`${API_BASE_URL}/accomodations`).then(all => {
                // Filtramos los míos
                return all.filter(acc => 
                    (acc.host && String(acc.host.id) === String(userId)) || 
                    (acc.user && String(acc.user.id) === String(userId))
                );
            });
            promises.push(accommodationsPromise);

            // 2. Si no había caché, pedimos User y Reservas también
            if (needToFetchLightData) {
                promises.push(fetchConToken(`${API_BASE_URL}/users/${userId}`));
                promises.push(fetchConToken(`${API_BASE_URL}/reservations/host/${userId}`));
            }

            // Esperamos a que todo termine
            const results = await Promise.all(promises);

            // Asignamos resultados
            myAccommodations = results[0]; // Siempre es el primero en el array

            if (needToFetchLightData) {
                currentUser = results[1];
                myReservations = results[2] || [];
                
                // Guardamos en caché SOLO LO LIVIANO
                try {
                    const dataToSave = {
                        user: currentUser,
                        reservations: myReservations
                        // NOTA: NO guardamos 'myAccommodations' aquí para no saturar la memoria
                    };
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(dataToSave));
                } catch (err) {
                    console.warn("No se pudo guardar caché (espacio lleno), pero la app sigue funcionando.");
                }
            }

            // C. RENDER FINAL (Con todo listo)
            updateUIall();

        } catch (error) {
            console.error("Error cargando dashboard:", error);
        }
    }

    function updateUIall() {
        updateUIUser(currentUser);
        updateStats(); // Ahora sí calculará rating porque ya tiene accommodations
        renderHostProperties(); // Ahora sí pintará las fotos
        renderReservations();
        renderCalendar();
    }

    // Ejecutamos la carga
    loadData();


    // --- 4. FUNCIONES DE RENDERIZADO ---

    function updateUIUser(user) {
        if (!user) return;
        const sidebarName = document.getElementById('sidebar-name');
        if (sidebarName) sidebarName.textContent = user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;

        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) welcomeMsg.textContent = `Bienvenido, ${user.firstName}`;

        const roleDisplay = document.getElementById('user-role-display');
        if (roleDisplay) {
            const roleMap = { 'HOST': 'Anfitrión', 'ADMIN': 'Administrador', 'GUEST': 'Huésped', 'USER': 'Usuario' };
            roleDisplay.textContent = roleMap[user.role || 'USER'] || user.role;
        }
        
        const avatarDiv = document.getElementById('sidebar-avatar'); 
        if (avatarDiv) {
            if (user.profilePictureUrl) {
                avatarDiv.textContent = '';
                avatarDiv.style.backgroundImage = `url('${user.profilePictureUrl}')`;
                avatarDiv.style.backgroundSize = 'cover';
                avatarDiv.style.backgroundPosition = 'center';
            } else {
                avatarDiv.textContent = user.firstName.charAt(0).toUpperCase();
            }
        }
    }

    function updateStats() {
        const elReservas = document.getElementById('stat-reservas');
        const elIngresos = document.getElementById('stat-ingresos');
        const elRating = document.getElementById('stat-rating');
        const elPendientes = document.getElementById('stat-pendientes');

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let contadorActivas = 0;
        let contadorPendientes = 0;
        let sumaIngresos = 0;

        if (myReservations) {
            myReservations.forEach(res => {
                if (res.deletedAt) return;

                const checkIn = new Date(res.checkIn);
                checkIn.setMinutes(checkIn.getMinutes() + checkIn.getTimezoneOffset());
                checkIn.setHours(0,0,0,0);

                const checkOut = new Date(res.checkOut);
                checkOut.setMinutes(checkOut.getMinutes() + checkOut.getTimezoneOffset());
                checkOut.setHours(0,0,0,0);

                if (checkOut >= hoy) { contadorActivas++; }
                if (checkIn > hoy) { contadorPendientes++; }

                const precio = Number(res.totalPrice) || 0; 
                sumaIngresos += precio;
            });
        }

        let totalRating = 0;
        let countRating = 0;
        
        if (myAccommodations) {
            myAccommodations.forEach(acc => {
                if (Array.isArray(acc.reviews)) {
                    acc.reviews.forEach(r => {
                        totalRating += Number(r.rating) || 0;
                        countRating++;
                    });
                }
            });
        }
        const avgRating = countRating > 0 ? (totalRating / countRating).toFixed(1) : '-';

        if (elReservas) elReservas.textContent = contadorActivas;
        if (elIngresos) elIngresos.textContent = `$${sumaIngresos.toLocaleString()}`;
        if (elPendientes) elPendientes.textContent = contadorPendientes;
        if (elRating) elRating.textContent = avgRating;
    }

    function renderHostProperties() {
        const container = document.getElementById('host-properties-container');
        if (!container) return; 
        
        container.innerHTML = ''; 

        if (!myAccommodations || myAccommodations.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 2rem; background:#f9f9f9; border-radius:8px;">
                    <p>Aún no has publicado ninguna propiedad.</p>
                    <a href="agregarChoza.html" style="color:var(--primary); font-weight:bold;">¡Publica la primera!</a>
                </div>`;
            return;
        }

        myAccommodations.forEach(acc => {
            const card = document.createElement('div');
            card.className = 'host-property-card';

            let imgUrl = 'https://placehold.co/300x200';
            if (acc.images && acc.images.length > 0) {
                imgUrl = acc.images[0].url || acc.images[0];
            }

            const locationText = acc.location ? `${acc.location.city}, ${acc.location.country}` : 'Ubicación sin definir';

            card.innerHTML = `
                <div class="host-card-img" style="background-image: url('${imgUrl}'); background-size: cover; background-position: center;"></div>
                <div class="host-card-info">
                    <h4 class="host-card-title">${acc.title}</h4>
                    <div class="host-card-meta">
                        <span>📍 ${locationText}</span>
                        <span>👥 ${acc.maxGuests || 0}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <div class="host-card-price">$${acc.pricePerNight} <span style="font-size:0.8em; font-weight:normal; color:#777;">/noche</span></div>
                        <button class="action-btn btn-secondary" 
                                onclick="window.location.href='editarChoza.html?id=${acc.id}'"
                                style="padding: 5px 10px; font-size:0.8rem; cursor: pointer;">
                            Editar
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function renderReservations() {
        const container = document.getElementById('reservations-container');
        if(!container) return;
        container.innerHTML = '';

        if (!myReservations || myReservations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                    <p>No tienes reservas registradas aún.</p>
                </div>`;
            return;
        }

        myReservations.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

        myReservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-item';
            
            const guestName = res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Usuario eliminado';
            const guestInitials = res.guest ? res.guest.firstName.charAt(0).toUpperCase() : '?';
            const guestEmail = res.guest ? res.guest.email : '';

            const checkInRaw = new Date(res.checkIn);
            const checkOutRaw = new Date(res.checkOut);
            checkInRaw.setMinutes(checkInRaw.getMinutes() + checkInRaw.getTimezoneOffset());
            checkOutRaw.setMinutes(checkOutRaw.getMinutes() + checkOutRaw.getTimezoneOffset());

            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const dateString = `${checkInRaw.toLocaleDateString('es-ES', options)} - ${checkOutRaw.toLocaleDateString('es-ES', options)}`;

            const hoy = new Date();
            const isPast = new Date(res.checkOut) < hoy;
            const statusClass = isPast ? 'confirmed' : 'pending'; 
            const statusText = isPast ? 'Finalizada' : 'Confirmada'; 

            card.innerHTML = `
                <div class="guest-info">
                    <div class="guest-avatar">${guestInitials}</div>
                    <div class="guest-details">
                        <h4>${guestName}</h4>
                        <p class="res-email">${guestEmail}</p>
                        <p class="res-property">🏠 ${res.accomodation.title}</p>
                    </div>
                </div>
                <div class="res-center">
                    <div class="dates">📅 ${dateString}</div>
                    <div class="status ${statusClass}">${statusText}</div>
                </div>
                <div class="res-right">
                    <div class="price">$${res.totalPrice}</div>
                    ${statusText !== 'Finalizada' ? 
                        `<button class="action-btn btn-secondary btn-delete" data-id="${res.id}">Cancelar</button>` 
                        : ''}
                </div>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', deleteReservation);
        });
    }

    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('calendar-month-title');
        
        if (!grid || !title) return;

        const oldDays = grid.querySelectorAll('.calendar-day:not(.header)');
        oldDays.forEach(day => day.remove());

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        title.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate(); 
        
        let totalCells = 0;

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            grid.appendChild(emptyDiv);
            totalCells++;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day available'; 
            dayDiv.textContent = day;

            const currentDate = new Date(year, month, day);
            currentDate.setHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (myReservations) {
                const reservaEncontrada = myReservations.find(res => {
                    if (res.deletedAt) return false;
                    const checkIn = new Date(res.checkIn);
                    checkIn.setMinutes(checkIn.getMinutes() + checkIn.getTimezoneOffset());
                    checkIn.setHours(0,0,0,0);
                    const checkOut = new Date(res.checkOut);
                    checkOut.setMinutes(checkOut.getMinutes() + checkOut.getTimezoneOffset());
                    checkOut.setHours(0,0,0,0);
                    return currentDate >= checkIn && currentDate < checkOut;
                });

                if (reservaEncontrada) {
                    if (currentDate < hoy) {
                        dayDiv.classList.add('booked'); 
                        dayDiv.style.opacity = '0.5'; 
                    } else if (currentDate.getTime() === hoy.getTime()) {
                        dayDiv.classList.add('booked');
                    } else {
                        dayDiv.classList.add('pending');
                    }
                    dayDiv.title = `Reservado por: ${reservaEncontrada.guest?.firstName || 'Usuario'}`;
                }
            }

            grid.appendChild(dayDiv);
            totalCells++;
        }

        const totalSlots = 42; 
        const remainingSlots = totalSlots - totalCells;
        for (let i = 0; i < remainingSlots; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty'; 
            grid.appendChild(emptyDiv);
        }
    }

    // --- 5. ACCIONES ---

    async function deleteReservation(e) {
        const id = e.target.getAttribute('data-id');
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

        try {
            await fetchConToken(`${API_BASE_URL}/reservations/${id}`, {
                method: 'DELETE'
            });
            alert('Reserva cancelada');
            sessionStorage.removeItem(CACHE_KEY); // Limpiar caché para refrescar
            window.location.reload();
        } catch (error) {
            alert('Error al cancelar: ' + error.message);
        }
    }

    // --- 6. EVENT LISTENERS ---
    
    // Controles Calendario
    const btnPrev = document.getElementById('cal-prev');
    const btnNext = document.getElementById('cal-next');
    const btnToday = document.getElementById('cal-today');

    if(btnPrev) btnPrev.addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(); });
    if(btnNext) btnNext.addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(); });
    if(btnToday) btnToday.addEventListener('click', () => { currentCalendarDate = new Date(); renderCalendar(); });

    // Logout Seguro
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('login.html'); // Replace para no volver atrás
        });
    }

    // Botones de Navegación
    const btnHome = document.getElementById('boton-home');
    if (btnHome) btnHome.addEventListener('click', () => window.location.href = 'home.html');
    
    const btnReserva = document.getElementById('btn-reserva');
    if (btnReserva) {
        btnReserva.addEventListener('click', () => window.location.href = 'agregarChoza.html');
    }

    // Tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if(targetContent) targetContent.classList.add('active');
        });
    });

    // --- MODAL DE EDICIÓN PERFIL ---
    window.openProfileModal = function() {
        if (!currentUser) return;
        document.getElementById('edit-firstname').value = currentUser.firstName || '';
        document.getElementById('edit-lastname').value = currentUser.lastName || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-phone').value = currentUser.phone || '';
        document.getElementById('edit-dob').value = currentUser.dateOfBirth || ''; 
        document.getElementById('edit-pic-url').value = currentUser.profilePictureUrl || '';
        document.getElementById('edit-country').value = currentUser.country || '';
        document.getElementById('edit-province').value = currentUser.province || '';
        document.getElementById('edit-city').value = currentUser.city || '';
        document.getElementById('edit-bio').value = currentUser.bio || '';
        
        document.getElementById('profile-modal').style.display = 'flex';
    };

    window.closeProfileModal = function() {
        document.getElementById('profile-modal').style.display = 'none';
    };

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('save-profile-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Guardando...';
            btn.disabled = true;

            try {
                const payload = {
                    firstName: document.getElementById('edit-firstname').value,
                    lastName: document.getElementById('edit-lastname').value,
                    email: document.getElementById('edit-email').value,
                    phone: document.getElementById('edit-phone').value,
                    dateOfBirth: document.getElementById('edit-dob').value || null,
                    profilePictureUrl: document.getElementById('edit-pic-url').value,
                    country: document.getElementById('edit-country').value,
                    province: document.getElementById('edit-province').value,
                    city: document.getElementById('edit-city').value,
                    bio: document.getElementById('edit-bio').value
                };

                const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Error al actualizar perfil');

                const updatedUser = await response.json();
                currentUser = updatedUser; 
                
                // Actualizar caché solo con los datos del usuario (mantener reservas)
                try {
                    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
                    cached.user = updatedUser;
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
                } catch(err) { console.warn("No se pudo actualizar caché"); }

                updateUIUser(currentUser);
                alert('Perfil actualizado correctamente');
                closeProfileModal();

            } catch (error) {
                console.error(error);
                alert('Error: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    document.getElementById('profile-modal').addEventListener('click', function(e) {
        if (e.target === this) closeProfileModal();
    });
});
