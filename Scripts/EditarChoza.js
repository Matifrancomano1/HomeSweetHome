/* =======================================================
   ARCHIVO: EditarChoza.js
   Lógica para editar un alojamiento existente
   ======================================================= */

   document.addEventListener('DOMContentLoaded', async function () {
    
    // 1. Obtener ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const accommodationId = urlParams.get('id');

    if (!accommodationId) {
        alert("No se especificó un alojamiento para editar.");
        window.location.href = 'anfitrion.html';
        return;
    }

    // --- VARIABLES ---
    const photoUpload = document.getElementById('main-photo-upload');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const editForm = document.getElementById('edit-form');
    const submitBtn = document.getElementById('submit-btn');

    // Estado global de imágenes
    // currentImages guardará tanto objetos {url: "..."} que vienen del back
    // como archivos nuevos convertidos a base64.
    let currentImages = []; 
    let newFilesToProcess = []; // Archivos nuevos seleccionados por el usuario

    // --- CARGAR DATOS DEL ALOJAMIENTO ---
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`${API_BASE_URL}/accomodations/${accommodationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("No se pudo cargar el alojamiento");

        const data = await response.json();
        console.log("Datos cargados:", data);

        // A. Rellenar Inputs
        document.getElementById('title').value = data.title || '';
        document.getElementById('description').value = data.description || '';
        document.getElementById('price').value = data.pricePerNight || '';
        document.getElementById('maxGuests').value = data.maxGuests || '';
        
        if (data.location) {
            document.getElementById('address').value = data.location.address || '';
            document.getElementById('city').value = data.location.city || '';
            document.getElementById('country').value = data.location.country || '';
            document.getElementById('postalCode').value = data.location.postalCode || '';
        }

        // B. Marcar Amenities (Checkboxes)
        if (data.amenities) {
            data.amenities.forEach(amenity => {
                // Buscamos el checkbox que tenga el mismo ID o Nombre
                // Asumimos que el value del checkbox es el ID
                const checkbox = document.querySelector(`input[name="amenities"][value="${amenity.id}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // C. Cargar Imágenes Existentes
        if (data.images) {
            currentImages = data.images.map(img => ({ 
                url: img.url,
                isExisting: true // Marca para saber que ya existía
            }));
            renderPreviews();
        }

    } catch (error) {
        console.error(error);
        alert("Error al cargar la información: " + error.message);
        window.location.href = 'anfitrion.html';
    }


    // --- MANEJO DE FOTOS (Nuevas) ---
    photoUpload.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
        this.value = '';
    });

    // Helper Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    async function handleFiles(files) {
        if (!files || files.length === 0) return;
        
        // Convertimos los nuevos archivos a Base64 inmediatamente para previsualizar y guardar
        const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        for (const file of fileArray) {
            try {
                const base64 = await toBase64(file);
                // Agregamos al array global
                currentImages.push({
                    url: base64,
                    isExisting: false // Es nueva
                });
            } catch (err) {
                console.error("Error leyendo archivo", err);
            }
        }
        renderPreviews();
    }

    function removeImage(index) {
        currentImages.splice(index, 1);
        renderPreviews();
    }

    function renderPreviews() {
        photoPreview.innerHTML = '';
        currentImages.forEach((imgObj, index) => {
            const div = document.createElement('div');
            div.style.cssText = "position:relative; height:120px; border-radius:8px; overflow:hidden; border:1px solid #ddd;";
            
            const img = document.createElement('img');
            img.src = imgObj.url;
            img.style.cssText = "width:100%; height:100%; object-fit:cover;";
            
            const btn = document.createElement('button');
            btn.innerHTML = '×';
            btn.style.cssText = "position:absolute; top:2px; right:2px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;";
            // Importante: type="button" para que no envíe el form al hacer clic
            btn.type = "button"; 
            btn.onclick = () => removeImage(index);

            div.appendChild(img);
            div.appendChild(btn);
            photoPreview.appendChild(div);
        });
    }


    // --- ENVIAR CAMBIOS (PATCH) ---
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validación fotos
        if (currentImages.length < 3) {
            alert("Debes mantener al menos 3 fotos en el alojamiento.");
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

        try {
            // 1. Capturar datos del formulario
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const price = parseFloat(document.getElementById('price').value);
            const maxGuests = parseInt(document.getElementById('maxGuests').value);
            
            // Ubicación
            const address = document.getElementById('address').value;
            const city = document.getElementById('city').value;
            const country = document.getElementById('country').value;
            const postalCode = document.getElementById('postalCode').value;

            // Amenities
            const checkedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'));
            const amenitiesList = checkedAmenities.map(checkbox => ({
                id: parseInt(checkbox.value),
                name: checkbox.dataset.name
            }));

            // 2. Construir el Payload (Solo mandamos lo que queremos actualizar)
            // Nota: En un PATCH completo, enviamos el estado final deseado.
            const payload = {
                title: title,
                description: description,
                pricePerNight: price,
                maxGuests: maxGuests,
                
                // Mantenemos el hostId original (el backend suele ignorarlo en update, pero por si acaso)
                hostId: parseInt(localStorage.getItem('userId')),

                location: {
                    address: address,
                    city: city,
                    country: country,
                    postalCode: postalCode,
                    // Si tuviéramos lat/long originales, deberíamos preservarlos o dejarlos en 0 si no se editan
                    latitude: 0.0, 
                    longitude: 0.0
                },

                // Enviamos el array FINAL de imágenes (mezcla de viejas y nuevas)
                // El backend debería reemplazar la lista anterior con esta nueva lista
                images: currentImages.map(img => ({ url: img.url })),

                amenities: amenitiesList
            };

            console.log("Enviando Update:", payload);

            // 3. Enviar PATCH
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(`${API_BASE_URL}/accomodations/${accommodationId}`, {
                method: 'PATCH', // O PUT, depende de tu backend. Tu controller tiene @PatchMapping
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            alert("Alojamiento actualizado correctamente.");
            
            // Limpiar caché para ver los cambios
            sessionStorage.removeItem('host_dashboard_data');
            
            window.location.href = 'anfitrion.html';

        } catch (error) {
            console.error(error);
            alert("Error al actualizar: " + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

});
