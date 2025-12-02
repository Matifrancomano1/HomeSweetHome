document.addEventListener('DOMContentLoaded', async function () {
    
    // --- VARIABLES ---
    const photoUpload = document.getElementById('main-photo-upload');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const createForm = document.getElementById('create-form');
    const amenitiesContainer = document.getElementById('amenities-container');
    
    let storedFiles = []; 

    // --- MANEJO DE FOTOS (Igual que antes pero integrado) ---
    photoUpload.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
        this.value = '';
    });

    // Drag & Drop
    photoUpload.addEventListener('dragover', (e) => { e.preventDefault(); photoUpload.style.borderColor = 'var(--primary)'; });
    photoUpload.addEventListener('dragleave', (e) => { e.preventDefault(); photoUpload.style.borderColor = '#ccc'; });
    photoUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        photoUpload.style.borderColor = '#ccc';
        handleFiles(e.dataTransfer.files);
    });

    // --- 1. CARGAR AMENITIES DISPONIBLES ---
    try {
        const res = await fetch(`${API_BASE_URL}/amenities`);
        if (res.ok) {
            const amenities = await res.json();
            renderAmenitiesCheckboxes(amenities);
        } else {
            amenitiesContainer.innerHTML = '<p style="color:red">Error al cargar comodidades.</p>';
        }
    } catch (error) {
        console.error("Error amenities:", error);
    }

    // Función para dibujar los checkboxes
    function renderAmenitiesCheckboxes(list) {
        if (!list || list.length === 0) {
            amenitiesContainer.innerHTML = '<p>No hay opciones disponibles.</p>';
            return;
        }
        amenitiesContainer.innerHTML = ''; // Limpiar "Cargando..."

        list.forEach(am => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            // Creamos el checkbox con el ID real de la base de datos
            label.innerHTML = `
                <input type="checkbox" name="amenities" value="${am.id}" data-name="${am.name}"> 
                ${am.name}
            `;
            amenitiesContainer.appendChild(label);
        });
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        storedFiles = [...storedFiles, ...newFiles];
        renderPreviews();
    }

    function removeFile(index) {
        storedFiles.splice(index, 1);
        renderPreviews();
    }

    function renderPreviews() {
        photoPreview.innerHTML = '';
        storedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const div = document.createElement('div');
                div.style.cssText = "position:relative; height:120px; border-radius:8px; overflow:hidden; border:1px solid #ddd;";
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = "width:100%; height:100%; object-fit:cover;";
                
                const btn = document.createElement('button');
                btn.innerHTML = '×';
                btn.style.cssText = "position:absolute; top:2px; right:2px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;";
                btn.onclick = () => removeFile(index);

                div.appendChild(img);
                div.appendChild(btn);
                photoPreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }

    // --- HELPER BASE64 ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // --- ENVÍO DEL FORMULARIO ---
    createForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita que se recargue la página

        // 1. Validar Fotos (Mínimo 3)
        if (storedFiles.length < 3) {
            alert('Por favor sube al menos 3 fotos obligatorias.');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Guardando...';
        submitBtn.disabled = true;

        try {
            // 2. CAPTURAR DATOS DEL FORMULARIO
            // Usamos .value para sacar lo que escribió el usuario
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const price = parseFloat(document.getElementById('price').value);
            const maxGuests = parseInt(document.getElementById('maxGuests').value);
            
            const address = document.getElementById('address').value;
            const city = document.getElementById('city').value;
            const country = document.getElementById('country').value;
            const postalCode = document.getElementById('postalCode').value;

            // 3. CAPTURAR AMENITIES (CHECKBOXES)
            const checkedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'));
            const amenitiesList = checkedAmenities.map(checkbox => ({
                id: parseInt(checkbox.value), // El ID que espera tu backend
                name: checkbox.dataset.name   // El nombre (opcional si el backend solo usa ID)
            }));

            // 4. CONVERTIR FOTOS A BASE64
            const imageObjects = await Promise.all(storedFiles.map(async (file) => {
                const base64String = await toBase64(file);
                return { url: base64String }; 
            }));

            // 5. OBTENER USUARIO ACTUAL (HOST)
            const userId = parseInt(localStorage.getItem('userId'));

            // 6. CONSTRUIR JSON FINAL
            const payload = {
                title: title,
                description: description,
                pricePerNight: price,
                maxGuests: maxGuests,
                
                // Asegúrate que tu DTO usa 'hostId' o 'guestId'. 
                // Dado tu entity 'host', lo más probable es 'hostId' o 'userId'
                hostId: userId, 

                location: {
                    address: address,
                    city: city,
                    country: country,
                    postalCode: postalCode,
                    latitude: 0.0, // Defaults
                    longitude: 0.0
                },

                images: imageObjects,
                amenities: amenitiesList
            };

            console.log("Enviando:", payload);

            // 7. ENVIAR AL BACKEND
            const token = localStorage.getItem('jwtToken');
            const response = await fetch(`${API_BASE_URL}/accomodations`, {
                method: 'POST',
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

            alert('¡Alojamiento publicado con éxito!');
            
            // Borrar caché del dashboard
            sessionStorage.removeItem('host_dashboard_data');
            
            // Volver
            window.location.href = 'anfitrion.html';

        } catch (error) {
            console.error(error);
            alert('Error al publicar: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
