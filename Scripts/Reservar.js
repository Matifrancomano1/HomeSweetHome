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

    // --- DEFINICIÓN DE PICKERS ---
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

        // A. Datos Principales
        const titleElem = document.querySelector('.property-title');
        const locElem = document.querySelector('.property-location span');
        const imgElem = document.querySelector('.main-image');

        if(titleElem) titleElem.textContent = accommodation.title;
        if(locElem) locElem.textContent = `📍 ${accommodation.location?.city || ''}, ${accommodation.location?.country || ''}`;
        
        NIGHTLY_RATE = accommodation.pricePerNight || 0;

        // B. Imágenes
        if (accommodation.images && accommodation.images.length > 0) {
            if (imgElem) imgElem.style.backgroundImage = `url('${accommodation.images[0].url}')`;
            
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

        // C. Amenities
        renderAmenities(accommodation.amenities);

        // D. Anfitrión
        renderHostInfo(accommodation.host);

        // Reviews
        renderReviews(accommodation.reviews);

        // E. Cargar Fechas y Calendario
        await loadAndBlockDates(accommodationId);
        initCalendar();
        calculateTotal();

    } catch (error) {
        console.error(error);
    }

    // --- FUNCIONES RENDERIZADO ---

    function renderAmenities(amenities) {
        const container = document.getElementById('amenities-container');
        if (!container) return;
        container.innerHTML = '';

        if (!amenities || amenities.length === 0) {
            container.innerHTML = '<p>No se especificaron comodidades.</p>';
            return;
        }

        const iconMap = {
            'Wifi': '📶', 'Wi-Fi': '📶', 'Internet': '🌐',
            'Piscina': '🏊‍♂️', 'Pool': '🏊‍♂️',
            'Cocina': '🍳', 'Kitchen': '🍳',
            'Estacionamiento': '🅿️', 'Parking': '🅿️',
            'Aire': '❄️', 'AC': '❄️',
            'TV': '📺', 'Pet': '🐾'
        };

        amenities.forEach(am => {
            const div = document.createElement('div');
            div.className = 'amenity-item';
            
            const icon = Object.keys(iconMap).find(key => am.name.includes(key)) 
                        ? iconMap[Object.keys(iconMap).find(key => am.name.includes(key))] 
                        : '✅';

            div.innerHTML = `<span class="amenity-icon">${icon}</span><span>${am.name}</span>`;
            container.appendChild(div);
        });
    }

    function renderHostInfo(host) {
        const container = document.getElementById('host-info-container');
        if (!host || !container) return;

        container.style.display = 'flex'; 
        const avatar = container.querySelector('.host-avatar');
        const name = container.querySelector('h4');
        const desc = container.querySelector('p');

        if (name) name.textContent = `${host.firstName} ${host.lastName}`;
        if (desc) desc.textContent = `Anfitrión · ${host.email}`;

        if (avatar) {
            if (host.profilePictureUrl) {
                avatar.style.backgroundImage = `url('${host.profilePictureUrl}')`;
                avatar.textContent = '';
            } else {
                avatar.style.backgroundImage = 'none';
                avatar.style.backgroundColor = 'var(--primary)';
                avatar.style.color = 'white';
                avatar.style.display = 'flex';
                avatar.style.alignItems = 'center';
                avatar.style.justifyContent = 'center';
                avatar.textContent = host.firstName.charAt(0).toUpperCase();
            }
        }
    }


    // --- HELPER FECHAS ---
    function normalizeDate(dateInput) {
        if (!dateInput) return null;
        const date = new Date(dateInput);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toISOString().split('T')[0];
    }

    // --- CARGAR RESERVAS ---
    async function loadAndBlockDates(accId) {
        try {
            const res = await fetch(`${API_BASE_URL}/reservations/accommodation/${accId}`);
            
            if (!res.ok) {
                const resAll = await fetch(`${API_BASE_URL}/reservations`);
                if (!resAll.ok) return;
                const all = await resAll.json();
                const filtered = all.filter(r => String(r.accomodation.id) === String(accId) && !r.deletedAt);
                bookedDates = filtered.map(r => ({ from: normalizeDate(r.checkIn), to: normalizeDate(r.checkOut) }));
                return;
            }

            const myReservations = await res.json();
            const activeReservations = myReservations.filter(r => !r.deletedAt);
            bookedDates = activeReservations.map(r => ({
                from: normalizeDate(r.checkIn),
                to: normalizeDate(r.checkOut)
            }));
            console.log("Fechas bloqueadas:", bookedDates.length);

        } catch (e) { console.error(e); }
    }

    // --- A. LÓGICA PARA CARGAR RESEÑAS ---
    function renderReviews(reviews) {
        const container = document.getElementById('reviews-list');
        if (!container) return;
        container.innerHTML = '';

        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<p style="color:#777;">Aún no hay reseñas. ¡Sé el primero!</p>';
            return;
        }

        reviews.forEach(rev => {
            const card = document.createElement('div');
            card.className = 'review-card';
            
            // Estrellas visuales
            const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
            const userName = rev.user ? rev.user.firstName : 'Usuario';
            
            card.innerHTML = `
                <div class="review-header">
                    <span>${userName}</span>
                    <span class="review-date">${rev.date || ''}</span>
                </div>
                <div class="review-rating">${stars}</div>
                <p style="margin-top:0.5rem; color:#555;">"${rev.comment}"</p>
            `;
            container.appendChild(card);
        });
    }

    // --- B. LÓGICA PARA EL FORMULARIO DE RESEÑA ---
    
    // 1. Mostrar formulario solo si está logueado
    if (isLoggedIn) {
        const formContainer = document.getElementById('review-form-container');
        if (formContainer) formContainer.style.display = 'block';
    }

    // 2. Manejo de Estrellas (Click)
    const stars = document.querySelectorAll('.star-rating .star');
    const ratingInput = document.getElementById('rating-input');

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const val = parseInt(this.getAttribute('data-value'));
            ratingInput.value = val;
            
            // Pintar estrellas
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= val) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // 3. Enviar Reseña
    const submitReviewBtn = document.getElementById('submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', async () => {
            const rating = parseInt(ratingInput.value);
            const comment = document.getElementById('review-comment').value;

            if (rating === 0) {
                alert("Por favor selecciona una puntuación (estrellas).");
                return;
            }
            if (!comment.trim()) {
                alert("Por favor escribe un comentario.");
                return;
            }

            try {
                const payload = {
                    rating: rating,
                    comment: comment,
                    userId: parseInt(userId),
                    accomodationId: parseInt(accommodationId)
                };

                const response = await fetch(`${API_BASE_URL}/reviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Error al publicar reseña');

                alert("¡Gracias por tu opinión!");
                window.location.reload(); // Recargar para ver la nueva reseña

            } catch (error) {
                console.error(error);
                alert("Hubo un error: " + error.message);
            }
        });
    }

    // --- CALENDARIO ---
    function initCalendar() {
        const commonConfig = {
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: bookedDates,
            locale: "es",
            disableMobile: true
        };

        checkinPicker = flatpickr("#checkin-date", {
            ...commonConfig,
            onChange: function(selectedDates) {
                if (selectedDates[0]) {
                    const minCheckout = new Date(selectedDates[0]);
                    minCheckout.setDate(minCheckout.getDate() + 1);
                    
                    if (checkoutPicker) {
                        checkoutPicker.set('minDate', minCheckout);
                        const currentCheckout = checkoutPicker.selectedDates[0];
                        if (currentCheckout && currentCheckout <= selectedDates[0]) {
                            checkoutPicker.clear();
                        }
                        setTimeout(() => checkoutPicker.open(), 100);
                    }
                }
                calculateTotal();
            }
        });

        checkoutPicker = flatpickr("#checkout-date", {
            ...commonConfig,
            onChange: function() { calculateTotal(); }
        });
    }

    // --- PRECIOS ---
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

                if(priceItems[0]) priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x ${nights} noches</span><span>$${subtotal}</span>`;
                if(priceTotalElement) priceTotalElement.textContent = `$${currentTotal}`;
                
                if (isLoggedIn && confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.classList.remove('disabled');
                }
                return;
            }
        }

        if(priceItems[0]) priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x 0 noches</span><span>$0</span>`;
        if(priceTotalElement) priceTotalElement.textContent = `$0`;
        if(confirmBtn) {
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

                if (successMessage) {
                    successMessage.style.display = 'block';
                    successMessage.scrollIntoView({ behavior: 'smooth' });
                }
                confirmBtn.style.display = 'none';

                alert("¡Tu reserva se ha realizado con éxito!");

                await loadAndBlockDates(accommodationId);
                initCalendar(); 
                
                confirmBtn.textContent = "Reserva Confirmada";

            } catch (error) {
                console.error(error);
                alert("Hubo un problema: " + error.message);
                confirmBtn.textContent = originalText;
                confirmBtn.disabled = false;
            }
        });
    }
    
    // Volver
    const btnHome = document.getElementById('btn-home');
    if(btnHome) btnHome.addEventListener('click', () => window.location.href = 'home.html');
});
