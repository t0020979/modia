/**
 * FieldValidator
 * Ответственность: валидация одного поля по набору правил.
 * Не знает о форме, компонентах или событиях.
 * Работает только с полем, правилами и рендерером ошибок.
 * 
 * Улучшения в версии 1.2.0:
 * - 5 уровней иерархии сообщений (включая обратную совместимость)
 * - Публичный метод loadRules()
 * - Улучшенная обработка массивов полей
 * - Зависимость от интерфейса ValidationRule (не от конкретного конфига)
 * - Guards для проверки структуры правил на runtime
 * 
 * @class FieldValidator
 * @version 1.2.0
 * @file modia/services/field-validator.js
 */
import { logger } from './logger.js';
import { FieldErrorRenderer, DEFAULT_CONFIG } from './field-error-renderer.js';

/**
 * Интерфейс правила валидации
 * FieldValidator зависит от этого интерфейса, не от конкретного файла конфигурации
 * 
 * @typedef {Object} ValidationRule
 * @property {string} name - Уникальное имя правила (для логов и атрибутов)
 * @property {string} selector - CSS-селектор для отбора полей
 * @property {Function} validate - Функция валидации: ($field, validator) → boolean|{valid, params}
 * @property {string|Function} [defaultMessage] - Сообщение по умолчанию (опционально)
 * @property {string} [templateId] - ID legacy-шаблона (опционально, для обратной совместимости)
 */

export class FieldValidator {
  /**
   * Создаёт валидатор поля
   * @param {jQuery} $valueSource - источник значения (поле или скрытый инпут)
   * @param {jQuery} $errorScreen - элемент, для которого выводится ошибка (визуальный)
   * @param {jQuery} $root - корень формы/контейнера (для поиска шаблонов ошибок)
   * @param {ValidationRule[]} validationRules - массив правил валидации (интерфейс, не конфиг)
   * @param {FieldErrorRenderer} errorRenderer - рендерер ошибок (обязательно)
   */
  constructor($valueSource, $errorScreen, $root, validationRules, errorRenderer) {
    // ✅ Проверка обязательного $valueSource
    if (!$valueSource || $valueSource.length === 0) {
      logger.error('[FieldValidator] $valueSource is required', 'FieldValidator');
      throw new Error('[FieldValidator] $valueSource is required');
    }

    // ✅ Проверка обязательного errorRenderer (без fallback!)
    if (!errorRenderer) {
      logger.error('[FieldValidator] errorRenderer is required', 'FieldValidator');
      throw new Error('[FieldValidator] errorRenderer is required');
    }

    // ✅ Проверка validationRules (должен быть массив)
    if (!Array.isArray(validationRules)) {
      logger.warn(
        '[FieldValidator] validationRules должен быть массивом. Используется пустой массив.',
        'FieldValidator'
      );
      this.validationRules = [];
    } else {
      this.validationRules = validationRules;
    }

    this.$valueSource = $valueSource;

    // ⚠️ Предупреждение если $errorScreen не передан (fallback)
    if (!$errorScreen || $errorScreen.length === 0) {
      logger.warn(
        '[FieldValidator] $errorScreen не передан, используем fallback на $valueSource.first()',
        'FieldValidator'
      );
      this.$errorScreen = $valueSource.first();
    } else {
      this.$errorScreen = $errorScreen;
    }

    this.$root = $root;
    this.errorRenderer = errorRenderer;

    // ✅ Кэширование правил при инициализации
    this.loadRules();

    logger.info(`FieldValidator инициализирован: ${this._getFieldIdentifier()}`, 'FieldValidator');
  }

  /**
   * Получает идентификатор поля для логирования
   * @private
   * @returns {string}
   */
  _getFieldIdentifier() {
    const id = this.$valueSource.attr('id');
    const name = this.$valueSource.attr('name') || 'unnamed';

    // ⚠️ НОВОЕ: Предупреждение об отсутствии ID
    if (!id) {
      logger.warn(
        `Поле не имеет id атрибута [name=${name}]. Рекомендуется добавить id для лучшей отладки.`,
        'FieldValidator'
      );
      return `__no_id__[name=${name}]`;
    }

    return `#${id}[name=${name}]`;
  }

  /**
   * Получает значение поля
   * Логика:
   * - Если несколько элементов (массив полей) — возвращает массив значений
   * - Если один элемент — возвращает строку
   * - Для стандартных полей (input, textarea, select) — .val()
   * - Для [contenteditable] — .text() (без HTML тегов, только видимый текст)
   * 
   * @returns {string|Array<string>} Значение поля или массив значений
   */
  getFieldValue() {
    // Сценарий 1: Массив полей
    if (this.$valueSource.length > 1) {
      return this.$valueSource.toArray().map(element => {
        const $el = $(element);
        const tagName = $el[0].tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'select') {
          return $el.val() || '';  // ← Возвращаем '' вместо null
        }
        return '';
      });
    }

    // Сценарий 2: Одиночное поле
    const tagName = this.$valueSource[0].tagName.toLowerCase();

    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return this.$valueSource.val() || '';  // ← Возвращаем '' вместо null/undefined
    }

    if (this.$valueSource.is('[contenteditable]')) {
      return this.$valueSource.text().trim();
    }

    return '';
  }

  /**
   * Проверяет, видимо ли поле для валидации
   * Пропускает скрытые и отключённые поля
   * @returns {boolean}
   */
  isVisibleForValidation() {
    // Валидируем только если экран ошибки видим и не отключён
    return this.$errorScreen.is(':visible') && !this.$errorScreen.is(':disabled');
  }

  /**
   * Загружает правила валидации для поля
   * Фильтрует правила по селектору и кэширует результат
   * Публичный метод для обновления правил после динамических изменений
   * 
   * GUARDS:
   * - Проверяет наличие rule.selector
   * - Пропускает правила без селектора с предупреждением
   */
  loadRules() {
    this.applicableRules = this.validationRules.filter(rule => {
      // ✅ Guard: проверка наличия selector
      if (!rule || !rule.selector) {
        logger.warn(
          `Правило без selector пропущено: ${JSON.stringify(rule)}`,
          'FieldValidator'
        );
        return false;
      }

      return this.$valueSource.is(rule.selector);
    });

    logger.info(
      `Загружено правил: ${this.applicableRules.length} для ${this._getFieldIdentifier()}`,
      'FieldValidator'
    );

    // ⚠️ Предупреждение если правил не найдено
    if (this.applicableRules.length === 0) {
      logger.warn(
        `Не найдено правил валидации для поля: ${this._getFieldIdentifier()}`,
        'FieldValidator'
      );
    }
  }

  /**
   * Валидирует поле по всем подходящим правилам
   * Останавливается на первой ошибке
   * 
   * GUARDS:
   * - Проверяет наличие rule.validate
   * - Пропускает правила без validate с предупреждением
   * 
   * @returns {boolean} true если поле валидно, false если есть ошибка
   */
  /**
  Валидирует поле по всем подходящим правилам
  Останавливается на первой ошибке
  @returns {boolean} true если поле валидно, false если есть ошибка
  */
  validate() {
    // Пропускаем скрытые поля
    if (!this.isVisibleForValidation()) {
      logger.info(`Пропущено поле (скрыто/отключено): ${this._getFieldIdentifier()}`, 'FieldValidator');
      return true;
    }

    // Очищаем старые ошибки перед валидацией (идемпотентность)
    this.errorRenderer.clearError();

    // ← ДИАГНОСТИКА: Логируем состояние перед валидацией
    console.log('[DEBUG validate] ====== НАЧАЛО ======');
    console.log('[DEBUG validate] $valueSource:', this.$valueSource);
    console.log('[DEBUG validate] $valueSource.length:', this.$valueSource.length);
    console.log('[DEBUG validate] getFieldValue():', this.getFieldValue());
    console.log('[DEBUG validate] applicableRules:', this.applicableRules?.map(r => r.name));
    console.log('[DEBUG validate] applicableRules.length:', this.applicableRules?.length);

    // Применяем правила по порядку
    for (const rule of this.applicableRules) {
      console.log(`[DEBUG validate] Проверка правила: ${rule.name}`);

      // Guard: проверка наличия validate
      if (typeof rule.validate !== 'function') {
        console.warn(`[DEBUG validate] Правило "${rule.name}" не имеет метода validate`);
        continue;
      }

      const result = rule.validate(this.$valueSource, this);

      console.log(`[DEBUG validate] Правило ${rule.name} вернуло:`, result);
      console.log(`[DEBUG validate] typeof result:`, typeof result);
      console.log(`[DEBUG validate] result === false:`, result === false);
      console.log(`[DEBUG validate] result && !result.valid:`, result && !result.valid);

      // Явная проверка что правило НЕ прошло
      const ruleFailed = (result === false) || (result && result.valid === false);

      console.log(`[DEBUG validate] ruleFailed:`, ruleFailed);

      if (ruleFailed) {
        const params = result && result.params ? result.params : {};
        const { message, level } = this._getErrorMessageWithLevel(rule, params);
        this.errorRenderer.renderError(message);
        this._logErrorLevel(rule.name, level);
        console.log('[DEBUG validate] ====== КОНЕЦ (ошибка) ======');
        return false;
      }
    }

    console.log('[DEBUG validate] ====== КОНЕЦ (успех) ======');
    logger.info(`Поле валидно: ${this._getFieldIdentifier()}`, 'FieldValidator');
    return true;
  }

  /**
   * Получает сообщение об ошибке с определением уровня
   * @private
   * @param {ValidationRule} rule - правило валидации
   * @param {Object} params - параметры для подстановки
   * @returns {{message: string, level: number}}
   */
  _getErrorMessageWithLevel(rule, params) {
    // Уровень 1: Inline-атрибут
    const inlineMessage = this._getInlineErrorMessage(rule.name);
    if (inlineMessage) {
      return { message: inlineMessage, level: 1 };
    }

    // Уровень 2: Шаблон в контейнере
    const containerMessage = this._getContainerTemplateMessage(rule.name, params);
    if (containerMessage) {
      return { message: containerMessage, level: 2 };
    }

    // Уровень 3: Отдельные шаблоны (legacy)
    const separateMessage = this._getSeparateTemplateMessage(rule.name, params);
    if (separateMessage) {
      return { message: separateMessage, level: 3 };
    }

    // Уровень 4: Сообщение по умолчанию
    const defaultMessage = this._resolveDefaultMessage(rule.defaultMessage, params);
    if (defaultMessage) {
      return { message: defaultMessage, level: 4 };
    }

    // Уровень 5: Fallback
    return { message: this._getFallbackMessage(rule.name, params), level: 5 };
  }

  /**
   * Логирует ошибку в зависимости от уровня
   * @private
   * @param {string} ruleName - имя правила
   * @param {number} level - уровень сообщения (1-5)
   */
  _logErrorLevel(ruleName, level) {
    const fieldId = this._getFieldIdentifier();

    // Уровни 1-2: Без логирования (штатная работа)
    if (level === 1 || level === 2) {
      return;
    }

    // Уровень 3: Warning - предупреждение о миграции
    if (level === 3) {
      logger.warn(
        `Поле ${fieldId}: используется legacy-шаблон для правила "${ruleName}". ` +
        `Рекомендуется перенести шаблон в .error-templates`,
        'FieldValidator'
      );
      return;
    }

    // Уровни 4-5: Error - требуется исправление конфигурации
    if (level === 4) {
      logger.error(
        `Поле ${fieldId}: не найден шаблон для правила "${ruleName}". ` +
        `Добавьте шаблон в .error-templates [data-rule="${ruleName}"]`,
        'FieldValidator'
      );
      return;
    }

    // Уровень 5: Fallback - критическая ошибка
    if (level === 5) {
      logger.error(
        `Поле ${fieldId}: КРИТИЧЕСКАЯ ОШИБКА - не найдено сообщение для правила "${ruleName}". ` +
        `Требуется немедленное исправление конфигурации`,
        'FieldValidator'
      );
    }
  }

  /**
   * Приоритет 1: Inline-атрибут на поле
   * @private
   * @param {string} ruleName - имя правила
   * @returns {string|null}
   */
  _getInlineErrorMessage(ruleName) {
    const attrName = `data-error-text-${ruleName}`;
    const message = this.$valueSource.attr(attrName);
    if (!message) return null;
    return this._formatErrorMessage(message);
  }

  /**
   * Приоритет 2: Шаблон в контейнере (новый формат)
   * @private
   * @param {string} ruleName - имя правила
   * @param {Object} params - параметры для подстановки
   * @returns {string|null}
   */
  _getContainerTemplateMessage(ruleName, params) {
    const $template = this.$root.find(
      `${DEFAULT_CONFIG.errorTemplateClass} [data-rule="${ruleName}"]`
    );
    if ($template.length === 0) return null;

    let html = $template.html();
    return this._formatMessage(html, params);
  }

  /**
   * Приоритет 3: Отдельные шаблоны (старый формат)
   * @private
   * @param {string} ruleName - имя правила
   * @param {Object} params - параметры для подстановки
   * @returns {string|null}
   */
  _getSeparateTemplateMessage(ruleName, params) {
    const templateSelector = DEFAULT_CONFIG.separateTemplates[ruleName];
    if (!templateSelector) return null;

    const $template = this.$root.find(templateSelector);
    if ($template.length === 0) return null;

    let html = $template.html();
    return this._formatMessage(html, params);
  }

  /**
   * Приоритет 4: Сообщение по умолчанию в правиле
   * @private
   * @param {string|Function} defaultMessage - строка или функция
   * @param {Object} params - параметры для подстановки
   * @returns {string|null}
   */
  _resolveDefaultMessage(defaultMessage, params) {
    if (!defaultMessage) return null;

    let message;
    if (typeof defaultMessage === 'function') {
      message = defaultMessage(params);
    } else {
      message = defaultMessage;
      Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`__${key.toUpperCase()}__`, 'g');
        message = message.replace(regex, value);
      });
    }

    return this._formatErrorMessage(message);
  }

  /**
   * Приоритет 5: Fallback в валидаторе
   * @private
   * @param {string} ruleName - имя правила
   * @param {Object} params - параметры
   * @returns {string}
   */
  _getFallbackMessage(ruleName, params) {
    return this._formatErrorMessage('Field error');
  }

  /**
   * Форматирует сообщение с подстановкой параметров
   * @private
   * @param {string} message - сообщение
   * @param {Object} params - параметры
   * @returns {string}
   */
  _formatMessage(message, params) {
    if (!message) return message;

    return message.replace(/__\w+__/g, match => {
      const key = match.replace(/__/g, '');
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Оборачивает текст сообщения в форматированный HTML
   * @private
   * @param {string} text - текст сообщения
   * @param {string} [tag='span'] - HTML-тег для обёртки
   * @param {string} [className='text-danger'] - класс для элемента
   * @returns {string}
   */
  _formatErrorMessage(text, tag = 'span', className = 'text-danger') {
    return `<${tag} class="${className}">${text}</${tag}>`;
  }

  /**
   * Очищает ошибки (делегует рендереру)
   */
  clearError() {
    this.errorRenderer.clearError();
  }
}