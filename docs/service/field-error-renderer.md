# FieldErrorRenderer Service

**Версия:** 1.2.0  
**Файл:** `modia/services/field-error-renderer.js`  
**Тип:** Сервис рендеринга ошибок валидации

---

## 📖 Обзор

`FieldErrorRenderer` — это сервис для отображения и очистки ошибок валидации в DOM. Он **не знает** о правилах валидации, событиях или источниках текста — его единственная ответственность: **вставить готовый HTML в нужное место и удалить его при необходимости**.

### Ключевые принципы

| Принцип | Описание |
|---------|----------|
| **Только DOM** | Сервис не генерирует сообщения, только размещает их |
| **Идемпотентность** | Методы можно вызывать многократно без побочных эффектов |
| **Кэширование** | Поиск контейнера выполняется один раз при инициализации |
| **Конфигурируемость** | Стили и селекторы настраиваются через `DEFAULT_CONFIG` |
| **Обратная совместимость** | Legacy-шаблоны (`.error-template`) не удаляются |

---

## 🔌 Подключение

### Через импорт (рекомендуется)

```javascript
import { FieldErrorRenderer } from '../../modia/services/field-error-renderer.js';

const renderer = new FieldErrorRenderer($('#email'));
renderer.renderError('<span class="text-danger">Ошибка</span>');
```

### Через FieldValidator (автоматически)

```javascript
import { FieldValidator } from '../../modia/services/field-validator.js';

const validator = new FieldValidator($valueSource, $errorScreen, $root, rules, renderer);
validator.validate(); // → автоматически вызовет renderer.renderError()
```

---

## 📦 Базовое использование

### Пример 1: Простое поле

```html
<!-- HTML -->
<div class="form-group" id="form_email">
  <label for="email">Email *</label>
  <input type="email" id="email" class="form-control" placeholder="test@example.com">
</div>
```

```javascript
// JavaScript
import { FieldErrorRenderer } from '../../modia/services/field-error-renderer.js';

const renderer = new FieldErrorRenderer($('#email'));

// Показать ошибку
renderer.renderError('<span class="text-danger">Некорректный email адрес</span>');

// Скрыть ошибку
renderer.clearError();

// Проверить наличие ошибки
if (renderer.hasError()) {
  console.log('Ошибка отображается');
}
```

### Пример 2: Rails шаблон (form.html.erb)

```erb
<!-- app/views/users/_form.html.erb -->
<div class="form-group" id="form_email">
  <%= form.label :email, "Email *" %>
  <%= form.email_field :email, class: "form-control", id: "email", placeholder: "test@example.com" %>
  
  <!-- Шаблон ошибки (не удаляется при очистке) -->
  <div id="error_span" class="invisible error-template">
    <span class="text-danger"><%= t('errors.messages.blank') %></span>
  </div>
</div>

<script>
  import { FieldErrorRenderer } from '../../modia/services/field-error-renderer.js';
  
  const renderer = new FieldErrorRenderer($('#email'));
  
  // При ошибке валидации
  if (!isValid) {
    renderer.renderError('<span class="text-danger">Заполните поле</span>');
  }
</script>
```

---

## 🎨 Конфигурация

### DEFAULT_CONFIG

```javascript
export const DEFAULT_CONFIG = {
  // Селекторы контейнеров для вставки ошибки
  containerSelectors: '.form-group, .input-group, .form-field',
  
  // Класс шаблонов ошибок (не удаляются при очистке)
  errorTemplateClass: '.error-template',
  
  // Классы динамических ошибок
  errorClasses: '.text-danger, .invalid-feedback, .form-error-message',
  
  // Маркер для поиска ошибок (data-атрибут)
  errorMarker: 'data-modia-error',
  
  // Стили ошибок
  errorStyles: {
    rails: {
      containerClass: 'field_with_errors',
      errorClass: 'form-error',
      messageClass: 'form-error-message'
    },
    bootstrap: {
      containerClass: '',
      errorClass: 'is-invalid',
      messageClass: 'invalid-feedback'
    },
    custom: {
      containerClass: '',
      errorClass: '',
      messageClass: ''
    }
  },
  
  // Стиль по умолчанию
  defaultStyle: 'bootstrap',
  
  // Legacy шаблоны (обратная совместимость)
  legacyTemplates: {
    required: '#error_span',
    format: '#format-error-span',
    ajax: '#ajax-error-span',
    'max-length': '#max_length_error_span',
    'html-tags': '.html-tags-error-message'
  }
};
```

### Переопределение конфигурации

```javascript
const renderer = new FieldErrorRenderer($('#email'), {
  defaultStyle: 'rails',
  containerSelectors: '.custom-form-group'
});
```

---

## 🎭 Стили ошибок

### Bootstrap (по умолчанию)

```javascript
renderer.setStyle('bootstrap');
renderer.renderError('<span class="invalid-feedback">Ошибка</span>');
```

**Результат:**
- Поле получает класс `.is-invalid` (красная рамка)
- Ошибка вставляется с классом `.invalid-feedback`

### Rails

```javascript
renderer.setStyle('rails');
renderer.renderError('<span class="form-error-message">Ошибка</span>');
```

**Результат:**
- Поле оборачивается в `.field_with_errors`
- Поле получает класс `.form-error`

### Custom

```javascript
renderer.setStyle('custom');
renderer.renderError('<span>Ошибка</span>');
```

**Результат:**
- Никаких дополнительных классов не добавляется
- Полный контроль над стилями через CSS

---

## 📋 API Reference

### constructor($errorScreen, config = {})

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `$errorScreen` | jQuery | ✅ Да | Элемент, для которого выводится ошибка |
| `config` | Object | ❌ Нет | Переопределение DEFAULT_CONFIG |

**Исключения:**
- `Error: [FieldErrorRenderer] $errorScreen is required` — если элемент не передан

**Пример:**
```javascript
const renderer = new FieldErrorRenderer($('#email'));
```

---

### renderError(html, styleName = null)

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `html` | string | ✅ Да | Готовый HTML-фрагмент с сообщением |
| `styleName` | string | ❌ Нет | Имя стиля (rails/bootstrap/custom) |

**Поведение:**
1. Очищает предыдущую ошибку (идемпотентность)
2. Добавляет класс ошибки на `$errorScreen`
3. Вставляет HTML в контейнер или после элемента (fallback)
4. Добавляет маркер `data-modia-error="{containerId}:{fieldId}"`

**Логирование:**
- `logger.info()` — при каждом рендере
- `logger.warn()` — если plain text обёрнут в тег

**Пример:**
```javascript
// Готовый HTML
renderer.renderError('<span class="text-danger">Обязательное поле</span>');

// С локальной сменой стиля
renderer.renderError('<span>Ошибка</span>', 'rails');
```

---

### clearError(preserveTemplates = true)

**Параметры:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `preserveTemplates` | boolean | `true` | Сохранять legacy-шаблоны |

**Поведение:**
1. Находит ошибки по маркеру `data-modia-error`
2. Если `preserveTemplates = true` — исключает `.error-template`
3. Удаляет класс ошибки с `$errorScreen`
4. Удаляет Rails-обёртку (если есть)

**Логирование:**
- `logger.info()` — при каждой очистке

**Пример:**
```javascript
// Очистить, сохраняя шаблоны
renderer.clearError();

// Очистить всё (включая шаблоны)
renderer.clearError(false);
```

---

### hasError()

**Возвращает:** `boolean`

**Проверки:**
- Класс ошибки на `$errorScreen`
- Класс ошибки на родителе
- Соседний элемент с маркером `data-modia-error`

**Пример:**
```javascript
if (renderer.hasError()) {
  renderer.clearError();
}
```

---

### getLastErrorMessage()

**Возвращает:** `string|null`

**Пример:**
```javascript
renderer.renderError('<span>Ошибка</span>');
const lastError = renderer.getLastErrorMessage();
// → '<span>Ошибка</span>'
```

---

### setStyle(styleName)

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `styleName` | string | `rails` | `bootstrap` | `custom` |

**Логирование:**
- `logger.info()` — при смене стиля

**Пример:**
```javascript
renderer.setStyle('rails');
renderer.renderError('<span>Ошибка</span>');
```

---

## 🧪 Примеры тестирования

### Тест 1: Базовый рендер

```html
<!-- examples/service/field-error-renderer/test-01-basic-render.html -->
<div class="form-group" id="form_1">
  <input type="email" id="email" class="form-control">
</div>

<button id="btn_render">renderError()</button>
<button id="btn_clear">clearError()</button>

<script type="module">
  import { FieldErrorRenderer } from '../../../modia/services/field-error-renderer.js';
  
  const renderer = new FieldErrorRenderer($('#email'));
  
  $('#btn_render').on('click', () => {
    renderer.renderError('<span class="text-danger">Ошибка</span>');
  });
  
  $('#btn_clear').on('click', () => {
    renderer.clearError();
  });
</script>
```

### Тест 2: Смена стилей

```html
<!-- examples/service/field-error-renderer/test-02-styles.html -->
<button onclick="renderer.setStyle('rails')">Rails</button>
<button onclick="renderer.setStyle('bootstrap')">Bootstrap</button>
<button onclick="renderer.setStyle('custom')">Custom</button>
```

### Тест 3: Legacy шаблоны

```html
<!-- examples/service/field-error-renderer/test-03-legacy-templates.html -->
<div class="error-template" id="error_span">
  <span class="text-danger">Шаблон (не удалится)</span>
</div>
```

---

## ⚠️ Важные замечания

### 1. ID элементов

**Требование:** Все элементы должны иметь `id` атрибут.

```javascript
// ✅ Правильно
<input type="email" id="email">

// ❌ Неправильно → logger.warn()
<input type="email">
```

**Почему:** Маркер ошибок использует ID для поиска: `data-modia-error="form_1:email_1"`

### 2. Спецсимволы в ID

**Не рекомендуется:**
```html
<!-- ❌ Двоеточия, пробелы, спецсимволы -->
<input id="field:with:colons">
<input id="field with spaces">
```

**Почему:** Могут ломать CSS-селекторы. При обнаружении — `logger.warn()`.

### 3. Plain text vs HTML

```javascript
// ✅ Готовый HTML
renderer.renderError('<span class="text-danger">Текст</span>');

// ⚠️ Plain text (автоматически обернётся + logger.warn())
renderer.renderError('Текст');
```

**Рекомендация:** FieldValidator должен всегда передавать готовый HTML.

### 4. Идемпотентность

```javascript
// ✅ Можно вызывать многократно
renderer.renderError('Ошибка 1');
renderer.renderError('Ошибка 2'); // ← предыдущая очистится
renderer.renderError('Ошибка 3'); // ← только одна ошибка в DOM
```

---

## 🔗 Зависимости

| Модуль | Тип | Назначение |
|--------|-----|------------|
| jQuery | Внешняя | DOM-манипуляции |
| logger | Внутренняя | Логирование событий |

---

## 📚 Связанная документация

| Файл | Описание |
|------|----------|
| [`field-validator.md`](./field-validator.md) | Валидация поля + иерархия сообщений |
| [`validation-component.md`](../components/validation.md) | Оркестрация валидации формы |
| [`logger.md`](./logger.md) | Сервис логирования |

---

## 🚀 Планы на развитие (v1.3+)

| Версия | Функция | Статус |
|--------|---------|--------|
| v1.3 | Автоматическая генерация ID (BaseComponent) | 📋 Запланировано |
| v1.3 | UI панель для логов (DebugComponent) | 📋 Запланировано |
| v1.4 | Поддержка Turbolinks (refreshContainer) | 💭 Обсуждается |
| v1.4 | Метод `cancel()` для отмены рендера | 💭 Обсуждается |

---

## 📝 Changelog

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.2.0 | 2026-02-20 | Маркеры `data-modia-error`, логирование, стили |
| 1.1.0 | 2026-02-10 | Поддержка стилей, legacy-шаблоны |
| 1.0.0 | 2026-01-15 | Базовая реализация |

---

**Последнее обновление:** 2026-02-21  
**Статус:** ✅ Реализовано (v1.2)