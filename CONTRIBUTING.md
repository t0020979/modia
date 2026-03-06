# 🛠 Contributing to Modia

**Версия:** 1.2.0  
**Последнее обновление:** 2026-02-25

Этот документ — для тех, кто развивает фреймворк Modia, а не только использует его.

---

## 🎯 Философия расширения

| Принцип | Описание |
| --- | --- |
| Расширять, не переписывать | Новые режимы — через мета-конфигурацию, не через новые компоненты |
| Контракт на компонент | Каждый компонент = отдельный `.md` файл с требованиями и критериями |
| HTML-first | Все компоненты работают с сериализацией в `<input type="hidden" value='JSON'>` |
| Совместимость с legacy | Не ломать DOM, не мешать UJS, поддерживать существующие шаблоны |
| Тестируемость | Заложена в архитектуру: чистые функции, изоляция, мокаемость |
| **Соглашение над конфигурацией** | Конфигурация через HTML-атрибуты (`data-*`), а не JS-объекты. JS должен быть минимален. |
| **Стабильность превыше прогресса (v1.x)** | В версиях 1.x запрещены Breaking Changes. Новые фичи — только через расширение API, не через изменение существующего. |
| **Изолированные лезвия** | Компоненты не должны глобально загрязнять DOM или переопределять нативные прототипы без веской причины. Используйте `ErrorBoundary`. |
| **Прагматизм парадигм** | Мы используем ООП для компонентов, функциональный подход для сервисов и декларативный для UI. Не пытайтесь привести всё к одному | 
| **Единое ядро, модульные границы** | Мы используем общее ядро Modia, но компоненты могут быть асинхронными («острова»). |
| **Осторожно с Async** | Используйте LazyLoad/SPA-паттерны только для тяжелых виджетов (графики, карты, сложные фильтры). Не превращайте простую форму в мини-SPA без необходимости. |
| **Изоляция состояний** | Асинхронные виджеты должны использовать `LocalContainer` или изолированный контекст, чтобы не загрязнять глобальное состояние. |знаменателю. |

---

## 🧩 Реализованные модули (v1.2)

| Модуль | Файл | Ответственность |
| --- | --- | --- |
| **BaseComponent** | `core.js` | Базовый класс: конфигурация, изоляция, `onStateChange()` |
| **Container** | `core.js` | Глобальное состояние → рассылка всем компонентам |
| **ComponentScanner** | `core.js` | Авто-инициализация по `data-component` |
| **ValidationComponent** | `components/validation.js` | Валидация формы (submit/live) через FieldValidator + FieldErrorRenderer |
| **FieldValidator** | `services/field-validator.js` | Валидация одного поля/группы по правилам |
| **FieldErrorRenderer** | `services/field-error-renderer.js` | Рендеринг ошибок (5 уровней иерархии) |
| **validationRules** | `configurations/validation-rules.js` | Конфигурация правил валидации |
| **Logger Service** | `services/logger.js` | Единый сервис логирования (режимы: log, debug, diag) |
| **Debounce Service** | `services/debounce.js` | Сервис debouncing для событий |
| **jQuery Data API** | — | Хранение ссылок на компоненты через `$.data('modia-component')` |
| **Custom Events** | — | События `modia:initialized`, `modia:scanned`, `modia:component-created` |

---

## 🚧 Запланированные компоненты (v1.3 — v2.0)

### v1.3 — Архитектурные расширения

| Компонент | Файл | Назначение | Контракт |
| --- | --- | --- | --- |
| **EventBus** | `services/event_bus.js` | Глобальная шина событий с payload | `modia_extensions_1_EventBus.md` |
| **RemoteModalComponent** | `components/remote_modal_component.js` | Модальные окна с рендерингом через контроллер | `modia_extensions_2_RemoteModalComponent.md` |
| **TemplateRegistry** | `services/template_registry.js` | Централизованное управление шаблонами | `modia_extensions_3_TemplateRegistry.md` |
| **AsyncWidgetComponent** | `components/async_widget_component.js` | Асинхронная загрузка виджетов (счётчики, статусы) | `modia_extensions_8_AsyncWidgetComponent.md` |
| **ErrorBoundaryComponent** | `components/error_boundary_component.js` | Изоляция ошибок в partials | `modia_extensions_9_ErrorBoundaryComponent.md` |
| **DebugPanel Component** | `components/debug_panel.js` | UI панель, диагностика страницы, экспорт логов | `CONTRIBUTING.md` |
| **Turbolinks поддержка** | `integrations/turbolinks.js` | Полная интеграция с `turbolinks:load` | `260218-index-refactor.md` |
| **ENV блокировка логов** | `services/logger.js` | `window.MODIA_LOG_ENABLED`, `window.MODIA_LOG_LEVEL` | `CONTRIBUTING.md` |

### v1.4 — Расширение валидации и сервисы

| Модуль | Файл | Назначение | Контракт |
| --- | --- | --- | --- |
| **Domain Layer** | `domain/*.js` | Чистые бизнес-объекты (без DOM) | `modia_extensions_4_DomainLayer.md` |
| **DataTransportLayer** | `services/data_transport.js` | Абстракция над AJAX (чтение и запись) | `modia_extensions_5_DataTransportLayer.md` |
| **StateReducer** | `reducers/*.js` | Управление валидными переходами состояния | `modia_extensions_6_StateReducer.md` |
| **Render Endpoint** | `controllers/widgets_controller.rb` | Единый endpoint для рендеринга UI-блоков | `modia_extensions_11_RenderEndpoint.md` |
| **Actions Endpoint** | `controllers/actions_controller.rb` | Единый endpoint для мутаций | `modia_extensions_12_ActionsEndpoint.md` |
| **WidgetStreamer** | `services/widget_streamer.js` | Потоковая загрузка виджетов | `modia_extensions_13_WidgetStreamer.md` |

### v2.0 — Declarative UI

| Модуль | Файл | Назначение | Контракт |
| --- | --- | --- | --- |
| **Schema-Driven UI** | `components/schema_form_component.js` | Генерация форм из декларативной схемы (JSON) | `modia_extensions_7_SchemaDrivenUI.md` |
| **jQuery Optional** | — | Опциональный отказ от jQuery (чистый DOM API) | `CONTRIBUTING.md` |

---

## 📁 Структура проекта

```
modia/
├── index.js                    ← Точка входа (регистрация + запуск)
├── version.js                  ← Версия фреймворка (запланировано)
├── core.js                     ← BaseComponent, Container, ComponentScanner
├── modia.css                   ← Базовые стили
│
├── components/                 ← Компоненты (поведение контейнера)
│   ├── validation.js
│   ├── debug.js                ← v1.3
│   ├── remote_modal_component.js
│   ├── async_widget_component.js
│   ├── error_boundary_component.js
│   └── schema_form_component.js
│
├── services/                   ← Сервисы (логика без состояния)
│   ├── logger.js
│   ├── debounce.js
│   ├── field-validator.js
│   ├── field-error-renderer.js
│   ├── event_bus.js            ← v1.3
│   ├── template_registry.js    ← v1.3+
│   ├── data_transport.js       ← v1.3+
│   └── widget_streamer.js      ← v1.3+
│
├── configurations/             ← Конфигурации (чистые данные)
│   └── validation-rules.js
│
├── domain/                     ← Domain Objects (v1.4+)
│   ├── sql_check.js
│   └── sql_query.js
│
├── reducers/                   ← State Reducers (v1.4+)
│   └── sql_form_reducer.js
│
└── integrations/               ← Опциональные интеграции (v1.3+)
    └── turbolinks.js
```

---

## 📝 Стандарты кода

### Именование файлов: `kebab-case`

```
field-validator.js          ✅
field_error_renderer.js     ❌
ValidationRules.js          ❌
validation-rules.js         ✅
```

**Почему `kebab-case`:**
- Совместимость с путями в браузере
- Единый стандарт экосистемы JS (React, Vue, Svelte)
- Согласованность с атрибутами: `data-component-*` → файлы в том же стиле

### Классы: `PascalCase`

```javascript
class FieldValidator { ... }
class ValidationComponent { ... }
```

### Переменные и методы: `camelCase`

```javascript
const fieldValue = '';
function validateField() { ... }
```

### Статические свойства: `static get`

```javascript
// ✅ Правильно
class ValidationComponent extends BaseComponent {
  static get componentName() {
    return 'validation';
  }
}

// ❌ Неправильно
class ValidationComponent extends BaseComponent {
  static componentName = 'validation';  // Конфликт с getter в родителе
}
```

### HTML-контракты
Поскольку Modia — HTML-first фреймворк, структура HTML является частью API.
- ✅ **Правильно:** `<div data-component="validation" data-rule="required">`
- ❌ **Неправильно:** `new Validator({ element: '#form', rules: ['required'] })`
- **Правило:** Если поведение можно выразить через атрибут — оно должно быть выражено через атрибут.

---

## 🔧 Процесс разработки

### 1. Создание компонента

```bash
# Создать файл компонента
touch modia/components/my_component.js

# Создать контракт
touch contracts/next/YYMMDD-my-component.md
```

### 2. Контракт на компонент

Каждый новый компонент требует контракт `.md` файл:

```markdown
# Техническая спецификация: MyComponent

## Цель
Описание проблемы и решения

## Требования
- [ ] Требование 1
- [ ] Требование 2

## Интерфейс
window.Modia.MyComponent = { ... }

## Критерии проверки
- [ ] Критерий 1
- [ ] Критерий 2
```

### 3. Регистрация в `index.js`

```javascript
import { MyComponent } from './components/my_component.js';
ComponentScanner.register(MyComponent);
```

### 4. Документация

| Файл | Обновить |
| --- | --- |
| `README.md` | Добавить в таблицу компонентов |
| `ARCHITECTURE.md` | Добавить в архитектурные слои |
| `ROADMAP.md` | Переместить из "Запланировано" в "Реализовано" |
| `api/` | Создать API Reference для пользователей |
| `docs/` | Создать внутреннюю документацию |

---

## 🐛 Исправления, выявленные при интеграции (v1.2.1)

| # | Bug | Файл | Статус |
| --- | --- | --- | --- |
| 1 | Static getter conflict в наследовании | `validation.js` | ✅ Fixed |
| 2 | `loadRules()` только `$valueSource` | `field-validator.js` | ✅ Fixed |
| 3 | Кэширование правил не учитывает динамические атрибуты | `field-validator.js` | ✅ Fixed |
| 4 | Native HTML5 validation блокирует скрытые required поля | ERB шаблоны | 📋 Workaround |
| 5 | Несоответствие класса `.error-template` vs `.error-templates` | `modia.css`, `docs/` | ✅ Fixed |
| 6 | Отсутствие guard от legacy-кнопок `.validate-on-click` | `validation.js` | ✅ Fixed |
| 7 | jQuery глобальная доступность — `$` есть, `jQuery` нет | `application.js` | ✅ Fixed |

**Контракт:** `contracts/actual/260227-integration-bugs-fixes.md`

---

## 🔒 ENV блокировка логов (v1.3+)

```javascript
window.MODIA_LOG_ENABLED = false;  // Полная блокировка
window.MODIA_LOG_LEVEL = 'error';  // Только ошибки
```

**Приоритет:** ENV > GET-параметры > Data-атрибуты

---

## 🧪 Тестирование

### Структура тестов

```
examples/
├── component/validation/
│   ├── test-01-basic-submit.html      ✅ Пройден
│   ├── test-02-validate-button.html   ✅ Пройден
│   ├── test-03-live-validation.html   ✅ Пройден
│   ├── test-04-multiple-forms.html    ✅ Пройден
│   ├── test-05-error-handling.html    ⚠️ Требует доработки
│   ├── test-06-dynamic-fields.html    ⏳ Не проверен
│   └── test-07-hidden-fields.html     ⏳ Не проверен
├── service/field-validator/
│   ├── test-01-basic.html
│   └── test-02-message-hierarchy.html
└── configurations/validation-rules/
    ├── test-01-helpers.html
    └── test-02-rules-structure.html
```

### Запуск тестов

```bash
# Открыть пример в браузере (Live Server порт 5501)
open http://127.0.0.1:5501/examples/component/validation/test-01-basic-submit.html

# С режимом логирования
open http://127.0.0.1:5501/examples/component/validation/test-01-basic-submit.html?modia-log
```

---

## 🔄 Версионная стратегия

| Версия | Описание | Breaking Changes |
| --- | --- | --- |
| **v1.x** | Базовая архитектура + компоненты | ❌ Нет |
| **v2.0** | Вложенные контейнеры, опциональный jQuery, Schema-Driven UI | ✅ Да |

**Принцип:** даже временные решения в v1.x должны соответствовать архитектуре — чтобы v2.0 не требовал переписывания.

---

## 📚 Связанные документы

| Файл | Аудитория |
| --- | --- |
| [README.md](./README.md) | Пользователи фреймворка |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитекторы |
| [ROADMAP.md](./ROADMAP.md) | Все |
| [docs/](./docs/) | Разработчики фреймворка |
| [api/](./api/) | Пользователи (API Reference) |
| [contracts/](./contracts/) | Разработчики фреймворка (внутренние контракты) |

---

**Последнее обновление:** 2026-02-25  
**Версия:** 1.2.0  
**Ответственный:** Modia Dev Team

