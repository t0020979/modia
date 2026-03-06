
# 🏗️ Архитектура Modia

**Версия:** 1.2.0  
**Последнее обновление:** 2026-02-25

Лёгкий компонентный фреймворк на JavaScript для управления динамическим UI в legacy-проектах. Совместим с Rails, jQuery, Turbolinks.

---

## 🏛 Архитектурные принципы
Modia следует принципам **Прагматичного Интегратора**:

1.  **Монолит-First:** Мы оптимизированы для работы внутри серверного рендеринга (Rails ERB, Django Templates). Мы не заменяем бэкенд, мы усиливаем фронтенд.
2.  **Гибридная Парадигма:**
    - **Компоненты:** ООП (классы, состояние, жизненный цикл).
    - **Сервисы:** Функциональные (чистые функции, утилиты).
    - **Конфигурация:** Декларативная (HTML attributes).
    *Не пытайтесь переписать сервисы на классы или компоненты на функции без необходимости.*
3.  **Безопасная Мощность:** Мы даем разработчику доступ к DOM, но требуем инкапсуляции. Прямая манипуляция чужим DOM вне компонента запрещена.

---

## 🏝 Архитектура «Островов» (Hybrid Islands)
Modia поддерживает гибридный подход внутри монолита:

1.  **Integrated Core:** Все компоненты используют единое ядро (Scanner, Container, EventBus). Это гарантирует совместимость и отсутствие конфликтов.
2.  **Async Islands:** Отдельные компоненты (виджеты) могут работать в режиме SPA:
    *   Ленивая загрузка (`AsyncWidgetComponent`).
    *   Изолированное состояние (Local Container).
    *   Асинхронные обновления без перезагрузки страницы.
3.  **Изоляция сбоев:** `ErrorBoundaryComponent` гарантирует, что падение «острова» не сломает всю страницу.

**Цель:** Получить преимущества SPA (отзывчивость) внутри надежности монолита (деплой, SEO, скорость первой отрисовки).

---

## 📦 Архитектурные слои

```
modia/
├── index.js                    ← Точка входа: регистрация + экспорт Modia.scan()
├── version.js                  ← Версия фреймворка
├── core.js                     ← Ядро: BaseComponent, Container, ComponentScanner
├── modia.css                   ← Базовые стили
│
├── components/                 ← Компоненты (поведение контейнера)
│   ├── validation.js           ← ValidationComponent (v1.2) ✅
│   ├── debug.js                ← DebugComponent (v1.3) ⏳
│   ├── remote_modal_component.js
│   ├── async_widget_component.js
│   ├── error_boundary_component.js
│   └── schema_form_component.js
│
├── services/                   ← Сервисы (логика без состояния)
│   ├── logger.js               ← Logger Service (v1.2) ✅
│   ├── debounce.js             ← Debounce Service (v1.2) ✅
│   ├── field-validator.js      ← FieldValidator (v1.2) ✅
│   ├── field-error-renderer.js ← FieldErrorRenderer (v1.2) ✅
│   ├── event_bus.js            ← EventBus (v1.3) ⏳
│   ├── template_registry.js    ← TemplateRegistry (v1.3) ⏳
│   ├── data_transport.js       ← DataTransportLayer (v1.4) ⏳
│   └── widget_streamer.js      ← WidgetStreamer (v1.4) ⏳
│
├── configurations/             ← Конфигурации (чистые данные)
│   └── validation-rules.js     ← validationRules (v1.2) ✅
│
├── domain/                     ← Domain Objects (v1.4+) ⏳
│   ├── sql_check.js
│   └── sql_query.js
│
├── reducers/                   ← State Reducers (v1.4+) ⏳
│   └── sql_form_reducer.js
│
└── integrations/               ← Опциональные интеграции (v1.3+) ⏳
    └── turbolinks.js
```

---

## 🧱 10 архитектурных уровней Modia

| № | Уровень | Роль | Фаза | Контракт |
| --- | --- | --- | --- | --- |
| 1 | **EventBus** | Глобальная шина событий с payload | v1.3 | `modia_extensions_1_EventBus.md` |
| 2 | **RemoteModalComponent** | Модальные окна с рендерингом через контроллер | v1.3 | `modia_extensions_2_RemoteModalComponent.md` |
| 3 | **TemplateRegistry** | Централизованное управление шаблонами | v1.3 | `modia_extensions_3_TemplateRegistry.md` |
| 4 | **AsyncWidgetComponent** | Асинхронная загрузка виджетов | v1.3 | `modia_extensions_8_AsyncWidgetComponent.md` |
| 5 | **ErrorBoundaryComponent** | Изоляция ошибок в partials | v1.3 | `modia_extensions_9_ErrorBoundaryComponent.md` |
| 6 | **Domain Layer** | Чистые бизнес-объекты (без DOM) | v1.4 | `modia_extensions_4_DomainLayer.md` |
| 7 | **DataTransportLayer** | Абстракция над AJAX (чтение и запись) | v1.4 | `modia_extensions_5_DataTransportLayer.md` |
| 8 | **StateReducer** | Управление валидными переходами состояния | v1.4 | `modia_extensions_6_StateReducer.md` |
| 9 | **Render/Actions Endpoint** | Единые endpoints для рендеринга и мутаций | v1.4 | `modia_extensions_11_*.md` |
| 10 | **Schema-Driven UI** | Генерация форм из декларативной схемы | v2.0 | `modia_extensions_7_SchemaDrivenUI.md` |

---

## 🔄 Поток данных

```
┌─────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│   DOM   │ ──→ │ ComponentScanner │ ──→ │  Component  │ ──→ │  Container   │
│ (HTML)  │     │   (scan root)    │     │ (create)    │     │ (state mgr)  │
└─────────┘     └──────────────────┘     └─────────────┘     └──────────────┘
                                                              │
                                                              ↓
                                                      onStateChange()
                                                              │
                                                              ↓
                                                     ┌─────────────┐
                                                     │   Service   │
                                                     │ (Validator) │
                                                     └─────────────┘
                                                              │
                                                              ↓
                                                     ┌─────────────┐
                                                     │  Renderer   │
                                                     │  (Error)    │
                                                     └─────────────┘
```

### Расширенный поток (v1.3+)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │ ──→ │   EventBus  │ ──→ │  Component  │
│             │     │  (emit/on)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       ↓                                       ↓
┌─────────────┐                         ┌─────────────┐
│DataTransport│                         │Domain Layer │
│  (AJAX)     │                         │(Business)   │
└─────────────┘                         └─────────────┘
```

---

## 🔁 Жизненный цикл компонента

| Стадия | Метод | Описание |
| --- | --- | --- |
| **Сканирование** | `ComponentScanner.scan()` | Находит `[data-component="name"]` в DOM |
| **Создание** | `new Component(element)` | Парсинг конфигурации из `data-*` |
| **Регистрация** | `container.addComponent()` | Добавляет компонент в контейнер (опционально) |
| **Инициализация** | `onStateChange()` | Первая инициализация состояния |
| **Работа** | `onStateChange(state)` | Слушает события, обновляет UI |
| **Уничтожение** | `destroy()` | Очищает обработчики при замене DOM |

---

## ⚠️ Обработка ошибок

### Иерархия источников ошибок (5 уровней)

| Приоритет | Источник | Пример | Когда использовать |
| --- | --- | --- | --- |
| 1 | Inline-атрибут | `data-error-text-required="Заполните"` | Точечное переопределение |
| 2 | Шаблон в контейнере | `.error-template [data-rule="required"]` | **Рекомендуемый** |
| 3 | Отдельные шаблоны | `#error_span` | Legacy-код |
| 4 | Сообщение из правила | `rule.defaultMessage` | Fallback |
| 5 | Fallback валидатора | `"Field error"` | Критическая ошибка |

### ErrorBoundaryComponent (v1.3+)

```html
<div data-component="error-boundary" data-component-fallback="Недоступно">
  <div data-component="async-widget" ...></div>
</div>
```

**Назначение:** Изоляция ошибок в дочерних компонентах — падение одного виджета ≠ падение страницы.

---

## 🧪 Стратегия тестирования

| Уровень | Расположение | Инструмент |
| --- | --- | --- |
| **Unit-тесты** | `tests/unit/` | Jest |
| **Integration-тесты** | `tests/integration/` | Jest + jsdom |
| **E2E-примеры** | `examples/` | Браузер (ручные + авто-тесты) |

### Статус тестов (v1.2)

| Файл | Статус | Проблема |
| --- | --- | --- |
| `test-01-basic-submit.html` | ✅ Пройден | — |
| `test-02-validate-button.html` | ✅ Пройден | — |
| `test-03-live-validation.html` | ✅ Пройден | — |
| `test-04-multiple-forms.html` | ✅ Пройден | — |
| `test-05-error-handling.html` | ⚠️ Требует доработки | disabled/hidden поля |
| `test-06-dynamic-fields.html` | ⏳ Не проверен | — |
| `test-07-hidden-fields.html` | ⏳ Не проверен | — |

---

## 📚 Документация

| Аудитория | Файлы |
| --- | --- |
| **Пользователи** | `README.md`, `api/` |
| **Разработчики фреймворка** | `CONTRIBUTING.md`, `docs/`, `contracts/` |
| **Архитекторы** | `ARCHITECTURE.md`, `ROADMAP.md` |

---

## 🔗 Связанные документы

| Файл | Описание |
| --- | --- |
| [README.md](./README.md) | Быстрый старт для пользователей |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Правила для разработчиков фреймворка |
| [ROADMAP.md](./ROADMAP.md) | Дорожная карта развития |
| [modia_extensions.md](./contracts/next/modia_extensions.md) | Полный контракт расширений (10 уровней) |
| [contracts/done/](./contracts/done/) | Реализованные контракты |
| [contracts/actual/](./contracts/actual/) | Текущие задачи |
| [contracts/next/](./contracts/next/) | Запланированные задачи |

---

> **Modia — не SPA-фреймворк, а система для поддержки сложного UI в legacy-проектах.**  
> Эти расширения дают путь от «работает» к «поддерживаемо», без полной переписки, с возможностью градиентного перехода к современной архитектуре.

---

**Последнее обновление:** 2026-02-25  
**Версия:** 1.2.0  
**Ответственный:** Modia Dev Team