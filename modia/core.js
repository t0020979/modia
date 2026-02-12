/**
 * Modia Core - Базовый компонент и утилиты
 * Версия: 1.1.0
 * Дата: 2026-02-10
 * 
 * Базовый класс для всех компонентов фреймворка.
 * Предоставляет:
 * - Извлечение конфигурации из атрибутов data-component-*
 * - Управление событиями с автоматической очисткой
 * - Интеграцию с Container
 * - Поддержку обратной совместимости
 * 
 * @class BaseComponent
 */
export class BaseComponent {
    /**
     * Префикс для атрибутов конфигурации компонента
     * @type {string}
     */
    static attributePrefix = 'component';

    /**
     * @param {HTMLElement} element - DOM-элемент компонента
     */
    constructor(element) {
        if (!element) {
            throw new Error('[BaseComponent] Element is required');
        }

        this.$el = $(element);
        this.container = null;
        this.config = this.extractConfig();

        // Массив обработчиков событий для автоматической очистки
        this._eventHandlers = [];
    }

    /**
     * Извлекает конфигурацию из атрибутов data-component-*
     * 
     * Пример:
     * <div data-component="validation" data-component-live="true">
     *   → config = { live: true }
     * 
     * @returns {Object} Конфигурация компонента
     */
    extractConfig() {
        const config = {};
        const prefix = `data-${this.constructor.attributePrefix}-`;
        const el = this.$el[0];

        if (!el || typeof el.getAttributeNames !== 'function') return config;

        el.getAttributeNames().forEach(attr => {
            if (attr.startsWith(prefix)) {
                const key = attr.substring(prefix.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                let value = this.$el.attr(attr);

                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^-?\d+$/.test(value)) value = parseInt(value, 10);

                config[key] = value;
            }
        });

        return config;
    }

    /**
     * Регистрирует обработчик события с автоматическим биндингом this
     * 
     * Обработчики сохраняются в this._eventHandlers для автоматической очистки в destroy()
     * 
     * @param {string} event - имя события (например, 'submit', 'click')
     * @param {string|Function} selectorOrHandler - селектор делегирования ИЛИ обработчик
     * @param {Function} [handler] - обработчик (если указан селектор)
     * @returns {BaseComponent} this для цепочки вызовов
     * 
     * @example
     * // Без селектора (событие на самом элементе)
     * this._on('submit', this._handleSubmit);
     * 
     * @example
     * // С селектором (делегирование)
     * this._on('click', '[data-validate]', this._handleValidateClick);
     */
    _on(event, selectorOrHandler, handler) {
        let selector = null;
        let callback = null;

        // Определяем, передан ли селектор
        if (typeof selectorOrHandler === 'string') {
            selector = selectorOrHandler;
            callback = handler;
        } else {
            callback = selectorOrHandler;
        }

        // Биндинг this к обработчику
        const boundHandler = callback.bind(this);

        // Регистрируем событие
        if (selector) {
            this.$el.on(event, selector, boundHandler);
            // Сохраняем для очистки
            this._eventHandlers.push({ event, selector, handler: boundHandler });
        } else {
            this.$el.on(event, boundHandler);
            // Сохраняем для очистки
            this._eventHandlers.push({ event, handler: boundHandler });
        }

        return this;
    }

    /**
     * Удаляет обработчик события
     * 
     * @param {string} event - имя события
     * @param {string|Function} [selectorOrHandler] - селектор ИЛИ обработчик
     * @param {Function} [handler] - обработчик (если указан селектор)
     * @returns {BaseComponent} this для цепочки вызовов
     * 
     * @example
     * // Удалить все обработчики 'submit'
     * this._off('submit');
     * 
     * @example
     * // Удалить обработчик с селектором
     * this._off('click', '[data-validate]', this._handleValidateClick);
     */
    _off(event, selectorOrHandler, handler) {
        let selector = null;
        let callback = null;

        if (typeof selectorOrHandler === 'string') {
            selector = selectorOrHandler;
            callback = handler;
        } else if (typeof selectorOrHandler === 'function') {
            callback = selectorOrHandler;
        }

        // Удаляем из jQuery
        if (selector && callback) {
            // Находим bound-версию обработчика
            const handlerEntry = this._eventHandlers.find(
                h => h.event === event && h.selector === selector && h.handler.name === callback.name
            );

            if (handlerEntry) {
                this.$el.off(event, selector, handlerEntry.handler);
                // Удаляем из массива
                this._eventHandlers = this._eventHandlers.filter(h => h !== handlerEntry);
            }
        } else if (callback) {
            // Без селектора
            const handlerEntry = this._eventHandlers.find(
                h => h.event === event && h.handler.name === callback.name
            );

            if (handlerEntry) {
                this.$el.off(event, handlerEntry.handler);
                this._eventHandlers = this._eventHandlers.filter(h => h !== handlerEntry);
            }
        } else {
            // Удаляем все обработчики для события
            const handlersForEvent = this._eventHandlers.filter(h => h.event === event);

            handlersForEvent.forEach(({ event: evt, selector: sel, handler: hdl }) => {
                if (sel) {
                    this.$el.off(evt, sel, hdl);
                } else {
                    this.$el.off(evt, hdl);
                }
            });

            // Удаляем из массива
            this._eventHandlers = this._eventHandlers.filter(h => h.event !== event);
        }

        return this;
    }

    /**
     * Устанавливает контейнер для компонента
     * @param {Container} container - контейнер
     */
    setContainer(container) {
        this.container = container;
    }

    /**
     * Хук, вызываемый при изменении состояния контейнера
     * @param {*} newState - новое состояние
     */
    onStateChange(newState) {
        // Переопределяется в потомках
    }

    /**
     * Очищает ресурсы компонента
     * Удаляет все обработчики событий
     */
    destroy() {
        // Удаляем все обработчики событий
        this._eventHandlers.forEach(({ event, selector, handler }) => {
            if (selector) {
                this.$el.off(event, selector, handler);
            } else {
                this.$el.off(event, handler);
            }
        });

        // Очищаем массив
        this._eventHandlers = [];

        // Очищаем ссылки
        this.$el = null;
        this.container = null;
    }
}

/**
 * Container
 * 
 * Контейнер для управления состоянием группы компонентов.
 * При изменении состояния уведомляет все компоненты.
 * 
 * @class Container
 */
export class Container {
    constructor() {
        this.state = null;
        this.components = [];
    }

    /**
     * Устанавливает состояние контейнера
     * @param {*} newState - новое состояние
     */
    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        // Уведомляем все компоненты
        this.components.forEach(comp => {
            if (typeof comp.onStateChange === 'function') {
                comp.onStateChange(newState);
            }
        });
    }

    /**
     * Добавляет компонент в контейнер
     * @param {BaseComponent} component - компонент
     */
    addComponent(component) {
        component.setContainer(this);
        this.components.push(component);
    }

    /**
     * Удаляет компонент из контейнера
     * @param {BaseComponent} component - компонент
     */
    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
            component.setContainer(null);
        }
    }

    /**
     * Очищает контейнер
     */
    destroy() {
        this.components.forEach(comp => {
            if (typeof comp.destroy === 'function') {
                comp.destroy();
            }
        });
        this.components = [];
        this.state = null;
    }
}

/**
 * ComponentScanner
 * 
 * Сканер компонентов для автоматической инициализации.
 * Регистрирует компоненты и сканирует DOM при загрузке.
 * 
 * @class ComponentScanner
 */
export class ComponentScanner {
    static components = [];

    /**
     * Регистрирует компонент для автоматической инициализации
     * @param {Class<BaseComponent>} ComponentClass - класс компонента
     */
    static register(ComponentClass) {
        if (!ComponentClass.componentName) {
            console.warn('Component must have static componentName:', ComponentClass);
            return;
        }
        this.components.push(ComponentClass);
    }

    /**
     * Сканирует DOM и инициализирует все компоненты
     * @param {HTMLElement|Document} [root=document] - корневой элемент для сканирования
     * @returns {Array<BaseComponent>} Массив инициализированных компонентов
     */
    static scan(root = document) {
        const instances = [];

        this.components.forEach(ComponentClass => {
            const selector = `[data-component="${ComponentClass.componentName}"]`;
            $(root).find(selector).each((i, el) => {
                try {
                    const instance = new ComponentClass(el);
                    instances.push(instance);
                } catch (e) {
                    console.error(`Failed to initialize component "${ComponentClass.componentName}"`, e);
                }
            });
        });

        return instances;
    }
}