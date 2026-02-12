/**
 * Unit tests for FieldErrorRenderer
 * Проверяет: подстановку параметров, рендеринг ошибок, очистку
 */
import { FieldErrorRenderer, DEFAULT_CONFIG } from '../../modia/services/field-error-renderer.js';

describe('FieldErrorRenderer', () => {
  let $container;
  let $errorScreen;
  let renderer;

  beforeEach(() => {
    // Создаём DOM для тестов
    $container = $('<div class="form-group"></div>');
    $errorScreen = $('<input type="text" name="test" class="form-control">');
    $container.append($errorScreen);
    $('body').append($container);

    // Создаём рендерер
    renderer = new FieldErrorRenderer($errorScreen);
  });

  afterEach(() => {
    // Очищаем DOM
    $container.remove();
  });

  describe('_formatMessage', () => {
    test('подстановка параметров в шаблон (__COUNT__ → 255)', () => {
      const message = 'Максимальная длина: __COUNT__ символов';
      const params = { COUNT: 255 };

      // Доступ к приватному методу через прототип
      const result = renderer._formatMessage(message, params);

      expect(result).toBe('Максимальная длина: 255 символов');
    });

    test('подстановка нескольких параметров', () => {
      const message = 'Поле __FIELD_NAME__: максимум __MAX__ символов';
      const params = { FIELD_NAME: 'description', MAX: 500 };

      const result = renderer._formatMessage(message, params);

      expect(result).toBe('Поле description: максимум 500 символов');
    });

    test('регистр параметров не важен (__count__ == __COUNT__)', () => {
      const message = 'Максимум __count__ символов';
      const params = { COUNT: 100 };

      const result = renderer._formatMessage(message, params);

      expect(result).toBe('Максимум 100 символов');
    });

    test('если параметр не найден, оставляем как есть', () => {
      const message = 'Ошибка: __UNKNOWN__';
      const params = { COUNT: 100 };

      const result = renderer._formatMessage(message, params);

      expect(result).toBe('Ошибка: __UNKNOWN__');
    });
  });

  describe('renderError', () => {
    test('рендерит ошибку и добавляет класс is-invalid', () => {
      const html = '<span class="text-danger">Обязательное поле</span>';

      renderer.renderError(html);

      expect($errorScreen.hasClass('is-invalid')).toBe(true);
      expect($errorScreen.next('.field-error-message').length).toBe(1);
      expect($errorScreen.next('.field-error-message').html()).toContain('Обязательное поле');
    });

    test('очищает предыдущую ошибку перед выводом новой (идемпотентность)', () => {
      const html1 = '<span class="text-danger">Ошибка 1</span>';
      const html2 = '<span class="text-danger">Ошибка 2</span>';

      renderer.renderError(html1);
      expect($errorScreen.next('.field-error-message').length).toBe(1);

      renderer.renderError(html2);
      expect($errorScreen.next('.field-error-message').length).toBe(1);
      expect($errorScreen.next('.field-error-message').html()).toContain('Ошибка 2');
    });
  });

  describe('clearError', () => {
    test('удаляет динамические ошибки', () => {
      const html = '<span class="text-danger">Обязательное поле</span>';

      renderer.renderError(html);
      expect($errorScreen.next('.field-error-message').length).toBe(1);

      renderer.clearError();
      expect($errorScreen.next('.field-error-message').length).toBe(0);
    });

    test('не удаляет шаблоны ошибок (.error-templates)', () => {
      // Добавляем шаблон ошибок
      const $templates = $('<div class="error-templates"><span data-rule="required">Обязательное</span></div>');
      $container.append($templates);

      renderer.renderError('<span class="text-danger">Ошибка</span>');
      renderer.clearError();

      // Шаблон должен остаться
      expect($container.find('.error-templates').length).toBe(1);
    });

    test('убирает класс is-invalid', () => {
      renderer.renderError('<span class="text-danger">Ошибка</span>');
      expect($errorScreen.hasClass('is-invalid')).toBe(true);

      renderer.clearError();
      expect($errorScreen.hasClass('is-invalid')).toBe(false);
    });
  });

  describe('hasError', () => {
    test('возвращает false если ошибки нет', () => {
      expect(renderer.hasError()).toBe(false);
    });

    test('возвращает true если ошибка отображена', () => {
      renderer.renderError('<span class="text-danger">Ошибка</span>');
      expect(renderer.hasError()).toBe(true);
    });
  });

  describe('setStyle', () => {
    test('устанавливает стиль ошибок (bootstrap)', () => {
      renderer.setStyle('bootstrap');

      // Проверяем, что стиль изменился
      // (текущий стиль хранится в renderer.currentStyle)
      expect(renderer.currentStyle).toEqual(DEFAULT_CONFIG.errorStyles.bootstrap);
    });

    test('устанавливает стиль ошибок (rails)', () => {
      renderer.setStyle('rails');

      expect(renderer.currentStyle).toEqual(DEFAULT_CONFIG.errorStyles.rails);
    });
  });
});