

document.addEventListener('DOMContentLoaded', async function() {
  const form = document.querySelector('.new-property-form');

  // Función para mostrar error en un campo
  function mostrarError(idCampo, mensaje) {
    let errorId = idCampo + '-error';
    let errorElem = document.getElementById(errorId);

    if (!errorElem) {
      errorElem = document.createElement('div');
      errorElem.id = errorId;
      errorElem.className = 'error-message';
      errorElem.style.color = 'red';
      errorElem.style.fontSize = '0.9em';
      errorElem.style.marginTop = '0.25rem';
      const campo = document.getElementById(idCampo);
      campo.parentNode.appendChild(errorElem);
    }
    errorElem.textContent = mensaje;
  }

  // Función para limpiar todos los errores
  function limpiarErrores() {
    const errores = document.querySelectorAll('.error-message');
    errores.forEach(e => e.remove());
  }

  // Función para validar URL 
  function esUrlValida(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    limpiarErrores();

    // Obtener valores
    const nombre = document.getElementById('nombre').value.trim();
    const ubicacion = document.getElementById('ubicacion').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const comodidades = document.getElementById('comodidades').value.trim();
    const precio = document.getElementById('precio').value.trim();
    const huespedes = document.getElementById('huespedes').value.trim();
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const imagenes = document.getElementById('imagenes').value.trim();

    let valido = true;

    // Validaciones
    if (!nombre) {
      mostrarError('nombre', 'El nombre del alojamiento es obligatorio.');
      valido = false;
    }

    if (!ubicacion) {
      mostrarError('ubicacion', 'La ubicación es obligatoria.');
      valido = false;
    }

    // No obligatorio pero si viene, validar longitud mínima en descripción
    if (descripcion.length > 0 && descripcion.length < 10) {
      mostrarError('descripcion', 'La descripción debe tener al menos 10 caracteres si se ingresa.');
      valido = false;
    }

    if (!precio || isNaN(precio) || Number(precio) < 0) {
      mostrarError('precio', 'Ingrese un precio válido mayor o igual a 0.');
      valido = false;
    }

    if (!huespedes || isNaN(huespedes) || Number(huespedes) < 1) {
      mostrarError('huespedes', 'Ingrese una capacidad de huéspedes válida (mínimo 1).');
      valido = false;
    }

    if (!checkin) {
      mostrarError('checkin', 'Seleccione la fecha de check-in.');
      valido = false;
    }

    if (!checkout) {
      mostrarError('checkout', 'Seleccione la fecha de check-out.');
      valido = false;
    }

    if (checkin && checkout) {
      const fechaCheckin = new Date(checkin);
      const fechaCheckout = new Date(checkout);
      if (fechaCheckout <= fechaCheckin) {
        mostrarError('checkout', 'La fecha de check-out debe ser posterior al check-in.');
        valido = false;
      }
    }

    if (imagenes && !esUrlValida(imagenes)) {
      mostrarError('imagenes', 'Ingrese una URL válida para la imagen.');
      valido = false;
    }

    if (!valido) return;

    // Confirmacion y redireccion a home
    alert('Alojamiento publicado exitosamente!');
    window.location.href = 'home.html';  


    // Limpiar formulario
    form.reset();

  });

  //Datos para enviar al backend

  const alojamiento = {
    nombre,
    ubicacion,
    descripcion,
    comodidades,
    precio: Number(precio),
    huespedes: Number(huespedes),
    imagenes: imagenes
  };

  //Llamada a los endpoints

  try {
    const response = await fetch('http://localhost:8080/api/accomodations',{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(alojamiento)
    });

    if (!response.ok) throw new Error ("Error al intentar publicar el alojamiento");

    const data = await response.json();
    console.log("alojamiento guardado correctamente xd: ", data);
    alert("Alojamiento publicado exitosamente =) ");
    window.location.href = "home.html";
    form.reset();
    
    //manejo de errores

  } catch(error) {
    console.error("Error", error);
    alert ("HUbo un problema para publicarlo al alojamiento.");
  }

  
});
