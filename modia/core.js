/**
 * Modia Core — Базовые классы
 * Версия: 1.2.0
 * Дата: 2026-02-17
 * 
 * ⚠️ jQuery доступен глобально через CDN (не импортировать)
 */

import { logger } from './services/logger.js';

// ============================================================================
// BaseComponent
// ============================================================================

export class BaseComponent {
  constructor(element) {
    this.$el = $(element);
    this.config = this._parseConfig();

    // Хранение ссылки на компонент через jQuery Data API
    this.$el.data('modia-component', this);

    // Регистрация в глобальном реестре
    ComponentScanner.registerInstance(this);

    logger.info(`Компонент создан: ${this.constructor.name}`, this.constructor.name);
  }

  /**
   * Парсинг конфигурации из data-атрибутов
   */
  _parseConfig() {
    const config = {};
    const prefix = `data-${this.constructor.componentName}-`;

    Array.from(this.$el[0].attributes).forEach(attr => {
      if (attr.name.startsWith(prefix)) {
        const key = attr.name.replace(prefix, '');
        config[key] = attr.value === '' ? true : attr.value;
      }
    });

    return config;
  }

  /**
   * Получить компонент из элемента
   * @param {HTMLElement} element 
   * @returns {BaseComponent|undefined}
   */
  static fromElement(element) {
    return $(element).data('modia-component');
  }

  /**
   * Уничтожение компонента
   */
  destroy() {
    // Очистка обработчиков с пространством .modia
    this.$el.off('.modia');
    // Очистка данных
    this.$el.removeData('modia-component');
    // Удаление из глобального реестра
    ComponentScanner.unregisterInstance(this);

    logger.info(`Компонент уничтожен: ${this.constructor.name}`, this.constructor.name);
  }
}

// ============================================================================
// Container
// ============================================================================

export class Container {
  constructor() {
    this.state = {};
    this.components = [];
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.components.forEach(comp => {
      if (comp.onStateChange) {
        comp.onStateChange(this.state);
      }
    });
  }

  addComponent(component) {
    this.components.push(component);
  }
}

export const container = new Container();

// ============================================================================
// ComponentScanner
// ============================================================================

export class ComponentScanner {
  static components = {}; // Зарегистрированные классы
  static instances = [];  // Глобальный реестр экземпляров (для отладки)

  static register(ComponentClass) {
    const name = ComponentClass.componentName;
    this.components[name] = ComponentClass;
    logger.info(`Компонент зарегистрирован: ${name}`, 'ComponentScanner');
  }

  static registerInstance(instance) {
    this.instances.push(instance);
  }

  static unregisterInstance(instance) {
    const index = this.instances.indexOf(instance);
    if (index > -1) {
      this.instances.splice(index, 1);
    }
  }

  static scan(root = document) {
    const instances = [];

    Object.entries(this.components).forEach(([name, ComponentClass]) => {
      const selector = `[data-component="${name}"]`;
      $(root).find(selector).addBack(selector).each((i, el) => {
        // Проверка: уже инициализирован ли этот элемент?
        if ($(el).data('modia-component')) {
          logger.warn(`Компонент уже инициализирован: ${name}`, 'ComponentScanner');
          return;
        }

        const instance = new ComponentClass(el);
        instances.push(instance);
        container.addComponent(instance);

        // Кастомное событие для каждого компонента
        $(el).trigger('modia:component-created', { component: instance });
      });
    });

    return instances;
  }
}