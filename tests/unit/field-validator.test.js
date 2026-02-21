/**
 * Unit tests for FieldValidator
 * Проверяет: отдельные шаблоны (#error_span), валидацию массивов, иерархию сообщений
 */
import { FieldValidator } from '../../modia/services/field-validator.js';
import { FieldErrorRenderer } from '../../modia/services/field-error-renderer.js';
import { validationRules } from '../../modia/configurations/validation-rules.js';

describe('FieldValidator', () => {
  let $container;
  let $field;
  let $root;
  let renderer;
  let validator;

  beforeEach(() => {
    // Создаём DOM для тестов
    $container = $('<div></div>');
    $root = $container;
    $field = $('<input type="text" name="test" required>');
    $container.append($field);

    $('body').append($container);

    // Создаём рендерер и валидатор
    renderer = new FieldErrorRenderer($field);
    validator = new FieldValidator($field, $field, $root, validationRules, renderer);
  });

  afterEach(() => {
    $container.remove();
  });

  describe('getFieldValue', () => {
    test('возвращает значение для одиночного поля', () => {
      $field.val('test value');
      const value = validator.getFieldValue();

      expect(value).toBe('test value');
    });

    test('возвращает массив значений для группы полей', () => {
      // Создаём группу полей
      $container.empty();
      const $field1 = $('<input type="text" name="tags[]" value="tag1">');
      const $field2 = $('<input type="text" name="tags[]" value="tag2">');
      const $field3 = $('<input type="text" name="tags[]" value="">');

      $container.append($field1).append($field2).append($field3);

      const validatorGroup = new FieldValidator(
        $($container.find('[name="tags[]"]')),
        $field1,
        $root,
        validationRules,
        renderer
      );

      const value = validatorGroup.getFieldValue();

      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['tag1', 'tag2', '']);
    });

    test('возвращает пустую строку для пустого поля', () => {
      $field.val('');

      const value = validator.getFieldValue();

      expect(value).toBe('');
    });
  });

  describe('isVisibleForValidation', () => {
    test('возвращает true для видимого поля', () => {
      expect(validator.isVisibleForValidation()).toBe(true);
    });

    test('возвращает false для скрытого поля', () => {
      $field.hide();

      expect(validator.isVisibleForValidation()).toBe(false);
    });

    test('возвращает false для отключённого поля', () => {
      $field.prop('disabled', true);

      expect(validator.isVisibleForValidation()).toBe(false);
    });
  });

  describe('_getSeparateTemplateMessage', () => {
    test('находит старый шаблон #error_span для правила required', () => {
      $container.append('<div class="invisible" id="error_span"><span class="text-danger">Обязательное поле</span></div>');
      const message = validator._getSeparateTemplateMessage('required', {});

      expect(message).toContain('Обязательное поле');
    });

    test('возвращает null если шаблон не найден', () => {
      const message = validator._getSeparateTemplateMessage('nonexistent', {});

      expect(message).toBeNull();
    });

    test('подставляет параметры в шаблон', () => {
      $container.append('<div class="invisible" id="max_length_error_span"><span class="text-danger">Максимум __COUNT__ символов</span></div>');

      const message = validator._getSeparateTemplateMessage('max-length', { COUNT: 255 });

      expect(message).toContain('Максимум 255 символов');
    });
  });

  describe('_getContainerTemplateMessage', () => {
    test('находит шаблон в .error-templates по data-rule', () => {
      // Добавляем новый формат шаблона
      $container.append(`
        <div class="error-templates">
          <span class="text-danger" data-rule="required">Заполните поле</span>
        </div>
      `);
      const message = validator._getContainerTemplateMessage('required', {});

      expect(message).toContain('Заполните поле');
    });

    test('возвращает null если шаблон не найден', () => {
      $container.append('<div class="error-templates"></div>');

      const message = validator._getContainerTemplateMessage('required', {});

      expect(message).toBeNull();
    });
  });

  describe('validate', () => {
    test('возвращает true для заполненного поля', () => {
      $field.val('test value');
      const result = validator.validate();

      expect(result).toBe(true);
      expect(renderer.hasError()).toBe(false);
    });

    test('возвращает false для пустого поля и показывает ошибку', () => {
      $field.val('');

      // Добавляем шаблон ошибки
      $container.append(`
        <div class="error-templates">
          <span class="text-danger" data-rule="required">Обязательное поле</span>
        </div>
      `);

      const result = validator.validate();

      expect(result).toBe(false);
      expect(renderer.hasError()).toBe(true);
    });

    test('пропускает скрытые поля', () => {
      $field.hide();
      $field.val('');

      const result = validator.validate();

      expect(result).toBe(true); // Скрытые поля считаются валидными
    });
  });

  describe('validate array fields', () => {
    test('валидирует группу полей: хотя бы одно заполнено', () => {
      // Создаём группу полей
      $container.empty();
      const $field1 = $('<input type="text" name="tags[]" value="">');
      const $field2 = $('<input type="text" name="tags[]" value="filled">');
      const $field3 = $('<input type="text" name="tags[]" value="">');

      $container.append($field1).append($field2).append($field3);

      const validatorGroup = new FieldValidator(
        $($container.find('[name="tags[]"]')),
        $field1,
        $root,
        validationRules,
        new FieldErrorRenderer($field1)
      );

      const result = validatorGroup.validate();

      expect(result).toBe(true); // Хотя бы одно поле заполнено
    });

    test('возвращает false если все поля в группе пустые', () => {
      $container.empty();

      const $field1 = $('<input type="text" name="tags[]" value="">');
      const $field2 = $('<input type="text" name="tags[]" value="">');

      $container.append($field1).append($field2);

      // Добавляем шаблон ошибки
      $container.append(`
        <div class="error-templates">
          <span class="text-danger" data-rule="required">Заполните хотя бы одно поле</span>
        </div>
      `);

      const validatorGroup = new FieldValidator(
        $($container.find('[name="tags[]"]')),
        $field1,
        $root,
        validationRules,
        new FieldErrorRenderer($field1)
      );

      const result = validatorGroup.validate();

      expect(result).toBe(false);
    });
  });
});