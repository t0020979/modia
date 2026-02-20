/**
 * FieldValidator
 * 
 * Ответственность: валидация одного поля по набору правил.
 * Не знает о форме, компонентах или событиях.
 * Работает только с полем, правилами и рендерером ошибок.
 * 
 * Улучшения в версии 1.2.0:
 * - 5 уровней иерархии сообщений (включая обратную совместимость)
 * - Публичный метод loadRules()
 * - Улучшенная обработка массивов полей
 * 
 * @class FieldValidator
 * @version 1.2.0
 * @file modia/services/field-validator.js
 */
import { logger } from './logger.js';
import { FieldErrorRenderer } from './field-error-renderer.js';

export class FieldValidator {
  /**
   * @param {jQuery} $valueSource - источник значения (поле или скрытый инпут)
   * @param {jQuery} $errorScreen - элемент, для которого выводится ошибка (визуальный)
   * @param {jQuery} $root - корень формы/контейнера (для поиска шаблонов ошибок)
   * @param {Array} validationRules - массив правил валидации
   * @param {FieldErrorRenderer} errorRenderer - рендерер ошибок (обязательно)
   */
  constructor($valueSource, $errorScreen, $root, validationRules, errorRenderer) {
    // ✅ Проверка обязательного $valueSource
    if (!$valueSource || $valueSource.length === 0) {
      throw new Error('[FieldValidator] $valueSource is required');
    }

    // ✅ Проверка обязательного errorRenderer (без fallback!)
    if (!errorRenderer) {
      throw new Error('[FieldValidator] errorRenderer is required');
    }

    this.$valueSource = $valueSource;
    this.$errorScreen = $errorScreen || $valueSource.first();
    this.$root = $root;
    this.validationRules = validationRules;
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
    const id = this.$valueSource.attr('id') || 'unknown';
    const name = this.$valueSource.attr('name') || 'unnamed';
    return `#${id}[name=${name}]`;
  }

  /**
   * Получает значение поля
   * Логика:
   * - Если несколько элементов (массив полей) — возвращает массив значений
   * - Если один элемент — возвращает строку
   * - Для стандартных полей (input, textarea, select) — .val()
   * - Для [contenteditable] — .text() (без HTML тегов)
   * @returns {string|Array<string>} Значение поля или массив значений
   */
  getFieldValue() {
    // Сценарий 1: Массив полей (например, name='tags[]' или мультиселект)
    if (this.$valueSource.length > 1) {
      return this.$valueSource.toArray().map(element => {
        const $el = $(element);
        const tagName = $el[0].tagName.toLowerCase();

        // Массив может быть только input или select
        if (tagName === 'input' || tagName === 'select') {
          return $el.val() || '';
        }

        // Fallback
        return '';
      });
    }

    // Сценарий 2: Одиночное поле
    const tagName = this.$valueSource[0].tagName.toLowerCase();

    // Стандартные поля формы
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return this.$valueSource.val() || '';
    }

    // Contenteditable элементы - используем .text() для безопасности
    if (this.$valueSource.is('[contenteditable]')) {
      return this.$valueSource.text().trim();
    }

    // Fallback
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
   */
  loadRules() {
    this.applicableRules = this.validationRules.filter(rule => {
      return this.$valueSource.is(rule.selector);
    });

    logger.info(`Загружено правил: ${this.applicableRules.length} для ${this._getFieldIdentifier()}`, 'FieldValidator');
  }

  /**
   * Валидирует поле по всем подходящим правилам
   * Останавливается на первой ошибке
   * @returns {boolean} true если поле валидно, false если есть ошибка
   */
  validate() {
    // Пропускаем скрытые поля
    if (!this.isVisibleForValidation()) {
      logger.info(`Пропущено поле (скрыто/отключено): ${this._getFieldIdentifier()}`, 'FieldValidator');
      return true; // Считаем валидным
    }

    // Очищаем старые ошибки перед валидацией (идемпотентность)
    this.errorRenderer.clearError();

    // Применяем правила по порядку
    for (const rule of this.applicableRules) {
      // Вызываем метод валидации правила
      const result = rule.validate(this.$valueSource, this);

      // Если правило вернуло ошибку
      if (result === false || (result && !result.valid)) {
        const params = result && result.params ? result.params : {};

        // Получаем сообщение об ошибке (с логированием уровня)
        const { message, level } = this._getErrorMessageWithLevel(rule, params);

        // Рендерим ошибку
        this.errorRenderer.renderError(message);

        // Логирование в зависимости от уровня
        this._logErrorLevel(rule.name, level);

        // Возвращаем false — поле не валидно
        return false;
      }
    }

    // Все правила пройдены — поле валидно
    logger.info(`Поле валидно: ${this._getFieldIdentifier()}`, 'FieldValidator');
    return true;
  }

  /**
   * Получает сообщение об ошибке с определением уровня
   * @private
   * @param {Object} rule - правило валидации
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
    if (!message) {
      return null;
    }
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
      `${FieldErrorRenderer.DEFAULT_CONFIG.errorTemplateClass} [data-rule="${ruleName}"]`
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
    const templateSelector = FieldErrorRenderer.DEFAULT_CONFIG.separateTemplates[ruleName];
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
    if (!defaultMessage) {
      return null;
    }

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