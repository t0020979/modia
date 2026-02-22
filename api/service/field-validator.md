# FieldValidator — API Reference

**Версия:** 1.2.0  
**Файл:** `modia/services/field-validator.js`

---

## 📦 Импорт

```javascript
import { FieldValidator } from '../../modia/services/field-validator.js';
import { FieldErrorRenderer } from '../../modia/services/field-error-renderer.js';
import { validationRules } from '../../modia/configurations/validation-rules.js';
```

---

## 🏗 Конструктор

```javascript
new FieldValidator($valueSource, $errorScreen, $root, validationRules, errorRenderer)
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `$valueSource` | jQuery | Источник значения поля |
| `$errorScreen` | jQuery | Элемент для отображения ошибки |
| `$root` | jQuery | Корневой элемент для поиска шаблонов |
| `validationRules` | ValidationRule[] | Массив правил валидации |
| `errorRenderer` | FieldErrorRenderer | Рендерер ошибок |

**Пример:**

```javascript
const $field = $('#email');
const renderer = new FieldErrorRenderer($field);
const validator = new FieldValidator($field, $field, $('form'), validationRules, renderer);
```

---

## 🔧 Публичные методы

### validate()

Валидирует поле по всем подходящим правилам.

**Возвращает:** `boolean` — `true` если валидно, `false` если есть ошибка

**Пример:**

```javascript
const isValid = validator.validate();
if (!isValid) {
  console.log('Поле не прошло валидацию');
}
```

**Поведение:**
- ✅ Очищает старые ошибки перед валидацией (идемпотентность)
- ✅ Пропускает скрытые/отключённые поля (возвращает `true`)
- ✅ Останавливается на первой ошибке
- ✅ Снимает класс `is-invalid` со всех полей группы при очистке

---

### getFieldValue()

Получает значение поля.

**Возвращает:** `string|Array` — значение поля или массив значений

**Пример:**

```javascript
// Одиночное поле
const value = validator.getFieldValue(); // "user@example.com"

// Массив полей (name='tags[]')
const values = validator.getFieldValue(); // ["тег1", "тег2", ""]

// Checkbox группа
const interests = validator.getFieldValue(); // ["programming", "design"]

// Multiple select
const tags = validator.getFieldValue(); // ["tag1", "tag3"]
```

**Поведение:**
- ✅ Для checkbox/radio проверяет `:checked`, а не `.val()`
- ✅ Для contenteditable возвращает `.text()` (без HTML)
- ✅ Для multiple select возвращает массив

---

### loadRules()

Загружает правила валидации для поля (фильтрует по селектору).

**Возвращает:** `void`

**Пример:**

```javascript
// После динамического добавления поля
validator.loadRules();

// Проверка количества правил
console.log(validator.applicableRules.length);
```

**Когда вызывать:**
- ✅ После добавления новых полей динамически
- ✅ После изменения атрибутов поля (required, data-format)
- ✅ При инициализации (вызывается автоматически в конструкторе)

---

### clearError()

Очищает ошибки поля.

**Возвращает:** `void`

**Пример:**

```javascript
validator.clearError();
```

**Поведение:**
- ✅ Удаляет класс `is-invalid` со всех полей группы
- ✅ Очищает текст ошибки через рендерер
- ✅ Для checkbox/radio групп — очищает контейнер `.form-group`
- ✅ Идемпотентен (можно вызывать многократно)

---

### isVisibleForValidation()

Проверяет, видимо ли поле для валидации.

**Возвращает:** `boolean`

**Пример:**

```javascript
if (!validator.isVisibleForValidation()) {
  console.log('Поле скрыто или отключено');
}
```

**Критерии:**
- ✅ `$errorScreen.is(':visible')` — видим
- ✅ `!$errorScreen.is(':disabled')` — не отключён

---

## 📐 Приватные методы (внутренние)

| Метод | Назначение |
|-------|-----------|
| `_getFieldIdentifier()` | Получает идентификатор поля для логов |
| `_getErrorMessageWithLevel(rule, params)` | Определяет сообщение и уровень (1-5) |
| `_getInlineErrorMessage(ruleName)` | Уровень 1: inline-атрибут |
| `_getContainerTemplateMessage(ruleName, params)` | Уровень 2: шаблон в контейнере |
| `_getSeparateTemplateMessage(ruleName, params)` | Уровень 3: отдельный шаблон (legacy) |
| `_resolveDefaultMessage(defaultMessage, params)` | Уровень 4: defaultMessage |
| `_getFallbackMessage(ruleName, params)` | Уровень 5: fallback |
| `_formatMessage(message, params)` | Форматирует плейсхолдеры `__key__` |
| `_formatErrorMessage(text, tag, className)` | Оборачивает текст в HTML |
| `_isFieldArray()` | Проверяет массив полей (length > 1) |
| `_isCheckboxOrRadioGroup()` | Проверяет checkbox/radio группу |
| `_logErrorLevel(ruleName, level)` | Логирует ошибку по уровню |

---

## 📊 Интерфейс ValidationRule

```javascript
/**
 * @typedef {Object} ValidationRule
 * @property {string} name - Уникальное имя правила
 * @property {string} selector - CSS-селектор для отбора полей
 * @property {Function} validate - Функция валидации: ($field, validator) → boolean|{valid, params}
 * @property {string|Function} [defaultMessage] - Сообщение по умолчанию
 * @property {string} [templateId] - ID legacy-шаблона
 */
```

**Пример правила:**

```javascript
{
  name: 'required',
  selector: '[required]',
  defaultMessage: 'Обязательное поле',
  validate($field, validator) {
    const value = validator.getFieldValue();
    return value.trim() !== '' ? true : { valid: false, params: {} };
  }
}
```

---

## 🎯 Плейсхолдеры в сообщениях

**Формат:** `__key__` (регистр не важен)

| Плейсхолдер | Параметр | Пример |
|-------------|----------|--------|
| `__count__` | `{ count: 50 }` | `Максимальная длина: __count__` → `50` |
| `__min__` | `{ min: 3 }` | `Минимум __min__ символа` → `3` |
| `__max__` | `{ max: 100 }` | `Максимум __max__` → `100` |
| `__any__` | Любой ключ | Case-insensitive замена |

**Пример:**

```javascript
// В правиле
return { valid: false, params: { count: 50 } };

// В шаблоне
<span data-rule="max-length">Максимальная длина: __count__ символов</span>

// Результат
"Максимальная длина: 50 символов"
```

---

## 🧪 Примеры использования

### Базовая валидация

```javascript
const validator = new FieldValidator($('#email'), $('#email'), $('form'), rules, renderer);
const isValid = validator.validate();
```

### Массив полей

```javascript
const $fields = $('input[name="tags[]"]');
const validator = new FieldValidator($fields, $fields.first(), $('form'), rules, renderer);
const values = validator.getFieldValue(); // Array<string>
```

### Динамическое обновление

```javascript
// Добавили поле
$('#container').append('<input name="tags[]" required>');

// Обновили правила
validator.loadRules();

// Валидировали
validator.validate();
```

---

## ⚠️ Известные ограничения

| Ограничение | Версия | Статус |
|-------------|--------|--------|
| Ошибка не очищается при `disabled` без re-validate | v1.2 | 🟡 Workaround: вызывать `validate()` |
| Ошибка не очищается при `hidden` без re-validate | v1.2 | 🟡 Workaround: вызывать `validate()` |
| MutationObserver для отслеживания состояния | v1.3 | ⏳ Запланировано |

---

## 📚 См. также

- [FieldErrorRenderer API](./field-error-renderer.md)
- [ValidationComponent API](../component/validation.md)
- [User Guide](../../docs/service/field-validator.md)

---

**Последнее обновление:** 2026-02-21  
**Статус:** ✅ Актуально (v1.2.0)