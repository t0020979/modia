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
// UTILS (чистые, кэшируемые)
// ============================================================================

/**
 * Нормализует значение в массив для единообразной обработки
 * @param {*} value 
 * @returns {Array}
 */
const normalizeValue = (value) => Array.isArray(value) ? value : [value];

/**
 * Проверяет пустоту значения (оптимизировано для валидации полей)
 * @param {*} value
 * @returns {boolean}
 */
const isEmpty = (value) => {
  if (value == null) return true; // null || undefined
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmpty);
  return false;
};

/**
 * Форматирует сообщение (упрощённый, case-sensitive по умолчанию)
 * @param {string} template
 * @param {Object} params
 * @returns {string}
 */
function formatMessage(template, params) {
  if (!template || !params) return template;

  return template.replace(/__([A-Za-z_]+)__/g, (match, placeholder) => {
    const key = placeholder.toLowerCase();
    const paramKey = Object.keys(params).find(k => k.toLowerCase() === key);
    return paramKey !== undefined ? params[paramKey] : match;
  });
}

// ============================================================================
// RULE FACTORY (DRY: общие паттерны)
// ============================================================================

/**
 * Создаёт правило для проверки длины (min/max)
 * @param {Object} config
 * @returns {ValidationRule}
 */
const createLengthRule = ({ name, selector, templateId, defaultMessage, type }) => ({
  name,
  selector,
  templateId,
  defaultMessage,
  messageLevel: 4,

  validate($field, validator) {
    const limit = parseInt($field.data(name), 10);
    if (isNaN(limit)) return true;

    const values = normalizeValue(validator.getFieldValue());
    const total = values.reduce((sum, v) => sum + (v?.length || 0), 0);

    const invalid = type === 'max' ? total > limit : total < limit;
    return invalid
      ? { valid: false, params: { count: limit, current: total } }
      : true;
  }
});

/**
 * Создаёт правило для проверки по regex
 * @param {Object} config
 * @returns {ValidationRule}
 */
const createRegexRule = ({ name, selector, templateId, defaultMessage, patternSource, regex }) => ({
  name,
  selector,
  templateId,
  defaultMessage,
  messageLevel: 4,

  validate($field, validator) {
    const pattern = patternSource === 'data'
      ? $field.data(name)
      : $field.attr(name);

    if (!pattern) return true;

    const values = normalizeValue(validator.getFieldValue());

    try {
      const testRegex = regex || new RegExp(patternSource === 'attr' ? `^${pattern}$` : pattern);
      const isValid = values.every(v => !v || testRegex.test(v));
      return isValid ? true : { valid: false, params: { [name]: pattern } };
    } catch {
      return true; // Неверный regex — пропускаем
    }
  }
});

// ============================================================================
// RULES EXPORT
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
  // Required
  {
    name: 'required',
    selector: '[required]',
    templateId: 'error_span',
    defaultMessage: 'Обязательное поле',
    messageLevel: 4,

    validate($field, validator) {
      const values = normalizeValue(validator.getFieldValue());
      const hasValue = values.some(v => !isEmpty(v));
      return hasValue ? true : { valid: false, params: {} };
    }
  },

  // Length rules (DRY)
  createLengthRule({
    name: 'max-length',
    selector: '[data-max-length]',
    templateId: 'max_length_error_span',
    defaultMessage: 'Максимальная длина: __COUNT__ символов',
    type: 'max'
  }),

  createLengthRule({
    name: 'min-length',
    selector: '[data-min-length]',
    templateId: 'min_length_error_span',
    defaultMessage: 'Минимальная длина: __COUNT__ символов',
    type: 'min'
  }),

  // Regex rules (DRY)
  createRegexRule({
    name: 'format',
    selector: '[data-format]',
    templateId: 'format-error-span',
    defaultMessage: 'Неверный формат поля',
    patternSource: 'data'
  }),

  createRegexRule({
    name: 'pattern',
    selector: '[pattern]',
    templateId: 'pattern-error-span',
    defaultMessage: 'Поле не соответствует шаблону',
    patternSource: 'attr',
    regex: null // Использует ^pattern$
  }),

  // Email — специализированный regex (не DRY, т.к. фиксированный паттерн)
  {
    name: 'email',
    selector: 'input[type="email"]',
    templateId: 'email-error-span',
    defaultMessage: 'Введите корректный email',
    messageLevel: 4,

    validate($field, validator) {
      const values = normalizeValue(validator.getFieldValue());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = values.every(v => !v || emailRegex.test(v));
      return isValid ? true : { valid: false, params: {} };
    }
  },

  // AJAX — заглушка (YAGNI: не реализовано до v1.3)
  {
    name: 'ajax',
    selector: '[data-ajax-validate]',
    templateId: 'ajax-error-span',
    defaultMessage: 'Проверка не пройдена',
    messageLevel: 4,
    validate: () => true // Заглушка
  },

  // Custom — для динамических правил
  {
    name: 'custom',
    selector: '[data-validate-custom]',
    templateId: 'custom-error-span',
    defaultMessage: 'Пользовательская ошибка',
    messageLevel: 4,

    validate($field, validator) {
      const fn = $field.data('validate-custom');
      if (typeof fn !== 'function') return true;

      const value = validator.getFieldValue();
      const result = fn(value, $field);

      return (result === true)
        ? true
        : { valid: false, params: result?.params || {} };
    }
  }
];

// ============================================================================
// EXPORTS
// ============================================================================
export default validationRules;
export { isEmpty, formatMessage, normalizeValue };