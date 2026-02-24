/**
 * Modia Index: Точка входа
 * Версия: 1.2.0
 * Дата: 2026-02-17
 * 
 * ⚠️ Без HTML шаблонов
 * ⚠️ Без console.log
 */

import { ComponentScanner, container } from './core.js';
import { logger } from './services/logger.js';
import { ValidationComponent } from './components/validation.js';

// ============================================================================
// Регистрация компонентов
// ============================================================================

ComponentScanner.register(ValidationComponent);

// ============================================================================
// Публичный API
// ============================================================================

window.Modia = {
    ComponentScanner,

    /**
     * Ручное сканирование контейнера
     * @param {HTMLElement|Document} root
     * @returns {Array}
     */
    scan(root = document) {
        return ComponentScanner.scan(root);
    },

    /**
     * Версия фреймворка
     */
    version: '1.2.0',

    /**
     * Logger API
     */
    log(message, level = 'info', context = '') {
        logger.log(message, level, context);
    },
    info(message, context) { logger.info(message, context); },
    warn(message, context) { logger.warn(message, context); },
    error(message, context) { logger.error(message, context); },
    success(message, context) { logger.success(message, context); },

};

// ============================================================================
// Автоинициализация
// ============================================================================

$(document).ready(() => {
    if (window.__modia_initialized) {
        return;
    }

    logger.info('Сканирование компонентов...', 'Index');

    const instances = ComponentScanner.scan();

    logger.success(`Найдено компонентов: ${instances.length}`, 'Index');

    // Кастомное событие для хуков
    $(document).trigger('modia:initialized', { instances });

    window.__modia_initialized = true;
});

// ============================================================================
// Поддержка Turbolinks (⏳ v1.3+)
// ============================================================================

// if (window.Turbolinks) {
//   document.addEventListener('turbolinks:load', () => {
//     logger.info('Turbolinks:load — сканирование', 'Index');
//     ComponentScanner.scan();
//   });
// }
