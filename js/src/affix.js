import { defineJQueryPlugin, isVisible, typeCheckConfig } from 'bootstrap/js/src/util';
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

const NAME = 'affix';
const DATA_KEY = 'bs.affix';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';

const Default = {
  offset: 0,
  target: window
};

const DefaultType = {
  offset: 'number',
  target: 'string'
};

const SELECTOR_SPY = '[data-bs-spy="affix"]';

const EVENT_SCROLL = `scroll${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`;
const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;

const CLASS_NAME_AFFIX = 'affix';
const CLASS_NAME_AFFIX_TOP = 'affix-top';
const CLASS_NAME_AFFIX_BOTTOM = 'affix-bottom';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Affix extends BaseComponent {
  constructor(element, config) {
    super(element);

    this.target = SelectorEngine.findOne(config.target);
    this.affixed = null;
    this.unpin = null;
    this.pinnedOffset = null;

    this._config = this._getConfig(config);

    this._addEventListeners();
    this.checkPosition();
  }

  // Getters

  static get DATA_KEY() {
    return DATA_KEY;
  }

  // Public

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
    EventHandler.on(this.target, EVENT_SCROLL, this.checkPosition.bind(this));
    EventHandler.on(this.target, EVENT_CLICK_DATA_API, this.checkPositionWithEventLoop.bind(this));
  }

  // Static

  static affixInterface(element, config) {
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
      data = new Affix(element, _config);
    }
  }

  static jQueryInterface(config) {
    return this.each(function () {
      Affix.affixInterface(this, config);
    });
  }

  static getState(scrollHeight, height, offsetTop, offsetBottom) {
    const { scrollTop, offsetHeight } = this.target;
    const position = {
      top: this._element.offsetTop,
      left: this._element.offsetLeft
    };
    const targetHeight = offsetHeight;

    if (offsetTop !== undefined && this.affixed === 'top') {
      return scrollTop < offsetTop ? 'top' : false;
    }

    if (this.affixed === 'bottom') {
      if (offsetTop !== undefined) {
        return (scrollTop + this.unpin <= position.top) ? false : 'bottom';
      }

      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom';
    }

    const initializing = this.affixed === undefined;
    const colliderTop = initializing ? scrollTop : position.top;
    const colliderHeight = initializing ? targetHeight : height;

    if (offsetTop !== undefined && scrollTop <= offsetTop) {
      return 'top';
    }

    if (offsetBottom !== undefined && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) {
      return 'bottom';
    }

    return false;
  }

  static getPinnedOffset() {
    if (this.pinnedOffset) {
      return this.pinnedOffset;
    }

    this._element.classList.remove(CLASS_NAME_AFFIX_TOP, CLASS_NAME_AFFIX_BOTTOM);
    this._element.classList.add(CLASS_NAME_AFFIX);

    const { scrollTop } = this.target;
    const position = {
      top: this._element.offsetTop,
      left: this._element.offsetLeft
    };

    this.pinnedOffset = position.top - scrollTop;

    return this.pinnedOffset;
  }

  static checkPositionWithEventLoop() {
    setTimeout(this.checkPosition.bind(this), 1);
  }

  static checkPosition() {
    if (!isVisible(this._element)) {
      return;
    }

    const height = this._element.offsetHeight;
    const { offset } = this._config;
    let offsetTop = offset.top;
    let offsetBottom = offset.bottom;
    const scrollHeight = Math.max(document.offsetHeight, document.body.offsetHeight);

    if (typeof offset !== 'object') {
      offsetTop = offset;
      offsetBottom = offset;
    }

    if (typeof offsetTop === 'function') {
      offsetTop = offset.top(this._element);
    }

    if (typeof offsetBottom === 'function') {
      offsetBottom = offset.bottom(this._element);
    }

    const affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);

    if (this.affixed !== affix) {
      if (this.unpin !== undefined) {
        this._element.style.top = '';
      }

      const affixType = 'affix' + (affix ? '-' + affix : '');

      EventHandler.trigger(this._element, `${affixType}${EVENT_KEY}`);

      // Is default prevented? Return

      this.affixed = affix;
      this.unpin = affix === 'bottom' ? this.getPinnedOffset() : null;

      this._element.classList.remove(CLASS_NAME_AFFIX, CLASS_NAME_AFFIX_TOP, CLASS_NAME_AFFIX_BOTTOM);
      this._element.classList.add(affixType);
      EventHandler.trigger(this._element, `${affixType.replace('affix', 'affixed')}${EVENT_KEY}`);
    }

    if (affix === 'bottom') {
      this._element.style.top = scrollHeight - height - offsetBottom;
    }
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  const affixes = SelectorEngine.find(SELECTOR_SPY);

  for (let i = 0, len = affixes.length; i < len; i++) {
    Affix.carouselInterface(affixes[i], Data.get(affixes[i], DATA_KEY));
  }
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Affix to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, Affix);

export default Affix;
