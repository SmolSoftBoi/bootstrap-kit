import EventHandler from 'bootstrap/js/src/dom/event-handler';
import BaseComponent from 'bootstrap/js/src/base-component';
import { defineJQueryPlugin } from 'bootstrap/js/src/util';

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'zoom';
const DATA_KEY = 'bs.zoom';
const EVENT_KEY = `.${DATA_KEY}`;
const DATA_API_KEY = '.data-api';

const TRANSITION_END = 'transitionend';
const ZOOM_OFFSET = 80;

const EVENT_CLICK = `click${EVENT_KEY}`;
const EVENT_SCROLL = `scroll${EVENT_KEY}`;
const EVENT_KEYUP = `keyup${EVENT_KEY}`;
const EVENT_TOUCHSTART = `touchstart${EVENT_KEY}`;
const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY}`;
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`;

const CLASS_NAME_ZOOM_OVERLAY_OPEN = 'zoom-overlay-open';
const CLASS_NAME_ZOOM_OVERLAY_TRANSITIONING = 'zoom-overlay-transitioning';
const CLASS_NAME_ZOOM_OVERLAY = 'zoom-overlay';
const CLASS_NAME_ZOOM_IMG_WRAP = 'zoom-img-wrap';
const CLASS_NAME_ZOOM_IMG = 'zoom-img';

const SELECTOR_ACTION = '[data-action="zoom"]';

const DATA_ZOOM = 'zoom';
const DATA_ZOOM_OUT = 'zoom-out';

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ZoomService extends BaseComponent {
  constructor(element) {
    super(element);

    this._activeZoom = null;
    this._initialScrollPosition = null;
    this._initialTouchPosition = null;
    this._touchMoveListener = null;

    this._document = document;
    this._window = window;
    this._body = document.body;

    this._boundClick = this._clickHandler.bind(this);
  }

  // Getters

  static get DATA_KEY() {
    return DATA_KEY;
  }

  // Private

  _zoom(event) {
    const { target, ctrlKey, metaKey, bubbles } = event;

    if (!target || target.tagName !== 'IMG') {
      return;
    }

    if (this._body.classList.contains(CLASS_NAME_ZOOM_OVERLAY_OPEN)) {
      return;
    }

    if (metaKey || ctrlKey) {
      return window.open((target.getAttribute('data-original') || target.src), '_blank');
    }

    if (target.width >= (window.scrollWidth() - ZOOM_OFFSET)) {
      return;
    }

    this._activeZoomClose(true);

    this._activeZoom = new Zoom(target);
    this._activeZoom.zoomImage();

    // Todo: Probably worth throttling this
    EventHandler.on(this._window, EVENT_SCROLL, this._scrollHandler.bind(this));

    EventHandler.on(this._document, EVENT_KEYUP, this._keyHandler.bind(this));
    EventHandler.on(this._document, EVENT_TOUCHSTART, this._touchStart.bind(this));

    // We use a capturing phase here to prevent unintended js events
    if (document.addEventListener) {
      document.addEventListener('click', this._boundClick, true);
    } else {
      document.attachEvent('onclick', this._boundClick, true);
    }

    if ('bubbles' in event) {
      if (bubbles) {
        event.stopPropagation();
      }
    } else {
      // Internet Explorer before version 9
      event.cancelBubble = true;
    }
  }

  _activeZoomClose(forceDispose) {
    if (!this._activeZoom) {
      return;
    }

    if (forceDispose) {
      this._activeZoom.dispose();
    } else {
      this._activeZoom.close();
    }

    EventHandler.off(this._window, EVENT_KEY);
    EventHandler.off(this._window, EVENT_KEY);

    document.removeEventListener('click', this._boundClick, true);

    this._activeZoom = null;
  }

  _scrollHandler() {
    if (this._initialScrollPosition === null) {
      this._initialScrollPosition = window.scrollTop;
    }

    const deltaY = this._initialScrollPosition - window.scrollTop;
    if (Math.abs(deltaY) >= 40) {
      this._activeZoomClose();
    }
  }

  _keyHandler(event) {
    if (event.keyCode === 27) {
      this._activeZoomClose();
    }
  }

  _clickHandler(event) {
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }

    if ('bubbles' in event) {
      if (event.bubbles) {
        event.stopPropagation();
      }
    } else {
      // Internet Explorer before version 9
      event.cancelBubble = true;
    }

    this._activeZoomClose();
  }

  _touchStart(event) {
    this._initialTouchPosition = event.touches[0].pageY;
    EventHandler.on(event.target, EVENT_TOUCHMOVE, this._touchMove.bind(this));
  }

  _touchMove(event) {
    if (Math.abs(event.touches[0].pageY - this._initialTouchPosition) > 10) {
      this._activeZoomClose();
      EventHandler.off(event.target, EVENT_TOUCHMOVE);
    }
  }

  listen() {
    EventHandler.on(this._body, EVENT_CLICK, SELECTOR_ACTION, this._zoom.bind(this));
  }
}

class Zoom {
  constructor(element) {
    this._fullHeight = null;
    this._fullWidth = null;
    this._overlay = null;
    this._targetImageWrap = null;

    this._targetImage = element;

    this._body = document.body;
  }

  // Public

  zoomImage() {
    const img = document.createElement('img');

    img.addEventListener('load', () => {
      this._fullHeight = Number(img.height);
      this._fullWidth = Number(img.width);
      this._zoomOriginal();
    });

    img.src = this._targetImage.src;
  }

  _zoomOriginal() {
    this._targetImageWrap = document.createElement('div');
    this._targetImageWrap.className = CLASS_NAME_ZOOM_IMG_WRAP;

    this._targetImage.parentNode.insertBefore(this._targetImageWrap, this._targetImage);
    this._targetImageWrap.append(this._targetImage);

    this._targetImage.classList.add(CLASS_NAME_ZOOM_IMG);
    this._targetImage.dataset.Action = DATA_ZOOM_OUT;

    this._overlay = document.createElement('div');
    this._overlay.className = CLASS_NAME_ZOOM_OVERLAY;

    document.body.append(this._overlay);

    this._calculateZoom();
    this._triggerAnimation();
  }

  _calculateZoom() {
    // eslint-disable-next-line no-unused-expressions
    this._targetImage.scrollWidth; // Repaint before animating

    const originalFullImageWidth = this._fullWidth;
    const originalFullImageHeight = this._fullHeight;

    const maxScaleFactor = originalFullImageWidth / this._targetImage.width;

    const viewportHeight = (window.scrollHeight - ZOOM_OFFSET);
    const viewportWidth = (window.scrollWidth - ZOOM_OFFSET);

    const imageAspectRatio = originalFullImageWidth / originalFullImageHeight;
    const viewportAspectRatio = viewportWidth / viewportHeight;

    if (originalFullImageWidth < viewportWidth && originalFullImageHeight < viewportHeight) {
      this._imgScaleFactor = maxScaleFactor;
    } else if (imageAspectRatio < viewportAspectRatio) {
      this._imgScaleFactor = (viewportHeight / originalFullImageHeight) * maxScaleFactor;
    } else {
      this._imgScaleFactor = (viewportWidth / originalFullImageWidth) * maxScaleFactor;
    }
  }

  _triggerAnimation() {
    // eslint-disable-next-line no-unused-expressions
    this._targetImage.scrollWidth; // Repaint before animating

    const imageOffset = {
      top: this._targetImage.offsetTop,
      left: this._targetImage.offsetLeft
    };
    const { scrollTop, scrollHeight, scrollWidth } = window;

    const viewportY = scrollTop + (scrollHeight / 2);
    const viewportX = (scrollWidth / 2);

    const imageCenterY = imageOffset.top + (this._targetImage.height / 2);
    const imageCenterX = imageOffset.left + (this._targetImage.width / 2);

    this._translateY = viewportY - imageCenterY;
    this._translateX = viewportX - imageCenterX;

    const targetTransform = `scale(${this._imgScaleFactor})`;
    const imageWrapTransform = `translate(${this._translateX}px, ${this._translateY}px)`;

    this._targetImage.style.transform = targetTransform;
    this._targetImage.style['-webkit-transform'] = this._targetImage.style.transform;
    this._targetImage.style['-ms-transform'] = this._targetImage.style.transform;

    this._targetImageWrap.style.transform = imageWrapTransform;
    this._targetImageWrap.style['-webkit-transform'] = this._targetImageWrap.style.transform;
    this._targetImageWrap.style['-ms-transform'] = this._targetImageWrap.style.transform;

    this._body.classList.add(CLASS_NAME_ZOOM_OVERLAY_OPEN);
  }

  close() {
    this._body.classList.remove(CLASS_NAME_ZOOM_OVERLAY_OPEN);
    this._body.classList.add(CLASS_NAME_ZOOM_OVERLAY_TRANSITIONING);

    this._targetImage.transform = '';
    this._targetImage['-webkit-transform'] = this._targetImage.transform;
    this._targetImage['-ms-transform'] = this._targetImage.transform;

    this._targetImageWrap.transform = '';
    this._targetImageWrap['-webkit-transform'] = this._targetImageWrap.transform;
    this._targetImageWrap['-ms-transform'] = this._targetImageWrap.transform;

    EventHandler.one(TRANSITION_END, this.dispose.bind(this));
    EventHandler.emulateTransitionEnd(300);
  }

  dispose() {
    if (this._targetImageWrap && this._targetImageWrap.parentNode) {
      this._targetImage.classList.remove(CLASS_NAME_ZOOM_IMG);
      this._targetImage.dataset.action = DATA_ZOOM;

      this._targetImageWrap.parentNode.replaceChild(this._targetImage, this._targetImageWrap);
      this._overlay.remove();

      this._body.classList.remove(CLASS_NAME_ZOOM_OVERLAY_TRANSITIONING);
    }
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  new ZoomService().listen();
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .Zoom to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, Zoom);

export default Zoom;
