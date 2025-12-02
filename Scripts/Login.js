document.addEventListener('DOMContentLoaded', function () {
    
    // --- ELEMENTOS DEL DOM ---
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- TOGGLE ENTRE TABS ---
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

    // --- VISIBILIDAD DE CONTRASEÑAS ---
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
            icon.textContent = '🔒'; 
        } else {
            field.type = 'password';
            icon.textContent = '👁️'; 
        }
    }

    // ==========================================
    //  LÓGICA DE LOGIN 
    // ==========================================
    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        let isValid = true;

        resetErrors('login');

        if (!email) {
            showError('login-email', 'Por favor ingresa tu correo electrónico');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('login-email', 'Por favor ingresa un correo electrónico válido');
            isValid = false;
        }

        if (!password) {
            showError('login-password', 'Por favor ingresa tu contraseña');
            isValid = false;
        }

        if (isValid) {
            const loginData = { email: email, password: password };

            fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            })
            .then(response => {
                if (!response.ok) throw new Error('Email o contraseña incorrectos');
                return response.json();
            })
            .then(data => {
                console.log("Login Response:", data);

                // 1. GUARDAR DATOS EN STORAGE
                sessionStorage.clear();
                localStorage.clear();
                const token = data.accessToken || data.token || data.jwt;
                if (!token) {
                    throw new Error('No se recibio el token de autenticacion');
                }                
                
                localStorage.setItem('jwtToken', token);
                localStorage.setItem('userEmail', data.email);
                localStorage.setItem('userId', data.id);
                localStorage.setItem('usuarioName', data.firstName);
                localStorage.setItem('userRole', data.role);
                
                // Guardamos el ROL 
                const userRole = data.role;

                // 2. REDIRECCIÓN SEGÚN ROL 
                alert(`¡Bienvenido ${data.firstName}! Redirigiendo...`);

                if (userRole === 'ADMIN') {
                    window.location.href = 'admin.html';
                } else if (userRole === 'HOST') {
                    window.location.href = 'anfitrion.html';
                } else {
                    window.location.href = 'home.html';
                }
            })
            .catch(error => {
                console.error('Error de login:', error);
                showError('login-password', 'Email o contraseña incorrectos');
            });
        }
    });

    // ==========================================
    //  LÓGICA DE REGISTRO
    // ==========================================
    document.getElementById('register-form').addEventListener('submit', function (e) {
        e.preventDefault();
        
        const firstName = document.getElementById('register-firstname').value.trim();
        const lastName = document.getElementById('register-lastname').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        
        // [CORRECCIÓN] Faltaba capturar el rol del select, si no existe el select, por defecto GUEST
        const roleSelect = document.getElementById('register-role'); 
        const role = roleSelect ? roleSelect.value : 'GUEST'; 

        let isValid = true;

        resetErrors('register');

        if (!firstName) { showError('register-firstname', 'Ingresa tu nombre'); isValid = false; }
        if (!lastName) { showError('register-lastname', 'Ingresa tu apellido'); isValid = false; }
        
        if (!email) { showError('register-email', 'Ingresa tu correo'); isValid = false; }
        else if (!validateEmail(email)) { showError('register-email', 'Correo inválido'); isValid = false; }

        if (!password) { showError('register-password', 'Ingresa contraseña'); isValid = false; }
        else if (password.length < 8) { showError('register-password', 'Mínimo 8 caracteres'); isValid = false; }

        if (!confirmPassword) { showError('register-confirm-password', 'Confirma contraseña'); isValid = false; }
        else if (password !== confirmPassword) { showError('register-confirm-password', 'No coinciden'); isValid = false; }

        if (isValid) {
            const registerData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                role: role
            };

            fetch(`${API_BASE_URL}/user`, { // Asegúrate que la ruta sea correcta (/auth/register o /users)
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.message || 'Error en registro'); });
                }
                return response.json();
            })
            .then(data => {
                console.log('Registro exitoso:', data);
                alert('¡Registro exitoso! Por favor inicia sesión.');
                loginTab.click(); // Cambiar al tab de login automáticamente
            })
            .catch(error => {
                console.error('Error:', error);
                showError('register-email', 'Hubo un error (posiblemente el email ya existe).');
            });
        }
    });

    // --- HELPERS ---
    function showError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function resetErrors(formType) {
        const errorElements = document.querySelectorAll(`#${formType}-form .error-message`);
        errorElements.forEach(el => el.style.display = 'none');
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});
