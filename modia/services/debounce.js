/**
 * Debounce утилита
 * Задерживает вызов функции до тех пор, пока не пройдёт указанное время
 * без новых вызовов
 *
 * @param {function} func - Функция для вызова
 * @param {number} wait - Время ожидания в миллисекундах
 * @param {boolean} immediate - Вызвать сразу, а не после задержки
 * @returns {function} - Дебаунсированная функция
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

export default debounce;