export default class UIController {
    constructor(apiClient) {
        this.api = apiClient;
        
        // Elementos del DOM
        this.tableBody = document.getElementById('tablaContactosBody');
        this.btnNuevo = document.getElementById('btnNuevoContacto');
        this.btnGuardar = document.getElementById('btnGuardar');
        this.btnConfirmDelete = document.getElementById('btnConfirmDelete');
        
        // Modales
        this.formModal = new bootstrap.Modal(document.getElementById('contactoModal'));
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        
        // Formulario
        this.form = document.getElementById('formContacto');
        this.modalTitle = document.getElementById('modalTitle');
        this.camposExtra = document.getElementById('camposExtraCreacion');
        
        // Estado
        this.contactoIdAEliminar = null;
        this.esEdicion = false;
        
        this.init();
    }

    init() {
        this.cargarContactos();
        this.asignarEventos();
    }

    asignarEventos() {
        this.btnNuevo.addEventListener('click', () => this.abrirModalCrear());
        this.btnGuardar.addEventListener('click', (e) => {
            e.preventDefault();
            this.guardarContacto();
        });
        this.btnConfirmDelete.addEventListener('click', () => this.ejecutarEliminacion());
    }

    async cargarContactos() {
        try {
            this.tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-info" role="status"></div></td></tr>';
            const respuesta = await this.api.getContactos();
            
            if (respuesta.ok && respuesta.data) {
                // AQUÍ ESTÁ LA MAGIA: Agrupar los datos dispersos
                const contactosAgrupados = this.agruparContactos(respuesta.data);
                this.renderizarTabla(contactosAgrupados);
            } else {
                this.tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error: ${respuesta.mensaje || 'No se pudieron cargar los datos'}</td></tr>`;
            }
        } catch (error) {
            console.error("Error al cargar:", error);
            this.tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error de conexión al servidor</td></tr>';
        }
    }

    // Nueva función para unificar las filas duplicadas
    agruparContactos(datosCrudos) {
        const mapa = new Map();

        datosCrudos.forEach(fila => {
            if (!mapa.has(fila.id_contacto)) {
                // Si es la primera vez que vemos este ID, creamos la estructura base
                mapa.set(fila.id_contacto, {
                    id_contacto: fila.id_contacto,
                    nombre: fila.nombre,
                    apellido: fila.apellido,
                    categoria: fila.nombre_categoria, // Usamos el nombre, ya que no viene el ID
                    telefono: '',
                    correo: '',
                    direccion: ''
                });
            }

            // Agregamos los datos de contacto específicos a la estructura
            const contactoObj = mapa.get(fila.id_contacto);
            if (fila.tipo_dato === 'Teléfono') contactoObj.telefono = fila.valor;
            if (fila.tipo_dato === 'Correo') contactoObj.correo = fila.valor;
            if (fila.tipo_dato === 'Dirección') contactoObj.direccion = fila.valor;
        });

        // Convertimos el Map de nuevo a un Array normal
        return Array.from(mapa.values());
    }

    renderizarTabla(contactos) {
        this.tableBody.innerHTML = '';
        if (!contactos || contactos.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay contactos registrados</td></tr>';
            return;
        }

        contactos.forEach(contacto => {
            const tr = document.createElement('tr');
            
            // Ya no buscamos fecha_nacimiento porque la BD no lo envía
            tr.innerHTML = `
                <td><span class="badge bg-secondary">${contacto.id_contacto}</span></td>
                <td class="fw-medium">${contacto.nombre} ${contacto.apellido}</td>
                <td><span class="text-muted">No disponible</span></td>
                <td><span class="badge bg-info text-dark">${contacto.categoria}</span></td>
                <td>${contacto.telefono || '<span class="text-muted">N/A</span>'}</td>
                <td>${contacto.correo || '<span class="text-muted">N/A</span>'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-info me-2 btn-edit shadow-sm" data-contacto='${JSON.stringify(contacto)}'>
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete shadow-sm" data-id="${contacto.id_contacto}">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            `;
            this.tableBody.appendChild(tr);
        });

        // Eventos Editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const datos = JSON.parse(e.currentTarget.getAttribute('data-contacto'));
                this.abrirModalEditar(datos);
            });
        });

        // Eventos Eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.contactoIdAEliminar = e.currentTarget.getAttribute('data-id');
                this.deleteModal.show();
            });
        });
    }

    abrirModalCrear() {
        this.esEdicion = false;
        this.form.reset();
        this.form.classList.remove('was-validated');
        document.getElementById('idContacto').value = '';
        this.modalTitle.innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Contacto';
        this.camposExtra.style.display = 'flex'; 
        
        // Habilitar campos de fecha e ID categoría para creación (aunque no los veamos al leer)
        document.getElementById('fechaNacimiento').disabled = false;
        document.getElementById('idCategoria').disabled = false;
    }

    abrirModalEditar(contacto) {
        this.esEdicion = true;
        this.form.reset();
        this.form.classList.remove('was-validated');
        
        document.getElementById('idContacto').value = contacto.id_contacto;
        document.getElementById('nombre').value = contacto.nombre;
        document.getElementById('apellido').value = contacto.apellido;
        
        // Como la BD no nos devuelve la fecha ni el ID de la categoría al hacer GET,
        // no podemos llenarlos en el modal. Los dejamos en blanco o deshabilitados.
        document.getElementById('fechaNacimiento').value = ''; 
        document.getElementById('idCategoria').value = ''; 
        
        this.modalTitle.innerHTML = '<i class="bi bi-person-gear me-2"></i>Editar Contacto';
        this.camposExtra.style.display = 'none'; 
        
        this.formModal.show();
    }

    async guardarContacto() {
        if (!this.form.checkValidity()) {
            this.form.classList.add('was-validated');
            return;
        }

        const data = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            fecha_nacimiento: document.getElementById('fechaNacimiento').value || '2000-01-01', // Valor por defecto si falla
            id_categoria: parseInt(document.getElementById('idCategoria').value) || 1 // Valor por defecto si falla
        };

        this.btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
        this.btnGuardar.disabled = true;

        try {
            let respuesta;
            if (this.esEdicion) {
                data.id_contacto = parseInt(document.getElementById('idContacto').value);
                respuesta = await this.api.updateContacto(data);
            } else {
                data.telefono = document.getElementById('telefono').value;
                data.correo = document.getElementById('correo').value;
                respuesta = await this.api.createContacto(data);
            }

            if (respuesta.ok) {
                this.formModal.hide();
                this.cargarContactos();
            } else {
                alert("Atención: " + (respuesta.mensaje || "Error al guardar."));
            }
        } catch (error) {
            console.error("Error de red/servidor:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            this.btnGuardar.innerHTML = "Guardar";
            this.btnGuardar.disabled = false;
        }
    }

    async ejecutarEliminacion() {
        if (!this.contactoIdAEliminar) return;

        this.btnConfirmDelete.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';
        this.btnConfirmDelete.disabled = true;

        try {
            const respuesta = await this.api.deleteContacto(parseInt(this.contactoIdAEliminar));
            if (respuesta.ok) {
                this.deleteModal.hide();
                this.cargarContactos();
            } else {
                alert("No se pudo eliminar: " + respuesta.mensaje);
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
        } finally {
            this.btnConfirmDelete.innerHTML = "Eliminar";
            this.btnConfirmDelete.disabled = false;
            this.contactoIdAEliminar = null;
        }
    }
}