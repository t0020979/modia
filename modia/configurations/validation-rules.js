/**
 * Validation Rules Configuration
 * Модуль: modia/configurations/validation-rules.js
 * Версия: 1.2.0
 * Дата: 2026-02-20
 * 
 * Принципы:
 * ✅ Чистая конфигурация — нет импортов из modia/
 * ✅ jQuery разрешён — глобально доступен
 * ✅ Каждое правило самодостаточно
 * ✅ Поддержка 5 уровней иерархии сообщений
 * ✅ Расширяемость — новое правило = добавить объект в массив
 */

// ============================================================================
// HELPER FUNCTIONS (чистые, без зависимостей)
// ============================================================================

/**
 * Проверяет, является ли значение пустым
 * @param {*} value - Значение для проверки
 * @returns {boolean}
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (Array.isArray(value) && value.every(v => isEmpty(v))) return true;
  return false;
}

/**
 * Форматирует сообщение с подстановкой параметров (case-insensitive)
 * @param {string} template - Шаблон сообщения
 * @param {Object} params - Параметры для подстановки
 * @returns {string}
 */
function formatMessage(template, params) {
  if (!template || !params) return template;

  return template.replace(/__\w+__/gi, match => {
    const key = match.replace(/__/g, '').toLowerCase();
    const paramKey = Object.keys(params).find(k => k.toLowerCase() === key);
    return paramKey !== undefined ? params[paramKey] : match;
  });
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * @typedef {Object} ValidationRule
 * @property {string} name - Уникальное имя (kebab-case)
 * @property {string} selector - CSS-селектор для отбора полей
 * @property {Function} validate - Функция валидации: ($field, validator) → boolean|{valid, params}
 * @property {string} [templateId] - ID legacy-шаблона (уровень 3 иерархии)
 * @property {string|Function} [defaultMessage] - Сообщение по умолчанию (уровень 4)
 * @property {number} [messageLevel] - Уровень для логирования (3-5)
 */

/**
 * Правило валидации "Обязательное поле"
 * 
 * Селектор: [required]
 * Проверяет, что поле не пустое (после удаления пробелов)
 * Поддерживает массивы полей — проверяет, что хотя бы один элемент заполнен
 */
export const validationRules = [
  // --------------------------------------------------------------------------
  // Правило 1: Required
  // --------------------------------------------------------------------------
  {
    name: 'required',
    selector: '[required]',
    templateId: 'error_span',
    defaultMessage: 'Обязательное поле',
    messageLevel: 4,

    /**
     * @param {jQuery} $field - Поле для валидации
     * @param {FieldValidator} validator - Валидатор (для getFieldValue())
     * @returns {boolean|{valid: boolean, params: Object}}
     */
    validate($field, validator) {
      let value = validator.getFieldValue();

      // Преобразуем в массив для единообразной обработки
      if (!Array.isArray(value)) {
        value = [value];
      }

      // Проверяем, есть ли хотя бы одно непустое значение
      const hasFilledValue = value.some(val => !isEmpty(val));

      return hasFilledValue ? true : { valid: false, params: {} };
    }
  },

  // --------------------------------------------------------------------------
  // Правило 2: MaxLength
  // --------------------------------------------------------------------------
  {
    name: 'max-length',
    selector: '[data-max-length]',
    templateId: 'max_length_error_span',
    defaultMessage: 'Максимальная длина: __COUNT__ символов',
    messageLevel: 4,

    validate($field, validator) {
      const maxLength = parseInt($field.data('max-length'), 10);
      if (isNaN(maxLength)) return true;

      const value = validator.getFieldValue();
      const values = Array.isArray(value) ? value : [value];
      const totalLength = values.reduce((sum, v) => sum + (v?.length || 0), 0);

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
  // Правило 3: Format (Regex)
  // --------------------------------------------------------------------------
  {
    name: 'format',
    selector: '[data-format]',
    templateId: 'format-error-span',
    defaultMessage: 'Неверный формат поля',
    messageLevel: 4,

    validate($field, validator) {
      const pattern = $field.data('format');
      if (!pattern) return true;

      const value = validator.getFieldValue();
      const values = Array.isArray(value) ? value : [value];

      try {
        const regex = new RegExp(pattern);
        const isValid = values.every(v => !v || regex.test(v));

        if (!isValid) {
          return { valid: false, params: { format: pattern } };
        }
      } catch (e) {
        // Неверный regex — пропускаем правило
        return true;
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 4: MinLength
  // --------------------------------------------------------------------------
  {
    name: 'min-length',
    selector: '[data-min-length]',
    templateId: 'min_length_error_span',
    defaultMessage: 'Минимальная длина: __COUNT__ символов',
    messageLevel: 4,

    validate($field, validator) {
      const minLength = parseInt($field.data('min-length'), 10);
      if (isNaN(minLength)) return true;

      const value = validator.getFieldValue();
      const values = Array.isArray(value) ? value : [value];
      const totalLength = values.reduce((sum, v) => sum + (v?.length || 0), 0);

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
  // Правило 5: Pattern (HTML5)
  // --------------------------------------------------------------------------
  {
    name: 'pattern',
    selector: '[pattern]',
    templateId: 'pattern-error-span',
    defaultMessage: 'Поле не соответствует шаблону',
    messageLevel: 4,

    validate($field, validator) {
      const pattern = $field.attr('pattern');
      if (!pattern) return true;

      const value = validator.getFieldValue();
      const values = Array.isArray(value) ? value : [value];

      try {
        const regex = new RegExp(`^${pattern}$`);
        const isValid = values.every(v => !v || regex.test(v));

        if (!isValid) {
          return { valid: false, params: { pattern } };
        }
      } catch (e) {
        return true;
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 6: Email (специализированный format)
  // --------------------------------------------------------------------------
  {
    name: 'email',
    selector: 'input[type="email"]',
    templateId: 'email-error-span',
    defaultMessage: 'Введите корректный email',
    messageLevel: 4,

    validate($field, validator) {
      const value = validator.getFieldValue();
      const values = Array.isArray(value) ? value : [value];

      // HTML5 email regex (упрощённый)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = values.every(v => !v || emailRegex.test(v));

      if (!isValid) {
        return { valid: false, params: {} };
      }

      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 7: AJAX (задел на будущее, v1.3+)
  // --------------------------------------------------------------------------
  {
    name: 'ajax',
    selector: '[data-ajax-validate]',
    templateId: 'ajax-error-span',
    defaultMessage: 'Проверка не пройдена',
    messageLevel: 4,

    validate($field, validator) {
      const url = $field.data('ajax-validate');
      if (!url) return true;

      // ⚠️ AJAX валидация требует асинхронной поддержки
      // Пока возвращаем true, реализация в v1.3+
      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Правило 8: Custom (для динамических правил)
  // --------------------------------------------------------------------------
  {
    name: 'custom',
    selector: '[data-validate-custom]',
    templateId: 'custom-error-span',
    defaultMessage: 'Пользовательская ошибка валидации',
    messageLevel: 4,

    validate($field, validator) {
      const customValidator = $field.data('validate-custom');
      if (!customValidator || typeof customValidator !== 'function') return true;

      const value = validator.getFieldValue();
      const result = customValidator(value, $field);

      if (result === false || (result && result.valid === false)) {
        return { valid: false, params: result?.params || {} };
      }

      return true;
    }
  }
];

// ============================================================================
// EXPORTS
// ============================================================================

export default validationRules;
export { isEmpty, formatMessage };