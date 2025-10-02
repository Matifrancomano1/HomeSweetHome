document.addEventListener('DOMContentLoaded', function() {
    // Photo upload functionality
    const photoUpload = document.getElementById('main-photo-upload');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    
    photoUpload.addEventListener('click', function() {
        photoInput.click();
    });
    
    photoInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            photoPreview.innerHTML = '';
            
            Array.from(files).forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imgContainer = document.createElement('div');
                        imgContainer.style.position = 'relative';
                        imgContainer.style.borderRadius = '8px';
                        imgContainer.style.overflow = 'hidden';
                        
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.width = '100%';
                        img.style.height = '150px';
                        img.style.objectFit = 'cover';
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.textContent = '×';
                        removeBtn.style.position = 'absolute';
                        removeBtn.style.top = '5px';
                        removeBtn.style.right = '5px';
                        removeBtn.style.background = 'rgba(255,255,255,0.9)';
                        removeBtn.style.border = 'none';
                        removeBtn.style.borderRadius = '50%';
                        removeBtn.style.width = '25px';
                        removeBtn.style.height = '25px';
                        removeBtn.style.cursor = 'pointer';
                        removeBtn.onclick = function() {
                            imgContainer.remove();
                        };
                        
                        if (index === 0) {
                            const mainLabel = document.createElement('div');
                            mainLabel.textContent = 'Principal';
                            mainLabel.style.position = 'absolute';
                            mainLabel.style.top = '5px';
                            mainLabel.style.left = '5px';
                            mainLabel.style.background = 'var(--primary)';
                            mainLabel.style.color = 'white';
                            mainLabel.style.padding = '2px 8px';
                            mainLabel.style.borderRadius = '4px';
                            mainLabel.style.fontSize = '0.8rem';
                            imgContainer.appendChild(mainLabel);
                        }
                        
                        imgContainer.appendChild(img);
                        imgContainer.appendChild(removeBtn);
                        photoPreview.appendChild(imgContainer);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });
    
    // Drag and drop functionality
    photoUpload.addEventListener('dragover', function(e) {
        e.preventDefault();
        photoUpload.style.borderColor = 'var(--primary)';
        photoUpload.style.background = 'rgba(52, 152, 219, 0.1)';
    });
    
    photoUpload.addEventListener('dragleave', function(e) {
        e.preventDefault();
        photoUpload.style.borderColor = '#ddd';
        photoUpload.style.background = 'white';
    });
    
    photoUpload.addEventListener('drop', function(e) {
        e.preventDefault();
        photoUpload.style.borderColor = '#ddd';
        photoUpload.style.background = 'white';
        
        const files = e.dataTransfer.files;
        photoInput.files = files;
        const event = new Event('change');
        photoInput.dispatchEvent(event);
    });
});

function nextStep() {
    alert('Continuando a la configuración de precios...');
    // window.location.href = 'precios-alojamiento.html';
}

function previousStep() {
    alert('Volviendo a características...');
    // window.location.href = 'caracteristicas-alojamiento.html';
}

function validateForm() {
    const photos = document.querySelectorAll('#photo-preview img');
    if (photos.length < 3) {
        alert('Por favor sube al menos 3 fotos de tu alojamiento');
        return false;
    }
    return true;
}