/**
 * ValidationComponent
 * Компонент валидации формы.
 * Отслеживает события отправки формы и валидирует все поля.
 * Поддерживает live-валидацию и динамическое добавление полей.
 * 
 * @class ValidationComponent
 * @extends BaseComponent
 * @version 1.2.0
 * @file modia/components/validation.js
 */
import { BaseComponent } from '../core.js';
import { FieldValidator } from '../services/field-validator.js';
import { FieldErrorRenderer } from '../services/field-error-renderer.js';
import { validationRules } from '../configurations/validation-rules.js';
import { debounce } from '../services/debounce.js';
import { logger } from '../services/logger.js';

export class ValidationComponent extends BaseComponent {
  // ========== Статические свойства ==========

  /**
   * Имя компонента для регистрации
   * @type {string}
   */
  static componentName = 'validation';

  /**
   * Конфигурация по умолчанию
   * @type {Object}
   */
  static defaultConfig = {
    live: false,              // Включить live-валидацию
    debounceDelay: 300,       // Задержка для debounce (мс)
    validateOnSubmit: true,   // Валидировать при отправке
    validateOnClick: true,    // Валидировать при клике на кнопку
    errorStyle: 'bootstrap'   // Стиль ошибок: rails, bootstrap, custom
  };

  // ========== Конструктор ==========

  /**
   * @param {HTMLElement} element - элемент формы или контейнера
   */
  constructor(element) {
    super(element);

    // ✅ Объединяем конфиги через $.extend() (jQuery механизм)
    this.config = $.extend(
      {},
      ValidationComponent.defaultConfig,
      this.config
    );

    // Массив валидаторов для полей
    this.fieldValidators = [];

    // ✅ BaseComponent уже сохранил: this.$el.data('modia-component', this)

    logger.info(
      `ValidationComponent инициализирован на ${this._getElementIdentifier()}`,
      'ValidationComponent'
    );

    // Инициализация
    this._init();
  }

  // ========== Инициализация ==========

  /**
   * Инициализация компонента
   * @private
   */
  _init() {
    // Находим и группируем поля
    this._findAndGroupFields();

    // Создаём валидаторы
    this._createValidators();

    // Навешиваем обработчики событий
    this._bindEvents();
  }

  /**
   * Получает идентификатор элемента для логирования
   * @private
   * @returns {string}
   */
  _getElementIdentifier() {
    const id = this.$el.attr('id');
    const tagName = this.$el[0].tagName.toLowerCase();
    return id ? `#${id}` : `<${tagName}>`;
  }

  /**
   * Находит все поля и группирует их по имени
   * Логика группировки:
   * - Поля с одинаковым именем (например, name='tags[]') → одна группа
   * - Поля без имени → каждое поле отдельная группа
   * - Одиночные поля → группа из одного элемента
   * @private
   */
  _findAndGroupFields() {
    // Находим все поля ввода (включая input, select, textarea, button)
    const $allFields = this.$el.find(':input, [contenteditable]').filter(':visible:not(:disabled)');

    // Группируем поля по имени
    const fieldGroups = {};

    $allFields.each((i, el) => {
      const $field = $(el);
      const name = $field.attr('name');

      // Создаём группу для поля
      const groupKey = name || `__no_name_${i}__`;

      if (!fieldGroups[groupKey]) {
        fieldGroups[groupKey] = [];
      }

      fieldGroups[groupKey].push($field);
    });

    this.fieldGroups = fieldGroups;

    logger.info(
      `Найдено групп полей: ${Object.keys(fieldGroups).length}`,
      'ValidationComponent'
    );
  }

  /**
   * Создаёт валидаторы для всех групп полей
   * @private
   */
  _createValidators() {
    this.fieldValidators = [];

    Object.values(this.fieldGroups).forEach($fields => {
      const validator = this._createValidatorForGroup($fields);
      if (validator) {
        this.fieldValidators.push(validator);
      }
    });

    logger.info(
      `Создано валидаторов: ${this.fieldValidators.length}`,
      'ValidationComponent'
    );
  }

  /**
   * Создаёт валидатор для группы полей
   * @param {Array} $fields - массив полей (может быть один элемент)
   * @returns {FieldValidator|null}
   * @private
   */
  _createValidatorForGroup($fields) {
    // Преобразуем массив в коллекцию jQuery
    const $group = $($fields);

    // Определяем источник значения и экран ошибки
    const { $valueSource, $errorScreen } = this._determineValueSourceAndErrorScreen($group);

    // Пропускаем если не нашли элементы
    if (!$valueSource || !$valueSource.length || !$errorScreen || !$errorScreen.length) {
      logger.warn(
        'Пропущена группа полей: не найден $valueSource или $errorScreen',
        'ValidationComponent'
      );
      return null;
    }

    // Создаём рендерер и валидатор
    const renderer = new FieldErrorRenderer($errorScreen, {
      defaultStyle: this.config.errorStyle
    });

    const validator = new FieldValidator(
      $valueSource,
      $errorScreen,
      this.$el,
      validationRules,
      renderer
    );

    logger.info(
      `Создан валидатор для: ${this._getFieldIdentifier($valueSource)}`,
      'ValidationComponent'
    );

    // Настраиваем live-валидацию если включена
    if (this.config.live) {
      this._setupLiveValidation($group, validator);
    }

    return validator;
  }

  /**
   * Получает идентификатор поля для логирования
   * @private
   * @param {jQuery} $field - поле
   * @returns {string}
   */
  _getFieldIdentifier($field) {
    const id = $field.attr('id');
    const name = $field.attr('name') || 'unnamed';
    return id ? `#${id}[name=${name}]` : `[name=${name}]`;
  }

  /**
   * Определяет источник значения и экран ошибки для поля
   * Поддерживает два способа:
   * 1. Видимый элемент + внешний источник значения (через data-input-value-source)
   * 2. Скрытое поле + внешний экран ошибки (через data-input-error-screen)
   * @param {jQuery} $group - группа полей (может быть одним элементом)
   * @returns {Object} { $valueSource, $errorScreen }
   * @private
   */
  _determineValueSourceAndErrorScreen($group) {
    // Берём первый элемент группы для определения
    const $field = $group.first();

    let $valueSource = $group;      // По умолчанию — сама группа
    let $errorScreen = $field;      // По умолчанию — первый элемент

    // Способ 1: Внешний источник значения (приоритет)
    // <div data-input-value-source="#hidden">Visible</div>
    // <input type="hidden" id="hidden">
    const valueSourceSelector = $field.data('input-value-source') || $field.data('input-field');
    if (valueSourceSelector) {
      const $externalValue = this.$el.find(valueSourceSelector);
      if ($externalValue.length) {
        $valueSource = $externalValue;
        $errorScreen = $field;
        logger.info(
          `Используется внешний источник значения: ${valueSourceSelector}`,
          'ValidationComponent'
        );
      }
    }

    // Способ 2: Внешний экран ошибки (переопределяет Способ 1)
    // <input type="hidden" id="hidden" data-input-error-screen=".visible">
    // <div class="visible"></div>
    const errorScreenSelector = $field.data('input-error-screen');
    if (errorScreenSelector) {
      const $externalError = this.$el.find(errorScreenSelector);
      if ($externalError.length) {
        $valueSource = $group;
        $errorScreen = $externalError;
        logger.info(
          `Используется внешний экран ошибки: ${errorScreenSelector}`,
          'ValidationComponent'
        );
      }
    }

    return { $valueSource, $errorScreen };
  }

  /**
   * Настраивает live-валидацию для группы полей
   * @param {jQuery} $fields - поля для валидации
   * @param {FieldValidator} validator - валидатор
   * @private
   */
  _setupLiveValidation($fields, validator) {
    // Сохраняем ссылки для очистки в destroy()
    this._liveValidationHandlers = this._liveValidationHandlers || [];
    this._liveValidationHandlers.push($fields);

    // Валидация при потере фокуса
    $fields.on('blur.modia-live', () => {
      validator.validate();
    });

    // Валидация при изменении (для select, checkbox, radio)
    $fields.on('change.modia-live', () => {
      validator.validate();
    });

    // Валидация при вводе (для текстовых полей с задержкой)
    $fields.filter('input:text, input[type="email"], input[type="tel"], textarea').each((i, el) => {
      $(el).on('input.modia-live', debounce(() => {
        validator.validate();
      }, this.config.debounceDelay));
    });

    logger.info('Live-валидация настроена', 'ValidationComponent');
  }

  // ========== Обработчики событий ==========

  /**
   * Навешивает обработчики событий
   * @private
   */
  _bindEvents() {
    // Валидация при отправке формы (только если это form)
    if (this.config.validateOnSubmit && this.$el.is('form')) {
      this._on('submit', this._handleSubmit);
    }

    // Валидация при клике на кнопку [data-validate]
    // Работает для любых контейнеров (form, div, section)
    if (this.config.validateOnClick) {
      this._on('click', '[data-validate]', this._handleValidateClick);
    }

    // Обработка динамического добавления полей
    this._on('validation:field-added', this._handleFieldAdded);
  }

  /**
   * Обработчик отправки формы
   * @param {Event} event - событие отправки
   * @private
   */
  _handleSubmit(event) {
    // ✅ Хук перед валидацией (кастомное событие)
    const beforeEvent = $.Event('validation:beforeValidate');
    this.$el.trigger(beforeEvent);

    if (beforeEvent.isDefaultPrevented()) {
      logger.info('Валидация отменена хуком validation:beforeValidate', 'ValidationComponent');
      return true;
    }

    const isValid = this.validate();

    // ✅ Хук после валидации
    this.$el.trigger('validation:validated', { isValid });

    if (!isValid) {
      logger.info('Валидация не пройдена, отмена отправки', 'ValidationComponent');

      // ✅ Хук ошибки
      this.$el.trigger('validation:invalid', { errors: this.getErrors() });

      event.preventDefault();
      event.stopPropagation();

      return false;
    }

    logger.info('Валидация пройдена, разрешена отправка', 'ValidationComponent');

    // ✅ Хук успеха
    this.$el.trigger('validation:valid');

    return true;
  }

  /**
   * Обработчик клика на кнопку валидации
   * @param {Event} event - событие клика
   * @private
   */
  _handleValidateClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const isValid = this.validate();

    // Опционально: можно вызвать колбэк или отправить форму вручную
    if (isValid && this.$el.is('form')) {
      this.$el[0].submit();
    }
  }

  /**
   * Обработчик динамического добавления поля
   * @param {Event} event - событие добавления
   * @private
   */
  _handleFieldAdded(event) {
    const $newField = $(event.target || event.detail?.field);

    if ($newField.length) {
      const name = $newField.attr('name');

      if (name) {
        // Ищем существующий валидатор для этой группы по имени
        const existingValidator = this.fieldValidators.find(validator => {
          // Проверяем, содержит ли $valueSource поля с этим именем
          return validator.$valueSource.filter(`[name="${name}"]`).length > 0;
        });

        if (existingValidator) {
          // Добавляем поле к существующему валидатору
          existingValidator.$valueSource = existingValidator.$valueSource.add($newField);
          existingValidator.loadRules();
          logger.info(`Поле добавлено к существующему валидатору: ${name}`, 'ValidationComponent');
          return;
        }
      }

      // Если валидатор не найден — создаём новый
      const validator = this._createValidatorForGroup([$newField]);
      if (validator) {
        this.fieldValidators.push(validator);
        logger.info(`Создан новый валидатор для динамического поля: ${name || 'unnamed'}`, 'ValidationComponent');
      }
    }
  }

  // ========== Публичные методы ==========

  /**
   * Валидирует все поля формы
   * @returns {boolean} true если все поля валидны
   */
  validate() {
    let isValid = true;

    this.fieldValidators.forEach(validator => {
      if (!validator.validate()) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Очищает все ошибки
   */
  clearErrors() {
    this.fieldValidators.forEach(validator => {
      validator.clearError();
    });
  }

  /**
   * Обновляет правила для всех валидаторов
   * Используется после динамического изменения полей
   */
  refreshRules() {
    this.fieldValidators.forEach(validator => {
      validator.loadRules();
    });
  }

  /**
   * Устанавливает стиль ошибок для всех валидаторов
   * @param {string} styleName - имя стиля (rails, bootstrap, custom)
   */
  setErrorStyle(styleName) {
    this.fieldValidators.forEach(validator => {
      if (validator.errorRenderer && typeof validator.errorRenderer.setStyle === 'function') {
        validator.errorRenderer.setStyle(styleName);
      }
    });
  }

  /**
   * Сериализует форму в объект
   * Поддерживает массивы полей (name[])
   * @returns {Object|null} Объект с данными формы или null если это не форма
   */
  getFormData() {
    if (!this.$el.is('form')) {
      return null;
    }

    return this.$el.serializeArray().reduce((obj, item) => {
      // Обработка массивов (полей с [])
      if (item.name.endsWith('[]')) {
        const key = item.name.slice(0, -2);
        if (!obj[key]) {
          obj[key] = [];
        }
        obj[key].push(item.value);
      } else {
        obj[item.name] = item.value;
      }
      return obj;
    }, {});
  }

  /**
   * Получает все ошибки валидации
   * @returns {Array} Массив ошибок { field, message }
   */
  getErrors() {
    return this.fieldValidators
      .filter(validator => validator.errorRenderer.hasError())
      .map(validator => ({
        field: validator.$valueSource.attr('name') || validator.$valueSource[0].tagName.toLowerCase(),
        message: validator.errorRenderer.getLastErrorMessage()
      }));
  }

  // ========== Уничтожение ==========

  /**
   * Уничтожение компонента
   */
  destroy() {
    logger.info('ValidationComponent уничтожается', 'ValidationComponent');

    // Очищаем live-валидацию
    if (this._liveValidationHandlers) {
      this._liveValidationHandlers.forEach($fields => {
        $fields.off('.modia-live');
      });
      this._liveValidationHandlers = null;
    }

    // Очищаем валидаторы
    this.fieldValidators = [];
    this.fieldGroups = null;

    // ✅ Вызываем родительский destroy() — очистит события, данные, реестр
    super.destroy();

    logger.info('ValidationComponent уничтожен', 'ValidationComponent');
  }
}