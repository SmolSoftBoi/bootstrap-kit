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

const NAME = 'imageGrid';
const DATA_KEY = 'bs.image-grid';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';

const Default = {
  padding: 10,
  targetHeight: 300,
  display: 'inline-block'
};

const DefaultType = {
  padding: 'number',
  targetHeight: 'number',
  display: 'string'
};

const EVENT_RESIZE = `resize${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`;

const SELECTOR_GRID = '[data-bs-grid="images"]';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ImageGrid extends BaseComponent {
  constructor(element, config) {
    super(element);

    this._cleanWhitespace(element);

    this._row = 0;
    this._rownum = 1;
    this._elements = [];
    this._albumWidth = element.scrollWidth;
    this._images = SelectorEngine.children(element);

    this._config = this._getConfig(config);

    this._addEventListeners();

    this._processImages();
  }

  // Getters

  static get Default() {
    return Default;
  }

  static get DATA_KEY() {
    return DATA_KEY;
  }

  // Public

  dispose() {
    EventHandler.off(window, EVENT_KEY);

    this._row = null;
    this._rownum = null;
    this._elements = null;
    this._albumWidth = null;
    this._images = null;
    this._config = null;

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

  _handleResize() {
    this._row = 0;
    this._rownum = 1;
    this._elements = [];
    this._albumWidth = this._element.scrollWidth;
    this._images = SelectorEngine.children();

    this._processImages();
  }

  _addEventListeners() {
    EventHandler.on(window, EVENT_RESIZE, this._handleResize.bind(this));
  }

  _processImages() {
    this._images.each(index => {
      const img = this.tagName === 'IMG' ? this : SelectorEngine.find('img', this);

      const w = typeof img.dataset.width === 'undefined' ?
        img.scrollWidth : img.dataset.width;

      const h = typeof img.dataset.height === 'undefined' ?
        img.scrollHeight : img.dataset.height;

      img.dataset.width = w;
      img.dataset.height = h;

      const idealW = Math.ceil(w / h * this._config.targetHeight);
      const idealH = Math.ceil(this._config.targetHeight);

      this._elements.push([this, idealW, idealH]);

      this._row += idealW + this._config.padding;

      if (this._row > this._albumWidth && this._elements.length > 0) {
        this._resizeRow(this._row - this._config.padding);

        this._row = 0;
        this._elements = [];
        this._rownum += 1;
      }

      if (this._images.length - 1 === index && this._elements.length > 0) {
        this._resizeRow(this._row);

        this._row = 0;
        this._elements = [];
        this._rownum += 1;
      }
    });
  }

  _resizeRow(row) {
    const imageExtras = (this._config.padding * (this._elements.length - 1));
    const albumWidthAdjusted = this._albumWidth - imageExtras;
    const overPercent = albumWidthAdjusted / (row - imageExtras);
    let trackWidth = imageExtras;

    for (let i = 0; i < this._elements.length; i++) {
      const obj = this._elements[i][0];
      let fw = Math.floor(this._elements[i][1] * overPercent);
      const fh = Math.floor(this._elements[i][2] * overPercent);
      const isNotLast = i < (this._elements.length - 1);

      trackWidth += fw;

      if (!isNotLast && trackWidth < this._albumWidth) {
        fw += (this._albumWidth - trackWidth);
      }

      fw--;

      const img = obj.tagName === 'IMG' ? obj : SelectorEngine.find('img', obj);

      img.style.width = fw;
      img.style.height = fh;

      this._applyModifications(obj, isNotLast);
    }
  }

  _applyModifications(obj, isNotLast) {
    const css = {
      marginBottom: this._config.padding + 'px',
      marginRight: (isNotLast) ? this._config.padding + 'px' : 0,
      display: this._config.display,
      verticalAlign: 'bottom'
    };

    obj.style.marginBottom = css.marginBottom;
    obj.style.marginRight = css.marginRight;
    obj.display = css.display;
    obj.verticalAlign = css.verticalAlign;
  }

  _cleanWhitespace(element) {
    [...element].filter(() => {
      return (this.nodeType === 3 && !/\S/.test(this.nodeValue));
    }).remove();
  }

  // Static

  static imageGridInterface(element, config) {
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
      data = new ImageGrid(element, _config);
    }

    if (typeof config === 'string') {
      if (typeof data[config] === 'undefined') {
        throw new TypeError(`No method named "${config}"`);
      }

      data[config]();
    }
  }

  static jQueryInterface(config) {
    return this.each(() => {
      ImageGrid.imageGridInterface(this, config);
    });
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  const imageGrids = SelectorEngine.find(SELECTOR_GRID);

  for (let i = 0, len = imageGrids.length; i < len; i++) {
    ImageGrid.carouselInterface(imageGrids[i], Data.get(imageGrids[i], DATA_KEY));
  }
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .ImageGrid to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, ImageGrid);

export default ImageGrid;
