document.addEventListener('DOMContentLoaded', function () {
    // --- TAB FUNCTIONALITY ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    //creacion de boton que redirecciona a Home
    const boton = document.getElementById('boton-home')
    
    function redirectHome() {
        window.location.href = 'home.html';
    }

    boton.addEventListener('click', redirectHome)

    //-- boton que redirecciona a Reserva
    const botonReserva = document.getElementById('btn-reserva')
    function redirectReserva() {
        window.location.href = 'reservar.html';
    }
    botonReserva.addEventListener('click', redirectReserva)


    // --- CALENDAR NAVIGATION ---
    const calendarHeader = document.querySelector('.calendar-header h3');
    const calendarActions = document.querySelectorAll('.calendar-actions .action-btn');
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    let currentMonth = 10; // Noviembre (base 0)

    function updateCalendarMonth() {
        calendarHeader.textContent = `${months[currentMonth]} 2023`;
        alert(`Mes cambiado a ${months[currentMonth]}`);
        // Aquí puedes recargar los días según el mes si agregas esa lógica
    }

    calendarActions.forEach(btn => {
        btn.addEventListener('click', function () {
            const action = this.textContent.trim();
            if (action === '‹') {
                currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
            } else if (action === '›') {
                currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
            } else if (action === 'Hoy') {
                currentMonth = new Date().getMonth();
            }
            updateCalendarMonth();
        });
    });

    // --- CALENDAR DAY INTERACTION ---
    const calendarDays = document.querySelectorAll('.calendar-day:not(.header)');

    calendarDays.forEach(day => {
        day.addEventListener('click', function () {
            if (day.classList.contains('booked')) {
                day.classList.remove('booked');
                day.classList.add('available');
                alert(`Día ${day.textContent} marcado como disponible.`);
            } else if (day.classList.contains('available')) {
                day.classList.remove('available');
                day.classList.add('booked');
                alert(`Día ${day.textContent} reservado.`);
            } else if (day.classList.contains('pending')) {
                alert(`El día ${day.textContent} está pendiente de confirmación.`);
            }
        });
    });

    // --- RESERVATION ACTIONS ---
    const reservationActions = document.querySelectorAll('.reservations-list .action-btn');

    reservationActions.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const action = this.textContent.trim();
            const reservation = this.closest('.reservation-item');
            const guestName = reservation.querySelector('h4').textContent;

            if (action === 'Aceptar') {
                if (confirm(`¿Aceptar reserva de ${guestName}?`)) {
                    alert('Reserva aceptada exitosamente');
                    reservation.querySelector('.status').textContent = 'Confirmada';
                    reservation.querySelector('.status').className = 'status confirmed';
                    this.remove(); // Elimina botón "Aceptar"
                    const rejectBtn = reservation.querySelector('.btn-secondary');
                    if (rejectBtn) rejectBtn.remove();
                }
            } else if (action === 'Rechazar') {
                if (confirm(`¿Rechazar reserva de ${guestName}?`)) {
                    alert('Reserva rechazada');
                    reservation.remove(); // Elimina la reserva de la lista
                }
            } else if (action === 'Ver') {
                alert(`Mostrando detalles de la reserva de ${guestName}`);
                // Aquí podrías abrir un modal con más detalles
            }
        });
    });

    // --- SAVE SETTINGS ---
    document.querySelector('.save-btn').addEventListener('click', function () {
        const inputs = document.querySelectorAll('.availability-settings input');
        const selects = document.querySelectorAll('.availability-settings select');

        const price = inputs[0].value;
        const minNights = inputs[1].value;
        const maxGuests = inputs[2].value;
        const checkIn = selects[0].value;
        const checkOut = selects[1].value;

        alert(
            `Configuración guardada:\n` +
            `Precio por noche: $${price}\n` +
            `Mínimo de noches: ${minNights}\n` +
            `Máximo de huéspedes: ${maxGuests}\n` +
            `Check-in: ${checkIn}\n` +
            `Check-out: ${checkOut}`
        );

        // En un sistema real, aquí enviarías los datos a tu backend
    });
});
