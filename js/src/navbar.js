import { typeCheckConfig } from 'bootstrap/js/src/util';
import Data from 'bootstrap/js/src/dom/data';
import EventHandler from 'bootstrap/js/src/dom/event-handler';
import Manipulator from 'bootstrap/js/src/dom/manipulator';
import SelectorEngine from 'bootstrap/js/src/dom/selector-engine';
import BaseComponent from 'bootstrap/js/src/base-component';
import Collapse from 'bootstrap/js/src/collapse';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'navbar';
const DATA_KEY = 'bs.navbar';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';

const COLLAPSE_DATA_KEY = Collapse.DATA_KEY;
const COLLAPSE_EVENT_KEY = `.${COLLAPSE_DATA_KEY}`;

const Default = {
  scrollTop: false
};

const DefaultType = {
  scrollTop: 'boolean'
};

const EVENT_OPEN = `open${EVENT_KEY}`;
const EVENT_OPENED = `opened${EVENT_KEY}`;
const EVENT_CLOSE = `close${EVENT_KEY}`;
const EVENT_CLOSED = `closed${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`

const COLAPSE_EVENT_SHOW = `show${COLLAPSE_EVENT_KEY}`;
const COLLAPSE_EVENT_SHOWN = `shown${COLLAPSE_EVENT_KEY}`;
const COLAPSE_EVENT_HIDE = `hide${COLLAPSE_EVENT_KEY}`;
const COLAPSE_EVENT_HIDDEN = `hidden${COLLAPSE_EVENT_KEY}`;

const CLASS_NAME_OPENING = 'opening';
const CLASS_NAME_OPEN = 'open';
const CLASS_NAME_CLOSING = 'closing';

const SELECTOR_NAVBAR = '.navbar';
const SELECTOR_NAVBAR_COLLAPSE = '.navbar-collapse';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class Navbar extends BaseComponent {
  constructor(element, config) {
    super(element);

    this._html = document.documentElement;
    this._collapseNavbarElement = SelectorEngine.find(SELECTOR_NAVBAR_COLLAPSE, this._element);
    this._config = this._getConfig(config);

    this._addEventListeners();

    console.info('Successfully constructed navbar.');
    console.debug(this._config);
    console.debug(this._element);
  }

  // Getters

  static get Default() {
    return Default;
  }

  static get DATA_KEY() {
    return DATA_KEY
  }

  // Public

  open() {
    Collapse.collapseInterface(this._collapseNavbarElement, 'show');
  }

  close() {
    Collapse.collapseInterface(this._collapseNavbarElement, 'hide');
  }

  // Private

  _getConfig(config) {
    config = {
      ...Default,
      ...config
    };

    config.scrollTop = Boolean(config.scrollTop);
    typeCheckConfig(NAME, config, DefaultType);

    return config;
  }

  _addEventListeners() {
    EventHandler.on(this._collapseNavbarElement, COLLAPSE_EVENT_SHOW, this._onShowNavbarCollapse.bind(this));
    EventHandler.on(this._collapseNavbarElement, COLLAPSE_EVENT_SHOWN, this._onShownNavbarCollapse.bind(this));
    EventHandler.on(this._collapseNavbarElement, COLLAPSE_EVENT_HIDE, this._onHideNavbarCollapse.bind(this));
    EventHandler.on(this._collapseNavbarElement, COLLAPSE_EVENT_HIDDEN, this._onHiddenNavbarCollapse.bind(this));
  }

  _onShowNavbarCollapse() {
    if (this._config.scrollTop) {
      this._html.scrollTop(Math.ceil(this._element.offsetTop));
    }

    EventHandler.trigger(this._element, EVENT_OPEN);
    this._element.classList.add(CLASS_NAME_OPENING);
  }

  _onShownNavbarCollapse() {
    this.element.classList.add(CLASS_NAME_OPEN);
    this.element.classList.remove(CLASS_NAME_OPENING);
    EventHandler.trigger(this._element, EVENT_OPENED);
  }

  _onHideNavbarCollapse() {
    EventHandler.trigger(this._element, EVENT_CLOSE);
    this._element.classList.add(CLASS_NAME_CLOSING);
    this._element.classList.remove(CLASS_NAME_OPEN);
  }

  _onHiddenNavbarCollapse() {
    this._element.classList.remove(CLASS_NAME_CLOSING);
    EventHandler.trigger(EVENT_CLOSED);
  }

  // Static

  static navbarInterface(element, config) {
    let data = Data.get(element, DATA_KEY)
    let _config = {
      ...Default,
      ...Manipulator.getDataAttributes(element)
    };

    if (typeof config === 'object') {
      _config = {
        ..._config,
        ...config
      }
    }

    if (!data) {
      data = new Navbar(element, _config);
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
      Navbar.navbarInterface(this, config);
    });
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  const navbars = SelectorEngine.find(SELECTOR_NAVBAR);

  for (let i = 0, len = navbars.length; i < len; i++) {
    Navbar.navbarInterface(navbars[i], Data.get(navbars[i], DATA_KEY))
  }
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

export default Navbar;
