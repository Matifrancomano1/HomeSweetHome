

document.addEventListener('DOMContentLoaded', function () {
    const photoUpload = document.getElementById('main-photo-upload');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');

    // Activar input al hacer clic en el área
    photoUpload.addEventListener('click', () => photoInput.click());

    // Manejar selección de archivos
    photoInput.addEventListener('change', handleFiles);

    // Drag & Drop
    photoUpload.addEventListener('dragover', function (e) {
        e.preventDefault();
        photoUpload.style.borderColor = 'var(--primary)';
        photoUpload.style.background = 'rgba(52, 152, 219, 0.1)';
    });

    photoUpload.addEventListener('dragleave', function (e) {
        e.preventDefault();
        resetDropzoneStyle();
    });

    photoUpload.addEventListener('drop', function (e) {
        e.preventDefault();
        resetDropzoneStyle();

        const files = e.dataTransfer.files;
        photoInput.files = files;
        photoInput.dispatchEvent(new Event('change'));
    });

    function resetDropzoneStyle() {
        photoUpload.style.borderColor = '#ddd';
        photoUpload.style.background = 'white';
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        photoPreview.innerHTML = ''; // Limpiar preview

        Array.from(files).forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';
                imgContainer.style.borderRadius = '8px';
                imgContainer.style.overflow = 'hidden';

                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '100%';
                img.style.height = '150px';
                img.style.objectFit = 'cover';

                const removeBtn = document.createElement('button');
                removeBtn.textContent = '×';
                Object.assign(removeBtn.style, {
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    fontSize: '18px'
                });
                removeBtn.onclick = () => imgContainer.remove();

                if (index === 0) {
                    const mainLabel = document.createElement('div');
                    mainLabel.textContent = 'Principal';
                    Object.assign(mainLabel.style, {
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        background: 'var(--primary)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                    });
                    imgContainer.appendChild(mainLabel);
                }

                imgContainer.appendChild(img);
                imgContainer.appendChild(removeBtn);
                photoPreview.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        });
    }
});

// Validar número mínimo de fotos
function validateForm() {
    const photoCount = document.querySelectorAll('#photo-preview img').length;
    if (photoCount < 3) {
        alert('Por favor sube al menos 3 fotos de tu alojamiento.');
        return false;
    }
    return true;
}

// Simulación de navegación entre pasos
function nextStep() {
    if (!validateForm()) return;

    alert('Continuando a la configuración de precios...');
    // window.location.href = 'precios-alojamiento.html';
}

function previousStep() {
    alert('Volviendo a características...');
    // window.location.href = 'caracteristicas-alojamiento.html';
}
