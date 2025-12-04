// Регистрация компонентов и запуск Modia

import { ComponentScanner } from 'packs/modia/core.js';
import { ValidationComponent } from 'packs/modia/components/validation.js';

// Регистрируем все компоненты
ComponentScanner.register(ValidationComponent);

// Экспорт для ручного сканирования (например, после AJAX)
window.Modia = {
    ComponentScanner,
    scan(root = document) {
        return ComponentScanner.scan(root);
    }
};

// // После вставки нового HTML:
// $('#modal').html(newHtml);
// Modia.scan($('#modal')[0]); // инициализировать компоненты внутри


// Запускаем автоматическую инициализацию при готовности DOM
$(document).ready(() => {
    ComponentScanner.scan();
});

// Поддержка Turbolinks (если используется)
if (window.Turbolinks) {
    document.addEventListener('turbolinks:load', () => {
        ComponentScanner.scan();
    });
}