document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current tab and content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Calendar navigation (simple example)
    const calendarActions = document.querySelectorAll('.calendar-actions .action-btn');
    calendarActions.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Funcionalidad de navegación del calendario');
            // Aquí iría la lógica para cambiar de mes
        });
    });
    
    // Reservation actions
    const reservationActions = document.querySelectorAll('.reservations-list .action-btn');
    reservationActions.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.textContent;
            const reservation = this.closest('.reservation-item');
            const guestName = reservation.querySelector('h4').textContent;
            
            if (action === 'Aceptar') {
                if (confirm(`¿Aceptar reserva de ${guestName}?`)) {
                    alert('Reserva aceptada exitosamente');
                }
            } else if (action === 'Rechazar') {
                if (confirm(`¿Rechazar reserva de ${guestName}?`)) {
                    alert('Reserva rechazada');
                }
            } else if (action === 'Ver') {
                alert(`Mostrando detalles de la reserva de ${guestName}`);
            }
        });
    });
    
    // Save settings
    document.querySelector('.save-btn').addEventListener('click', function() {
        alert('Configuración guardada exitosamente');
    });
});