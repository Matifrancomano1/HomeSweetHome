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
    
    // Contenedor de amenities en el HTML
    const amenitiesContainer = document.querySelector('.amenities-grid');

    // Estado global
    let currentImages = []; 
    let availableAmenities = []; // Lista completa del backend

    // --- CARGA INICIAL ---
    try {
        const token = localStorage.getItem('jwtToken');
        
        // 1. Cargar TODAS las Amenities disponibles (Para dibujar los checkboxes)
        const resAmenities = await fetch(`${API_BASE_URL}/amenities`);
        if (resAmenities.ok) {
            availableAmenities = await resAmenities.json();
            renderAmenitiesCheckboxes(availableAmenities);
        }

        // 2. Cargar el Alojamiento
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
                // Buscamos el checkbox por su valor (ID) y lo marcamos
                const checkbox = document.querySelector(`input[name="amenities"][value="${amenity.id}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // C. Cargar Imágenes Existentes
        if (data.images) {
            currentImages = data.images.map(img => ({ 
                url: img.url,
                isExisting: true
            }));
            renderPreviews();
        }

    } catch (error) {
        console.error(error);
        alert("Error al cargar la información: " + error.message);
        window.location.href = 'anfitrion.html';
    }

    // --- FUNCIÓN PARA DIBUJAR AMENITIES DINÁMICAMENTE ---
    function renderAmenitiesCheckboxes(amenitiesList) {
        if (!amenitiesContainer) return;
        amenitiesContainer.innerHTML = ''; // Limpiar hardcode

        amenitiesList.forEach(am => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" name="amenities" value="${am.id}" data-name="${am.name}"> 
                ${am.name}
            `;
            amenitiesContainer.appendChild(label);
        });
    }

    // --- MANEJO DE FOTOS (Igual que antes) ---
    photoUpload.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
        this.value = '';
    });

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    async function handleFiles(files) {
        if (!files || files.length === 0) return;
        const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        for (const file of fileArray) {
            try {
                const base64 = await toBase64(file);
                currentImages.push({ url: base64, isExisting: false });
            } catch (err) { console.error(err); }
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

        if (currentImages.length < 3) {
            alert("Debes mantener al menos 3 fotos en el alojamiento.");
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

        try {
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const price = parseFloat(document.getElementById('price').value);
            const maxGuests = parseInt(document.getElementById('maxGuests').value);
            
            const address = document.getElementById('address').value;
            const city = document.getElementById('city').value;
            const country = document.getElementById('country').value;
            const postalCode = document.getElementById('postalCode').value;

            const checkedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'));
            const amenitiesList = checkedAmenities.map(checkbox => ({
                id: parseInt(checkbox.value),
                name: checkbox.dataset.name
            }));

            const payload = {
                title: title,
                description: description,
                pricePerNight: price,
                maxGuests: maxGuests,
                hostId: parseInt(localStorage.getItem('userId')),
                location: {
                    address: address,
                    city: city,
                    country: country,
                    postalCode: postalCode,
                    latitude: 0.0, 
                    longitude: 0.0
                },
                images: currentImages.map(img => ({ url: img.url })),
                amenities: amenitiesList
            };

            const token = localStorage.getItem('jwtToken');
            const response = await fetch(`${API_BASE_URL}/accomodations/${accommodationId}`, {
                method: 'PATCH',
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
            sessionStorage.removeItem('host_dashboard_lite'); // Borrar caché
            
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
