/**
 * Integration tests for ValidationComponent
 * Проверяет: валидацию на div без формы, работу с разными типами полей
 */
import { ValidationComponent } from '../../modia/components/validation.js';
import { ComponentScanner } from '../../modia/core.js';

describe('ValidationComponent Integration', () => {
  let $container;
  let component;

  afterEach(() => {
    if ($container) {
      $container.remove();
    }
    if (component && typeof component.destroy === 'function') {
      component.destroy();
    }
  });

  describe('Валидация на div без формы (Вариант Б)', () => {
    beforeEach(() => {
      // Создаём модалку без формы (как в примере 2)
      $container = $(`
        <div class="modal-body" data-component="validation">
          <div class="form-group">
            <label>Имя</label>
            <input type="text" name="name" required class="form-control">
          </div>
          
          <div class="form-group">
            <label>Вид</label>
            <select name="species" required class="form-control">
              <option value="">Выберите...</option>
              <option value="crocodile">Крокодил</option>
              <option value="lion">Лев</option>
            </select>
          </div>
          
          <div class="error-templates">
            <span class="text-danger" data-rule="required">Заполните поле</span>
          </div>
        </div>
      `);

      $('body').append($container);

      // Инициализируем компонент
      component = new ValidationComponent($container[0]);
    });

    test('компонент инициализируется на div', () => {
      expect(component).toBeDefined();
      expect(component.$el.is('div')).toBe(true);
      expect(component.$el.data('component')).toBe('validation');
    });

    test('валидирует поля внутри div', () => {
      const $name = $container.find('[name="name"]');
      const $species = $container.find('[name="species"]');

      // Поля пустые
      $name.val('');
      $species.val('');

      const isValid = component.validate();

      expect(isValid).toBe(false);
      expect($name.hasClass('is-invalid')).toBe(true);
      expect($species.hasClass('is-invalid')).toBe(true);
    });

    test('возвращает true если все поля заполнены', () => {
      const $name = $container.find('[name="name"]');
      const $species = $container.find('[name="species"]');

      $name.val('Чебурашка');
      $species.val('crocodile');

      const isValid = component.validate();

      expect(isValid).toBe(true);
      expect($name.hasClass('is-invalid')).toBe(false);
      expect($species.hasClass('is-invalid')).toBe(false);
    });
  });

  describe('Работа с разными типами полей', () => {
    beforeEach(() => {
      $container = $(`
        <form data-component="validation">
          <!-- Обычное текстовое поле -->
          <div class="form-group">
            <input type="text" name="name" required class="form-control">
          </div>
          
          <!-- Мультиселект -->
          <div class="form-group">
            <select name="members[]" class="form-control" multiple required>
              <option value="cheburashka">Чебурашка</option>
              <option value="crocodile">Крокодил Гена</option>
            </select>
          </div>
          
          <!-- Скрытое поле с внешним экраном -->
          <div class="form-group">
            <div class="character-selector" id="character-selector">
              <button type="button" data-select="cheburashka">Чебурашка</button>
            </div>
            <input type="hidden" id="character_id" name="character_id" required 
                   data-input-error-screen="#character-selector">
          </div>
          
          <div class="error-templates">
            <span class="text-danger" data-rule="required">Обязательное поле</span>
          </div>
        </form>
      `);

      $('body').append($container);
      component = new ValidationComponent($container[0]);
    });

    test('валидирует обычное текстовое поле', () => {
      const $name = $container.find('[name="name"]');
      $name.val('');

      const isValid = component.validate();

      expect(isValid).toBe(false);
      expect($name.hasClass('is-invalid')).toBe(true);
    });

    test('валидирует мультиселект (массив значений)', () => {
      const $select = $container.find('[name="members[]"]');
      $select.val([]); // Ничего не выбрано

      const isValid = component.validate();

      expect(isValid).toBe(false);
      expect($select.hasClass('is-invalid')).toBe(true);
    });

    test('валидирует мультиселект если выбрано хотя бы одно значение', () => {
      const $select = $container.find('[name="members[]"]');
      $select.val(['cheburashka']); // Выбран один элемент

      const isValid = component.validate();

      expect(isValid).toBe(true);
      expect($select.hasClass('is-invalid')).toBe(false);
    });

    test('валидирует скрытое поле с внешним экраном ошибки', () => {
      const $hidden = $container.find('#character_id');
      const $screen = $container.find('#character-selector');

      $hidden.val(''); // Скрытое поле пустое

      const isValid = component.validate();

      expect(isValid).toBe(false);
      // Ошибка должна отобразиться на внешнем экране
      expect($screen.next('.field-error-message').length).toBe(1);
    });
  });

  describe('Автоматическая инициализация через ComponentScanner', () => {
    beforeEach(() => {
      $container = $(`
        <form data-component="validation">
          <div class="form-group">
            <input type="text" name="email" required class="form-control">
          </div>
          
          <div class="error-templates">
            <span class="text-danger" data-rule="required">Обязательное поле</span>
          </div>
          
          <button type="submit" class="btn btn-primary">Отправить</button>
        </form>
      `);

      $('body').append($container);
    });

    test('ComponentScanner.scan() находит и инициализирует компонент', () => {
      const instances = ComponentScanner.scan($container[0]);

      expect(instances.length).toBe(1);
      expect(instances[0]).toBeInstanceOf(ValidationComponent);
    });

    test('Modia.ComponentScanner.scan() работает как глобальный метод', () => {
      // Глобальный объект должен быть доступен
      window.Modia = window.Modia || {};
      window.Modia.ComponentScanner = ComponentScanner;

      const instances = window.Modia.ComponentScanner.scan($container[0]);

      expect(instances.length).toBe(1);
      expect(instances[0]).toBeInstanceOf(ValidationComponent);
    });
  });

  describe('Публичные методы', () => {
    beforeEach(() => {
      $container = $(`
        <form data-component="validation">
          <input type="text" name="name" required class="form-control">
          <div class="error-templates">
            <span class="text-danger" data-rule="required">Обязательное поле</span>
          </div>
        </form>
      `);

      $('body').append($container);
      component = new ValidationComponent($container[0]);

      // Заполняем поле
      $container.find('[name="name"]').val('Test');
    });

    test('validate() возвращает true если все поля валидны', () => {
      const result = component.validate();

      expect(result).toBe(true);
    });

    test('clearErrors() удаляет все ошибки', () => {
      // Сначала вызываем ошибку
      $container.find('[name="name"]').val('');
      component.validate();

      expect($container.find('.is-invalid').length).toBeGreaterThan(0);

      // Очищаем
      component.clearErrors();

      expect($container.find('.is-invalid').length).toBe(0);
    });

    test('refreshRules() обновляет правила валидации', () => {
      // Добавляем новое поле динамически
      $container.append('<input type="text" name="new_field" required class="form-control">');

      const oldCount = component.fieldValidators.length;

      component.refreshRules();

      // Количество валидаторов должно увеличиться
      expect(component.fieldValidators.length).toBeGreaterThan(oldCount);
    });

    test('setErrorStyle() устанавливает стиль ошибок', () => {
      // Проверяем, что метод существует
      expect(typeof component.setErrorStyle).toBe('function');

      // Вызываем метод
      component.setErrorStyle('rails');

      // Стиль должен примениться ко всем валидаторам
      // (проверяем через внутреннее состояние)
      expect(component.config.errorStyle).toBe('rails');
    });
  });
});