document.addEventListener('DOMContentLoaded', async function () {
    
    // --- VARIABLES DE ESTADO ---
    let allUsers = []; 
    let filteredUsers = []; 

    // --- ELEMENTOS DOM ---
    const tableBody = document.getElementById('users-table-body');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-field');
    const sortSelect = document.getElementById('sort-field');
    const userModal = document.getElementById('user-modal');
    const userForm = document.getElementById('user-form');

    // --- 1. VERIFICAR ADMIN ---
    const role = await checkAdminRole();
    if (!role) return; // Si no es admin, se redirige

    // --- 2. CARGAR USUARIOS ---
    await loadUsers();

    // --- 3. EVENT LISTENERS ---
    searchInput.addEventListener('input', applyFilters);
    filterSelect.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters); // Aplicar filtros llama a ordenar también

    // --- FUNCIONES LÓGICAS ---

    async function checkAdminRole() {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('jwtToken');
        
        if (!userId || !token) {
            window.location.href = 'login.html';
            return false;
        }

        try {
            // Verificamos el usuario actual
            const user = await fetchConToken(`${API_BASE_URL}/users/${userId}`);
            if (user.role !== 'ADMIN') {
                alert('Acceso denegado. Se requieren permisos de administrador.');
                window.location.href = 'home.html';
                return false;
            }
            document.getElementById('admin-name').textContent = user.firstName;
            return true;
        } catch (error) {
            console.error(error);
            window.location.href = 'login.html';
            return false;
        }
    }

    async function loadUsers() {
        try {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando usuarios...</td></tr>';
            allUsers = await fetchConToken(`${API_BASE_URL}/users`);
            
            // Inicialmente, los filtrados son todos
            filteredUsers = [...allUsers];
            applyFilters(); // Esto renderiza la tabla también
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar usuarios</td></tr>';
        }
    }

    // --- FILTRADO Y ORDENAMIENTO ---
    function applyFilters() {
        const searchText = searchInput.value.toLowerCase();
        const filterField = filterSelect.value;
        const sortValue = sortSelect.value;

        // 1. Filtrar
        filteredUsers = allUsers.filter(user => {
            // Buscamos coincidencia en todos los campos relevantes
            const matchesSearch = 
                (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchText) ||
                user.email.toLowerCase().includes(searchText) ||
                user.role.toLowerCase().includes(searchText);

            // Filtro específico (opcional si queremos ser más estrictos con el select)
            let matchesField = true;
            if (filterField !== 'all' && searchText.length > 0) {
                // Si el usuario seleccionó "Nombre" y escribe algo, solo busca en nombre
                if (filterField === 'firstName') matchesField = user.firstName.toLowerCase().includes(searchText);
                if (filterField === 'email') matchesField = user.email.toLowerCase().includes(searchText);
                if (filterField === 'role') matchesField = user.role.toLowerCase().includes(searchText);
            }

            // Usamos matchesSearch general si está en 'all', sino el específico
            return filterField === 'all' ? matchesSearch : matchesField;
        });

        // 2. Ordenar
        filteredUsers.sort((a, b) => {
            const [field, direction] = sortValue.split('-');
            
            let valA, valB;
            
            if (field === 'id') { valA = a.id; valB = b.id; }
            if (field === 'name') { valA = a.firstName.toLowerCase(); valB = b.firstName.toLowerCase(); }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        renderTable();
    }

    // --- RENDERIZADO TABLA ---
    function renderTable() {
        tableBody.innerHTML = '';

        if (filteredUsers.length === 0) {
            document.getElementById('no-results').style.display = 'block';
            return;
        }
        document.getElementById('no-results').style.display = 'none';

        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            
            // 1. Iniciales y Clases
            const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '?';
            const roleClass = `badge-role-${(user.role || 'guest').toLowerCase()}`;
            const statusClass = user.isActive ? 'badge-status-active' : 'badge-status-inactive';
            const statusText = user.isActive ? 'Activo' : 'Inactivo';

            // 2. Formatear Ubicación (Ciudad + Provincia)
            const locationParts = [user.city, user.province, user.country].filter(part => part); 
            const locationText = locationParts.length > 0 ? locationParts.join(', ') : '-';

            // 3. Formatear Fecha de Nacimiento
            let dobText = '-';
            if (user.dateOfBirth) {
                const dateObj = new Date(user.dateOfBirth + 'T00:00:00'); 
                dobText = dateObj.toLocaleDateString(); 
            }

            // 4. Teléfono
            const phoneText = user.phone || '-';

            // 5. Inyectar HTML con las nuevas columnas
            row.innerHTML = `
                <td>#${user.id}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-cell-avatar">${initial}</div>
                        <div class="user-cell-info">
                            <strong>${user.firstName} ${user.lastName}</strong>
                            <span class="user-cell-email">${user.email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${roleClass}">${user.role}</span></td>
                
                <td style="white-space: nowrap;">${phoneText}</td>
                <td>${dobText}</td>
                <td>${locationText}</td>
                
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon btn-edit" onclick="openUserModal(${user.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteUser(${user.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- MODAL Y CRUD ---

    window.openUserModal = function(id = null) {
        // Limpiar form
        userForm.reset();
        document.getElementById('user-id').value = '';
        document.getElementById('password-group').style.display = 'block'; // Mostrar pass por defecto

        if (id) {
            // MODO EDICIÓN
            const user = allUsers.find(u => u.id === id);
            if (user) {
                document.getElementById('modal-title').textContent = 'Editar Usuario';
                document.getElementById('user-id').value = user.id;
                document.getElementById('input-firstname').value = user.firstName;
                document.getElementById('input-lastname').value = user.lastName;
                document.getElementById('input-email').value = user.email;
                document.getElementById('input-role').value = user.role;
                document.getElementById('input-active').value = user.isActive.toString();
                
                // Ocultar password al editar (generalmente no se edita aquí o se deja vacío para no cambiar)
                document.getElementById('password-group').style.display = 'none';
            }
        } else {
            // MODO CREACIÓN
            document.getElementById('modal-title').textContent = 'Nuevo Usuario';
        }

        userModal.style.display = 'flex';
    };

    window.closeUserModal = function() {
        userModal.style.display = 'none';
    };

    // GUARDAR (Create / Update)
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('user-id').value;
        const isEdit = !!id;
        
        const payload = {
            firstName: document.getElementById('input-firstname').value,
            lastName: document.getElementById('input-lastname').value,
            email: document.getElementById('input-email').value,
            role: document.getElementById('input-role').value,
            isActive: document.getElementById('input-active').value === 'true'
        };

        // Si es creación, agregamos password
        if (!isEdit) {
            const pass = document.getElementById('input-password').value;
            if (!pass) return alert("Contraseña requerida");
            payload.password = pass;
        }

        const url = isEdit ? `${API_BASE_URL}/users/${id}` : `${API_BASE_URL}/users`; // Ajusta si tu create es /auth/register
        const method = isEdit ? 'PATCH' : 'POST';

        try {
            const token = localStorage.getItem('jwtToken');
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            alert(isEdit ? 'Usuario actualizado' : 'Usuario creado');
            closeUserModal();
            loadUsers(); // Recargar tabla

        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        }
    });

    // ELIMINAR
    window.deleteUser = async function(id) {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const token = localStorage.getItem('jwtToken');
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('No se pudo eliminar');

            alert('Usuario eliminado');
            loadUsers();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // Helper reutilizado
    async function fetchConToken(url) {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error fetch');
        return res.json();
    }

    // --- LÓGICA DE CIERRE DE SESIÓN (LOGOUT) ---
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        
        if(confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            // 1. Borrar todo el almacenamiento local
            localStorage.clear();
            sessionStorage.clear();
            
            // 2. Redirigir al login reemplazando el historial (para no poder volver atrás)
            window.location.replace('login.html');
        }
    });
});
