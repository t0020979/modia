/**
 * Debounce утилита
 * 
 * Задерживает вызов функции до тех пор, пока не пройдёт указанное время
 * без новых вызовов. Поддерживает режим немедленного вызова при первом срабатывании.
 * 
 * @example
 * // Базовое использование (отложенный вызов)
 * const saveHandler = debounce(() => {
 *   console.log('Сохранение...');
 * }, 500);
 * 
 * @example
 * // Режим immediate (вызов сразу, затем пауза)
 * const clickHandler = debounce(() => {
 *   console.log('Клик обработан');
 * }, 300, true);
 * 
 * @param {Function} func - Функция для вызова
 * @param {number} wait - Время ожидания в миллисекундах (по умолчанию: 300)
 * @param {boolean} immediate - Если true, вызвать функцию немедленно при первом вызове,
 *                              затем ждать паузы перед следующим вызовом (по умолчанию: false)
 * @returns {Function} Дебаунсированная функция-обёртка
 * 
 * @behaviour
 * - При каждом вызове сбрасывает предыдущий таймер
 * - В режиме !immediate: функция вызывается после паузы без новых вызовов
 * - В режиме immediate: функция вызывается сразу при первом вызове, затем игнорируется до конца паузы
 * - Контекст (this) и аргументы сохраняются корректно
 * - Ошибки в func не ломают работу таймера
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout = null;

  /**
   * Безопасный вызов функции с обработкой ошибок
   * @param {Function} fn - Функция для вызова
   * @param {*} context - Контекст для apply
   * @param {Array} args - Аргументы для передачи
   */
  const safeCall = (fn, context, args) => {
    try {
      fn.apply(context, args);
    } catch (error) {
      console.error('Debounce: функция выбросила ошибку', error);
    }
  };

  return function executedFunction(...args) {
    const context = this;

    /**
     * Callback для отложенного вызова
     * Вызывается после истечения таймера wait
     */
    const later = () => {
      timeout = null;

      // В режиме !immediate вызываем функцию после задержки
      if (!immediate) {
        safeCall(func, context, args);
      }
    };

    // Сбрасываем предыдущий таймер (если был)
    clearTimeout(timeout);

    // Устанавливаем новый таймер
    timeout = setTimeout(later, wait);

    // В режиме immediate вызываем функцию немедленно при первом вызове
    // и если таймер ещё не установлен
    if (immediate && !timeout) {
      safeCall(func, context, args);
    }
  };
}