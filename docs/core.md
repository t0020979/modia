# Core — Ядро фреймворка Modia

**Версия:** 1.2.0  
**Файл:** `modia/core.js`

---

## 📖 Обзор

`core.js` содержит базовые классы фреймворка Modia:

| Класс | Ответственность |
|-------|-----------------|
| `BaseComponent` | Базовый класс для всех компонентов |
| `Container` | Управление глобальным состоянием |
| `ComponentScanner` | Автоматическое обнаружение и создание компонентов |

**Для кого:** Разработчики компонентов фреймворка и продвинутые пользователи.

---

## 🚀 Быстрый старт

### Подключение

```html
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script type="module" src="/modia/index.js"></script>
```

### Базовый компонент

```html
<form data-component="validation">
  <input type="email" name="email" required>
  <button type="submit">Отправить</button>
</form>
```

```javascript
import { BaseComponent, ComponentScanner } from '../modia/core.js';

class ValidationComponent extends BaseComponent {
  static get componentName() {
    return 'validation';
  }
  
  constructor(element) {
    super(element);
    this._init();
  }
  
  _init() {
    this._on('submit', this._handleSubmit);
  }
  
  _handleSubmit(event) {
    event.preventDefault();
    console.log('Форма отправлена', this.config);
  }
}

ComponentScanner.register(ValidationComponent);
```

---

## 📦 Конфигурация компонентов

Компонент автоматически парсит атрибуты с префиксом `data-{componentName}-`:

```html
<form data-component="validation" 
      data-validation-live="true" 
      data-validation-debounce="300"
      data-validation-max-length="600">
```

```javascript
class ValidationComponent extends BaseComponent {
  static get componentName() { return 'validation'; }
  
  constructor(element) {
    super(element);
    // this.config = { live: true, debounce: 300, maxLength: 600 }
  }
}
```

### Конвертация типов

| Значение атрибута | Тип в config |
|-------------------|--------------|
| `"true"` | `boolean` |
| `"false"` | `boolean` |
| `"300"` | `number` |
| `"cross"` | `string` |

---

## 🔌 События

### Встроенные события Modia

```javascript
$(document).on('modia:initialized', (e, data) => {
  console.log('Готово:', data.instances.length);
});

$(document).on('modia:component-created', (e, data) => {
  console.log('Компонент:', data.component.constructor.name);
});

$(document).on('modia:component-destroyed', (e, data) => {
  console.log('Уничтожен:', data.component.constructor.name);
});
```

### Собственные события компонента

```javascript
class MyComponent extends BaseComponent {
  _init() {
    // Регистрация обработчиков
    this._on('click', this.handleClick);
    this._on('submit', 'button', this.handleSubmit);
    
    // Триггер собственных событий
    this.$el.trigger('my-component:ready', { component: this });
  }
  
  destroy() {
    // Автоматическая очистка всех .modia событий
    super.destroy();
  }
}
```

---

## 🔄 Жизненный цикл компонента

```
1. ComponentScanner.scan() → находит [data-component="name"]
2. new Component(element) → создание экземпляра
3. this.$el.data('modia-component', this) → сохранение ссылки
4. ComponentScanner.registerInstance(this) → добавление в реестр
5. container.addComponent(this) → добавление в контейнер
6. $(el).trigger('modia:component-created') → кастомное событие
7. Работа компонента → обработка событий
8. destroy() → очистка обработчиков и данных
```

---

## 🧪 Тестирование

### Проверка инициализации

```javascript
// Через jQuery Data API
const component = $('#form1').data('modia-component');

// Через BaseComponent
import { BaseComponent } from '../modia/core.js';
const component = BaseComponent.fromElement($('#form1')[0]);
```

### Ручное сканирование (после AJAX)

```javascript
$.get('/form-partial', (html) => {
  $('#container').html(html);
  Modia.scan($('#container')[0]);
});
```

### Глобальный реестр (отладка)

```javascript
// Доступ ко всем компонентам
ComponentScanner.instances.forEach(comp => {
  console.log(comp.constructor.name, comp.$el.attr('id'));
});
```

---

## ⚠️ Ограничения v1.2

| Ограничение | Обход | План |
|-------------|-------|------|
| Нет EventBus | Использовать jQuery события | ⏳ v1.3+ |
| Нет LocalContainer | Использовать глобальный container | ⏳ v1.3+ |
| Нет рекурсивного сканирования | Вызывать scan() вручную | ⏳ v1.3+ |

---

## 📚 Связанная документация

| Файл | Описание |
|------|----------|
| [index.md](./index.md) | Index — точка входа фреймворка |
| [logger.md](./logger.md) | Logger — сервис логирования |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Архитектурные принципы |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Правила разработки |

---

**Последнее обновление:** 2026-02-19  
**Статус:** ✅ Актуально (v1.2)