/* =======================================================
   ARCHIVO: Anfitrion.js
   Lógica del Panel de Anfitrión con integración al Backend
   ======================================================= */

// --- 1. CONFIGURACIÓN Y VARIABLES GLOBALES ---
const CACHE_KEY = 'host_dashboard_data'; 
let currentUser = null;
let myAccommodations = [];
let myReservations = [];

// [CORRECCIÓN]: Definimos esta variable AQUÍ ARRIBA para que esté disponible siempre
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
    
    // --- 2. VERIFICACIÓN DE SESIÓN ---
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwtToken');

    if (!userId || !token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 3. CARGA DE DATOS ---
    async function loadData() {
        try {
            // A. Intentamos leer del caché
            const cachedData = sessionStorage.getItem(CACHE_KEY);

            if (cachedData) {
                console.log("⚡ Cargando desde caché...");
                const data = JSON.parse(cachedData);
                currentUser = data.user;
                myAccommodations = data.accommodations;
                myReservations = data.reservations;
                
                updateUIall(); 
                return;
            }

            // B. Si no hay caché, vamos al Backend
            console.log("🌐 Descargando datos del backend...");
            
            // 1. Usuario
            currentUser = await fetchConToken(`${API_BASE_URL}/users/${userId}`);
            
            // 2. Alojamientos
            const allAccommodations = await fetchConToken(`${API_BASE_URL}/accomodations`);
            myAccommodations = allAccommodations.filter(acc => 
                (acc.host && acc.host.id == userId) || (acc.user && acc.user.id == userId)
            );

            // 3. Reservas (Endpoint específico)
            const responseRes = await fetchConToken(`${API_BASE_URL}/reservations/host/${userId}`);
            myReservations = responseRes || [];

            // C. Guardamos en Caché
            const dataToSave = {
                user: currentUser,
                accommodations: myAccommodations,
                reservations: myReservations
            };
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(dataToSave));

            // D. Renderizar
            updateUIall();

        } catch (error) {
            console.error("Error cargando dashboard:", error);
        }
    }

    function updateUIall() {
        updateUIUser(currentUser);
        updateStats(); 
        renderHostProperties();
        renderReservations();
        renderCalendar(); // Ahora sí funcionará porque la variable ya existe
    }

    // Ejecutamos la carga inicial
    loadData();


    // --- 4. FUNCIONES DE RENDERIZADO ---

    function updateUIUser(user) {
        const sidebarName = document.getElementById('sidebar-name');
        if (sidebarName) {
            sidebarName.textContent = user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
        }

        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) {
            welcomeMsg.textContent = `Bienvenido, ${user.firstName}`;
        }

        const roleDisplay = document.getElementById('user-role-display');
        if (roleDisplay) {
            const roleMap = { 'HOST': 'Anfitrión', 'ADMIN': 'Administrador', 'GUEST': 'Huésped', 'USER': 'Usuario' };
            const userRole = user.role || 'USER';
            roleDisplay.textContent = roleMap[userRole] || userRole;
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

        let totalRating = 0;
        let countRating = 0;
        myAccommodations.forEach(acc => {
            if (Array.isArray(acc.reviews)) {
                acc.reviews.forEach(r => {
                    totalRating += Number(r.rating) || 0;
                    countRating++;
                });
            }
        });
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

        if (myAccommodations.length === 0) {
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
                        <button class="action-btn btn-secondary" style="padding: 5px 10px; font-size:0.8rem;">Editar</button>
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

        if (myReservations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                    <p>No tienes reservas registradas aún.</p>
                </div>`;
            return;
        }

        // Ordenar: Más recientes primero (por fecha de Check-In)
        myReservations.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

        myReservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-item';
            
            // Datos del Huésped (Validación segura)
            const guestName = res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Usuario eliminado';
            const guestEmail = res.guest ? res.guest.email : '';
            const guestInitials = res.guest ? res.guest.firstName.charAt(0).toUpperCase() : '?';

            // Ajuste de Fechas y Formato Local (ej: "25 nov 2025")
            const checkInDate = new Date(res.checkIn);
            checkInDate.setMinutes(checkInDate.getMinutes() + checkInDate.getTimezoneOffset());
            
            const checkOutDate = new Date(res.checkOut);
            checkOutDate.setMinutes(checkOutDate.getMinutes() + checkOutDate.getTimezoneOffset());

            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const dateString = `${checkInDate.toLocaleDateString('es-ES', options)} - ${checkOutDate.toLocaleDateString('es-ES', options)}`;

            // Lógica de Estado Visual
            const hoy = new Date();
            hoy.setHours(0,0,0,0);
            
            let statusText = 'Confirmada';
            let statusClass = 'confirmed'; // Verde por defecto

            if (checkOutDate < hoy) {
                statusText = 'Finalizada';
                statusClass = 'past'; // Gris
            } else if (checkInDate <= hoy && checkOutDate >= hoy) {
                statusText = 'En curso';
                statusClass = 'active'; // Azul
            }

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

        // Reactivar los botones de cancelar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', deleteReservation);
        });
    }

    // --- 5. LOGICA DEL CALENDARIO ---
    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('calendar-month-title');
        
        if (!grid || !title) return;

        // Limpiar días anteriores
        const oldDays = grid.querySelectorAll('.calendar-day:not(.header)');
        oldDays.forEach(day => day.remove());

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        title.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate(); 

        // Contador de celdas dibujadas (para saber cuántas faltan para llegar a 42)
        let totalCells = 0;

        // 1. Padding inicial (Días vacíos antes del 1)
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            grid.appendChild(emptyDiv);
            totalCells++;
        }

        // 2. Días reales
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day available'; 
            dayDiv.textContent = day;

            const currentDate = new Date(year, month, day);
            currentDate.setHours(0, 0, 0, 0);

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

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

            grid.appendChild(dayDiv);
            totalCells++;
        }

        // 3. Padding final (Rellenar hasta llegar a 42 celdas - 6 semanas)
        // Esto evita que el calendario "salte" de altura
        const totalSlots = 42; // 7 columnas * 6 filas
        const remainingSlots = totalSlots - totalCells;

        for (let i = 0; i < remainingSlots; i++) {
            const emptyDiv = document.createElement('div');
            // Le ponemos 'empty' pero con borde suave para que se note la estructura (opcional)
            emptyDiv.className = 'calendar-day empty'; 
            // Si quieres que se vean los bordes vacíos, usa esto en su lugar:
            // emptyDiv.style.border = '1px solid #f9f9f9'; 
            grid.appendChild(emptyDiv);
        }
    }

    // --- 6. ACCIONES ---

    async function deleteReservation(e) {
        const id = e.target.getAttribute('data-id');
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

        try {
            await fetchConToken(`${API_BASE_URL}/reservations/${id}`, {
                method: 'DELETE'
            });
            alert('Reserva cancelada');
            sessionStorage.removeItem(CACHE_KEY);
            window.location.reload();
        } catch (error) {
            alert('Error al cancelar: ' + error.message);
        }
    }

    // --- 7. EVENT LISTENERS GENERALES ---
    
    // Calendar controls
    const btnPrev = document.getElementById('cal-prev');
    const btnNext = document.getElementById('cal-next');
    const btnToday = document.getElementById('cal-today');

    if(btnPrev) btnPrev.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    if(btnNext) btnNext.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    if(btnToday) btnToday.addEventListener('click', () => {
        currentCalendarDate = new Date();
        renderCalendar();
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }

    const btnHome = document.getElementById('boton-home');
    if (btnHome) btnHome.addEventListener('click', () => window.location.href = 'home.html');
    
    const btnReserva = document.getElementById('btn-reserva');
    if (btnReserva) {
        btnReserva.addEventListener('click', () => window.location.href = 'adminReser.html');
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
});
