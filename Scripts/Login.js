document.addEventListener('DOMContentLoaded', function () {
    // Form toggling
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');


    // Cambiar entre tabs de Login y Registro
    loginTab.addEventListener('click', function () {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    registerTab.addEventListener('click', function () {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    // Toggle de visibilidad de contraseñas
    document.getElementById('toggle-login-password').addEventListener('click', function () {
        const passwordField = document.getElementById('login-password');
        togglePasswordVisibility(passwordField, this);
    });

    document.getElementById('toggle-register-password').addEventListener('click', function () {
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
    document.getElementById('login-form').addEventListener('submit', function (e) {
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
            const loginData = {
                email: email,
                password: password
            };

            fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            })
                .then(response => {
                    if (!response.ok) {
                        // si no da status 2xx, lanza error
                        throw new Error('Email o contraseña incorrectos');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Login Response Data:", data); // DEBUG: Ver qué devuelve el backend
                    // Guardamos datos en el localstorage
                    // INTENTO DE RECUPERACIÓN ROBUSTA:
                    const token = data.accessToken || data.token || data.jwt;
                    localStorage.setItem('jwtToken', token);
                    localStorage.setItem('userEmail', data.email);
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('usuarioName', data.firstName)

                    alert('Inicio de sesion exitoso! Redirigiendo...');
                    window.location.href = 'home.html';
                })
                .catch(error => {
                    // error
                    console.error('Error de login:', error);
                    showError('login-password', error.message);
                })
        }
    });

    // Validación del formulario de Registro
    document.getElementById('register-form').addEventListener('submit', function (e) {
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

        // Validacion de rol
        if (!role) {
            showError('reister-role', 'Por favor selecciona un rol');
            isValid = false;
        }

        if (isValid) {
            const registerData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                role: role
            };

            fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.message || 'Error en el registro');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Registro exitoso: ', data);
                    alert('Registro exitoso! Por favor, iniciar sesión.');

                    loginTab.click();
                })
                .catch(error => {
                    console.error('Error de registro:', error);
                    showError('register-email', 'El correo electronico ya esta en uso');
                })
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
