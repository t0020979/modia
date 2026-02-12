/**
 * FieldErrorRenderer
 * 
 * Ответственность: только отображение и очистка ошибок для одного элемента.
 * Не знает о правилах валидации, событиях или источниках текста.
 * Принимает готовый HTML и вставляет/удаляет его в DOM.
 * 
 * Улучшения в версии 1.1.0:
 * - Поддержка стилей ошибок (rails, bootstrap, custom)
 * - Обратная совместимость со старыми шаблонами (#error_span и т.д.)
 * - 5 уровней иерархии сообщений
 * 
 * @class FieldErrorRenderer
 */

// ==================== КОНСТАНТЫ ПО УМОЛЧАНИЮ ====================
// Эти значения используются, если не передан кастомный конфиг
export const DEFAULT_CONFIG = {
  containerSelectors: '.form-group, .input-group, .form-field',
  errorTemplateClass: '.error-template',
  errorClasses: '.text-danger, .invalid-feedback, .form-error-message',

  // Стили ошибок
  errorStyles: {
    // Rails-стиль (по умолчанию)
    rails: {
      containerClass: 'field_with_errors',
      errorClass: 'form-error',
      messageClass: 'form-error-message'
    },
    // Bootstrap-стиль
    bootstrap: {
      containerClass: '',
      errorClass: 'is-invalid',
      messageClass: 'invalid-feedback'
    },
    // Кастомный стиль
    custom: {
      containerClass: '',
      errorClass: '',
      messageClass: ''
    }
  },

  // Стиль по умолчанию
  defaultStyle: 'bootstrap',

  // Селекторы для обратной совместимости (старый формат)
  legacyTemplates: {
    required: '#error_span',
    format: '#format-error-span',
    ajax: '#ajax-error-span',
    'max-length': '#max_length_error_span',
    'html-tags': '.html-tags-error-message'
  }
};

export class FieldErrorRenderer {
  /**
   * Создаёт рендерер ошибок
   * 
   * @param {jQuery} $errorScreen - элемент, для которого выводится ошибка (визуальный)
   * @param {Object} [config] - опциональная конфигурация (переопределяет DEFAULT_CONFIG)
   * @param {string} [config.containerSelectors] - селекторы контейнеров для вставки ошибки
   * @param {string} [config.errorTemplateClass] - класс шаблонов ошибок (не удаляются при очистке)
   * @param {string} [config.errorClasses] - классы динамических ошибок
   * @param {string} [config.defaultStyle] - стиль ошибок по умолчанию (rails/bootstrap/custom)
   */
  constructor($errorScreen, config = {}) {
    if (!$errorScreen || $errorScreen.length === 0) {
      throw new Error('[FieldErrorRenderer] $errorScreen is required');
    }

    this.$errorScreen = $errorScreen;

    // Объединяем конфиг по умолчанию с пользовательским
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Текущий стиль ошибок
    this.currentStyle = this.config.errorStyles[this.config.defaultStyle] ||
      this.config.errorStyles.bootstrap;

    // Последнее сообщение об ошибке
    this._lastErrorMessage = null;

    // Кэшируем контейнер при инициализации (один раз)
    this.$container = $errorScreen.closest(this.config.containerSelectors);
  }

  /**
   * Проверяет, есть ли уже выведенная ошибка
   * 
   * @returns {boolean} true если ошибка уже отображается
   */
  hasError() {
    return this.$errorScreen.hasClass(this.currentStyle.errorClass) ||
      this.$errorScreen.parent().hasClass(this.currentStyle.containerClass) ||
      this.$errorScreen.next('.field-error-message').length > 0;
  }

  /**
   * Выводит ошибку в DOM
   * Всегда очищает предыдущую ошибку перед выводом (идемпотентность)
   * 
   * @param {string} html - готовый HTML-фрагмент с сообщением об ошибке
   * @param {string} [styleName] - имя стиля (опционально)
   * @returns {void}
   */
  renderError(html, styleName = null) {
    // Устанавливаем стиль если указан
    if (styleName && this.config.errorStyles[styleName]) {
      this.currentStyle = this.config.errorStyles[styleName];
    }

    // Защита: всегда очищаем перед выводом
    if (this.hasError()) {
      this.clearError(false);
    }

    // Сохраняем сообщение
    this._lastErrorMessage = html;

    // Добавляем класс .is-invalid для стилизации
    this.$errorScreen.addClass(this.currentStyle.errorClass);

    // Для Rails-стиля оборачиваем в .field_with_errors
    if (this.currentStyle.containerClass && !this.$errorScreen.parent().hasClass(this.currentStyle.containerClass)) {
      this.$errorScreen.wrap(`<div class="${this.currentStyle.containerClass}"></div>`);
    }

    // Создаём элемент ошибки
    const $errorElement = $(`<div class="field-error-message ${this.currentStyle.messageClass}"></div>`);
    $errorElement.html(html);

    // Вставляем ошибку: в кэшированный контейнер или после элемента (fallback)
    if (this.$container.length) {
      this.$container.append($errorElement);
    } else {
      $errorElement.insertAfter(this.$errorScreen);
    }
  }

  /**
   * Очищает динамические ошибки, кроме тех, что внутри шаблона
   * Идемпотентен: можно вызывать многократно без побочных эффектов
   * 
   * @param {boolean} preserveTemplates - сохранять шаблоны (по умолчанию: true)
   * @returns {void}
   */
  clearError(preserveTemplates = true) {
    // Удаляем только динамические ошибки (не шаблоны)
    this.$errorScreen.siblings(this.config.errorClasses).filter(function () {
      return !$(this).closest(this.config.errorTemplateClass).length;
    }.bind(this)).remove();

    // Убираем класс ошибки
    this.$errorScreen.removeClass(this.currentStyle.errorClass);

    // Убираем обёртку .field_with_errors для Rails-стиля
    if (this.currentStyle.containerClass) {
      const $parent = this.$errorScreen.parent();
      if ($parent.hasClass(this.currentStyle.containerClass)) {
        $parent.replaceWith(this.$errorScreen);
      }
    }

    // Очищаем последнее сообщение
    this._lastErrorMessage = null;
  }

  /**
   * Возвращает последнее сообщение об ошибке
   * @returns {string|null}
   */
  getLastErrorMessage() {
    return this._lastErrorMessage;
  }

  /**
   * Устанавливает стиль ошибок
   * @param {string} styleName - имя стиля (rails, bootstrap, custom)
   */
  setStyle(styleName) {
    if (this.config.errorStyles[styleName]) {
      this.currentStyle = this.config.errorStyles[styleName];
    }
  }
}