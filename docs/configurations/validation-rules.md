# Конфигурация правил валидации

## 📖 Обзор

`validation-rules.js` — это центральный файл конфигурации, который определяет все правила валидации для фреймворка Modia.

**Назначение:**
- Определение правил валидации (required, max-length, email и др.)
- Настройка сообщений об ошибках
- Поддержка 5 уровней иерархии сообщений

**Важно:** Этот файл не содержит логики DOM, рендеринга или событий — только чистая конфигурация.

## 🔌 Подключение

Правила импортируются автоматически через `modia/index.js`:

```javascript
// Автоматический импорт (через index.js)
import { ValidationComponent } from './modia/index.js';

// Прямой импорт (для кастомных сценариев)
import { validationRules } from './modia/configurations/validation-rules.js';
```

## 📦 Доступные правила

| Правило | Селектор | Описание | Пример |
|---------|----------|----------|--------|
| `required` | `[required]` | Обязательное поле | `<input required>` |
| `max-length` | `[data-max-length]` | Максимальная длина | `<input data-max-length="100">` |
| `min-length` | `[data-min-length]` | Минимальная длина | `<input data-min-length="5">` |
| `format` | `[data-format]` | Проверка по regex | `<input data-format="^\d+$">` |
| `pattern` | `[pattern]` | HTML5 pattern | `<input pattern="[A-Z]{3}">` |
| `email` | `input[type="email"]` | Формат email | `<input type="email">` |
| `ajax` | `[data-ajax-validate]` | Серверная валидация | `<input data-ajax-validate="/check">` |
| `custom` | `[data-validate-custom]` | Кастомная функция | `<input data-validate-custom="myFn">` |

## 📋 Примеры использования

### Пример 1: Базовая валидация

```html
<form data-component="validation">
  <div class="form-group">
    <label for="email">Email *</label>
    <input type="email" id="email" name="email" required>
    
    <!-- Шаблон ошибки (Уровень 2) -->
    <div class="error-templates">
      <span class="text-danger" data-rule="required">Обязательное поле</span>
      <span class="text-danger" data-rule="email">Введите корректный email</span>
    </div>
  </div>
  
  <button type="submit">Отправить</button>
</form>
```

### Пример 2: Проверка длины

```html
<form data-component="validation">
  <div class="form-group">
    <label for="username">Имя пользователя *</label>
    <input type="text" id="username" name="username" 
           required 
           data-min-length="3" 
           data-max-length="20">
    
    <div class="error-templates">
      <span class="text-danger" data-rule="required">Обязательное поле</span>
      <span class="text-danger" data-rule="min-length">Минимум __COUNT__ символов</span>
      <span class="text-danger" data-rule="max-length">Максимум __COUNT__ символов</span>
    </div>
  </div>
</form>
```

### Пример 3: Массив полей

```html
<form data-component="validation">
  <div class="form-group">
    <label>Теги *</label>
    <input type="text" name="tags[]" class="form-control" placeholder="Тег 1">
    <input type="text" name="tags[]" class="form-control" placeholder="Тег 2">
    <input type="text" name="tags[]" class="form-control" placeholder="Тег 3">
    
    <div class="error-templates">
      <span class="text-danger" data-rule="required">Заполните хотя бы одно поле</span>
    </div>
  </div>
</form>
```

### Пример 4: Кастомное правило

```html
<form data-component="validation">
  <div class="form-group">
    <label for="phone">Телефон *</label>
    <input type="tel" id="phone" name="phone" required
           data-validate-custom="validatePhone">
    
    <div class="error-templates">
      <span class="text-danger" data-rule="required">Обязательное поле</span>
      <span class="text-danger" data-rule="custom">Неверный формат телефона</span>
    </div>
  </div>
</form>

<script>
  function validatePhone(value, $field) {
    const regex = /^\+7\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
    return regex.test(value) ? true : { valid: false, params: {} };
  }
</script>
```

## 🔄 Иерархия сообщений об ошибках

Система проверяет сообщения об ошибках в следующем порядке (от высшего приоритета к низшему):

| Уровень | Источник | Пример | Когда использовать |
|---------|----------|--------|-------------------|
| 1 | Inline-атрибут на поле | `data-error-text-required="Заполните"` | Точечное переопределение |
| 2 | Шаблон в контейнере | `.error-templates [data-rule="required"]` | **Рекомендуемый** |
| 3 | Отдельные шаблоны | `#error_span` | Legacy-код |
| 4 | Сообщение из правила | `defaultMessage` в конфиге | Fallback |
| 5 | Fallback валидатора | `"Field error"` | Критическая ошибка |

### Пример: Все 5 уровней

```html
<form data-component="validation">
  <!-- Уровень 1: Inline-атрибут (наивысший приоритет) -->
  <input type="text" name="email" required 
         data-error-text-required="Пожалуйста, введите email">
  
  <!-- Уровень 2: Шаблон в контейнере (рекомендуется) -->
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Обязательное поле</span>
  </div>
  
  <!-- Уровень 3: Отдельный шаблон (legacy) -->
  <div id="error_span" class="invisible">
    <span class="text-danger">Обязательное поле</span>
  </div>
  
  <!-- Уровень 4 и 5: defaultMessage и fallback (в конфигурации) -->
</form>
```

## ⚙️ Конфигурация

### Параметры правила

Каждое правило в конфигурации имеет следующую структуру:

```javascript
{
  name: 'required',                    // Уникальное имя (kebab-case)
  selector: '[required]',              // CSS-селектор полей
  templateId: 'error_span',            // ID legacy-шаблона
  defaultMessage: 'Обязательное поле', // Сообщение по умолчанию
  messageLevel: 4,                     // Уровень для логирования (3-5)
  validate($field, validator) {        // Функция валидации
    // Логика проверки
    return true; // или { valid: false, params: {} }
  }
}
```

### Подстановка параметров

В сообщениях об ошибках поддерживается подстановка параметров:

```javascript
// В конфигурации правила
defaultMessage: 'Максимальная длина: __COUNT__ символов'

// Параметры передаются из validate()
return { valid: false, params: { count: 100 } };

// Результат: "Максимальная длина: 100 символов"
```

**Особенности:**
- Регистр не важен: `__COUNT__`, `__count__`, `__Count__` работают одинаково
- Неподставленные параметры остаются как есть: `__MISSING__`

## 🚫 Ограничения

| Ограничение | Обходное решение |
|-------------|-----------------|
| AJAX-валидация не реализована (v1.2) | Использовать кастомное правило |
| Асинхронные правила не поддерживаются | Запланировано в v1.3 |
| Изменение правил требует перезагрузки | Использовать `loadRules()` в валидаторе |

## 📚 Связанная документация

| Файл | Описание |
|------|----------|
| [docs/service/field-validator.md](../service/field-validator.md) | Сервис валидации поля |
| [docs/service/field-error-renderer.md](../service/field-error-renderer.md) | Рендеринг ошибок |
| [docs/component/validation.md](../component/validation.md) | Компонент валидации формы |
| [api/configurations/validation-rules.md](../../api/configurations/validation-rules.md) | API Reference для разработчиков |

---

**Последнее обновление:** 2026-02-20  
**Версия:** 1.2.0