/**
 * FieldValidator
 * 
 * Ответственность: валидация одного поля по набору правил.
 * Не знает о форме, компонентах или событиях.
 * Работает только с полем, правилами и рендерером ошибок.
 * 
 * Улучшения в версии 1.1.0:
 * - 5 уровней иерархии сообщений (включая обратную совместимость)
 * - Публичный метод loadRules()
 * - Улучшенная обработка массивов полей
 * 
 * @class FieldValidator
 */
import { FieldErrorRenderer } from './field-error-renderer.js';

export class FieldValidator {
  /**
   * @param {jQuery} $valueSource - источник значения (поле или скрытый инпут)
   * @param {jQuery} $errorScreen - элемент, для которого выводится ошибка (визуальный)
   * @param {jQuery} $root - корень формы/контейнера (для поиска шаблонов ошибок)
   * @param {Array} validationRules - массив правил валидации
   * @param {FieldErrorRenderer} errorRenderer - рендерер ошибок
   */
  constructor($valueSource, $errorScreen, $root, validationRules, errorRenderer) {
    if (!$valueSource || $valueSource.length === 0) {
      throw new Error('[FieldValidator] $valueSource is required');
    }

    this.$valueSource = $valueSource;
    this.$errorScreen = $errorScreen || $valueSource.first();
    this.$root = $root;
    this.validationRules = validationRules;
    this.errorRenderer = errorRenderer || new FieldErrorRenderer(this.$errorScreen);

    // Загружаем правила при инициализации
    this.loadRules();
  }

  /**
   * Получает значение поля
   * 
   * Логика:
   * 1. Если несколько элементов (массив полей) — возвращает массив значений
   * 2. Если один элемент — возвращает строку
   * 3. Для стандартных полей (<input>, <select>, <textarea>) — .val()
   * 4. Для [contenteditable] — .text() (без HTML тегов)
   * 
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
    return this.$errorScreen.is(':visible') &&
      !this.$errorScreen.is(':disabled');
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
  }

  /**
   * Валидирует поле по всем подходящим правилам
   * Останавливается на первой ошибке
   * 
   * @returns {boolean} true если поле валидно, false если есть ошибка
   */
  validate() {
    // Пропускаем скрытые поля
    if (!this.isVisibleForValidation()) {
      return true; // Считаем валидным
    }

    // Очищаем старые ошибки перед валидацией
    this.errorRenderer.clearError();

    // Применяем правила по порядку
    for (const rule of this.applicableRules) {
      // Вызываем метод валидации правила
      const result = rule.validate(this.$valueSource, this);

      // Если правило вернуло ошибку
      if (result === false || (result && !result.valid)) {
        const params = result && result.params ? result.params : {};
        // Получаем сообщение об ошибке
        const errorMessage = this._getErrorMessage(rule, params);

        // Рендерим ошибку
        this.errorRenderer.renderError(errorMessage);

        // Возвращаем false — поле не валидно
        return false;
      }
    }

    // Все правила пройдены — поле валидно
    return true;
  }

  /**
   * Получает сообщение об ошибке по иерархии приоритетов (5 уровней)
   * 
   * Приоритеты:
   * 1. Inline-атрибут на поле (например, data-error-text-required)
   * 2. Шаблон на форме по типу проверки (например, .error-templates [data-rule="required"])
   * 3. Старые шаблоны (#error_span, #format-error-span и т.д.) - обратная совместимость
   * 4. Сообщение по умолчанию в конфигурации правила (rule.defaultMessage)
   * 5. Fallback в валидаторе ("Field error")
   * 
   * @param {Object} rule - правило валидации
   * @param {Object} params - параметры для подстановки
   * @returns {string} HTML-фрагмент с сообщением об ошибке
   * @private
   */
  _getErrorMessage(rule, params) {
    return (
      this._getInlineErrorMessage(rule.name) ||
      this._getContainerTemplateMessage(rule.name, params) ||
      this._getSeparateTemplateMessage(rule.name, params) ||
      this._resolveDefaultMessage(rule.defaultMessage, params) ||
      this._getFallbackMessage(rule.name, params)
    );
  }

  /**
   * Приоритет 1: Inline-атрибут на поле
   * @param {string} ruleName - имя правила
   * @returns {string|null}
   * @private
   */
  _getInlineErrorMessage(ruleName) {
    // Формат: data-error-text-required, data-error-text-max-length
    const attrName = `data-error-text-${ruleName}`;
    const message = this.$valueSource.attr(attrName);

    // Возвращаем null если атрибут не задан
    if (!message) {
      return null;
    }

    return this._formatErrorMessage(message);
  }

  /**
   * Приоритет 2: Шаблон в контейнере (новый формат)
   * Ищет шаблон внутри .error-templates по атрибуту data-rule
   * 
   * @param {string} ruleName - имя правила
   * @param {Object} params - параметры для подстановки
   * @returns {string|null}
   * @private
   */
  _getContainerTemplateMessage(ruleName, params) {
    // Ищем шаблон в .error-templates
    const $template = this.$root.find(
      `${FieldErrorRenderer.DEFAULT_CONFIG.errorTemplateClass} [data-rule="${ruleName}"]`
    );

    if ($template.length === 0) return null;

    let html = $template.html();
    return this._formatMessage(html, params);
  }

  /**
   * Приоритет 3: Отдельные шаблоны (старый формат)
   * Ищет отдельные элементы по селекторам (#error_span, #format-error-span и т.д.)
   * 
   * @param {string} ruleName - имя правила
   * @param {Object} params - параметры для подстановки
   * @returns {string|null}
   * @private
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
   * @param {string|Function} defaultMessage - строка или функция
   * @param {Object} params - параметры для подстановки
   * @returns {string|null}
   * @private
   */
  _resolveDefaultMessage(defaultMessage, params) {
    // Возвращаем null если сообщение не задано
    if (!defaultMessage) {
      return null;
    }

    let message;

    if (typeof defaultMessage === 'function') {
      message = defaultMessage(params);
    } else {
      // Подстановка параметров в строку
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
   * @param {string} ruleName - имя правила
   * @param {Object} params - параметры
   * @returns {string}
   * @private
   */
  _getFallbackMessage(ruleName, params) {
    // Общий текст ошибки
    return this._formatErrorMessage('Field error');
  }

  /**
   * Форматирует сообщение с подстановкой параметров
   * Заменяет __KEY__ на значение из params
   * 
   * @param {string} message - сообщение
   * @param {Object} params - параметры
   * @returns {string}
   * @private
   */
  _formatMessage(message, params) {
    if (!message) return message;

    // Подстановка параметров: __COUNT__ → 600, __FIELD_NAME__ → "Email"
    return message.replace(/__\w+__/g, match => {
      const key = match.replace(/__/g, '');
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Оборачивает текст сообщения в форматированный HTML
   * 
   * @param {string} text - текст сообщения
   * @param {string} [tag='span'] - HTML-тег для обёртки
   * @param {string} [className='text-danger'] - класс для элемента
   * @returns {string} HTML-фрагмент с сообщением
   * @private
   */
  _formatErrorMessage(text, tag = 'span', className = 'text-danger') {
    return `<${tag} class="${className}">${text}</${tag}>`;
  }

  /**
   * Очищает ошибки
   */
  clearError() {
    this.errorRenderer.clearError();
  }
}