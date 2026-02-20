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
 * @version 1.2.0
 * @file modia/services/field-error-renderer.js
 *
 * @example
 * // Базовое использование
 * const renderer = new FieldErrorRenderer($('#email'));
 * renderer.renderError('<span class="text-danger">Ошибка</span>');
 * renderer.clearError();
 *
 * @example
 * // Plain text (автоматически обернётся в <span>)
 * renderer.renderError('Обязательное поле');
 *
 * @note
 * Стили ошибок определяются в modia.css через селектор [data-modia-error].
 * Дизайнер может переопределить стили через [data-modia-error="field"].
 */
import { logger } from './logger.js';

// ==================== КОНСТАНТЫ ПО УМОЛЧАНИЮ ====================
// Эти значения используются, если не передан кастомный конфиг
export const DEFAULT_CONFIG = {
  containerSelectors: '.form-group, .input-group, .form-field',
  errorTemplateClass: '.error-template',
  errorClasses: '.text-danger, .invalid-feedback, .form-error-message',

  errorMarker: 'data-modia-error',

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

  defaultErrorTag: 'span',
  defaultErrorClass: 'text-danger',

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

    this._checkElementIds();

    logger.info('FieldErrorRenderer инициализирован', 'FieldErrorRenderer');
  }

  _checkElementIds() {
    const errorScreenId = this.$errorScreen.attr('id');
    if (!errorScreenId) {
      logger.warn(
        `Требуется ID для errorScreen: ${this.$errorScreen[0]?.tagName}. ` +
        `Назначьте id атрибут.`,
        'FieldErrorRenderer'
      );
    } else {
      this._validateId(errorScreenId, 'errorScreen');
    }

    if (this.$container.length) {
      const containerId = this.$container.attr('id');
      if (!containerId) {
        logger.warn(
          `Требуется ID для container: ${this.$container[0]?.tagName}. ` +
          `Назначьте id атрибут.`,
          'FieldErrorRenderer'
        );
      }
    }
  }

  _validateId(id, type) {
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(id)) {
      logger.warn(
        `ID содержит спецсимволы: ${id} (${type}). ` +
        `Возможны проблемы с селекторами.`,
        'FieldErrorRenderer'
      );
    }
  }

  _getFieldId() {
    return this.$errorScreen.attr('id') || 'unknown-field';
  }

  _getContainerId() {
    return this.$container.attr('id') || 'unknown-container';
  }

  _getErrorMarkerValue() {
    const containerId = this._getContainerId();
    const fieldId = this._getFieldId();

    this._validateId(containerId, 'container');
    this._validateId(fieldId, 'field');

    return `${containerId}:${fieldId}`;
  }

  /**
   * Проверяет, есть ли уже выведенная ошибка
   * 
   * @returns {boolean} true если ошибка уже отображается
   */
  hasError() {
    const containerId = this._getContainerId();
    const marker = this.config.errorMarker;
    const selector = `[${marker}^="${containerId}:"]`;

    // Проверяем в контейнере + siblings (как в clearError)
    const hasErrorInContainer = this.$container.length
      ? this.$container.find(selector).length > 0
      : false;

    const hasErrorInSiblings = this.$errorScreen.siblings(selector).length > 0;

    return this.$errorScreen.hasClass(this.currentStyle.errorClass) ||
      this.$errorScreen.parent().hasClass(this.currentStyle.containerClass) ||
      hasErrorInContainer ||
      hasErrorInSiblings;
  }

  _formatIncomingHtml(html) {
    const $element = $(html);

    if ($element.length === 0 || $element[0].nodeType === 3) {
      logger.warn(
        `[FieldErrorRenderer] Текст ошибки обёрнут в тег: ${html?.substring(0, 50)}`,
        'FieldErrorRenderer'
      );

      return $('<span>')
        .addClass(this.config.defaultErrorClass)
        .html(html);
    }

    return $element;
  }

  _addErrorMarker($element) {
    const markerValue = this._getErrorMarkerValue();
    $element.attr(this.config.errorMarker, markerValue);

    // Гибридный подход: ссылки для точечных операций
    $element.data('modiaErrorField', this.$errorScreen[0]);
    if (this.$container.length) {
      $element.data('modiaErrorContainer', this.$container[0]);
    }
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

    const $element = this._formatIncomingHtml(html);
    this._addErrorMarker($element);

    // Сохраняем сообщение
    this._lastErrorMessage = html;

    logger.info(
      `Ошибка рендера: ${this._getFieldId()} → ${html?.substring(0, 50)}...`,
      'FieldErrorRenderer'
    );

    // Добавляем класс .is-invalid для стилизации
    this.$errorScreen.addClass(this.currentStyle.errorClass);

    // Для Rails-стиля оборачиваем в .field_with_errors
    if (this.currentStyle.containerClass &&
      !this.$errorScreen.parent().hasClass(this.currentStyle.containerClass)) {
      this.$errorScreen.wrap(`<div class="${this.currentStyle.containerClass}"></div>`);
    }

    // // Создаём элемент ошибки
    // const $errorElement = $(`<div class="field-error-message ${this.currentStyle.messageClass}">${html}</div>`);
    // // $errorElement.html(html);

    // // Добавим стили Bootstrap по умолчанию
    // if (this.currentStyle.messageClass === '') {
    //   $errorElement.addClass('text-danger');
    // }

    // Вставляем ошибку: в кэшированный контейнер или после элемента (fallback)
    if (this.$container.length) {
      this.$container.append($element);
    } else {
      $element.insertAfter(this.$errorScreen);
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
    // // Удаляем только динамические ошибки (не шаблоны)
    // this.$errorScreen.siblings(this.config.errorClasses).filter(function () {
    //   return !$(this).closest(this.config.errorTemplateClass).length;
    // }.bind(this)).remove();

    const containerId = this._getContainerId();
    const marker = this.config.errorMarker;
    const fieldId = this._getFieldId();

    logger.info(
      `Очистка ошибок: ${fieldId} (preserveTemplates: ${preserveTemplates})`,
      'FieldErrorRenderer'
    );

    // Ищем в контейнере + siblings (покрываем оба сценария вставки)
    let $errors;
    if (this.$container.length) {
      $errors = this.$container.find(`[${marker}^="${containerId}:"]`);
    } else {
      $errors = this.$errorScreen.siblings(`[${marker}^="${containerId}:"]`);
    }

    if (preserveTemplates) {
      $errors.filter(function () {
        return !$(this).closest(this.config.errorTemplateClass).length;
      }.bind(this)).remove();
    } else {
      $errors.remove();
    }


    // Удаляем ВСЕ классы ошибок из всех стилей
    const allErrorClasses = Object.values(this.config.errorStyles)
      .map(style => style.errorClass)
      .filter(cls => cls) // убираем пустые строки
      .join(' ');

    this.$errorScreen.removeClass(allErrorClasses);

    // ✅ ИСПРАВЛЕНО: Удаляем ВСЕ обёртки контейнеров из всех стилей
    const allContainerClasses = Object.values(this.config.errorStyles)
      .map(style => style.containerClass)
      .filter(cls => cls)
      .join(' ');

    if (allContainerClasses) {
      const $parent = this.$errorScreen.parent();
      const parentClasses = $parent.attr('class') || '';
      const hasContainerClass = allContainerClasses.split(' ').some(cls =>
        parentClasses.includes(cls)
      );

      if (hasContainerClass) {
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
      logger.info(`Стиль установлен: ${styleName}`, 'FieldErrorRenderer');
    }
  }
}