/**
 * Modia Logger — Единый сервис логирования
 * Версия: 1.2.0
 * Дата: 2026-02-19
 * 
 * Режимы активации (по приоритету):
 *   1. window.MODIA_LOG_ENABLED / MODIA_LOG_LEVEL (ENV)
 *   2. GET-параметры (?modia-log, ?modia-debug, etc.)
 *   3. Data-атрибуты ([data-modia-log], etc.)
 * Режимы:
 * - modia-log: логирование в консоль
 * - modia-debug: логирование в консоль + панель (v1.3+)
 * - modia-diag: диагностическая информация (v1.3+)
 * - modia-panel: UI панель (v1.3+)
 */

export class Logger {
  constructor() {
    this.prefix = '[Modia]';
    // ✅ Уровни логирования для фильтрации
    this.logLevels = {
      'info': 0,
      'warn': 1,
      'error': 2,
      'success': 0
    };
  }

  /**
   * Проверка активности режимов отладки (иерархия 3 уровней)
   * @returns {boolean}
   */
  _isActive() {
    // ─────────────────────────────────────────────────────────
    // Уровень 1: ENV-конфигурация (наивысший приоритет)
    // ─────────────────────────────────────────────────────────
    if (typeof window !== 'undefined') {
      // Полная блокировка через ENV
      if (window.MODIA_LOG_ENABLED === false) {
        return false;
      }
    }

    // ─────────────────────────────────────────────────────────
    // Уровень 2: GET-параметры URL
    // ─────────────────────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('modia-log')) return true;
    if (urlParams.has('modia-debug')) return true;
    if (urlParams.has('modia-diag')) return true;
    if (urlParams.has('modia-panel')) return true;

    // ─────────────────────────────────────────────────────────
    // Уровень 3: Data-атрибуты в DOM
    // ─────────────────────────────────────────────────────────
    // ✅ Используем глобальный $ (jQuery уже загружен в HTML)
    if ($('[data-modia-log]').length > 0) return true;
    if ($('[data-modia-debug]').length > 0) return true;
    if ($('[data-modia-diag]').length > 0) return true;
    if ($('[data-modia-panel]').length > 0) return true;

    return false;
  }

  /**
   * Проверка уровня логирования (для ENV фильтрации)
   * @param {string} level - 'info' | 'warn' | 'error' | 'success'
   * @returns {boolean}
   */
  _isLevelAllowed(level) {
    // Если ENV уровень не установлен — разрешаем всё
    if (typeof window === 'undefined' || !window.MODIA_LOG_LEVEL) {
      return true;
    }

    const envLevel = window.MODIA_LOG_LEVEL;
    const messageLevel = this.logLevels[level] !== undefined
      ? this.logLevels[level]
      : 0;
    const thresholdLevel = this.logLevels[envLevel] !== undefined
      ? this.logLevels[envLevel]
      : 0;

    // Сообщение проходит, если его уровень >= порога
    return messageLevel >= thresholdLevel;
  }

  /**
   * Получить метод консоли по уровню
   * @param {string} level
   * @returns {string}
   */
  _getConsoleMethod(level) {
    const map = {
      'info': 'log',
      'warn': 'warn',
      'error': 'error',
      'success': 'log'
    };
    return map[level] || 'log';
  }

  /**
   * Основное API логирования
   * @param {string} message - Сообщение
   * @param {string} level - 'info' | 'warn' | 'error' | 'success'
   * @param {string} context - Контекст (имя компонента)
   */
  log(message, level = 'info', context = '') {
    // ✅ Проверка 1: Активен ли логгер вообще?
    if (!this._isActive()) {
      return;
    }

    // ✅ Проверка 2: Проходит ли уровень логирования?
    if (!this._isLevelAllowed(level)) {
      return;
    }

    // ✅ Проверка 3: Существует ли console?
    if (typeof console === 'undefined') {
      return;
    }

    const timestamp = new Date().toLocaleTimeString('ru-RU');
    const contextStr = context ? ` ${context}` : '';
    const formattedMessage = `${this.prefix}${contextStr} ${message}`;

    const method = this._getConsoleMethod(level);
    console[method](`[${timestamp}] ${formattedMessage}`);
  }

  /**
   * Уровни логирования (удобные алиасы)
   */
  info(message, context) { this.log(message, 'info', context); }
  warn(message, context) { this.log(message, 'warn', context); }
  error(message, context) { this.log(message, 'error', context); }
  success(message, context) { this.log(message, 'success', context); }
}

// Singleton
export const logger = new Logger();