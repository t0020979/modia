// Правила валидации для ValidationComponent
//
// Источник текста ошибки:
//   1. Шаблон из DOM (например, #error_span) — ДОЛЖЕН содержать текст из Rails-локализации,
//      например: <%= t('errors.messages.blank') %>
//   2. Fallback — текст по умолчанию (на случай отладки или отсутствия шаблона).
//
// Правила валидации с гибким разрешением сообщений
//
// Поддерживаемые форматы шаблонов:
//   1. Legacy: <div id="error_span"><span class="text-danger">...</span></div>
//   2. Unified: <div class="error-templates"><span data-error-text="required">...</span></div>
//
// Fallback — текст по умолчанию.

// Правила валидации для ValidationComponent
//
// Поддерживаемый формат шаблонов:
//   <div id="error_span" class="invisible error-template">
//     <span class="text-danger"><%= t('errors.messages.blank') %></span>
//   </div>
//
// Fallback — текст по умолчанию (на английском), если шаблон отсутствует.

export const validationRules = [
    {
        name: 'required',
        selector: '[required]',
        messageSource: { type: 'textDanger', id: 'error_span' },
        validate($field, component) {
            const value = component.getFieldValue($field);
            return value.trim() !== '';
        },
        // Унифицированный метод разрешения сообщений для типа 'textDanger'
        resolveTextDangerMessage($templateContainer, id, placeholderReplacements = {}) {
            const $container = $templateContainer.find(`#${id}`);
            if ($container.length === 0) return null;

            // Берём HTML изнутри #id — предполагается, что он содержит <span class="text-danger">...</span>
            let messageHtml = $container.html();

            // Применяем замены (например, __COUNT__ → 600)
            Object.entries(placeholderReplacements).forEach(([placeholder, value]) => {
                const regex = new RegExp(`__${placeholder.toUpperCase()}__`, 'g');
                messageHtml = messageHtml.replace(regex, value);
            });

            return messageHtml;
        },
        resolveMessage($templateContainer, params = {}, component) {
            const source = this.messageSource;
            if (source.type === 'textDanger') {
                const messageHtml = this.resolveTextDangerMessage($templateContainer, source.id);
                if (messageHtml !== null) return messageHtml;
            }
            return this.fallbackMessage(params);
        },
        fallbackMessage(params) {
            return '<span class="text-danger">This field is required.</span>';
        }
    },
    {
        name: 'maxLength',
        selector: '[data-max-length]',
        messageSource: { type: 'textDanger', id: 'max_length_error_span' },
        validate($field, component) {
            const maxLength = $field.data('max-length');
            if (maxLength == null || typeof maxLength !== 'number') return true;
            const value = component.getFieldValue($field);
            return value.length <= maxLength;
        },
        // Этот тип тоже использует textDanger, но с подстановкой __COUNT__
        resolveMessage($templateContainer, params = {}, component) {
            const source = this.messageSource;
            if (source.type === 'textDanger') {
                const replacements = { COUNT: params.maxLength };
                const messageHtml = this.resolveTextDangerMessage($templateContainer, source.id, replacements);
                if (messageHtml !== null) return messageHtml;
            }
            return this.fallbackMessage(params);
        },
        fallbackMessage(params) {
            return `<span class="text-danger">Must not exceed ${params.maxLength} characters.</span>`;
        }
    }
];
