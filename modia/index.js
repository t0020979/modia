/**
 * Modia Index: Регистрация компонентов и запуск Modia
 * Версия: 1.1.0
 * Дата: 2026-02-10
 */

import { ComponentScanner } from './core.js';
import { ValidationComponent } from './components/validation.js';

// Регистрируем все компоненты
ComponentScanner.register(ValidationComponent);

// Экспорт для ручного сканирования (например, после AJAX)
window.Modia = {
    ComponentScanner,
    scan(root = document) {
        return ComponentScanner.scan(root);
    },
    version: '1.1.0'
};

// // Запускаем автоматическую инициализацию при готовности DOM
// $(document).ready(() => {
//     if (!window.__modia_initialized) {
//         ComponentScanner.scan();
//         window.__modia_initialized = true;
//     }
// });

// Запускаем автоматическую инициализацию при готовности DOM
$(document).ready(() => {
    if (!window.__modia_initialized) {
        console.log('[Modia] Сканирование компонентов...');
        const instances = ComponentScanner.scan();
        console.log('[Modia] Найдено компонентов:', instances.length);
        instances.forEach((inst, i) => {
            console.log(`  [${i}]`, inst.constructor.name, 'на', inst.$el[0]);
        });
        window.__modia_initialized = true;
    }
});

// Поддержка Turbolinks (если используется)
if (window.Turbolinks) {
    document.addEventListener('turbolinks:load', () => {
        if (!window.__modia_initialized) {
            ComponentScanner.scan();
            window.__modia_initialized = true;
        }
    });
}