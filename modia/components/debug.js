/**
 * DebugComponent — Компонент отладки
 * Версия: 1.2.0
 * Дата: 2026-02-17
 * 
 * v1.2: Только активация режимов отладки
 * v1.3+: UI панель, диагностика страницы
 */

import { logger } from '../services/logger.js';

// Singleton instance
let debugInstance = null;

export class DebugComponent {
  constructor() {
    this.mode = null;
    this._checkTriggers();

    if (this.mode) {
      logger.info('DebugComponent инициализирован', 'DebugComponent');
    }
  }

  /**
   * Проверка триггеров активации
   */
  _checkTriggers() {
    // 1. GET-параметры (приоритет 1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('modia-panel')) {
      this.mode = 'panel';
      return;
    }
    if (urlParams.has('modia-diag')) {
      this.mode = 'diag';
      return;
    }
    if (urlParams.has('modia-debug')) {
      this.mode = 'debug';
      return;
    }
    if (urlParams.has('modia-log')) {
      this.mode = 'log';
      return;
    }

    // 2. Data-атрибуты (приоритет 2)
    if ($('[data-modia-panel]').length > 0) {
      this.mode = 'panel';
      return;
    }
    if ($('[data-modia-diag]').length > 0) {
      this.mode = 'diag';
      return;
    }
    if ($('[data-modia-debug]').length > 0) {
      this.mode = 'debug';
      return;
    }
    if ($('[data-modia-log]').length > 0) {
      this.mode = 'log';
      return;
    }
  }

  /**
   * Публичный API: включён ли debug
   * @returns {boolean}
   */
  static isEnabled() {
    return debugInstance ? debugInstance.mode !== null : false;
  }

  /**
   * Публичный API: текущий режим
   * @returns {string|null}
   */
  static getMode() {
    return debugInstance ? debugInstance.mode : null;
  }

  /**
   * Получить реестр компонентов (для диагностики)
   * @returns {Array}
   */
  static getComponentsRegistry() {
    // Будет реализовано через ComponentScanner.instances в v1.3
    return [];
  }
}

// Авто-инициализация при импорте
debugInstance = new DebugComponent();