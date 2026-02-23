# Validation Rules — API Reference

## Интерфейс

```javascript
import { validationRules, isEmpty, formatMessage, normalizeValue } 
  from './modia/configurations/validation-rules.js';

// Доступ к массиву правил
console.log(validationRules); // Array<ValidationRule>

// Использование хелперов
const empty = isEmpty('');           // true
const msg = formatMessage('Hi __NAME__', { name: 'Alex' }); // "Hi Alex"
const arr = normalizeValue('test');  // ['test']
```

## Типы

### ValidationRule

```typescript
interface ValidationRule {
  name: string;                      // Уникальное имя (kebab-case)
  selector: string;                  // CSS-селектор для отбора полей
  validate($field: jQuery, validator: FieldValidator): boolean | { valid: boolean, params: Object };
  templateId?: string;               // ID legacy-шаблона (уровень 3)
  defaultMessage?: string | Function; // Сообщение по умолчанию (уровень 4)
  messageLevel?: number;             // Уровень логирования (3-5)
}
```

## Методы

### Хелперы

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `isEmpty(value)` | `*` - значение для проверки | `boolean` | Проверяет, является ли значение пустым |
| `formatMessage(template, params)` | `string` - шаблон, `Object` - параметры | `string` | Форматирует сообщение с подстановкой параметров |
| `normalizeValue(value)` | `*` - значение для нормализации | `Array` | Нормализует значение в массив |

### isEmpty()

Проверяет пустоту значения с поддержкой массивов.

```javascript
isEmpty('')                    // true
isEmpty('   ')                 // true
isEmpty(null)                  // true
isEmpty(undefined)             // true
isEmpty([])                    // true
isEmpty(['', null])            // true
isEmpty('test')                // false
isEmpty(['test'])              // false
```

### formatMessage()

Форматирует сообщение с подстановкой параметров (case-insensitive).

```javascript
formatMessage('Hi __NAME__', { name: 'Alex' })
  // → "Hi Alex"

formatMessage('Max: __COUNT__', { count: 100 })
  // → "Max: 100"

formatMessage('__A__ + __B__', { a: 1, b: 2 })
  // → "1 + 2"

formatMessage('Static', {})
  // → "Static"

formatMessage('__MISSING__', {})
  // → "__MISSING__" (неподставленный параметр остаётся)
```

### normalizeValue()

Нормализует значение в массив для единообразной обработки.

```javascript
normalizeValue('test')         // ['test']
normalizeValue(['a', 'b'])     // ['a', 'b']
normalizeValue(null)           // [null]
normalizeValue(42)             // [42]
```

## Экспорт

| Экспорт | Тип | Описание |
|---------|-----|----------|
| `validationRules` | `Array<ValidationRule>` | Массив всех правил валидации (default export) |
| `isEmpty` | `Function` | Хелпер для проверки пустоты |
| `formatMessage` | `Function` | Хелпер для форматирования сообщений |
| `normalizeValue` | `Function` | Хелпер для нормализации значений |

```javascript
// Default export
import validationRules from './modia/configurations/validation-rules.js';

// Named exports
import { validationRules, isEmpty, formatMessage, normalizeValue } 
  from './modia/configurations/validation-rules.js';
```

## Зависимости

| Модуль | Тип | Назначение |
|--------|-----|------------|
| jQuery | Внешняя | DOM-манипуляции в функциях валидации |
| FieldValidator | Интерфейс | Используется как параметр в `validate()` |

### Не зависит от

| Модуль | Причина |
|--------|---------|
| `modia/services/*` | Чистая конфигурация |
| `modia/components/*` | Изоляция от компонентов |
| `modia/core.js` | Не требует BaseComponent |

## Правила

| Правило | Описание |
|---------|----------|
| Никаких импортов из `modia/` | Кроме внутренних хелперов |
| Никаких DOM-манипуляций | Только конфигурация |
| Никаких событий | Без `addEventListener`, `$.on()` |
| Никакого состояния | Без глобальных переменных |
| `name` в kebab-case | Соответствует `data-error-text-{name}` |
| Уникальные `name` | Проверка при code review |
| `validate()` без побочных эффектов | Только проверка, нет мутаций |

## Структура файла

```
modia/configurations/validation-rules.js
├── Helper functions
│   ├── isEmpty(value)
│   ├── formatMessage(template, params)
│   └── normalizeValue(value)
│
├── Rule factories (DRY)
│   ├── createLengthRule(config)
│   └── createRegexRule(config)
│
├── Rules array
│   ├── required
│   ├── max-length
│   ├── min-length
│   ├── format
│   ├── pattern
│   ├── email
│   ├── ajax (заглушка)
│   └── custom
│
└── Exports
    ├── default → validationRules
    └── named → isEmpty, formatMessage, normalizeValue
```

## Примеры

### Создание кастомного правила

```javascript
import { validationRules } from './modia/configurations/validation-rules.js';

// Добавить новое правило
validationRules.push({
  name: 'phone',
  selector: '[data-validate-phone]',
  templateId: 'phone-error-span',
  defaultMessage: 'Введите корректный номер телефона',
  messageLevel: 4,
  
  validate($field, validator) {
    const value = validator.getFieldValue();
    const regex = /^\+7\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
    
    if (!regex.test(value)) {
      return { valid: false, params: {} };
    }
    
    return true;
  }
});
```

### Расширение существующего правила

```javascript
// Найти правило
const requiredRule = validationRules.find(r => r.name === 'required');

// Переопределить defaultMessage
requiredRule.defaultMessage = 'Это поле обязательно для заполнения';

// Или переопределить validate
requiredRule.validate = function($field, validator) {
  const value = validator.getFieldValue();
  // Кастомная логика
  return value !== '' ? true : { valid: false, params: {} };
};
```

## События

`validation-rules.js` не генерирует события — это чистая конфигурация.

События валидации генерируются в `ValidationComponent`:

| Событие | Данные | Описание |
|---------|--------|----------|
| `validation:beforeValidate` | `{}` | Перед началом валидации |
| `validation:validated` | `{ isValid: boolean }` | После валидации |
| `validation:valid` | `{}` | Все поля валидны |
| `validation:invalid` | `{ errors: Array }` | Есть ошибки |

## Крайние случаи

| Сценарий | Поведение |
|----------|-----------|
| Пустой шаблон в `formatMessage()` | Возвращает пустую строку |
| `null`/`undefined` в `formatMessage()` | Возвращает шаблон без изменений |
| Неподставленный параметр | Остаётся как `__NAME__` |
| Неверный regex в правиле | Правило пропускается (возвращает `true`) |
| Отсутствие атрибута у поля | Правило пропускается |
| Массив полей | Валидация «хотя бы одно заполнено» |

## Тестирование

```javascript
// Unit-тесты хелперов
import { isEmpty, formatMessage, normalizeValue } 
  from './modia/configurations/validation-rules.js';

describe('isEmpty', () => {
  test('пустая строка', () => {
    expect(isEmpty('')).toBe(true);
  });
  
  test('непустая строка', () => {
    expect(isEmpty('test')).toBe(false);
  });
});

describe('formatMessage', () => {
  test('подстановка параметров', () => {
    expect(formatMessage('Hi __NAME__', { name: 'Alex' }))
      .toBe('Hi Alex');
  });
});
```

## См. также

| Файл | Описание |
|------|----------|
| [docs/configurations/validation-rules.md](../../docs/configurations/validation-rules.md) | User Guide для пользователей |
| [api/service/field-validator.md](../service/field-validator.md) | API валидатора поля |
| [api/service/field-error-renderer.md](../service/field-error-renderer.md) | API рендерера ошибок |
| [api/component/validation.md](../component/validation.md) | API компонента валидации |

---

**Последнее обновление:** 2026-02-20  
**Версия:** 1.2.0