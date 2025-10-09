document.addEventListener('DOMContentLoaded', function () {
    const confirmBtn = document.getElementById('confirm-btn');
    const successMessage = document.getElementById('success-message');

    const nameInput = document.querySelector('input[type="text"]');
    const emailInput = document.querySelector('input[type="email"]');
    const phoneInput = document.querySelector('input[type="tel"]');

    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    const priceItems = document.querySelectorAll('.price-item');
    const priceTotal = document.querySelector('.price-total span:last-child');

    const NIGHTLY_RATE = 150;
    const CLEANING_FEE = 50;
    const SERVICE_FEE = 45;

    // --- CONFIRMAR RESERVA ---
    confirmBtn.addEventListener('click', function () {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();

        // Validación básica
        if (!name || !email || !phone) {
            alert('Por favor completa toda la información del huésped.');
            return;
        }

        // Confirmación visual
        successMessage.style.display = 'block';
        confirmBtn.textContent = 'Reserva Confirmada';
        confirmBtn.style.backgroundColor = 'var(--success)';
        confirmBtn.disabled = true;

        successMessage.scrollIntoView({ behavior: 'smooth' });
    });

    // --- CÁLCULO DE PRECIO AUTOMÁTICO ---
    function calculateTotal() {
        const checkin = new Date(checkinInput.value);
        const checkout = new Date(checkoutInput.value);

        if (isValidDate(checkin) && isValidDate(checkout) && checkout > checkin) {
            const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
            const subtotal = NIGHTLY_RATE * nights;
            const total = subtotal + CLEANING_FEE + SERVICE_FEE;

            // Actualizar detalles
            priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x ${nights} noches</span><span>$${subtotal}</span>`;
            priceTotal.textContent = `$${total}`;
        } else {
            // Resetear precios si fechas inválidas
            priceItems[0].innerHTML = `<span>$${NIGHTLY_RATE} x 0 noches</span><span>$0</span>`;
            priceTotal.textContent = `$${CLEANING_FEE + SERVICE_FEE}`;
        }
    }

    function isValidDate(d) {
        return d instanceof Date && !isNaN(d);
    }

    checkinInput.addEventListener('change', calculateTotal);
    checkoutInput.addEventListener('change', calculateTotal);

    // --- Inicializar cálculo al cargar ---
    calculateTotal();

    //--boton que redirecciona de reserva a home
    const botonReservar = document.getElementById('btn-home')
    function redirectHome() {
        window.location.href = 'home.html';
    }
    botonReservar.addEventListener('click', redirectHome)
});
