import { defineJQueryPlugin, typeCheckConfig } from 'bootstrap/js/src/util';
import Data from 'bootstrap/js/src/dom/data';
import EventHandler from 'bootstrap/js/src/dom/event-handler';
import Manipulator from 'bootstrap/js/src/dom/manipulator';
import SelectorEngine from 'bootstrap/js/src/dom/selector-engine';
import BaseComponent from 'bootstrap/js/src/base-component';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'enter';
const DATA_KEY = 'bs.enter';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';

const Default = {
  easing: 'cubic-bezier(.2, .7, .5, 1)',
  duration: 1200,
  delay: 0
};

const DefaultType = {
  easing: 'string',
  duration: 'number',
  delay: 'number'
}

const EVENT_SCROLL = `scroll${EVENT_KEY}`;
const EVENT_ENTER = `enter${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`

const SELECTOR_DATA_TRANSITION = '[data-bs-transition="entrance"]';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Enter extends BaseComponent {
  constructor(element, config) {
    super(element);

    this._handler = null;

    this._config = this._getConfig(config);

    this._addEventListeners();
  }

  // Getters

  static get Default() {
    return Default;
  }

  static get DATA_KEY() {
    return DATA_KEY
  }

  // Public

  dispose() {
    this._element = null;
    this._config = null;
    this._handler = null;

    super.dispose();
  }

  // Private

  _getConfig(config) {
    config = {
      ...Default,
      ...config
    };

    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _addEventListeners() {
    const boundScrollHandler = this._checkForEnter.bind(this);

    this._handler = () => {
      window.requestAnimationFrame(boundScrollHandler);
    };

    EventHandler.on(window, EVENT_SCROLL, this._handler);
    this._checkForEnter();
  }

  _removeEventListeners() {
    EventHandler.off(window, EVENT_SCROLL, this._handler);
  }

  _checkForEnter() {
    const windowHeight = window.innerHeight;
    const rect = this._element.getBoundingClientRect();

    if ((windowHeight - rect.top) >= 0) {
      setTimeout(this._triggerEntrance.bind(this), this._config.delay);
    }
  }

  _triggerEntrance() {
    this._removeEventListeners();
    this._element.style.transition = `transform ${this._config.duration}ms ${this._config.easing}`;
    this._element.style.transform = 'none';
    this._element.style['-webkit-transition'] = `-webkit-${this._element.style.transition}`;
    this._element.style['-webkit-transform'] = this._element.style.transform;
    this._element.style['-ms-transition'] = `-ms-${this._element.style.transition}`;
    this._element.style['-ms-transform'] = this._element.style.transform;
    EventHandler.trigger(this._element, EVENT_ENTER);
  }

  // Static

  static enterInterface(element, config) {
    let data = Data.get(element, DATA_KEY)
    let _config = {
      ...Default,
      ...Manipulator.getDataAttributes(element)
    }

    if (typeof config === 'object') {
      _config = {
        ..._config,
        ...config
      }
    }

    if (!data) {
      data = new Enter(element, _config);
    }

    if (typeof config === 'string') {
      data[config]();
    }
  }

  static jQueryInterface(config) {
    return this.each(() => {
      Enter.enterInterface(this, config);
    });
  }

}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  const enters = SelectorEngine.find(SELECTOR_DATA_TRANSITION);

  for (let i = 0, len = carousels.length; i < len; i++) {
    Carousel.carouselInterface(enters[i], Data.get(enters[i], DATA_KEY))
  }
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Enter to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, Enter);

export default Enter;
