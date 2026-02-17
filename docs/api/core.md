# Core — Ядро фреймворка

**Версия:** 1.2.0  
**Файл:** `modia/core.js`  
**Тип:** Базовые классы

## 📖 Обзор

`core.js` содержит базовые классы фреймворка Modia:

- `BaseComponent` — базовый класс для всех компонентов
- `Container` — управление глобальным состоянием
- `ComponentScanner` — автоматическое обнаружение и создание компонентов

## 📦 Классы

### BaseComponent

Базовый класс для всех компонентов Modia.

#### Конструктор

```javascript
class BaseComponent {
  constructor(element) {
    this.$el = $(element);
    this.config = this._parseConfig();
    this.$el.data('modia-component', this);
  }
}
```

#### Методы

| Метод | Описание |
|-------|----------|
| `static fromElement(element)` | Получить компонент из DOM-элемента |
| `destroy()` | Уничтожить компонент (очистка обработчиков) |

#### Пример использования

```javascript
import { BaseComponent } from '../core.js';

class MyComponent extends BaseComponent {
  static get componentName() {
    return 'my-component';
  }
  
  constructor(element) {
    super(element);
    // Инициализация
  }
  
  destroy() {
    super.destroy();
    // Дополнительная очистка
  }
}
```

#### Конфигурация из data-атрибутов

Компонент автоматически парсит атрибуты с префиксом `data-{componentName}-`:

```html
<form data-component="validation" data-validation-live="true">
```

```javascript
// В компоненте доступно:
this.config = { live: true };
```

---

### Container

Singleton для управления глобальным состоянием.

#### Методы

| Метод | Описание |
|-------|----------|
| `setState(newState)` | Обновить состояние, уведомить компоненты |
| `addComponent(component)` | Добавить компонент в контейнер |

#### Пример использования

```javascript
import { container } from '../core.js';

// Обновление состояния
container.setState({ formMode: 'cross' });

// Компоненты получат onStateChange(newState)
```

---

### ComponentScanner

Статический класс для обнаружения и создания компонентов.

#### Методы

| Метод | Описание |
|-------|----------|
| `register(ComponentClass)` | Зарегистрировать класс компонента |
| `scan(root = document)` | Сканировать DOM на наличие компонентов |
| `registerInstance(instance)` | Добавить экземпляр в реестр |
| `unregisterInstance(instance)` | Удалить экземпляр из реестра |

#### Пример использования

```javascript
import { ComponentScanner } from '../core.js';

// Регистрация компонента
ComponentScanner.register(MyComponent);

// Сканирование DOM
const instances = ComponentScanner.scan();

// Сканирование контейнера (после AJAX)
const instances = ComponentScanner.scan($('#modal')[0]);
```

#### jQuery Data API

Каждый компонент хранит ссылку на себя в jQuery Data API:

```javascript
// Получить компонент из элемента
const component = $('#form1').data('modia-component');

// Проверка инициализации
if ($('#form1').data('modia-component')) {
  // Уже инициализирован
}
```

#### Глобальный реестр (для отладки)

```javascript
// Доступ ко всем компонентам
ComponentScanner.instances.forEach(comp => {
  console.log(comp.constructor.name);
});
```

⚠️ **Важно:** Реестр предназначен только для отладки, не используйте в бизнес-логике.

---

## 🔄 Жизненный цикл компонента

```
1. ComponentScanner.scan() → находит [data-component="name"]
2. new Component(element) → создание экземпляра
3. this.$el.data('modia-component', this) → сохранение ссылки
4. ComponentScanner.registerInstance(this) → добавление в реестр
5. Работа компонента → обработка событий
6. destroy() → очистка обработчиков и данных
```

---

## 📋 Примеры использования

### Базовая инициализация

```html
<form data-component="validation">
  <input type="email" name="email" required>
  <button type="submit">Отправить</button>
</form>

<script type="module" src="/modia/index.js"></script>
```

### Ручное сканирование после AJAX

```javascript
$.get('/form-partial', (html) => {
  $('#container').html(html);
  Modia.scan($('#container')[0]);
});
```

### Получение компонента из элемента

```javascript
const component = $('#form1').data('modia-component');
if (component) {
  component.validate();
}
```

### Создание собственного компонента

```javascript
import { BaseComponent, ComponentScanner } from '../core.js';

class ModalComponent extends BaseComponent {
  static get componentName() {
    return 'modal';
  }
  
  constructor(element) {
    super(element);
    this._init();
  }
  
  _init() {
    this.$el.on('click.modia', '[data-close]', () => {
      this.close();
    });
  }
  
  close() {
    this.$el.hide();
  }
  
  destroy() {
    this.$el.off('.modia');
    super.destroy();
  }
}

ComponentScanner.register(ModalComponent);
```

---

## ⚙️ Кастомные события

| Событие | Когда | Данные |
|---------|-------|--------|
| `modia:initialized` | После автоинициализации | `{ instances: [...] }` |
| `modia:scanned` | После scan() | `{ instances: [...] }` |
| `modia:component-created` | После создания компонента | `{ component: ... }` |

### Подписка на события

```javascript
$(document).on('modia:initialized', (e, data) => {
  console.log('Инициализировано компонентов:', data.instances.length);
});

$(document).on('modia:component-created', (e, data) => {
  console.log('Создан компонент:', data.component.constructor.name);
});
```

---

## 🚫 Ограничения

| Ограничение | Описание |
|-------------|----------|
| Нет EventBus | Глобальная шина событий (v1.3+) |
| Нет LocalContainer | Локальные контейнеры для вложенных компонентов (v1.3+) |
| Нет рекурсивного сканирования | Инициализация внутри компонентов (v1.3+) |

---

## 📚 Связанная документация

| Файл | Описание |
|------|----------|
| [index.md](./index.md) | Index — точка входа фреймворка |
| [logger.md](./logger.md) | Logger — сервис логирования |
| [debug.md](./debug.md) | DebugComponent — режимы отладки |

---

**Последнее обновление:** 2026-02-17  
**Статус:** ✅ Реализовано (v1.2)
