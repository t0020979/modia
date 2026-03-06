# 🗺 Roadmap — План развития Modia

Этот документ описывает эволюцию Modia как системы:
— текущие возможности,
— запланированные архитектурные слои,
— компоненты к реализации,
— поддержку иерархии и событий.

Он не дублирует README, а служит дорожной картой для разработчика фреймворка.

**Последнее обновление:** 2026-02-27  
**Текущая версия:** v1.2.0  
**Следующая версия:** v1.3.0

---

## ✅ Реализовано (v1.2)

| Модуль | Ответственность | Статус |
| --- | --- | --- |
| BaseComponent | Базовый класс: конфигурация, изоляция | ✅ v1.2 |
| Container | Глобальное состояние → рассылка всем компонентам | ✅ v1.2 |
| ComponentScanner | Авто-инициализация по `data-component` | ✅ v1.2 |
| ValidationComponent | Валидация формы (submit), через FieldValidator и FieldErrorRenderer | ✅ v1.2 |
| FieldValidator | Валидация одного поля/группы полей по правилам | ✅ v1.2 |
| FieldErrorRenderer | Рендеринг и очистка ошибок (5 уровней иерархии) | ✅ v1.2 |
| validationRules | Конфигурация правил валидации | ✅ v1.2 |
| Logger Service | Единый сервис логирования | ✅ v1.2 |
| Debounce Service | Сервис debouncing для событий | ✅ v1.2 |
| jQuery Data API | Хранение ссылок на компоненты через `$.data()` | ✅ v1.2 |
| Custom Events | События `modia:initialized`, `modia:scanned`, `modia:component-created` | ✅ v1.2 |
| DebugComponent | Управление режимами отладки |  v1.3+ |

### 📋 Правила валидации (v1.2)

| Правило | Селектор | Статус |
| --- | --- | --- |
| required | `[required]` | ✅ Реализовано |
| max-length | `[data-max-length]` | ⏳ v1.3 |
| min-length | `[data-min-length]` | ⏳ v1.3 |
| format | `[data-format]` | ⏳ v1.3 |
| pattern | `[pattern]` | ⏳ v1.3 |
| email | `input[type="email"]` | ⏳ v1.3 |
| ajax | `[data-ajax-validate]` | ⏳ v1.4 |
| custom | `[data-validate-custom]` | ⏳ v1.4 |

---

## 🚧 Запланировано

### v1.3 — Архитектурные расширения и фиксы (Q1 2026)

#### 🔧 Критические исправления (v1.2.1 patch)

| # | Bug | Файл | Статус |
| --- | --- | --- | --- |
| 1 | Static getter conflict в наследовании | validation.js | ✅ Fixed |
| 2 | loadRules() только $valueSource (игнорировал $errorScreen) | field-validator.js | ✅ Fixed |
| 3 | Кэширование правил не учитывает динамические атрибуты | field-validator.js | ✅ Fixed |
| 4 | Native HTML5 validation блокирует скрытые required поля | ERB шаблоны | 📋 Workaround |
| 5 | Несоответствие класса .error-template vs .error-templates | modia.css, docs/ | ✅ Fixed |
| 6 | Отсутствие guard от legacy-кнопок `.validate-on-click` | validation.js | ✅ Fixed |
| 7 | jQuery глобальная доступность — `$` есть, `jQuery` нет | application.js | ✅ Fixed |

#### 🆕 Новые компоненты

| Компонент | Назначение | Статус | Контракт |
| --- | --- | --- | --- |
| EventBus | Глобальная шина событий с payload | ⏳ v1.3 | `modia_extensions_1_EventBus.md` |
| LocalContainer | Локальные контейнеры для вложенных компонентов | ⏳ v1.3 | `260218-core-update.md` |
| DebugPanel Component | UI панель, диагностика страницы, экспорт логов | ⏳ v1.3 | `CONTRIBUTING.md` |
| RemoteModalComponent | Модальные окна с рендерингом через контроллер | ⏳ v1.3 | `modia_extensions_2_RemoteModalComponent.md` |
| TemplateRegistry | Централизованное управление шаблонами | ⏳ v1.3 | `modia_extensions_3_TemplateRegistry.md` |
| AsyncWidgetComponent | Асинхронная загрузка виджетов (счётчики, статусы) | ⏳ v1.3 | `modia_extensions_8_AsyncWidgetComponent.md` |
| ErrorBoundaryComponent | Изоляция ошибок в partials | ⏳ v1.3 | `modia_extensions_9_ErrorBoundaryComponent.md` |

#### 🔧 Улучшения ядра

| Улучшение | Описание | Статус | Контракт |
| --- | --- | --- | --- |
| Index.js рефакторинг | Удаление мёртвых импортов, вынос версии, Turbolinks модуль | ⏳ v1.3 | `260218-index-refactor.md` |
| ENV блокировка логов | `window.MODIA_LOG_ENABLED`, `window.MODIA_LOG_LEVEL` | ⏳ v1.3 | `CONTRIBUTING.md` |
| Генерация ID для элементов | `ensureElementId()` для элементов без ID | ⏳ v1.3 | `260218-core-update.md` |
| Рекурсивное сканирование | Инициализация внутри компонентов (для модалок) | ⏳ v1.3 | `260218-core-update.md` |
| Turbolinks поддержка | Полная интеграция с `turbolinks:load` | ⏳ v1.3 | `260218-index-refactor.md` |
| Декларативная валидация | `data-modia-rule` + активация по атрибуту | ⏳ v1.3 | `260225-component-validation-upd.md` |
| MutationObserver | Авто-обновление правил при изменении атрибутов | ⏳ v1.3 | `260222-field-validator.md` |

#### 🧪 Тесты и примеры для компонента Валидации

| Файл | Статус | Проблема | Приоритет |
| --- | --- | --- | --- |
| test-01-basic-submit.html | ✅ Пройден | — | — |
| test-02-validate-button.html | ✅ Пройден | — | — |
| test-03-live-validation.html | ✅ Пройден | — | — |
| test-04-multiple-forms.html | ✅ Пройден | — | — |
| test-05-error-handling.html | ⚠️ Требует доработки | disabled/hidden поля не переключают состояние | 🔴 Высокий |
| test-06-dynamic-fields.html | ⏳ Не проверен | Динамические поля, массивы | 🟡 Средний |
| test-07-hidden-fields.html | ⏳ Не проверен | Скрытые поля + error-screen | 🟡 Средний |
| test-08-hooks-events.html | ⏳ Не проверен | Хуки и события валидации | 🟡 Средний |
| test-09-form-data.html | ⏳ Не проверен | getFormData(), getErrors() | 🟡 Средний |

---

### v1.4 — Расширение валидации и сервисы (Q2 2026)

| Модуль | Назначение | Статус | Контракт |
| --- | --- | --- | --- |
| Domain Layer | Чистые бизнес-объекты (без DOM) | ⏳ v1.4 | `modia_extensions_4_DomainLayer.md` |
| DataTransportLayer | Абстракция над AJAX (чтение и запись) | ⏳ v1.4 | `modia_extensions_5_DataTransportLayer.md` |
| StateReducer | Управление валидными переходами состояния формы | ⏳ v1.4 | `modia_extensions_6_StateReducer.md` |
| Render Endpoint | Единый endpoint для рендеринга UI-блоков (batch + streaming) | ⏳ v1.4 | `modia_extensions_11_RenderEndpoint.md` |
| WidgetStreamer | Потоковая загрузка виджетов | ⏳ v1.4 | `modia_extensions_13_WidgetStreamer.md` |

#### Правила валидации (v1.4)

| Правило | Назначение | Статус |
| --- | --- | --- |
| ajax | Асинхронная валидация через бэк | ⏳ v1.4 |
| custom | Кастомные валидаторы (функции) | ⏳ v1.4 |
| unique | Проверка уникальности через API | ⏳ v1.4 |
| dependent | Валидация зависимых полей | ⏳ v1.4 |

---

### v1.5 — Новые компоненты UI (Q3 2026)

| Компонент | Назначение | Статус |
| --- | --- | --- |
| FormStateComponent | Переключение режимов (regular/cross) через Container | ⏳ v1.5 |
| ModalComponent | Открытие/закрытие, сканирование внутреннего DOM | ⏳ v1.5 |
| DynamicSelectComponent | Асинхронная подгрузка опций в `<select>` | ⏳ v1.5 |
| DependentFieldComponent | Блокировка/очистка полей при изменении другого | ⏳ v1.5 |
| LazyModalLoader | Отложенная инициализация модалок (режим RemoteModal) | ⏳ v1.5 |

---

### v1.6+ — Зависимые поля и UI (Q4 2026)

| Компонент | Назначение | Статус |
| --- | --- | --- |
| TabGroupComponent | Переключение вкладок с поддержкой `data-component` внутри | ⏳ v1.6 |
| AccordionComponent | Сворачиваемые секции с сохранением состояния | ⏳ v1.6 |
| CounterComponent | Счётчик длины, выбранного и т.п. | ⏳ v1.7 |
| FormLockerComponent | Блокировка после отправки (`data-disable-with`) | ⏳ v1.7 |
| Actions Endpoint | Единый endpoint для мутаций (сохранение, обновление) | ⏳ v1.6 |

---

### v2.0 — Declarative UI (2027)

| Модуль | Назначение | Статус | Контракт |
| --- | --- | --- | --- |
| Schema-Driven UI | Генерация форм из декларативной схемы (JSON) | ⏳ v2.0 | `modia_extensions_7_SchemaDrivenUI.md` |
| Render All Page | Потоковая рендеринг всей страницы | ⏳ v2.0 | `modia_extensions.md` |
| jQuery Optional | Опциональный отказ от jQuery (чистый DOM API) | ⏳ v2.0 | `CONTRIBUTING.md` |
| Nested Containers | Полная поддержка вложенных контейнеров | ⏳ v2.0 | `CONTRIBUTING.md` |

---

## 📦 Архитектурные слои

| Слой | Описание | Статус |
| --- | --- | --- |
| Core Layer | BaseComponent, Container, ComponentScanner, EventBus | ✅ v1.2, ⏳ v1.3 |
| Service Layer | FieldValidator, FieldErrorRenderer, Logger, Debounce, DataTransport | ✅ v1.2, ⏳ v1.4 |
| Component Layer | ValidationComponent, DebugComponent, RemoteModal, AsyncWidget | ✅ v1.2, ⏳ v1.3 |
| Configuration Layer | validationRules.js, formStateMap.js, templateSources.js | ✅ v1.2 |
| Integration Layer | Turbolinks, UJS, Rails i18n, Webpacker | ⏳ v1.3 |
| Domain Layer | Domain Objects (без DOM), StateReducer | ⏳ v1.4 |
| Streaming Layer | WidgetStreamer, Render Endpoint, Actions Endpoint | ⏳ v1.4 |

---

## 🔄 Версионная стратегия

| Версия | Описание | Breaking Changes |
| --- | --- | --- |
| v1.x | **Stable LTS.** Базовая архитектура + компоненты. Гарантия обратной совместимости. | ❌ Нет |
|  ... | ... | ... |   
| v1.2 | Базовая валидация + ядро | ❌ Нет |
| v1.3 | Архитектурные расширения + фиксы | ❌ Нет |
| v1.4 | Domain Layer + DataTransport | ❌ Нет |
| v1.5 | Новые UI компоненты | ❌ Нет |
| v1.6+ | Зависимые поля + Endpoints | ❌ Нет |
| v2.0 | Возможные изменения: вложенные контейнеры - Schema-Driven UI, опциональный jQuery | ✅ Да |


**Принцип:** даже временные решения в v1.x должны соответствовать архитектуре — чтобы v2.0 не требовал переписывания.
**Принцип:** В ветке v1.x приоритетом является **Стабильность**. Любое изменение, ломающее существующий HTML-контракт, переносится в v2.0.

---

## 📅 Принципы развития

| Принцип | Описание |
| --- | --- |
| Контракт на компонент | Каждый компонент = контракт: требования, ограничения, критерии |
| Расширение, не переопределение | Новые возможности — через расширение, не через изменение ядра |
| Совместимость с legacy | Обязательна: не ломать DOM, не мешать UJS, поддерживать существующие шаблоны |
| Тестируемость | Заложена в архитектуру: чистые функции, изоляция, мокаемость сервисов |
| HTML-first | Все компоненты могут работать с сериализацией в `<input type="hidden" value='JSON'>` |
| Gradual Migration | Путь от «работает» к «поддерживаемо» без полной переписки |

---

## 🔗 Связанные документы

| Файл | Описание |
| --- | --- |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Правила для разработчиков фреймворка |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектурные принципы и слои |
| [README.md](./README.md) | Быстрый старт и пользовательская документация |
| [modia_extensions.md](./contracts/next/modia_extensions.md) | Полный контракт расширений (10 уровней) |
| [contracts/done/](./contracts/done/) | Реализованные контракты |
| [contracts/actual/](./contracts/actual/) | Текущие задачи (интеграция, багфиксы) |
| [contracts/next/](./contracts/next/) | Запланированные задачи |
| [examples/](./examples/) | Рабочие примеры и тесты |

---

## 📊 Сводка по версиям

| Версия | Компоненты | Сервисы | Исправления | Тесты |
| --- | --- | --- | --- | --- |
| **v1.2** | Validation | Logger, Debounce, Validator, ErrorRenderer | 7 integration bugs | 4/9 примеров |
| **v1.3** | EventBus, Debug, RemoteModal, TemplateRegistry, AsyncWidget, ErrorBoundary, DebugPanel | DataTransport (начало) | Dynamic attributes, Turbolinks, ENV logs | 9/9 примеров |
| **v1.4** | Domain Components | DataTransport, StateReducer | — | Unit-тесты |
| **v2.0** | SchemaForm | — | — | E2E |

---

> **Modia — не SPA-фреймворк, а система для поддержки сложного UI в legacy-проектах.**  
> Эти расширения дают путь от «работает» к «поддерживаемо», без полной переписки, с возможностью градиентного перехода к современной архитектуре.

**Дата обновления:** 2026-02-27  
**Ответственный:** Modia Dev Team