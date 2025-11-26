document.addEventListener('DOMContentLoaded', async function () {
    // 1. OBTENER ID DE LA URL
    const urlParams = new URLSearchParams(window.location.search);
    const accommodationId = urlParams.get('id');

    if (!accommodationId) {
        alert('No se ha seleccionado ningún alojamiento');
        window.location.href = 'home.html';
        return;
    }

    // --- ELEMENTOS DEL DOM ---
    const confirmBtn = document.getElementById('confirm-btn');
    const successMessage = document.getElementById('success-message');
    const guestsInput = document.getElementById('guests');

    // Elementos del formulario condicional
    const guestInfoSection = document.getElementById('guest-info-section');
    const nameInput = document.getElementById('guest-name');
    const emailInput = document.getElementById('guest-email');
    const phoneInput = document.getElementById('guest-phone');

    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    const priceItems = document.querySelectorAll('.price-item');
    const priceTotalElement = document.querySelector('.price-total span:last-child');

    // Elementos de la propiedad
    const titleElem = document.querySelector('.property-title');
    const locationElem = document.querySelector('.property-location span');
    const mainImageElem = document.querySelector('.main-image');
    const secondaryImages = document.querySelectorAll('.secondary-image');

    // Elementos del Anfitrión (Host)
    const hostNameElem = document.querySelector('.host-details h4');
    const hostDescElem = document.querySelector('.host-details p'); // El texto de abajo (Superhost...)
    const hostAvatarElem = document.querySelector('.host-avatar');

    // --- VARIABLES GLOBALES ---
    let NIGHTLY_RATE = 0;
    const CLEANING_FEE = 50;
    const SERVICE_FEE = 45;
    let currentTotal = 0;

    // Verificar estado de login
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwtToken');
    const isLoggedIn = userId && token;

    // --- 0. CONFIGURACIÓN INICIAL ---
    // Fechas por defecto: Hoy y Mañana
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    checkinInput.valueAsDate = today;
    checkoutInput.valueAsDate = tomorrow;

    // --- GESTIÓN DE VISIBILIDAD DEL FORMULARIO ---
    if (isLoggedIn) {
        // Usuario logueado: Ocultar formulario
        if (guestInfoSection) guestInfoSection.style.display = 'none';
    } else {
        // Usuario NO logueado: Mostrar formulario
        if (guestInfoSection) guestInfoSection.style.display = 'block';
    }

    // --- INICIALIZAR INTL-TEL-INPUT (Solo si el input existe y está visible) ---
    let iti;
    if (phoneInput) {
        iti = window.intlTelInput(phoneInput, {
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
            preferredCountries: ['mx', 'us', 'ca', 'es'],
            separateDialCode: true,
            initialCountry: "auto",
            geoIpLookup: function (callback) {
                fetch("https://ipapi.co/json")
                    .then(function (res) { return res.json(); })
                    .then(function (data) { callback(data.country_code); })
                    .catch(function () { callback("mx"); });
            }
        });
    }

    // --- CARGAR DATOS DEL BACKEND ---
    try {
        const response = await fetch(`${API_BASE_URL}/accomodations/${accommodationId}`);
        if (!response.ok) throw new Error('Error al cargar el alojamiento');

        const accommodation = await response.json();
        console.log("Datos del alojamiento:", accommodation);

        // 1. Info básica
        titleElem.textContent = accommodation.title;
        locationElem.textContent = `📍 ${accommodation.location?.city || 'Ciudad'}, ${accommodation.location?.country || 'País'}`;
        NIGHTLY_RATE = accommodation.pricePerNight;

        // 2. Imágenes
        if (accommodation.images && accommodation.images.length > 0) {
            const mainUrl = accommodation.images[0].url || accommodation.images[0];
            mainImageElem.style.backgroundImage = `url('${mainUrl}')`;

            secondaryImages.forEach((imgDiv, index) => {
                if (accommodation.images[index + 1]) {
                    const secUrl = accommodation.images[index + 1].url || accommodation.images[index + 1];
                    imgDiv.style.backgroundImage = `url('${secUrl}')`;
                }
            });
        }

        // 3. INFO DEL ANFITRION (HOST)
        const host = accommodation.host || accommodation.user;

        if (host) {
            const nombreHost = host.firstName || host.name || "Anfitrión";
            const apellidoHost = host.lastName || "";
            hostNameElem.textContent = `${nombreHost} ${apellidoHost}`;

            const detalleHost = host.email || "Anfitrión verificado";
            hostDescElem.textContent = `${detalleHost} · Contacto directo`;

            if (host.profilePicture || host.avatarUrl) {
                const avatarUrl = host.profilePicture || host.avatarUrl;
                hostAvatarElem.style.backgroundImage = `url('${avatarUrl}')`;
            }
        }

        // 4. INFO DE AMENITIES (NUEVO CÓDIGO)
        const amenitiesGrid = document.querySelector('.amenities-grid');

        if (amenitiesGrid) {
            amenitiesGrid.innerHTML = '';

            if (accommodation.amenities && accommodation.amenities.length > 0) {
                
                // Mapa simple para asignar iconos según el texto (puedes agregar más)
                const iconMap = {
                    'Wi-Fi': '📶',
                    'Piscina': '🏊‍♂️',
                    'Aire acondicionado': '❄️',
                    'Calefacción': '🔥',
                    'Cocina': '🍳',
                    'Estacionamiento': '🅿️',
                    'Pet friendly': '🐾',
                    'Televisión': '📺',
                    'Lavadora': '🧺',
                    'Vista al mar': '🌊',
                    'Gimnasio': '🏋️‍♂️'
                };

                accommodation.amenities.forEach(amenity => {
                    const div = document.createElement('div');
                    div.className = 'amenity-item';

                    const icon = Object.keys(iconMap).find(key => 
                        amenity.name.toLowerCase().includes(key.toLowerCase())
                    ) ? iconMap[Object.keys(iconMap).find(key => amenity.name.toLowerCase().includes(key.toLowerCase()))] : '✅';

                    div.innerHTML = `
                        <span class="amenity-icon">${icon}</span>
                        <span>${amenity.name}</span>
                    `;
                    amenitiesGrid.appendChild(div);
                });
            } else {
                amenitiesGrid.innerHTML = '<p>No se especificaron comodidades.</p>';
            }
        }

        // Recalcular precios con el valor real
        calculateTotal();

    } catch (error) {
        console.error(error);
    }

    // --- CÁLCULO DE PRECIO ---
    function calculateTotal() {
        const checkin = new Date(checkinInput.value);
        const checkout = new Date(checkoutInput.value);

        if (isValidDate(checkin) && isValidDate(checkout) && checkout > checkin) {
            const diffTime = Math.abs(checkout - checkin);
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const subtotal = NIGHTLY_RATE * nights;
            currentTotal = subtotal + CLEANING_FEE + SERVICE_FEE;

            priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x ${nights} noches</span><span>$${subtotal}</span>`;
            priceTotalElement.textContent = `$${currentTotal}`;
        } else {
            priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x 0 noches</span><span>$0</span>`;
            priceTotalElement.textContent = `$${CLEANING_FEE + SERVICE_FEE}`;
            currentTotal = 0;
        }
        validateForm();
    }

    function isValidDate(d) {
        return d instanceof Date && !isNaN(d);
    }

    checkinInput.addEventListener('change', calculateTotal);
    checkoutInput.addEventListener('change', calculateTotal);


    // --- VALIDACIÓN DEL FORMULARIO ---
    function validateForm() {
        const isDateValid = currentTotal > 0;
        let isFormValid = true;

        // Si NO está logueado, validar los campos del formulario
        if (!isLoggedIn) {
            const isNameValid = nameInput.value.trim() !== '';
            const isEmailValid = emailInput.value.trim() !== '';
            const isPhoneValid = iti ? iti.isValidNumber() : false;

            isFormValid = isNameValid && isEmailValid && isPhoneValid;
        }

        if (isDateValid && isFormValid) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('disabled');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('disabled');
        }
    }

    // Event listeners para validación (solo si existen)
    if (nameInput) nameInput.addEventListener('input', validateForm);
    if (emailInput) emailInput.addEventListener('input', validateForm);
    if (phoneInput) {
        phoneInput.addEventListener('input', validateForm);
        phoneInput.addEventListener('countrychange', validateForm);
    }

    // Inicializar estado del botón
    confirmBtn.disabled = true;
    // Llamar a validación inicial
    validateForm();

    // --- CONFIRMAR RESERVA ---
    confirmBtn.addEventListener('click', async function () {
        if (confirmBtn.disabled) return;

        // Preparar datos del huésped
        let guestIdToSend = null;
        let guestNameToSend = "";
        let guestEmailToSend = "";
        let guestPhoneToSend = "";

        if (isLoggedIn) {
            // Usar datos de localStorage
            guestIdToSend = parseInt(userId);
            guestNameToSend = localStorage.getItem('usuarioName') || "";
            guestEmailToSend = localStorage.getItem('userEmail') || "";
            // Teléfono vacío o de localStorage si existiera
        } else {
            // Usar datos del formulario
            guestNameToSend = nameInput.value.trim();
            guestEmailToSend = emailInput.value.trim();
            guestPhoneToSend = iti ? iti.getNumber() : "";
            // guestIdToSend se queda en null o 0, según lo que espere el backend para usuarios no registrados
        }

        // Objeto Reserva
        const reserva = {
            guestId: guestIdToSend, // Puede ser null si no está registrado
            accomodationId: parseInt(accommodationId),
            checkIn: checkinInput.value,
            checkOut: checkoutInput.value,
            totalPrice: currentTotal,
            guests: parseInt(guestsInput.value),
            guestName: guestNameToSend,
            guestEmail: guestEmailToSend,
            guestPhone: guestPhoneToSend
        };

        console.log("Reserva Payload:", reserva); // DEBUG

        // Configurar headers (Authorization solo si hay token)
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reservations`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(reserva)
            });

            if (!response.ok) throw new Error(await response.text());

            successMessage.style.display = 'block';
            confirmBtn.textContent = 'Confirmado';
            confirmBtn.disabled = true;
            successMessage.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error("Error:", error);
            alert("Error al reservar: " + error.message);
        }
    });

    const botonReservar = document.getElementById('btn-home');
    if (botonReservar) botonReservar.addEventListener('click', () => window.location.href = 'home.html');
});
