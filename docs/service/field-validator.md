# FieldValidator Service

**Версия:** 1.2.0  
**Расположение:** `modia/services/field-validator.js`  
**Зависимости:** `logger.js`, `field-error-renderer.js`

---

## 📖 Описание

`FieldValidator` — сервис валидации одного поля или группы полей. Отвечает за:

- ✅ Проверку значения поля по набору правил
- ✅ Определение уровня сообщения об ошибке (5 уровней иерархии)
- ✅ Очистку ошибок (включая комбинированную подсветку групп)
- ✅ Логирование процесса валидации

**Не отвечает за:**
- ❌ Отображение ошибок в DOM (это `FieldErrorRenderer`)
- ❌ Управление формой или событиями (это `ValidationComponent`)
- ❌ Хранение правил валидации (это `validation-rules.js`)

---

## 🚀 Быстрый старт

### Базовое использование

```html
<form data-component="validation">
  <div class="form-group">
    <input type="email" id="email" name="email" required>
    
    <!-- Шаблон ошибки (Уровень 2) -->
    <div class="error-template invisible">
      <span data-rule="required">Обязательное поле</span>
    </div>
  </div>
</form>

<script type="module">
  import { FieldValidator, FieldErrorRenderer } from '../../modia/services/field-validator.js';
  import { validationRules } from '../../modia/configurations/validation-rules.js';
  
  const $field = $('#email');
  const $errorScreen = $field;
  const $root = $('form[data-component="validation"]');
  const renderer = new FieldErrorRenderer($errorScreen);
  
  const validator = new FieldValidator(
    $field,
    $errorScreen,
    $root,
    validationRules,
    renderer
  );
  
  // Валидация
  const isValid = validator.validate();
  
  // Получение значения
  const value = validator.getFieldValue();
</script>
```

### Rails шаблон (form.html.erb)

```erb
<%= form_with(model: @user, data: { component: 'validation' }) do |f| %>
  <div class="form-group">
    <%= f.email_field :email, id: 'email', required: true %>
    
    <div class="error-template invisible">
      <span data-rule="required">Обязательное поле</span>
    </div>
  </div>
<% end %>
```

---

## 📋 Типичные сценарии

### 1. Одиночное текстовое поле

```javascript
const validator = new FieldValidator($('#email'), $('#email'), $root, rules, renderer);
validator.validate(); // true/false
```

### 2. Массив полей (name='tags[]')

```javascript
// Возвращает Array<string>
const value = validator.getFieldValue(); // ["тег1", "тег2", ""]
const isValid = validator.validate();    // true если хотя бы одно заполнено
```

### 3. Checkbox группа (name='interests[]')

```javascript
// Возвращает Array<string> только отмеченных
const value = validator.getFieldValue(); // ["programming", "design"]
const isValid = validator.validate();    // true если хотя бы один отмечен
```

### 4. Множественный select (multiple)

```javascript
// Возвращает Array<string> выбранных значений
const value = validator.getFieldValue(); // ["tag1", "tag3"]
```

### 5. Contenteditable поле

```javascript
// Возвращает только видимый текст (без HTML-тегов)
const value = validator.getFieldValue(); // "SELECT * FROM users"
```

### 6. Скрытое поле + внешний экран ошибки

```html
<input type="hidden" id="real-field" name="field">
<div id="visible-field" data-input-value-source="#real-field">Выберите...</div>
```

```javascript
// $valueSource = скрытое поле, $errorScreen = видимый элемент
const validator = new FieldValidator($('#real-field'), $('#visible-field'), $root, rules, renderer);
```

---

## 🎯 5 Уровней иерархии сообщений

FieldValidator определяет сообщение об ошибке по приоритету:

| Уровень | Источник | Пример | Когда использовать |
|---------|----------|--------|-------------------|
| 1 | Inline-атрибут | `data-error-text-required="Заполните поле"` | Точечная переопределение |
| 2 | Шаблон в контейнере | `.error-template [data-rule="required"]` | **Рекомендуемый** |
| 3 | Отдельный шаблон | `#error_span` | Legacy-код |
| 4 | defaultMessage правила | `'Обязательное поле'` | fallback |
| 5 | Fallback валидатора | `'Field error'` | Критическая ошибка |

---

## ⚙️ Конфигурация

### Параметры конструктора

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `$valueSource` | jQuery | ✅ | Источник значения (поле или скрытый инпут) |
| `$errorScreen` | jQuery | ✅ | Элемент для отображения ошибки (визуальный) |
| `$root` | jQuery | ✅ | Корень формы/контейнера (для поиска шаблонов) |
| `validationRules` | Array | ✅ | Массив правил валидации (интерфейс ValidationRule) |
| `errorRenderer` | FieldErrorRenderer | ✅ | Рендерер ошибок |

---

## 🔧 Динамические поля

### Обновление правил после добавления поля

```javascript
// 1. Добавляем новое поле динамически
const $newField = $('<input name="tags[]" required>');
$('#tags-container').append($newField);

// 2. Создаём новый валидатор для поля
const newValidator = new FieldValidator($newField, $newField, $root, rules, renderer);

// 3. Или обновляем кэш существующего (если селектор изменился)
existingValidator.loadRules();
```

---

## ⚠️ Известные ограничения

| Ограничение | Статус | Обходное решение |
|-------------|--------|------------------|
| Ошибка не очищается при `disabled` без re-validate | 🟡 v1.2 | Вызывать `validate()` после изменения состояния |
| Ошибка не очищается при `hidden` без re-validate | 🟡 v1.2 | Вызывать `validate()` после изменения состояния |
| MutationObserver для отслеживания состояния | ⏳ v1.3 | Запланировано в ROADMAP |

---

## 🧪 Тесты

| Файл | Сценарий |
|------|----------|
| `examples/service/field-validator/test-01-basic.html` | Базовая валидация |
| `examples/service/field-validator/test-02-message-hierarchy.html` | 5 уровней сообщений |
| `examples/service/field-validator/test-03-edge-cases.html` | Крайние случаи |
| `examples/service/field-validator/test-04-hidden-fields.html` | Скрытые поля |
| `examples/service/field-validator/test-05-arrays.html` | Массивы полей |

---

## 📚 См. также

- [FieldErrorRenderer](./field-error-renderer.md) — рендеринг ошибок
- [ValidationComponent](../component/validation.md) — компонент валидации формы
- [validation-rules.js](../../modia/configurations/validation-rules.js) — конфигурация правил

---

**Последнее обновление:** 2026-02-21  
**Статус:** ✅ Актуально (v1.2.0)
