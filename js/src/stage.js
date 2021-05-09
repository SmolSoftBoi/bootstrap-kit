import { defineJQueryPlugin, getElementFromSelector, typeCheckConfig } from 'bootstrap/js/src/util';
import Data from 'bootstrap/js/src/dom/data';
import EventHandler from 'bootstrap/js/src/dom/event-handler';
import Manipulator from 'bootstrap/js/src/dom/manipulator';
import BaseComponent from 'bootstrap/js/src/base-component';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'stage';
const DATA_KEY = 'bs.stage';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';

const TRANSITION_END = 'transitionend';

const Default = {
  easing: 'cubic-bezier(.2, .7, .5, 1)',
  duration: 300,
  delay: 0,
  distance: 250,
  hiddenElements: '#sidebar'
};

const DefaultType = {
  easing: 'string',
  duration: 'number',
  delay: 'number',
  distance: 'number',
  hiddenElements: 'string'
};

const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY}`;
const EVENT_KEYDOWN = `keydown${EVENT_KEY}`;
const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_OPENED = `opened${EVENT_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_CLOSED = `closed${EVENT_KEY}`;
const EVENT_CLICK = `click${EVENT_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;

const CLASS_NAME_STAGE_OPEN = 'stage-open';
const CLASS_NAME_HIDDEN = 'hidden';

const SELECTOR_TOGGLE = '[data-toggle="stage"]';

/**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

class Stage extends BaseComponent {
  constructor(element, config) {
    super(element);

    this._config = this._getConfig(config);
  }

  // Getters

  static get Default() {
    return Default;
  }

  static get DATA_KEY() {
    return DATA_KEY;
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

  _isOpen() {
    return this._element.classList.contains(CLASS_NAME_STAGE_OPEN);
  }

  _complete() {
    document.body.style.overflow = 'auto';

    if ('ontouchstart' in document.documentElement) {
      EventHandler.off(document, EVENT_TOUCHMOVE);
    }

    this._config.hiddenElements.classList.add(CLASS_NAME_HIDDEN);

    this._element.classList.remove(CLASS_NAME_STAGE_OPEN);
    this._element.style.transition = '';
    this._element.style.transform = '';
    this._element.style['-webkit-transition'] = this._element.style.transition;
    this._element.style['-webkit-transform'] = this._element.style.transform;
    this._element.style['-ms-transition'] = this._element.style.transition;
    this._element.style['-ms-transform'] = this._element.style.transform;
    EventHandler.trigger(this._element, EVENT_CLOSED);
  }

  // Public

  toggle() {
    if (this._isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    document.body.style.overflow = 'hidden';

    if ('ontouchstart' in document.documentElement) {
      EventHandler.on(document, EVENT_TOUCHMOVE, event => {
        event.preventDefault();
      });
    }

    this._config.hiddenElements.classList.remove(CLASS_NAME_HIDDEN);

    EventHandler.one(window, EVENT_KEYDOWN, event => {
      event.which = 27 && this.close();
    });

    EventHandler.on(this._element, EVENT_CLICK, this.close.bind(this));
    EventHandler.trigger(this._element, EVENT_OPEN);

    this._element.classList.add(CLASS_NAME_STAGE_OPEN);

    this._element.style.transition = `transform ${this._config.duration}ms ${this._config.easing}`;
    this._element.style['-webkit-transition'] = `-webkit-${this._element.style.transition}`;
    this._element.style['-ms-transition'] = `-ms-${this._element.style.transition}`;

    // eslint-disable-next-line no-unused-expressions
    this._element.scrollWidth; // Force reflow

    this._element.style.transform = `translateX(${this._config.distance}px)`;
    this._element.style['-webkit-transform'] = `-webkit-${this._element.style.transform}`;
    this._element.style['-ms-transform'] = `-ms-${this._element.style.transform}`;

    EventHandler.one(this._element, TRANSITION_END, () => {
      EventHandler.trigger(this._element, EVENT_OPENED);
    });
    EventHandler.emulateTransitionEnd(this._element, this._config.duration);
  }

  close() {
    EventHandler.off(window, EVENT_KEYDOWN);

    EventHandler.trigger(this._element, EVENT_CLOSE);
    EventHandler.off(this._element, EVENT_CLICK);

    this._element.style.transform = 'none';
    this._element.style['-webkit-transform'] = this._element.style.transform;
    this._element.style['-ms-transform'] = this._element.style.transform;

    EventHandler.one(this._element, TRANSITION_END, this._complete.bind(this));
    EventHandler.emulateTransitionEnd(this._element, this._config.duration);
  }

  // Static

  static stageInterface(element, config) {
    let data = Data.get(element, DATA_KEY);
    let _config = {
      ...Default,
      ...Manipulator.getDataAttributes(element)
    };

    if (typeof config === 'object') {
      _config = {
        ..._config,
        ...config
      };
    }

    if (!data) {
      data = new Stage(element, _config);
    }

    if (typeof config === 'string') {
      if (typeof data[config] === 'undefined') {
        throw new TypeError(`No method named "${config}"`);
      }

      data[config]();
    }
  }

  static jQueryInterface(config) {
    return this.each(function () {
      Stage.stageInterface(this, config);
    });
  }

  static dataApiClickHandler() {
    const target = getElementFromSelector(this);

    if (!target) {
      return;
    }

    Stage.stageInterface(target, 'toggle');
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_TOGGLE, Stage.dataApiClickHandler);

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Carousel to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, Stage);

export default Stage;
