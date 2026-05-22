import ApiClient from './ApiClient.js';
import UIController from './UIController.js';

document.addEventListener('DOMContentLoaded', () => {
    const api = new ApiClient();
    const ui = new UIController(api);
});     