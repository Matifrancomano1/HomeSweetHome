document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirm-btn');
    const successMessage = document.getElementById('success-message');
    
    confirmBtn.addEventListener('click', function() {
        // Validación básica
        const nameInput = document.querySelector('input[type="text"]');
        const emailInput = document.querySelector('input[type="email"]');
        const phoneInput = document.querySelector('input[type="tel"]');
        
        if (!nameInput.value || !emailInput.value || !phoneInput.value) {
            alert('Por favor completa toda la información del huésped');
            return;
        }
        
        // Simular confirmación exitosa
        successMessage.style.display = 'block';
        confirmBtn.textContent = 'Reserva Confirmada';
        confirmBtn.style.backgroundColor = 'var(--success)';
        confirmBtn.disabled = true;
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Calcular total automáticamente basado en fechas
    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    const priceItems = document.querySelectorAll('.price-item');
    
    function calculateTotal() {
        const checkin = new Date(checkinInput.value);
        const checkout = new Date(checkoutInput.value);
        
        if (checkin && checkout && checkout > checkin) {
            const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
            const nightlyRate = 150;
            const cleaningFee = 50;
            const serviceFee = 45;
            
            const totalNights = nightlyRate * nights;
            const total = totalNights + cleaningFee + serviceFee;
            
            // Actualizar precios
            priceItems[0].innerHTML = `<span>$${nightlyRate} x ${nights} noches</span><span>$${totalNights}</span>`;
            document.querySelector('.price-total span:last-child').textContent = `$${total}`;
        }
    }
    
    checkinInput.addEventListener('change', calculateTotal);
    checkoutInput.addEventListener('change', calculateTotal);
});