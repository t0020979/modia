# 🧪 Validation Component — Modia

Компонент валидации форм в фреймворке [Modia](https://github.com/t0020979/modia).  
Работает **автоматически** при наличии `data-component="validation"`.

---

## ✅ Требования и договорённости

1. **Шаблоны ошибок**  
   Должны быть указаны **на странице** в виде:
   ```html
   <div class="invisible error-template" id="error_span">
     <span class="text-danger"><%= t('errors.messages.blank') %></span>
   </div>
   <div class="invisible error-template" id="max_length_error_span">
     <span class="text-danger"><%= t('errors.messages.name_too_long', count: '__COUNT__') %></span>
   </div>
   ```
   → Компонент **берёт `.html()` шаблона целиком** и вставляет как есть.

2. **Формат ошибки**  
   Всегда вставляется **точно так, как задано в шаблоне** (обычно `<span class="text-danger">`).

3. **Триггер валидации**  
   - Отправка формы (`submit`)
   - Клик по кнопке с `[data-validate]`

4. **Область валидации**  
   Только видимые и неотключённые поля:  
   `:input, [contenteditable]` → фильтруются через `:visible:not(:disabled)`.

5. **Поддерживаемые правила**
   - `required` → проверка на заполненность
   - `data-max-length` → ограничение длины

6. **Динамический HTML**  
   После вставки нового контента вызовите:
   ```js
   Modia.scan(containerElement);
   ```

---

## 🧩 Архитектура

- **Компонент**: [`modia/components/validation.js`](https://github.com/t0020979/modia/blob/main/frontend/packs/modia/components/validation.js)
- **Правила**: [`modia/configurations/validationRules.js`](https://github.com/t0020979/modia/blob/main/frontend/packs/modia/configurations/validationRules.js)
- **Контекст ошибок**: встроен в компонент (класс `ValidationContext`)

Каждое правило — самодостаточный объект с:
- `selector` — фильтр полей,
- `validate()` — логика проверки,
- `resolveMessage()` — получение HTML ошибки из шаблона.

---

## 🛠️ Использование

```html
<div data-component="validation">
  <input required data-max-length="600">
  <button type="submit" data-validate>Сохранить</button>

  <!-- Шаблоны ошибок (обязательно!) -->
  <div class="invisible error-template" id="error_span">
    <span class="text-danger"><%= t('errors.messages.blank') %></span>
  </div>
  <div class="invisible error-template" id="max_length_error_span">
    <span class="text-danger"><%= t('errors.messages.name_too_long', count: '__COUNT__') %></span>
  </div>

  <button type="submit" class="btn btn-primary"><%= t('.submit_button') %></button>
</div>
```

> 💡 Никакого JavaScript не требуется — достаточно `import './modia'` в `application.js`.

---

## 🔮 Расширение

Чтобы добавить новое правило:
1. Добавьте объект в [`validationRules.js`](https://github.com/t0020979/modia/blob/main/frontend/packs/modia/configurations/validationRules.js)
2. Укажите `selector`, `validate`, `resolveMessage`
3. Добавьте соответствующий шаблон на страницу

---



## 📂 Структура каталога

```
app/javascript/packs/modia/
├── core.js                   ← BaseComponent, Container, ComponentScanner
├── components/               ← логика компонентов
│   └── validation.js         ← ValidationComponent (только цикл + вызов правил)
├── configurations/           ← конфигурации (правила, шаблоны, параметры)
│   └── validationRules.js    ← массив правил валидации
└── index.js                  ← регистрация + экспорт
```
---
> ✨ Компонент не создаёт обёрток — **ошибка = шаблон из DOM**.  
> Это гарантирует совместимость со всеми текущими стилями и шаблонами.
