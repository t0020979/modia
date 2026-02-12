/**
 * ValidationComponent
 * 
 * Компонент валидации формы.
 * Отслеживает события отправки формы и валидирует все поля.
 * Поддерживает live-валидацию и динамическое добавление полей.
 * 
 * Улучшения в версии 1.1.0:
 * - Поддержка стилей ошибок (rails/bootstrap/custom)
 * - Обратная совместимость со старыми шаблонами
 * - Сохранение интеграции с Container
 * - Улучшенный метод refreshRules()
 * 
 * @class ValidationComponent
 * @extends BaseComponent
 */
import { BaseComponent } from '../core.js';
import { FieldValidator } from '../services/field-validator.js';
import { FieldErrorRenderer } from '../services/field-error-renderer.js';
import { validationRules } from '../configurations/validation-rules.js';
import debounce from '../services/debounce.js';

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
   * @param {HTMLElement} element - элемент формы
   */
  constructor(element) {
    super(element);
    console.log('[ValidationComponent] Инициализирован на:', element);

    // Объединяем конфиг по умолчанию с пользовательским
    this.config = {
      ...ValidationComponent.defaultConfig,
      ...this.config
    };

    // Массив валидаторов для полей
    this.fieldValidators = [];

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
   * Находит все поля и группирует их по имени
   * 
   * Логика группировки:
   * - Поля с одинаковым именем (например, name='tags[]') → одна группа
   * - Поля без имени → каждое поле отдельная группа
   * - Одиночные поля → группа из одного элемента
   * 
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
  }

  /**
   * Создаёт валидатор для группы полей
   * 
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
    if (!$valueSource || !$errorScreen) {
      return null;
    }

    // Создаём рендерер и валидатор
    const renderer = new FieldErrorRenderer($errorScreen, {
      defaultStyle: this.config.errorStyle
    });

    const validator = new FieldValidator($valueSource, $errorScreen, this.$el, validationRules, renderer);

    // Настраиваем live-валидацию если включена
    if (this.config.live) {
      this._setupLiveValidation($group, validator);
    }

    return validator;
  }

  /**
   * Определяет источник значения и экран ошибки для поля
   * 
   * Поддерживает два способа:
   * 1. Видимый элемент + внешний источник значения (через data-input-value-source)
   * 2. Скрытое поле + внешний экран ошибки (через data-input-error-screen)
   * 
   * @param {jQuery} $group - группа полей (может быть одним элементом)
   * @returns {Object} { $valueSource, $errorScreen }
   * @private
   */
  _determineValueSourceAndErrorScreen($group) {
    // Берём первый элемент группы для определения
    const $field = $group.first();

    let $valueSource = $group;      // По умолчанию — сама группа
    let $errorScreen = $field;      // По умолчанию — первый элемент

    // Способ 1: Видимый элемент + внешний источник значения
    // <div data-input-value-source="#hidden">Visible</div>
    // <input type="hidden" id="hidden">
    const valueSourceSelector = $field.data('input-value-source') || $field.data('input-field');
    if (valueSourceSelector) {
      const $externalValue = this.$el.find(valueSourceSelector);
      if ($externalValue.length) {
        $valueSource = $externalValue;
        $errorScreen = $field;
      }
    }

    // Способ 2: Скрытое поле + внешний экран ошибки
    // <input type="hidden" id="hidden" data-input-error-screen=".visible">
    // <div class="visible"></div>
    const errorScreenSelector = $field.data('input-error-screen');
    if (errorScreenSelector) {
      const $externalError = this.$el.find(errorScreenSelector);
      if ($externalError.length) {
        $valueSource = $group;
        $errorScreen = $externalError;
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
    // Валидация при потере фокуса (для текстовых полей)
    $fields.on('blur', () => {
      validator.validate();
    });

    // Валидация при изменении (для select, checkbox, radio)
    $fields.on('change', () => {
      validator.validate();
    });

    // Валидация при вводе (для текстовых полей с задержкой)
    // @todo доработать входные типы
    $fields.filter('input:text, input[type="email"], input[type="tel"], textarea').on('input', debounce(() => {
      validator.validate();
    }, this.config.debounceDelay));
  }

  // ========== Обработчики событий ==========

  /**
   * Навешивает обработчики событий
   * @private
   */
  _bindEvents() {
    // Валидация при отправке формы
    if (this.config.validateOnSubmit) {
      this._on('submit', this._handleSubmit);
    }

    // Валидация при клике на кнопку
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
  // _handleSubmit(event) {
  //   const isValid = this.validate();

  //   // Если есть ошибки — отменяем отправку
  //   if (!isValid) {
  //     event.preventDefault();
  //     event.stopPropagation();
  //   }
  // }
  _handleSubmit(event) {
    console.log('[ValidationComponent] Обработчик submit сработал');
    console.log('[ValidationComponent] event.type:', event.type);
    console.log('[ValidationComponent] event.target:', event.target);

    const isValid = this.validate();
    console.log('[ValidationComponent] Результат валидации:', isValid);

    if (!isValid) {
      console.log('[ValidationComponent] Есть ошибки, отменяем отправку');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation(); // ← Добавляем это
    } else {
      console.log('[ValidationComponent] Всё валидно, разрешаем отправку');
    }
  }

  /**
   * Обработчик клика на кнопку валидации
   * @param {Event} event - событие клика
   * @private
   */
  _handleValidateClick(event) {
    event.preventDefault();
    this.validate();
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
          return;
        }
      }

      // Если валидатор не найден — создаём новый
      const validator = this._createValidatorForGroup([$newField]);
      if (validator) {
        this.fieldValidators.push(validator);
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
}