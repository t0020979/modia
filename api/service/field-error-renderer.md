





# FieldErrorRenderer — API Reference

**Версия:** 1.2.0  
**Файл:** `modia/services/field-error-renderer.js`

---

## 📦 Импорт

```javascript
// Прямой импорт
import { FieldErrorRenderer, DEFAULT_CONFIG } from '../../modia/services/field-error-renderer.js';

// Через FieldValidator (автоматически)
import { FieldValidator } from '../../modia/services/field-validator.js';
```

---

## 🏗 Класс FieldErrorRenderer

### Конструктор

```javascript
new FieldErrorRenderer($errorScreen: jQuery, config?: Object): FieldErrorRenderer
```

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `$errorScreen` | jQuery | ✅ Да | — | Элемент для отображения ошибки |
| `config` | Object | ❌ Нет | `{}` | Переопределение конфигурации |

**Пример:**
```javascript
const renderer = new FieldErrorRenderer($('#email'), {
  defaultStyle: 'rails'
});
```

---

## 🔧 Публичные методы

### renderError(html, styleName)

```javascript
renderError(html: string, styleName?: string): void
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `html` | string | Готовый HTML-фрагмент |
| `styleName` | string | `rails` \| `bootstrap` \| `custom` |

**Пример:**
```javascript
renderer.renderError('<span class="text-danger">Ошибка</span>');
renderer.renderError('<span>Ошибка</span>', 'rails');
```

---

### clearError(preserveTemplates)

```javascript
clearError(preserveTemplates?: boolean): void
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `preserveTemplates` | boolean | `true` | Сохранять `.error-template` |

**Пример:**
```javascript
renderer.clearError();           // Сохранить шаблоны
renderer.clearError(false);      // Удалить всё
```

---

### hasError()

```javascript
hasError(): boolean
```

**Возвращает:** `true` если ошибка отображается в DOM.

**Пример:**
```javascript
if (renderer.hasError()) {
  renderer.clearError();
}
```

---

### getLastErrorMessage()

```javascript
getLastErrorMessage(): string | null
```

**Возвращает:** Последнее сообщение об ошибке или `null`.

**Пример:**
```javascript
const lastError = renderer.getLastErrorMessage();
```

---

### setStyle(styleName)

```javascript
setStyle(styleName: string): void
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `styleName` | string | `rails` \| `bootstrap` \| `custom` |

**Пример:**
```javascript
renderer.setStyle('rails');
```

---

## ⚙️ Константы

### DEFAULT_CONFIG

```javascript
DEFAULT_CONFIG: Object
```

**Структура:**
```javascript
{
  containerSelectors: '.form-group, .input-group, .form-field',
  errorTemplateClass: '.error-template',
  errorClasses: '.text-danger, .invalid-feedback, .form-error-message',
  errorMarker: 'data-modia-error',
  errorStyles: {
    rails: { containerClass, errorClass, messageClass },
    bootstrap: { containerClass, errorClass, messageClass },
    custom: { containerClass, errorClass, messageClass }
  },
  defaultStyle: 'bootstrap',
  legacyTemplates: { required, format, ajax, ... }
}
```

---

## 🎨 Стили

### Bootstrap (по умолчанию)

```javascript
{
  containerClass: '',
  errorClass: 'is-invalid',
  messageClass: 'invalid-feedback'
}
```

### Rails

```javascript
{
  containerClass: 'field_with_errors',
  errorClass: 'form-error',
  messageClass: 'form-error-message'
}
```

### Custom

```javascript
{
  containerClass: '',
  errorClass: '',
  messageClass: ''
}
```

---

## 📊 Диаграмма потока

```
┌─────────────────────────────────────────────────────────┐
│  ValidationComponent                                    │
│    ↓                                                    │
│  FieldValidator.validate()                              │
│    ↓                                                    │
│  FieldErrorRenderer.renderError(html)                   │
│    ├─ 1. clearError() (идемпотентность)                 │
│    ├─ 2. Добавить класс на $errorScreen                 │
│    ├─ 3. Вставить HTML в контейнер                      │
│    └─ 4. Добавить data-modia-error маркер               │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `$errorScreen is required` | Передан `null` или пустой jQuery | Проверить элемент перед созданием |
| `logger.warn(): ID required` | У элемента нет `id` | Добавить `id` атрибут |
| `logger.warn(): спецсимволы` | ID содержит `:`, пробелы | Использовать `[a-zA-Z0-9_-]` |

---

## 🧪 Тесты

| Файл | Сценарий |
|------|----------|
| `test-01-basic-render.html` | Базовый рендер + очистка |
| `test-02-styles.html` | Смена стилей |
| `test-03-legacy-templates.html` | Legacy шаблоны |
| `test-04-logging.html` | Логирование |
| `test-05-edge-cases.html` | Edge cases + авто-тест |

---

**Последнее обновление:** 2026-02-21  
**Статус:** ✅ Реализовано (v1.2)