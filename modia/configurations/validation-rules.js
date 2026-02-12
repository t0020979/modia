/**
 * Validation Rules
 * 
 * Конфигурация правил валидации.
 * Каждое правило — объект с определённым интерфейсом.
 * 
 * Улучшения в версии 1.1.0:
 * - Поддержка 5 уровней иерархии сообщений
 * - Обратная совместимость со старыми шаблонами
 * - Улучшенная обработка массивов полей
 * 
 * @module validation-rules
 */

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
 * Правило валидации "Обязательное поле"
 * 
 * Селектор: [required]
 * Проверяет, что поле не пустое (после удаления пробелов)
 * Поддерживает массивы полей — проверяет, что хотя бы один элемент заполнен
 */
export const validationRules = [
  {
    // ========== Определения полей ==========

    /**
     * Уникальное имя правила
     * Используется для поиска атрибута `data-error-text-{name}`
     * @type {string}
     */
    name: 'required',

    /**
     * CSS-селектор для отбора полей, к которым применяется правило
     * @type {string}
     */
    selector: '[required]',

    /**
     * Идентификатор шаблона ошибки (для обратной совместимости)
     * @type {string}
     */
    templateId: 'error_span',

    /**
     * Сообщение по умолчанию (если шаблон не найден)
     * Может быть строкой или функцией
     * @type {string|Function}
     */
    defaultMessage: 'This field is required',

    // ========== Основная логика ==========

    /**
     * Функция валидации
     * 
     * Объединяет два сценария:
     * 1. Одиночное поле — проверяет, что значение не пустое
     * 2. Массив полей — проверяет, что хотя бы один элемент заполнен
     * 
     * @param {jQuery} $field - поле для валидации
     * @param {FieldValidator} validator - валидатор поля
     * @returns {boolean|Object} true если валидно, или { valid: false, params: {...} } если ошибка
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
  }
];

export default validationRules;