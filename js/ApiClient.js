export default class ApiClient {
    constructor() {
        this.baseUrl = 'https://ippublic.ivyrey.net/contactoAPI/index.php';
    }

    async getContactos() {
        const response = await fetch(`${this.baseUrl}?accion=contactos-completos`);
        return await response.json();
    }

    async createContacto(data) {
        const response = await fetch(`${this.baseUrl}?accion=agregar-contacto-completo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async updateContacto(data) {
        const response = await fetch(`${this.baseUrl}?accion=actualizar-contacto`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async deleteContacto(id) {
        const response = await fetch(`${this.baseUrl}?accion=eliminar-contacto`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_contacto: id })
        });
        return await response.json();
    }
}