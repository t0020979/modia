// Modia Core: базовые классы

export class BaseComponent {
    static componentName = null;
    static attributePrefix = 'component';

    constructor(element) {
        this.$el = $(element);
        this.container = null;
        this.config = this.extractConfig();
    }

    extractConfig() {
        const config = {};
        const prefix = `data-${this.constructor.attributePrefix}-`;
        const el = this.$el[0];
        if (!el || !el.getAttributeNames) return config;

        el.getAttributeNames().forEach(attr => {
            if (attr.startsWith(prefix)) {
                const key = attr.substring(prefix.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                let value = this.$el.attr(attr);
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^\d+$/.test(value)) value = parseInt(value, 10);
                config[key] = value;
            }
        });
        return config;
    }

    setContainer(container) {
        this.container = container;
    }

    onStateChange(newState) {
        // Переопределяется в потомках
    }
}

export class Container {
    constructor() {
        this.state = null;
        this.components = [];
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.components.forEach(comp => {
            if (typeof comp.onStateChange === 'function') {
                comp.onStateChange(newState);
            }
        });
    }

    addComponent(component) {
        component.setContainer(this);
        this.components.push(component);
    }
}

export class ComponentScanner {
    static components = [];

    static register(ComponentClass) {
        if (!ComponentClass.componentName) {
            console.warn('Component must have static componentName:', ComponentClass);
            return;
        }
        this.components.push(ComponentClass);
    }

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