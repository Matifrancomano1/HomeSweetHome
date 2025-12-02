document.addEventListener('DOMContentLoaded', async function () {
    
    // 1. OBTENER ID
    const urlParams = new URLSearchParams(window.location.search);
    const accommodationId = urlParams.get('id');

    if (!accommodationId) {
        alert('No se ha seleccionado ningún alojamiento');
        window.location.href = 'home.html';
        return;
    }

    // --- ELEMENTOS DOM ---
    const confirmBtn = document.getElementById('confirm-btn');
    const guestInfoSection = document.getElementById('guest-info-section');
    const loginWarning = document.getElementById('login-warning');
    const successMessage = document.getElementById('success-message');
    
    const priceItems = document.querySelectorAll('.price-item');
    const priceTotalElement = document.querySelector('.price-total span:last-child');
    
    const guestNameInput = document.getElementById('guest-name');
    const guestEmailInput = document.getElementById('guest-email');

    // --- VARIABLES ---
    let NIGHTLY_RATE = 0;
    const CLEANING_FEE = 20; 
    const SERVICE_FEE = 15;
    let currentTotal = 0;
    let bookedDates = []; 

    // --- DEFINICIÓN DE PICKERS (IMPORTANTE: GLOBAL) ---
    let checkinPicker = null;
    let checkoutPicker = null;

    // --- 2. GESTIÓN DE SESIÓN ---
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwtToken');
    const isLoggedIn = userId && token;

    if (isLoggedIn) {
        if(guestInfoSection) guestInfoSection.style.display = 'block';
        if(confirmBtn) confirmBtn.style.display = 'block';
        if(loginWarning) loginWarning.style.display = 'none';
        if(guestNameInput) guestNameInput.value = localStorage.getItem('usuarioName') || '';
        if(guestEmailInput) guestEmailInput.value = localStorage.getItem('userEmail') || '';
    } else {
        if(guestInfoSection) guestInfoSection.style.display = 'none';
        if(confirmBtn) confirmBtn.style.display = 'none';
        if(loginWarning) loginWarning.style.display = 'block';
    }

    // --- 3. CARGAR DATOS ---
    try {
        const response = await fetch(`${API_BASE_URL}/accomodations/${accommodationId}`);
        if (!response.ok) throw new Error('Error al cargar');
        const accommodation = await response.json();

        // UI
        const titleElem = document.querySelector('.property-title');
        const locElem = document.querySelector('.property-location span');
        const imgElem = document.querySelector('.main-image');

        if(titleElem) titleElem.textContent = accommodation.title;
        if(locElem) locElem.textContent = `📍 ${accommodation.location?.city || ''}, ${accommodation.location?.country || ''}`;
        
        NIGHTLY_RATE = accommodation.pricePerNight || 0;

        // Imágenes (Principal y Secundarias)
        if (accommodation.images && accommodation.images.length > 0) {
            // Principal
            if (imgElem) imgElem.style.backgroundImage = `url('${accommodation.images[0].url}')`;
            
            // Secundarias
            const secondaryDivs = document.querySelectorAll('.secondary-image');
            secondaryDivs.forEach((div, index) => {
                const imgIndex = index + 1; 
                if (accommodation.images[imgIndex]) {
                    div.style.backgroundImage = `url('${accommodation.images[imgIndex].url}')`;
                    div.style.display = 'block';
                } else {
                    div.style.backgroundColor = '#eee'; 
                }
            });
        }

        // CARGAR FECHAS OCUPADAS
        await loadAndBlockDates(accommodationId);

        // INICIAR CALENDARIO
        initCalendar();
        calculateTotal();

    } catch (error) {
        console.error(error);
    }

    // --- HELPER FECHAS (TIMEZONE SAFE) ---
    function normalizeDate(dateInput) {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        // Ajustamos la zona horaria para obtener la fecha calendario correcta (YYYY-MM-DD)
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toISOString().split('T')[0];
    }

    // --- CARGAR RESERVAS ---
    async function loadAndBlockDates(accId) {
        try {
            // Usamos el endpoint específico si existe, o filtramos
            // Nota: Si tienes el endpoint específico /accommodation/{id}, úsalo aquí.
            const res = await fetch(`${API_BASE_URL}/reservations/accommodation/${accId}`);
            
            // Fallback si el endpoint específico no existe (404/403), intentamos el general
            if (!res.ok) {
                console.warn("Endpoint específico falló, intentando general...");
                const resAll = await fetch(`${API_BASE_URL}/reservations`);
                if (!resAll.ok) return;
                const all = await resAll.json();
                
                // Filtramos manual
                const myReservations = all.filter(r => 
                    String(r.accomodation.id) === String(accId) && !r.deletedAt
                );
                
                bookedDates = myReservations.map(r => ({
                    from: normalizeDate(r.checkIn),
                    to: normalizeDate(r.checkOut)
                }));
                return;
            }

            const myReservations = await res.json();
            // Filtramos solo las no borradas
            const activeReservations = myReservations.filter(r => !r.deletedAt);

            bookedDates = activeReservations.map(r => ({
                from: normalizeDate(r.checkIn),
                to: normalizeDate(r.checkOut)
            }));

            console.log("Fechas bloqueadas cargadas:", bookedDates.length);

        } catch (e) { console.error("Error cargando ocupación:", e); }
    }

    // --- CALENDARIO (FLATPICKR) ---
    function initCalendar() {
        const commonConfig = {
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: bookedDates,
            locale: "es",
            disableMobile: true
        };

        // CHECK-IN
        checkinPicker = flatpickr("#checkin-date", {
            ...commonConfig,
            onChange: function(selectedDates, dateStr) {
                if (selectedDates[0]) {
                    const minCheckout = new Date(selectedDates[0]);
                    minCheckout.setDate(minCheckout.getDate() + 1); // Salida mín. 1 día después
                    
                    if (checkoutPicker) {
                        checkoutPicker.set('minDate', minCheckout);
                        
                        // Si la fecha de salida seleccionada ya no es válida, la borramos
                        const currentCheckout = checkoutPicker.selectedDates[0];
                        if (currentCheckout && currentCheckout <= selectedDates[0]) {
                            checkoutPicker.clear();
                        }
                        // Abrir checkout automáticamente
                        setTimeout(() => checkoutPicker.open(), 100);
                    }
                }
                calculateTotal();
            }
        });

        // CHECK-OUT
        checkoutPicker = flatpickr("#checkout-date", {
            ...commonConfig,
            onChange: function() {
                calculateTotal();
            }
        });
    }

    // --- CÁLCULO PRECIOS ---
    function calculateTotal() {
        const checkinInput = document.getElementById('checkin-date');
        const checkoutInput = document.getElementById('checkout-date');
        
        if (!checkinInput || !checkoutInput) return;

        const checkinVal = checkinInput.value;
        const checkoutVal = checkoutInput.value;

        if (checkinVal && checkoutVal) {
            const start = new Date(checkinVal);
            const end = new Date(checkoutVal);
            const diffTime = end - start;
            const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (nights > 0) {
                const subtotal = NIGHTLY_RATE * nights;
                currentTotal = subtotal + CLEANING_FEE + SERVICE_FEE;

                priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x ${nights} noches</span><span>$${subtotal}</span>`;
                priceTotalElement.textContent = `$${currentTotal}`;
                
                if (isLoggedIn && confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.classList.remove('disabled');
                }
                return;
            }
        }

        // Reset
        priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x 0 noches</span><span>$0</span>`;
        priceTotalElement.textContent = `$0`;
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('disabled');
        }
    }

    // --- CONFIRMAR ---
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function () {
            if (!isLoggedIn) return;

            const checkin = document.getElementById('checkin-date').value;
            const checkout = document.getElementById('checkout-date').value;

            if (!checkin || !checkout) {
                alert("Por favor selecciona las fechas.");
                return;
            }

            const originalText = confirmBtn.textContent;
            confirmBtn.textContent = "Procesando...";
            confirmBtn.disabled = true;

            const payload = {
                checkIn: checkin,
                checkOut: checkout,
                totalPrice: currentTotal,
                guestId: parseInt(userId),
                accomodationId: parseInt(accommodationId)
            };

            try {
                const response = await fetch(`${API_BASE_URL}/reservations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        throw new Error(errorJson.message || errorText);
                    } catch (e) {
                        throw new Error(errorText || 'Error al reservar');
                    }
                }

                // ÉXITO
                if (successMessage) {
                    successMessage.style.display = 'block';
                    successMessage.scrollIntoView({ behavior: 'smooth' });
                }
                confirmBtn.style.display = 'none';

                alert("¡Tu reserva se ha realizado con éxito!");

                // Recargar fechas bloqueadas para mostrar el cambio visual
                await loadAndBlockDates(accommodationId);
                // Reiniciar calendarios con las nuevas fechas bloqueadas
                initCalendar(); 
                
                // Reset visual del botón (por si quieren reservar otra cosa, aunque ya ocultamos el botón)
                confirmBtn.textContent = "Reserva Confirmada";

            } catch (error) {
                console.error(error);
                alert("Hubo un problema: " + error.message);
                confirmBtn.textContent = originalText;
                confirmBtn.disabled = false;
            }
        });
    }
});
