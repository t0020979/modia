/**
 * Validation Rules Configuration
 * Модуль: modia/configurations/validation-rules.js
 * Версия: 1.2.1 (компромиссная)
 * Дата: 2026-02-20
 * 
 * Принципы:
 * ✅ Чистая конфигурация — нет импортов из modia/
 * ✅ jQuery разрешён — глобально доступен
 * ✅ Каждое правило самодостаточно
 * ✅ Поддержка 5 уровней иерархии сообщений
 * ✅ Расширяемость — новое правило = добавить объект в массив
 * ✅ Явные функции и JSDoc — для читаемости
 */

// ============================================================================
// HELPER FUNCTIONS (чистые, без зависимостей)
// ============================================================================

/**
 * Нормализует значение в массив для единообразной обработки
 * @param {*} value - Значение для нормализации
 * @returns {Array} - Массив значений
 */
function normalizeValue(value) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Проверяет, является ли значение пустым
 * @param {*} value - Значение для проверки
 * @returns {boolean} - true если значение пустое
 */
function isEmpty(value) {
  // Явные проверки для читаемости
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (Array.isArray(value) && value.every(function (v) { return isEmpty(v); })) {
    return true;
  }
  return false;
}

/**
 * Форматирует сообщение с подстановкой параметров (case-insensitive)
 * @param {string} template - Шаблон сообщения с плейсхолдерами __KEY__
 * @param {Object} params - Объект параметров для подстановки
 * @returns {string} - Отформатированное сообщение
 * 
 * @example
 * formatMessage('Max: __COUNT__', { count: 10 }) // → 'Max: 10'
 * formatMessage('Hi __NAME__', { NAME: 'Alex' }) // → 'Hi Alex' (регистр не важен)
 */
function formatMessage(template, params) {
  if (!template || !params) {
    return template;
  }

  // ✅ Только плейсхолдеры __KEY__, не любые слова
  return template.replace(/__([A-Za-z_]+)__/g, function (match, placeholder) {
    const key = placeholder.toLowerCase();
    const paramKey = Object.keys(params).find(function (k) {
      return k.toLowerCase() === key;
    });
    return paramKey !== undefined ? params[paramKey] : match;
  });
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * @typedef {Object} ValidationRule
 * @property {string} name - Уникальное имя правила (kebab-case)
 * @property {string} selector - CSS-селектор для отбора полей
 * @property {Function} validate - Функция валидации: ($field, validator) → boolean|{valid, params}
 * @property {string} [templateId] - ID legacy-шаблона (уровень 3 иерархии)
 * @property {string|Function} [defaultMessage] - Сообщение по умолчанию (уровень 4)
 * @property {number} [messageLevel] - Уровень для логирования (3-5)
 */

/**
 * Массив правил валидации
 * @type {ValidationRule[]}
 */
export const validationRules = [

  // --------------------------------------------------------------------------
  // Правило 1: Required
  // --------------------------------------------------------------------------
  /**
   * Правило "Обязательное поле"
   * Проверяет, что поле не пустое (после удаления пробелов)
   * Поддерживает массивы полей — хотя бы один элемент заполнен
   */
  {
    /** @type {string} */
    name: 'required',

    /** @type {string} */
    selector: '[required]',

    /** @type {string} */
    templateId: 'error_span',

    /** @type {string} */
    defaultMessage: 'Обязательное поле',

    /** @type {number} */
    messageLevel: 4,

    /**
     * Функция валидации
     * @param {jQuery} $field - Поле для валидации
     * @param {FieldValidator} validator - Валидатор (для getFieldValue())
     * @returns {boolean|{valid: boolean, params: Object}}
     */
    validate: function ($field, validator) {
      const value = validator.getFieldValue();
      const values = normalizeValue(value);

      // Проверяем, есть ли хотя бы одно непустое значение
      const hasFilledValue = values.some(function (val) {
        return !isEmpty(val);
      });

      return hasFilledValue
        ? true
        : { valid: false, params: {} };
    }
  },

  // --------------------------------------------------------------------------
  // Правило 2: MaxLength
  // --------------------------------------------------------------------------
  /**
   * Правило "Максимальная длина"
   * Проверяет, что общая длина значения не превышает лимит
   */
  {
    name: 'max-length',
    selector: '[data-max-length]',
    templateId: 'max_length_error_span',
    defaultMessage: 'Максимальная длина: __COUNT__ символов',
    messageLevel: 4,

    validate: function ($field, validator) {
      const maxLength = parseInt($field.data('max-length'), 10);

      // Если атрибут не задан или не число — пропускаем правило
      if (isNaN(maxLength)) {
        return true;
      }

      const value = validator.getFieldValue();
      const values = normalizeValue(value);

      // Считаем общую длину всех значений
      const totalLength = values.reduce(function (sum, v) {
        return sum + (v?.length || 0);
      }, 0);

      if (totalLength > maxLength) {
        return {
          valid: false,
          params: { count: maxLength, current: totalLength }
        };
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 3: MinLength
  // --------------------------------------------------------------------------
  /**
   * Правило "Минимальная длина"
   * Проверяет, что общая длина значения не меньше лимита
   */
  {
    name: 'min-length',
    selector: '[data-min-length]',
    templateId: 'min_length_error_span',
    defaultMessage: 'Минимальная длина: __COUNT__ символов',
    messageLevel: 4,

    validate: function ($field, validator) {
      const minLength = parseInt($field.data('min-length'), 10);

      if (isNaN(minLength)) {
        return true;
      }

      const value = validator.getFieldValue();
      const values = normalizeValue(value);
      const totalLength = values.reduce(function (sum, v) {
        return sum + (v?.length || 0);
      }, 0);

      if (totalLength < minLength) {
        return {
          valid: false,
          params: { count: minLength, current: totalLength }
        };
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 4: Format (Regex)
  // --------------------------------------------------------------------------
  /**
   * Правило "Формат" (проверка по регулярному выражению)
   * Pattern берётся из data-format атрибута
   */
  {
    name: 'format',
    selector: '[data-format]',
    templateId: 'format-error-span',
    defaultMessage: 'Неверный формат поля',
    messageLevel: 4,

    validate: function ($field, validator) {
      const pattern = $field.data('format');

      // Если атрибут не задан — пропускаем правило
      if (!pattern) {
        return true;
      }

      const value = validator.getFieldValue();
      const values = normalizeValue(value);

      try {
        const regex = new RegExp(pattern);
        const isValid = values.every(function (v) {
          // Пустые значения пропускаем (они обрабатываются required)
          return !v || regex.test(v);
        });

        if (!isValid) {
          return { valid: false, params: { format: pattern } };
        }
      } catch (e) {
        // Неверный regex — логируем и пропускаем правило
        // console.warn('[validation-rules] Invalid regex:', pattern);
        return true;
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 5: Pattern (HTML5)
  // --------------------------------------------------------------------------
  /**
   * Правило "Pattern" (HTML5 атрибут pattern)
   * Автоматически оборачивает pattern в ^...$ для полного совпадения
   */
  {
    name: 'pattern',
    selector: '[pattern]',
    templateId: 'pattern-error-span',
    defaultMessage: 'Поле не соответствует шаблону',
    messageLevel: 4,

    validate: function ($field, validator) {
      const pattern = $field.attr('pattern');

      if (!pattern) {
        return true;
      }

      const value = validator.getFieldValue();
      const values = normalizeValue(value);

      try {
        // HTML5 pattern — неявное ^...$, добавляем явно
        const regex = new RegExp('^' + pattern + '$');
        const isValid = values.every(function (v) {
          return !v || regex.test(v);
        });

        if (!isValid) {
          return { valid: false, params: { pattern: pattern } };
        }
      } catch (e) {
        return true;
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 6: Email
  // --------------------------------------------------------------------------
  /**
   * Правило "Email" (специализированная проверка формата email)
   * Применяется автоматически к input[type="email"]
   */
  {
    name: 'email',
    selector: 'input[type="email"]',
    templateId: 'email-error-span',
    defaultMessage: 'Введите корректный email',
    messageLevel: 4,

    validate: function ($field, validator) {
      const value = validator.getFieldValue();
      const values = normalizeValue(value);

      // Упрощённый email regex (соответствует HTML5 spec)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const isValid = values.every(function (v) {
        // Пустые значения пропускаем
        return !v || emailRegex.test(v);
      });

      if (!isValid) {
        return { valid: false, params: {} };
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 7: AJAX (заглушка, v1.3+)
  // --------------------------------------------------------------------------
  /**
   * Правило "AJAX" (серверная валидация)
   * ⚠️ Заглушка: пока не реализована асинхронная поддержка
   * Реализация запланирована в v1.3
   */
  {
    name: 'ajax',
    selector: '[data-ajax-validate]',
    templateId: 'ajax-error-span',
    defaultMessage: 'Проверка не пройдена',
    messageLevel: 4,

    validate: function ($field, validator) {
      const url = $field.data('ajax-validate');

      if (!url) {
        return true;
      }

      // ⚠️ AJAX требует асинхронной валидации — пока заглушка
      // Реализация: возвращать Promise и обрабатывать в FieldValidator
      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 8: Custom (динамические правила)
  // --------------------------------------------------------------------------
  /**
   * Правило "Custom" (пользовательская валидация)
   * Позволяет задать функцию валидации через data-validate-custom
   */
  {
    name: 'custom',
    selector: '[data-validate-custom]',
    templateId: 'custom-error-span',
    defaultMessage: 'Пользовательская ошибка валидации',
    messageLevel: 4,

    validate: function ($field, validator) {
      const customFn = $field.data('validate-custom');

      // Если функция не задана или не функция — пропускаем
      if (!customFn || typeof customFn !== 'function') {
        return true;
      }

      const value = validator.getFieldValue();
      const result = customFn(value, $field);

      // Обработка результата: true = валидно, false/объект = ошибка
      if (result === true) {
        return true;
      }

      if (result === false) {
        return { valid: false, params: {} };
      }

      if (result && typeof result === 'object' && result.valid === false) {
        return { valid: false, params: result.params || {} };
      }

      // Fallback: считаем валидным
      return true;
    }
  }
];

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Экспорт по умолчанию — массив правил
 */
export default validationRules;

/**
 * Экспорт хелперов для тестов и кастомных правил
 */
export { isEmpty, formatMessage, normalizeValue };