# ValidationComponent — Компонент валидации форм

**Версия:** 1.2.0  
**Последнее обновление:** 2026-02-25

---

## 🎯 Назначение

`ValidationComponent` — оркестратор валидации формы или контейнера. Автоматически управляет валидацией всех полей внутри элемента с атрибутом `data-component="validation"`.

**Основная ответственность:**
- ✅ Слушает события `submit` (на форме) и `click` (на `[data-validate]`)
- ✅ Создаёт и управляет `FieldValidator` для каждого поля/группы полей
- ✅ Поддерживает live-валидацию через `blur` + `debounce`
- ✅ Обрабатывает динамическое добавление полей
- ✅ Делегирует проверку → `FieldValidator`, рендеринг → `FieldErrorRenderer`

**Не является ответственностью:**
- ❌ Логика проверки правил (это `FieldValidator`)
- ❌ Рендеринг ошибок в DOM (это `FieldErrorRenderer`)
- ❌ Определение текста ошибки (это `FieldValidator` + `validationRules`)

---

## 🔌 Подключение

### Шаг 1: Подключите Modia в вашем проекте

```javascript
// application.js
import 'packs/libs/modia';  // Единая точка входа
```

### Шаг 2: Добавьте атрибут к форме

```html
<form data-component="validation">
  <input type="text" name="email" required>
  <button type="submit">Отправить</button>
</form>
```

### Шаг 3: Добавьте шаблоны ошибок

```html
<div class="error-templates">
  <span class="text-danger" data-rule="required">Обязательное поле</span>
  <span class="text-danger" data-rule="email">Некорректный email</span>
</div>
```

---

## ⚙️ Конфигурация

### Глобальные настройки (через data-атрибуты)

| Атрибут | Тип | По умолчанию | Описание |
|---------|-----|--------------|----------|
| `data-component-validation-live` | `boolean` | `false` | Включить live-валидацию при `blur` |
| `data-component-validation-debounce-delay` | `number` | `300` | Задержка debounce (мс) |
| `data-component-validation-validate-on-submit` | `boolean` | `true` | Валидировать при `submit` формы |
| `data-component-validation-validate-on-click` | `boolean` | `true` | Валидировать при клике на `[data-validate]` |
| `data-component-validation-error-style` | `string` | `'bootstrap'` | Стиль ошибок: `rails` \| `bootstrap` \| `custom` |

### Пример конфигурации

```html
<form data-component="validation" 
      data-component-validation-live="true"
      data-component-validation-debounce-delay="500"
      data-component-validation-error-style="rails">
  <!-- поля формы -->
</form>
```

---

## 📋 Типичные сценарии использования

### Сценарий 1: Простая форма с валидацией при отправке

```html
<!-- Чистый HTML -->
<form data-component="validation">
  <div class="form-group">
    <label for="email">Email *</label>
    <input type="email" id="email" name="email" class="form-control" required>
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Обязательное поле</span>
    <span class="text-danger" data-rule="email">Некорректный email</span>
  </div>
  
  <button type="submit">Отправить</button>
</form>
```

```erb
<!-- Rails шаблон (form.html.erb) -->
<%= form_with(model: @user, data: { component: 'validation' }) do |f| %>
  <div class="form-group">
    <%= f.label :email, 'Email *' %>
    <%= f.email_field :email, class: 'form-control', required: true %>
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Обязательное поле</span>
    <span class="text-danger" data-rule="email">Некорректный email</span>
  </div>
  
  <%= f.submit 'Отправить' %>
<% end %>
```

### Сценарий 2: Live-валидация (при blur)

```html
<form data-component="validation" 
      data-component-validation-live="true"
      data-component-validation-debounce-delay="300">
  <div class="form-group">
    <label for="email">Email *</label>
    <input type="email" id="email" name="email" class="form-control" required>
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Обязательное поле</span>
  </div>
  
  <button type="submit">Отправить</button>
</form>
```

### Сценарий 3: Кнопка валидации (не форма)

```html
<!-- Контейнер div (например, в модалке) -->
<div data-component="validation" class="modal-body">
  <div class="form-group">
    <label for="name">Имя *</label>
    <input type="text" id="name" name="name" class="form-control" required>
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Обязательное поле</span>
  </div>
  
  <button type="button" data-validate>Сохранить</button>
</div>
```

### Сценарий 4: Массив полей (name='field[]')

```html
<form data-component="validation">
  <div class="form-group">
    <label>Теги (хотя бы один) *</label>
    <input type="text" name="tags[]" class="form-control" placeholder="Тег 1">
    <input type="text" name="tags[]" class="form-control" placeholder="Тег 2">
    <input type="text" name="tags[]" class="form-control" placeholder="Тег 3">
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Заполните хотя бы одно поле</span>
  </div>
  
  <button type="submit">Отправить</button>
</form>
```

### Сценарий 5: Скрытое поле + внешний экран ошибки

```html
<form data-component="validation">
  <div class="form-group">
    <label>Выберите персонажа *</label>
    <div id="character-selector" class="character-selector">
      <button type="button" data-select="1">Персонаж 1</button>
      <button type="button" data-select="2">Персонаж 2</button>
    </div>
    
    <!-- Скрытое поле с внешним экраном ошибки -->
    <input type="hidden" 
           name="character_id" 
           required
           data-input-error-screen="#character-selector">
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Выберите персонажа</span>
  </div>
  
  <button type="submit">Отправить</button>
</form>
```

### Сценарий 6: Contenteditable элемент

```html
<form data-component="validation">
  <div class="form-group">
    <label>Описание *</label>
    <div contenteditable="true" 
         name="description" 
         class="sql-editor" 
         required>SELECT * FROM table;</div>
  </div>
  
  <div class="error-templates">
    <span class="text-danger" data-rule="required">Заполните описание</span>
  </div>
  
  <button type="submit">Отправить</button>
</form>
```

---

## 🔔 События (хуки для интеграции)

Компонент триггерит кастомные события на элементе формы:

| Событие | Данные | Когда | Можно отменить |
|---------|--------|-------|----------------|
| `validation:beforeValidate` | — | Перед началом валидации | ✅ `event.preventDefault()` |
| `validation:validated` | `{ isValid: boolean }` | После валидации | ❌ |
| `validation:valid` | — | Если все поля валидны | ❌ |
| `validation:invalid` | `{ errors: [...] }` | Если есть ошибки | ❌ |
| `validation:manual-check` | `{ isValid: boolean }` | При клике на `[data-validate]` | ❌ |
| `validation:field-added` | `{ field: HTMLElement }` | При динамическом добавлении поля | ❌ |

### Пример использования хуков

```javascript
// Отмена валидации при определённых условиях
$('form[data-component="validation"]').on('validation:beforeValidate', function(e) {
  if (!confirm('Вы уверены, что хотите отправить форму?')) {
    e.preventDefault();  // Отменяет валидацию
  }
});

// Логирование успешной валидации
$('form[data-component="validation"]').on('validation:valid', function(e) {
  console.log('✅ Форма валидна, можно показывать лоадер');
});

// Обработка ошибок
$('form[data-component="validation"]').on('validation:invalid', function(e, data) {
  console.log('❌ Ошибки валидации:', data.errors);
  // data.errors = [{ field: 'email', message: 'Некорректный email' }, ...]
});
```

---

## 🛠 Публичные методы

Доступ через `$(element).data('modia-component')`:

```javascript
const component = $('form[data-component="validation"]').data('modia-component');

// Валидировать все поля
const isValid = component.validate();

// Очистить все ошибки
component.clearErrors();

// Обновить правила (после динамического добавления полей)
component.refreshRules();

// Установить стиль ошибок
component.setErrorStyle('rails');

// Получить данные формы в объект
const data = component.getFormData();
// { name: 'Иван', email: 'ivan@example.com', tags: ['tag1', 'tag2'] }

// Получить все ошибки
const errors = component.getErrors();
// [{ field: 'email', message: 'Некорректный email' }, ...]
```

---

## ⚠️ Обратная совместимость

| Старый атрибут/паттерн | Новое поведение | Статус |
|------------------------|-----------------|--------|
| `.validate-on-click` | Заменяется на `[data-validate]` | ⚠️ Не поддерживается |
| `data-input-field` | Алиас для `data-input-value-source` | ✅ Поддержка |
| `#error_span` | Шаблон ошибки (уровень 3 иерархии) | ✅ Поддержка |
| `novalidate` в HTML | Компонент не управляет этим атрибутом | ❌ Не поддерживается |

---

## 📚 Связанная документация

| Файл | Назначение |
|------|------------|
| [`api/component/validation.md`](../../api/component/validation.md) | API Reference для разработчиков |
| [`docs/service/field-validator.md`](../service/field-validator.md) | Сервис валидации поля |
| [`docs/service/field-error-renderer.md`](../service/field-error-renderer.md) | Сервис рендеринга ошибок |
| [`docs/configurations/validation-rules.md`](../configurations/validation-rules.md) | Правила валидации |

---

**Последнее обновление:** 2026-02-25  
**Версия документации:** 1.2.0