import { BaseComponent } from 'packs/modia/core.js';
import { validationRules } from 'packs/modia/configurations/validationRules.js';

export class ValidationComponent extends BaseComponent {
    static componentName = 'validation';

    constructor(element) {
        super(element);
        this.$el.on('submit', (e) => this.handleValidate(e));
        this.$el.on('click', '[data-validate]', (e) => this.handleValidate(e));
    }

    handleValidate(event) {
        if (!this.validate()) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    validate() {
        const context = new ValidationContext(this.$el);

        // Общая область: только видимые и активные поля
        const $allFields = this.$el.find(':input, [contenteditable]').filter(':visible:not(:disabled)');

        // Применяем все правила
        validationRules.forEach(rule => {
            const $fields = $allFields.filter(rule.selector);
            $fields.each((i, el) => {
                const $field = $(el);
                const isValid = rule.validate($field, this);

                if (!isValid) {
                    const params = { maxLength: $field.data('max-length') };
                    // НОВОЕ: вызываем resolveMessage
                    const message = rule.resolveMessage(this.$el, params, this);
                    context.addError($field, message);
                }
            });
        });

        context.applyErrors();
        return context.isValid;
    }

    getFieldValue($field) {
        if ($field.is('[contenteditable]')) {
            return $field.text();
        }
        return $field.val() || '';
    }
}

// Вспомогательный класс контекста валидации
class ValidationContext {
    constructor($root) {
        this.$root = $root;
        this.errors = [];
        this.isValid = true;
    }

    addError($field, message) {
        this.isValid = false;
        this.errors.push({ $field, message });
    }

    applyErrors() {
        this.$root
            .find('.text-danger, .invalid-feedback')
            .filter(function() {
                return !$(this).closest('.error-template').length;
            })
            .remove();

        this.$root.find('.is-invalid').removeClass('is-invalid');

        this.errors.forEach(({ $field, messageHtml }) => {
            const $group = $field.closest('.input-group, .form-group');
            if ($group.length) {
                $group.append(messageHtml);
            } else {
                $field.after(messageHtml);
            }
            $field.addClass('is-invalid');
        });
    }
}
