/**
Modia Core — Базовые классы
Версия: 1.2.0
Дата: 2026-02-19
⚠️ jQuery доступен глобально через CDN (не импортировать)
*/
import { logger } from './services/logger.js';

// ============================================================================
// BaseComponent
// ============================================================================
export class BaseComponent {
  static get componentName() {
    return 'base'; // Переопределяется в потомках
  }

  constructor(element) {
    if (!element) {
      throw new Error('[BaseComponent] Element is required');
    }
    this.$el = $(element);
    this.container = null;

    // extractConfig() с конвертацией типов
    this.config = this.extractConfig();

    // Массив обработчиков событий для отладки (не для очистки)
    this._eventHandlers = [];

    // Хранение ссылки на компонент через jQuery Data API
    this.$el.data('modia-component', this);

    // Регистрация в глобальном реестре
    ComponentScanner.registerInstance(this);

    logger.info(`Компонент создан: ${this.constructor.name}`, this.constructor.name);
  }

  /**
   * Извлекает конфигурацию из атрибутов data-component-*
   * @returns {Object} Конфигурация компонента
   */
  extractConfig() {
    const config = {};
    const prefix = `data-${this.constructor.componentName}-`;
    const el = this.$el[0];
    if (!el || typeof el.getAttributeNames !== 'function') {
      return config;
    }

    el.getAttributeNames().forEach(attr => {
      if (attr.startsWith(prefix)) {
        const key = attr.substring(prefix.length).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        let value = this.$el.attr(attr);

        // ✅ Конвертация типов
        if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        } else if (/^-?\d+$/.test(value)) {
          value = parseInt(value, 10);
        }

        config[key] = value;
      }
    });

    return config;
  }

  /**
   * Регистрирует обработчик события с автоматическим биндингом this
   * @param {string} event - имя события
   * @param {string|Function} selectorOrHandler - селектор ИЛИ обработчик
   * @param {Function} [handler] - обработчик (если указан селектор)
   * @returns {BaseComponent} this для цепочки вызовов
   */
  _on(event, selectorOrHandler, handler) {
    let selector = null;
    let callback = null;
    if (typeof selectorOrHandler === 'string') {
      selector = selectorOrHandler;
      callback = handler;
    } else {
      callback = selectorOrHandler;
    }

    const boundHandler = callback.bind(this);

    // ✅ Добавляем .modia namespace для всех событий
    if (selector) {
      this.$el.on(`${event}.modia`, selector, boundHandler);
      this._eventHandlers.push({ event: `${event}.modia`, selector, handler: boundHandler });
    } else {
      this.$el.on(`${event}.modia`, boundHandler);
      this._eventHandlers.push({ event: `${event}.modia`, handler: boundHandler });
    }

    return this;
  }

  /**
   * Удаляет обработчик события
   * ⚠️ Упрощено: использует .modia namespace для массовой очистки
   * @param {string} [event] - имя события (опционально, для отладки)
   * @returns {BaseComponent} this для цепочки вызовов
   */
  _off(event) {
    // ✅ Используем namespace для очистки всех .modia событий
    this.$el.off('.modia');
    this._eventHandlers = [];
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
    logger.info(`Компонент уничтожается: ${this.constructor.name}`, this.constructor.name);

    // ✅ Очищаем все обработчики с .modia namespace
    this.$el.off('.modia');
    this._eventHandlers = [];

    // Очистка данных
    this.$el.removeData('modia-component');

    // Удаление из глобального реестра
    ComponentScanner.unregisterInstance(this);

    // Удаление из контейнера
    if (this.container) {
      this.container.removeComponent(this);
    }

    // ✅ Событие о уничтожении компонента
    this.$el.trigger('modia:component-destroyed', { component: this });

    // Очистка ссылок
    this.$el = null;
    this.container = null;

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
    // Проверка на рекурсию
    if (this._isSettingState) return;
    this._isSettingState = true;
    this.state = { ...this.state, ...newState };

    this.components.forEach(comp => {
      if (typeof comp.onStateChange === 'function') {
        comp.onStateChange(this.state);
      }
    });

    this._isSettingState = false;
  }

  addComponent(component) {
    component.setContainer(this);
    this.components.push(component);
  }

  removeComponent(component) {
    const index = this.components.indexOf(component);
    if (index > -1) {
      this.components.splice(index, 1);
      component.setContainer(null);
    }
  }

  destroy() {
    this.components.forEach(comp => {
      if (typeof comp.destroy === 'function') {
        comp.destroy();
      }
    });
    this.components = [];
    this.state = {};
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

    // ✅ Добавляем try/catch для защиты от ошибок одного компонента
    try {
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

          // ✅ Кастомное событие для каждого компонента
          $(el).trigger('modia:component-created', { component: instance });
        });
      });
    } catch (error) {
      logger.error(`Ошибка сканирования: ${error.message}`, 'ComponentScanner');
    }

    // ✅ Кастомное событие после сканирования
    $(root).trigger('modia:scanned', { instances, root });

    return instances;
  }
}