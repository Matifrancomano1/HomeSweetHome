
        document.addEventListener('DOMContentLoaded', function() {
            // Form toggling
            const loginTab = document.getElementById('login-tab');
            const registerTab = document.getElementById('register-tab');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
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
            
            // Password toggle functionality
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
                    icon.textContent = '🔒';
                } else {
                    field.type = 'password';
                    icon.textContent = '👁️';
                }
            }
            
            // Form validation
            document.getElementById('login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value.trim();
                let isValid = true;
                
                // Reset errors
                document.getElementById('login-email-error').style.display = 'none';
                document.getElementById('login-password-error').style.display = 'none';
                
                // Email validation
                if (!email) {
                    document.getElementById('login-email-error').textContent = 'Por favor ingresa tu correo electrónico';
                    document.getElementById('login-email-error').style.display = 'block';
                    isValid = false;
                } else if (!validateEmail(email)) {
                    document.getElementById('login-email-error').textContent = 'Por favor ingresa un correo electrónico válido';
                    document.getElementById('login-email-error').style.display = 'block';
                    isValid = false;
                }
                
                // Password validation
                if (!password) {
                    document.getElementById('login-password-error').textContent = 'Por favor ingresa tu contraseña';
                    document.getElementById('login-password-error').style.display = 'block';
                    isValid = false;
                }
                
                if (isValid) {
                    // Aquí iría la lógica para enviar los datos al servidor
                    alert('Inicio de sesión exitoso! Redirigiendo...');
                    // window.location.href = 'dashboard.html';
                }
            });
            
            document.getElementById('register-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const firstName = document.getElementById('register-firstname').value.trim();
                const lastName = document.getElementById('register-lastname').value.trim();
                const email = document.getElementById('register-email').value.trim();
                const password = document.getElementById('register-password').value.trim();
                const confirmPassword = document.getElementById('register-confirm-password').value.trim();
                let isValid = true;
                
                // Reset errors
                const errorElements = document.querySelectorAll('#register-form .error-message');
                errorElements.forEach(el => {
                    el.style.display = 'none';
                });
                
                // First name validation
                if (!firstName) {
                    document.getElementById('register-firstname-error').textContent = 'Por favor ingresa tu nombre';
                    document.getElementById('register-firstname-error').style.display = 'block';
                    isValid = false;
                }
                
                // Last name validation
                if (!lastName) {
                    document.getElementById('register-lastname-error').textContent = 'Por favor ingresa tu apellido';
                    document.getElementById('register-lastname-error').style.display = 'block';
                    isValid = false;
                }
                
                // Email validation
                if (!email) {
                    document.getElementById('register-email-error').textContent = 'Por favor ingresa tu correo electrónico';
                    document.getElementById('register-email-error').style.display = 'block';
                    isValid = false;
                } else if (!validateEmail(email)) {
                    document.getElementById('register-email-error').textContent = 'Por favor ingresa un correo electrónico válido';
                    document.getElementById('register-email-error').style.display = 'block';
                    isValid = false;
                }
                
                // Password validation
                if (!password) {
                    document.getElementById('register-password-error').textContent = 'Por favor ingresa una contraseña';
                    document.getElementById('register-password-error').style.display = 'block';
                    isValid = false;
                } else if (password.length < 8) {
                    document.getElementById('register-password-error').textContent = 'La contraseña debe tener al menos 8 caracteres';
                    document.getElementById('register-password-error').style.display = 'block';
                    isValid = false;
                }
                
                // Confirm password validation
                if (!confirmPassword) {
                    document.getElementById('register-confirm-password-error').textContent = 'Por favor confirma tu contraseña';
                    document.getElementById('register-confirm-password-error').style.display = 'block';
                    isValid = false;
                } else if (password !== confirmPassword) {
                    document.getElementById('register-confirm-password-error').textContent = 'Las contraseñas no coinciden';
                    document.getElementById('register-confirm-password-error').style.display = 'block';
                    isValid = false;
                }
                
                if (isValid) {

                    // Aquí iría la lógica para enviar los datos al servidor
                    
                    const userData = {
                        firstName,
                        lastName,
                        email,
                        password
                    };
                    console.log('Datos del usuario:', userData);
                    alert('Registro exitoso! Redirigiendo...');
                    
                    // window.location.href = 'dashboard.html';
                }
            });
            
            function validateEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }
        });
   
        
            
    

        document.addEventListener('DOMContentLoaded', function() {
            // Form toggling
            const loginTab = document.getElementById('login-tab');
            const registerTab = document.getElementById('register-tab');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
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
            
            // Password toggle functionality
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
                    icon.textContent = '🔒';
                } else {
                    field.type = 'password';
                    icon.textContent = '👁️';
                }
            }
            
            // Form validation
            document.getElementById('login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value.trim();
                let isValid = true;
                
                // Reset errors
                document.getElementById('login-email-error').style.display = 'none';
                document.getElementById('login-password-error').style.display = 'none';
                
                // Email validation
                if (!email) {
                    document.getElementById('login-email-error').textContent = 'Por favor ingresa tu correo electrónico';
                    document.getElementById('login-email-error').style.display = 'block';
                    isValid = false;
                } else if (!validateEmail(email)) {
                    document.getElementById('login-email-error').textContent = 'Por favor ingresa un correo electrónico válido';
                    document.getElementById('login-email-error').style.display = 'block';
                    isValid = false;
                }
                
                // Password validation
                if (!password) {
                    document.getElementById('login-password-error').textContent = 'Por favor ingresa tu contraseña';
                    document.getElementById('login-password-error').style.display = 'block';
                    isValid = false;
                }
                
                if (isValid) {
                    // Aquí iría la lógica para enviar los datos al servidor
                    alert('Inicio de sesión exitoso! Redirigiendo...');
                    // window.location.href = 'dashboard.html';
                }
            });
            
            document.getElementById('register-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const firstName = document.getElementById('register-firstname').value.trim();
                const lastName = document.getElementById('register-lastname').value.trim();
                const email = document.getElementById('register-email').value.trim();
                const password = document.getElementById('register-password').value.trim();
                const confirmPassword = document.getElementById('register-confirm-password').value.trim();
                let isValid = true;
                
                // Reset errors
                const errorElements = document.querySelectorAll('#register-form .error-message');
                errorElements.forEach(el => {
                    el.style.display = 'none';
                });
                
                // First name validation
                if (!firstName) {
                    document.getElementById('register-firstname-error').textContent = 'Por favor ingresa tu nombre';
                    document.getElementById('register-firstname-error').style.display = 'block';
                    isValid = false;
                }
                
                // Last name validation
                if (!lastName) {
                    document.getElementById('register-lastname-error').textContent = 'Por favor ingresa tu apellido';
                    document.getElementById('register-lastname-error').style.display = 'block';
                    isValid = false;
                }
                
                // Email validation
                if (!email) {
                    document.getElementById('register-email-error').textContent = 'Por favor ingresa tu correo electrónico';
                    document.getElementById('register-email-error').style.display = 'block';
                    isValid = false;
                } else if (!validateEmail(email)) {
                    document.getElementById('register-email-error').textContent = 'Por favor ingresa un correo electrónico válido';
                    document.getElementById('register-email-error').style.display = 'block';
                    isValid = false;
                }
                
                // Password validation
                if (!password) {
                    document.getElementById('register-password-error').textContent = 'Por favor ingresa una contraseña';
                    document.getElementById('register-password-error').style.display = 'block';
                    isValid = false;
                } else if (password.length < 8) {
                    document.getElementById('register-password-error').textContent = 'La contraseña debe tener al menos 8 caracteres';
                    document.getElementById('register-password-error').style.display = 'block';
                    isValid = false;
                }
                
                // Confirm password validation
                if (!confirmPassword) {
                    document.getElementById('register-confirm-password-error').textContent = 'Por favor confirma tu contraseña';
                    document.getElementById('register-confirm-password-error').style.display = 'block';
                    isValid = false;
                } else if (password !== confirmPassword) {
                    document.getElementById('register-confirm-password-error').textContent = 'Las contraseñas no coinciden';
                    document.getElementById('register-confirm-password-error').style.display = 'block';
                    isValid = false;
                }
                
                if (isValid) {
                    // Aquí iría la lógica para enviar los datos al servidor
                    const userData = {
                        firstName,
                        lastName,
                        email,
                        password
                    };
                    console.log('Datos del usuario:', userData);
                    alert('Registro exitoso! Redirigiendo...');
                    // window.location.href = 'dashboard.html';
                }
            });
            
            function validateEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }
        }
    
    );
