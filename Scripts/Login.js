document.addEventListener('DOMContentLoaded', function() {
    // Form toggling
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const testUser = {
        email: "example@hotmail.com",
        password: "password123"
    }
    
    // Cambiar entre tabs de Login y Registro
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });
    
    registerTab.addEventListener('click', function() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
    
    // Toggle de visibilidad de contraseñas
    document.getElementById('toggle-login-password').addEventListener('click', function() {
        const passwordField = document.getElementById('login-password');
        togglePasswordVisibility(passwordField, this);
    });
    
    document.getElementById('toggle-register-password').addEventListener('click', function() {
        const passwordField = document.getElementById('register-password');
        togglePasswordVisibility(passwordField, this);
    });
    
    function togglePasswordVisibility(field, icon) {
        if (field.type === 'password') {
            field.type = 'text';
            icon.textContent = '🔒';  // Cambiar ícono a cerrado
        } else {
            field.type = 'password';
            icon.textContent = '👁️';  // Cambiar ícono a abierto
        }
    }

    // Validación del formulario de Login
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        let isValid = true;
        
        // Resetear errores
        resetErrors('login');
        
        // Validación del correo
        if (!email) {
            showError('login-email', 'Por favor ingresa tu correo electrónico');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('login-email', 'Por favor ingresa un correo electrónico válido');
            isValid = false;
        }
        
        // Validación de la contraseña
        if (!password) {
            showError('login-password', 'Por favor ingresa tu contraseña');
            isValid = false;
        }
        
        if (isValid) {

            if (email === testUser.email && password === testUser.password) {
                localStorage.setItem('usuarioName', 'Usuario')
                alert('Inicio de sesión exitoso! Redirigiendo...');
                window.location.href = 'home.html';
            } else {
                showError('login-password', 'Usuario o contraseña incorrectos');
            }
        }
    }); 

    // Validación del formulario de Registro
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const firstName = document.getElementById('register-firstname').value.trim();
        const lastName = document.getElementById('register-lastname').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        let isValid = true;

        // Resetear errores
        resetErrors('register');

        // Validación de nombre
        if (!firstName) {
            showError('register-firstname', 'Por favor ingresa tu nombre');
            isValid = false;
        }

        // Validación de apellido
        if (!lastName) {
            showError('register-lastname', 'Por favor ingresa tu apellido');
            isValid = false;
        }

        // Validación del correo
        if (!email) {
            showError('register-email', 'Por favor ingresa tu correo electrónico');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('register-email', 'Por favor ingresa un correo electrónico válido');
            isValid = false;
        }

        // Validación de contraseña
        if (!password) {
            showError('register-password', 'Por favor ingresa una contraseña');
            isValid = false;
        } else if (password.length < 8) {
            showError('register-password', 'La contraseña debe tener al menos 8 caracteres');
            isValid = false;
        }

        // Validación de confirmación de contraseña
        if (!confirmPassword) {
            showError('register-confirm-password', 'Por favor confirma tu contraseña');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('register-confirm-password', 'Las contraseñas no coinciden');
            isValid = false;
        }

        if (isValid) {
            const userData = {
                firstName,
                lastName,
                email,
                password
            };
            console.log('Datos del usuario:', userData);
            alert('Registro exitoso! Redirigiendo...');
            // Aquí iría la lógica de redirección
            // window.location.href = 'dashboard.html';
        }
    });

    // Función para mostrar los errores
    function showError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Función para resetear los errores
    function resetErrors(formType) {
        const errorElements = document.querySelectorAll(`#${formType}-form .error-message`);
        errorElements.forEach(el => {
            el.style.display = 'none';
        });
    }

    // Función para validar el formato del correo electrónico
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});
