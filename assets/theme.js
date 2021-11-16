/*
@license
  Streamline by Archetype Themes (https://archetypethemes.co)
  Access unminified JS in assets/theme.js

  Use our custom event listeners to tap into common functions.
  Documentation - https://archetypethemes.co/blogs/streamline/javascript-events-for-developers

  document.addEventListener('page:loaded', function() {
    // Stylesheet and theme scripts have loaded
  });
*/

window.theme = window.theme || {};
window.Shopify = window.Shopify || {};

// Breakpoint values are used throughout many templates.
// We strongly suggest not changing them globally.
theme.bp = {};
theme.config = {
  cssLoaded: false,
  bpSmall: false,
  hasSessionStorage: true,
  mediaQuerySmall: 'screen and (max-width: 768px)',
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  isSafari: !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/),
  isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
  rtl: document.documentElement.getAttribute('dir') == 'rtl' ? true : false
};

if (console && console.log) {
  console.log('Streamline theme ('+theme.settings.themeVersion+') by ARCHΞTYPE | Learn more at https://archetypethemes.co');
}

window.lazySizesConfig = window.lazySizesConfig || {};
lazySizesConfig.expFactor = 4;

// Trigger events when going between breakpoints
theme.config.bpSmall = matchMedia(theme.config.mediaQuerySmall).matches;
matchMedia(theme.config.mediaQuerySmall).addListener(function(mql) {
  if (mql.matches) {
    theme.config.bpSmall = true;
    document.dispatchEvent(new CustomEvent('matchSmall'));
  } else {
    theme.config.bpSmall = false;
    document.dispatchEvent(new CustomEvent('unmatchSmall'));
  }
});

(function(){
  'use strict';

  theme.delegate = {
    on: function(event, callback, options){
      if( !this.namespaces ) // save the namespaces on the DOM element itself
        this.namespaces = {};
  
      this.namespaces[event] = callback;
      options = options || false;
  
      this.addEventListener(event.split('.')[0], callback, options);
      return this;
    },
    off: function(event) {
      if (!this.namespaces) { return }
      this.removeEventListener(event.split('.')[0], this.namespaces[event]);
      delete this.namespaces[event];
      return this;
    }
  };
  
  // Extend the DOM with these above custom methods
  window.on = Element.prototype.on = theme.delegate.on;
  window.off = Element.prototype.off = theme.delegate.off;
  
  theme.utils = {
    defaultTo: function(value, defaultValue) {
      return (value == null || value !== value) ? defaultValue : value
    },
  
    wrap: function(el, wrapper) {
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    },
  
    debounce: function(wait, callback, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) callback.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) callback.apply(context, args);
      }
    },
  
    throttle: function(limit, callback) {
      var waiting = false;
      return function () {
        if (!waiting) {
          callback.apply(this, arguments);
          waiting = true;
          setTimeout(function () {
            waiting = false;
          }, limit);
        }
      }
    },
  
    prepareTransition: function(el, callback) {
      el.addEventListener('transitionend', removeClass);
  
      function removeClass(evt) {
        el.classList.remove('is-transitioning');
        el.removeEventListener('transitionend', removeClass);
      }
  
      el.classList.add('is-transitioning');
      el.offsetWidth; // check offsetWidth to force the style rendering
  
      if (typeof callback === 'function') {
        callback();
      }
    },
  
    // _.compact from lodash
    // Creates an array with all falsey values removed. The values `false`, `null`,
    // `0`, `""`, `undefined`, and `NaN` are falsey.
    // _.compact([0, 1, false, 2, '', 3]);
    // => [1, 2, 3]
    compact: function(array) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];
  
      while (++index < length) {
        var value = array[index];
        if (value) {
          result[resIndex++] = value;
        }
      }
      return result;
    },
  
    serialize: function(form) {
      var arr = [];
      Array.prototype.slice.call(form.elements).forEach(function(field) {
        if (
          !field.name ||
          field.disabled ||
          ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1
        )
          return;
        if (field.type === 'select-multiple') {
          Array.prototype.slice.call(field.options).forEach(function(option) {
            if (!option.selected) return;
            arr.push(
              encodeURIComponent(field.name) +
                '=' +
                encodeURIComponent(option.value)
            );
          });
          return;
        }
        if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked)
          return;
        arr.push(
          encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value)
        );
      });
      return arr.join('&');
    }
  };
  
  theme.a11y = {
    trapFocus: function(options) {
      var eventsName = {
        focusin: options.namespace ? 'focusin.' + options.namespace : 'focusin',
        focusout: options.namespace
          ? 'focusout.' + options.namespace
          : 'focusout',
        keydown: options.namespace
          ? 'keydown.' + options.namespace
          : 'keydown.handleFocus'
      };
  
      // Get every possible visible focusable element
      var focusableEls = options.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])');
      var elArray = [].slice.call(focusableEls);
      var focusableElements = elArray.filter(el => el.offsetParent !== null);
  
      var firstFocusable = focusableElements[0];
      var lastFocusable = focusableElements[focusableElements.length - 1];
  
      if (!options.elementToFocus) {
        options.elementToFocus = options.container;
      }
  
      options.container.setAttribute('tabindex', '-1');
      options.elementToFocus.focus();
  
      document.documentElement.off('focusin');
      document.documentElement.on(eventsName.focusout, function() {
        document.documentElement.off(eventsName.keydown);
      });
  
      document.documentElement.on(eventsName.focusin, function(evt) {
        if (evt.target !== lastFocusable && evt.target !== firstFocusable) return;
  
        document.documentElement.on(eventsName.keydown, function(evt) {
          _manageFocus(evt);
        });
      });
  
      function _manageFocus(evt) {
        if (evt.keyCode !== 9) return;
        /**
         * On the first focusable element and tab backward,
         * focus the last element
         */
        if (evt.target === firstFocusable && evt.shiftKey) {
          evt.preventDefault();
          lastFocusable.focus();
        }
      }
    },
    removeTrapFocus: function(options) {
      var eventName = options.namespace
        ? 'focusin.' + options.namespace
        : 'focusin';
  
      if (options.container) {
        options.container.removeAttribute('tabindex');
      }
  
      document.documentElement.off(eventName);
    },
  
    lockMobileScrolling: function(namespace, element) {
      var el = element ? element : document.documentElement;
      document.documentElement.classList.add('lock-scroll');
      el.on('touchmove' + namespace, function() {
        return true;
      });
    },
  
    unlockMobileScrolling: function(namespace, element) {
      document.documentElement.classList.remove('lock-scroll');
      var el = element ? element : document.documentElement;
      el.off('touchmove' + namespace);
    }
  };
  
  // Add class when tab key starts being used to show outlines
  document.documentElement.on('keyup.tab', function(evt) {
    if (evt.keyCode === 9) {
      document.documentElement.classList.add('tab-outline');
      document.documentElement.off('keyup.tab');
    }
  });
  
  theme.Sections = function Sections() {
    this.constructors = {};
    this.instances = [];
  
    document.addEventListener('shopify:section:load', this._onSectionLoad.bind(this));
    document.addEventListener('shopify:section:unload', this._onSectionUnload.bind(this));
    document.addEventListener('shopify:section:select', this._onSelect.bind(this));
    document.addEventListener('shopify:section:deselect', this._onDeselect.bind(this));
    document.addEventListener('shopify:block:select', this._onBlockSelect.bind(this));
    document.addEventListener('shopify:block:deselect', this._onBlockDeselect.bind(this));
  };
  
  theme.Sections.prototype = Object.assign({}, theme.Sections.prototype, {
    _createInstance: function(container, constructor, scope) {
      var id = container.getAttribute('data-section-id');
      var type = container.getAttribute('data-section-type');
  
      constructor = constructor || this.constructors[type];
  
      if (typeof constructor === 'undefined') {
        return;
      }
  
      // If custom scope passed, check to see if instance
      // is already initialized so we don't double up
      if (scope) {
        var instanceExists = this._findInstance(id);
        if (instanceExists) {
          this._removeInstance(id);
        }
      }
  
      var instance = Object.assign(new constructor(container), {
        id: id,
        type: type,
        container: container
      });
  
      this.instances.push(instance);
    },
  
    _findInstance: function(id) {
      for (var i = 0; i < this.instances.length; i++) {
        if (this.instances[i].id === id) {
          return this.instances[i];
        }
      }
    },
  
    _removeInstance: function(id) {
      var i = this.instances.length;
      var instance;
  
      while(i--) {
        if (this.instances[i].id === id) {
          instance = this.instances[i];
          this.instances.splice(i, 1);
          break;
        }
      }
  
      return instance;
    },
  
    _onSectionLoad: function(evt, subSection, subSectionId) {
      if (window.AOS) { AOS.refreshHard() }
      if (theme && theme.initGlobals) {
        theme.initGlobals();
      }
  
      var container = subSection ? subSection : evt.target;
      var section = subSection ? subSection : evt.target.querySelector('[data-section-id]');
  
      if (!section) {
        return;
      }
  
      this._createInstance(section);
  
      var instance = subSection ? subSectionId : this._findInstance(evt.detail.sectionId);
  
      // Check if we have subsections to load
      var haveSubSections = container.querySelectorAll('[data-subsection]');
      if (haveSubSections.length) {
        this.loadSubSections(container);
      }
  
      // Run JS only in case of the section being selected in the editor
      // before merchant clicks "Add"
      if (instance && typeof instance.onLoad === 'function') {
        instance.onLoad(evt);
      }
  
      // Force editor to trigger scroll event when loading a section
      setTimeout(function() {
        window.dispatchEvent(new Event('scroll'));
      }, 200);
    },
  
    _onSectionUnload: function(evt) {
      this.instances = this.instances.filter(function(instance) {
        var isEventInstance = instance.id === evt.detail.sectionId;
  
        if (isEventInstance) {
          if (typeof instance.onUnload === 'function') {
            instance.onUnload(evt);
          }
        }
  
        return !isEventInstance;
      });
    },
  
    loadSubSections: function(scope) {
      if (!scope) {
        return;
      }
  
      var sections = scope.querySelectorAll('[data-section-id]');
  
      sections.forEach(el => {
        this._onSectionLoad(null, el, el.dataset.sectionId);
      });
    },
  
    _onSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onSelect === 'function'
      ) {
        instance.onSelect(evt);
      }
    },
  
    _onDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onDeselect === 'function'
      ) {
        instance.onDeselect(evt);
      }
    },
  
    _onBlockSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onBlockSelect === 'function'
      ) {
        instance.onBlockSelect(evt);
      }
    },
  
    _onBlockDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (
        typeof instance !== 'undefined' &&
        typeof instance.onBlockDeselect === 'function'
      ) {
        instance.onBlockDeselect(evt);
      }
    },
  
    register: function(type, constructor, scope) {
      this.constructors[type] = constructor;
  
      var sections = document.querySelectorAll('[data-section-type="' + type + '"]');
  
      if (scope) {
        sections = scope.querySelectorAll('[data-section-type="' + type + '"]');
      }
  
      sections.forEach(
        function(container) {
          this._createInstance(container, constructor, scope);
        }.bind(this)
      );
    },
  
    reinit: function(section) {
      for (var i = 0; i < this.instances.length; i++) {
        var instance = this.instances[i];
        if (instance['type'] === section) {
          if (typeof instance.forceReload === 'function') {
            instance.forceReload();
          }
        }
      }
    }
  });
  
  /**
   * Currency Helpers
   * -----------------------------------------------------------------------------
   * A collection of useful functions that help with currency formatting
   *
   * Current contents
   * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
   *   - When theme.settings.superScriptPrice is enabled, format cents in <sup> tag
   * - getBaseUnit - Splits unit price apart to get value + unit
   *
   */
  
  theme.Currency = (function() {
    var moneyFormat = '${{amount}}';
    var superScript = theme && theme.settings && theme.settings.superScriptPrice;
  
    function formatMoney(cents, format) {
      if (!format) {
        format = theme.settings.moneyFormat;
      }
  
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      var value = '';
      var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      var formatString = (format || moneyFormat);
  
      function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = theme.utils.defaultTo(precision, 2);
        thousands = theme.utils.defaultTo(thousands, ',');
        decimal = theme.utils.defaultTo(decimal, '.');
  
        if (isNaN(number) || number == null) {
          return 0;
        }
  
        number = (number / 100.0).toFixed(precision);
  
        var parts = number.split('.');
        var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        var centsAmount = parts[1] ? (decimal + parts[1]) : '';
  
        return dollarsAmount + centsAmount;
      }
  
      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
  
          if (superScript && value && value.includes('.')) {
            value = value.replace('.', '<sup>') + '</sup>';
          }
  
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
  
          if (superScript && value && value.includes('.')) {
            value = value.replace(',', '<sup>') + '</sup>';
          }
  
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ');
          break;
      }
  
      return formatString.replace(placeholderRegex, value);
    }
  
    function getBaseUnit(variant) {
      if (!variant) {
        return;
      }
  
      if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
        return;
      }
  
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }
  
    return {
      formatMoney: formatMoney,
      getBaseUnit: getBaseUnit
    }
  })();
  
  theme.Images = (function() {
  
    /**
     * Find the Shopify image attribute size
     */
    function imageSize(src) {
      if (!src) {
        return '620x'; // default based on theme
      }
  
      var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
  
      if (match !== null) {
        return match[1];
      } else {
        return null;
      }
    }
  
    /**
     * Adds a Shopify size attribute to a URL
     */
    function getSizedImageUrl(src, size) {
      if (!src) {
        return src;
      }
  
      if (size == null) {
        return src;
      }
  
      if (size === 'master') {
        return this.removeProtocol(src);
      }
  
      var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);
  
      if (match != null) {
        var prefix = src.split(match[0]);
        var suffix = match[0];
  
        return this.removeProtocol(prefix[0] + '_' + size + suffix);
      }
  
      return null;
    }
  
    function removeProtocol(path) {
      return path.replace(/http(s)?:/, '');
    }
  
    function lazyloadImagePath(string) {
      var image;
  
      if (string !== null) {
        image = string.replace(/(\.[^.]*)$/, "_{width}x$1");
      }
  
      return image;
    }
  
    return {
      imageSize: imageSize,
      getSizedImageUrl: getSizedImageUrl,
      removeProtocol: removeProtocol,
      lazyloadImagePath: lazyloadImagePath
    };
  })();
  
  theme.loadImageSection = function(container) {
    // Wait until images inside container have lazyloaded class
    function setAsLoaded() {
      container.classList.remove('loading', 'loading--delayed');
      container.classList.add('loaded');
    }
  
    function checkForLazyloadedImage() {
      return container.querySelector('.lazyloaded');
    }
  
    // If it has SVGs it's in the onboarding state so set as loaded
    if (container.querySelector('svg')) {
      setAsLoaded();
      return;
    };
  
    if (checkForLazyloadedImage()) {
      setAsLoaded();
      return;
    }
  
    var interval = setInterval(function() {
      if (checkForLazyloadedImage()) {
        clearInterval(interval);
        setAsLoaded();
      }
    }, 25);
  };
  
  // Init section function when it's visible, then disable observer
  theme.initWhenVisible = function(options) {
    var threshold = options.threshold ? options.threshold : 0;
  
    var observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (typeof options.callback === 'function') {
            options.callback();
            observer.unobserve(entry.target);
          }
        }
      });
    }, {rootMargin: '0px 0px '+ threshold +'px 0px'});
  
    observer.observe(options.element);
  };
  
  theme.Variants = (function() {
  
    function Variants(options) {
      this.container = options.container;
      this.variants = options.variants;
      this.singleOptionSelector = options.singleOptionSelector;
      this.originalSelectorId = options.originalSelectorId;
      this.enableHistoryState = options.enableHistoryState;
      this.currentVariant = this._getVariantFromOptions();
  
      this.container.querySelectorAll(this.singleOptionSelector).forEach(el => {
        el.addEventListener('change', this._onSelectChange.bind(this));
      });
    }
  
    Variants.prototype = Object.assign({}, Variants.prototype, {
  
      _getCurrentOptions: function() {
        var result = [];
  
        this.container.querySelectorAll(this.singleOptionSelector).forEach(el => {
          var type = el.getAttribute('type');
  
          if (type === 'radio' || type === 'checkbox') {
            if (el.checked) {
              result.push({
                value: el.value,
                index: el.dataset.index
              });
            }
          } else {
            result.push({
              value: el.value,
              index: el.dataset.index
            });
          }
        });
  
        // remove any unchecked input values if using radio buttons or checkboxes
        result = theme.utils.compact(result);
  
        return result;
      },
  
      _getVariantFromOptions: function() {
        var selectedValues = this._getCurrentOptions();
        var variants = this.variants;
        var found = false;
  
        variants.forEach(function(variant) {
          var match = true;
          var options = variant.options;
  
          selectedValues.forEach(function(option) {
            if (match) {
              match = (variant[option.index] === option.value);
            }
          });
  
          if (match) {
            found = variant;
          }
        });
  
        return found || null;
      },
  
      _onSelectChange: function() {
        var variant = this._getVariantFromOptions();
  
        this.container.dispatchEvent(new CustomEvent('variantChange', {
          detail: {
            variant: variant
          }
        }));
  
        document.dispatchEvent(new CustomEvent('variant:change', {
          detail: {
            variant: variant
          }
        }));
  
        if (!variant) {
          return;
        }
  
        this._updateMasterSelect(variant);
        this._updateImages(variant);
        this._updatePrice(variant);
        this._updateUnitPrice(variant);
        this._updateSKU(variant);
        this.currentVariant = variant;
  
        if (this.enableHistoryState) {
          this._updateHistoryState(variant);
        }
      },
  
      _updateImages: function(variant) {
        var variantImage = variant.featured_image || {};
        var currentVariantImage = this.currentVariant.featured_image || {};
  
        if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantImageChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updatePrice: function(variant) {
        if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
          return;
        }


        this.container.dispatchEvent(new CustomEvent('variantPriceChange', {

          


          detail: {
            variant: variant
          }
        }));
      },
  
      _updateUnitPrice: function(variant) {
        if (variant.unit_price === this.currentVariant.unit_price) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantUnitPriceChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updateSKU: function(variant) {
        if (variant.sku === this.currentVariant.sku) {
          return;
        }
  
        this.container.dispatchEvent(new CustomEvent('variantSKUChange', {
          detail: {
            variant: variant
          }
        }));
      },
  
      _updateHistoryState: function(variant) {
        if (!history.replaceState || !variant) {
          return;
        }
  
        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({path: newurl}, '', newurl);
      },
  
      _updateMasterSelect: function(variant) {
        this.container.querySelector(this.originalSelectorId).value = variant.id;
        // Force a change event so Shop Pay installments works after a variant is changed
        this.container.querySelector(this.originalSelectorId).dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  
    return Variants;
  })();
  
  theme.rteInit = function() {
    // Wrap tables so they become scrollable on small screens
    document.querySelectorAll('.rte table').forEach(table => {
      var wrapWith = document.createElement('div');
      wrapWith.classList.add('table-wrapper');
      theme.utils.wrap(table, wrapWith);
    });
  
    // Wrap video iframe embeds so they are responsive
    document.querySelectorAll('.rte iframe[src*="youtube.com/embed"]').forEach(iframe => {
      wrapVideo(iframe);
    });
    document.querySelectorAll('.rte iframe[src*="player.vimeo"]').forEach(iframe => {
      wrapVideo(iframe);
    });
  
    function wrapVideo(iframe) {
      // Reset the src attribute on each iframe after page load
      // for Chrome's "incorrect iFrame content on 'back'" bug.
      // https://code.google.com/p/chromium/issues/detail?id=395791
      iframe.src = iframe.src;
      var wrapWith = document.createElement('div');
      wrapWith.classList.add('video-wrapper');
      theme.utils.wrap(iframe, wrapWith);
    }
  
    // Remove CSS that adds animated underline under image links
    document.querySelectorAll('.rte a img').forEach(img => {
      img.parentNode.classList.add('rte__image');
    });
  }
  
  theme.LibraryLoader = (function() {
    var types = {
      link: 'link',
      script: 'script'
    };
  
    var status = {
      requested: 'requested',
      loaded: 'loaded'
    };
  
    var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';
  
    var libraries = {
      youtubeSdk: {
        tagId: 'youtube-sdk',
        src: 'https://www.youtube.com/iframe_api',
        type: types.script
      },
      vimeo: {
        tagId: 'vimeo-api',
        src: 'https://player.vimeo.com/api/player.js',
        type: types.script
      },
      shopifyXr: {
        tagId: 'shopify-model-viewer-xr',
        src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
        type: types.script
      },
      modelViewerUi: {
        tagId: 'shopify-model-viewer-ui',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
        type: types.script
      },
      modelViewerUiStyles: {
        tagId: 'shopify-model-viewer-ui-styles',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
        type: types.link
      }
    };
  
    function load(libraryName, callback) {
      var library = libraries[libraryName];
  
      if (!library) return;
      if (library.status === status.requested) return;
  
      callback = callback || function() {};
      if (library.status === status.loaded) {
        callback();
        return;
      }
  
      library.status = status.requested;
  
      var tag;
  
      switch (library.type) {
        case types.script:
          tag = createScriptTag(library, callback);
          break;
        case types.link:
          tag = createLinkTag(library, callback);
          break;
      }
  
      tag.id = library.tagId;
      library.element = tag;
  
      var firstScriptTag = document.getElementsByTagName(library.type)[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  
    function createScriptTag(library, callback) {
      var tag = document.createElement('script');
      tag.src = library.src;
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }
  
    function createLinkTag(library, callback) {
      var tag = document.createElement('link');
      tag.href = library.src;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }
  
    return {
      load: load
    };
  })();
  
  window.vimeoApiReady = function() {
    theme.config.vimeoLoading = true;
  
    // Because there's no way to check for the Vimeo API being loaded
    // asynchronously, we use this terrible timeout to wait for it being ready
    checkIfVimeoIsReady()
      .then(function() {
        theme.config.vimeoReady = true;
        theme.config.vimeoLoading = false;
        document.dispatchEvent(new CustomEvent('vimeoReady'));
      });
  }
  
  function checkIfVimeoIsReady() {
    var wait;
    var timeout;
  
    var deferred = new Promise((resolve, reject) => {
      wait = setInterval(function() {
        if (!Vimeo) {
          return;
        }
  
        clearInterval(wait);
        clearTimeout(timeout);
        resolve();
      }, 500);
  
      timeout = setTimeout(function() {
        clearInterval(wait);
        reject();
      }, 4000); // subjective. test up to 8 times over 4 seconds
    });
  
    return deferred;
  }
  
  theme.VimeoPlayer = (function() {
    var classes = {
      loading: 'loading',
      loaded: 'loaded',
      interactable: 'video-interactable'
    }
  
    var defaults = {
      background: true,
      byline: false,
      controls: false,
      loop: true,
      muted: true,
      playsinline: true,
      portrait: false,
      title: false
    };
  
    function VimeoPlayer(divId, videoId, options) {
      this.divId = divId;
      this.el = document.getElementById(divId);
      this.videoId = videoId;
      this.iframe = null;
      this.options = options;
  
      if (this.options && this.options.videoParent) {
        this.parent = this.el.closest(this.options.videoParent);
      }
  
      this.setAsLoading();
  
      if (theme.config.vimeoReady) {
        this.init();
      } else {
        theme.LibraryLoader.load('vimeo', window.vimeoApiReady);
        document.addEventListener('vimeoReady', this.init.bind(this));
      }
    }
  
    VimeoPlayer.prototype = Object.assign({}, VimeoPlayer.prototype, {
      init: function() {
        var args = defaults;
        args.id = this.videoId;
  
        this.videoPlayer = new Vimeo.Player(this.el, args);
  
        this.videoPlayer.ready().then(this.playerReady.bind(this));
      },
  
      playerReady: function() {
        this.iframe = this.el.querySelector('iframe');
        this.iframe.setAttribute('tabindex', '-1');
  
        this.videoPlayer.setMuted(true);
  
        this.setAsLoaded();
  
        // pause when out of view
        var observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.play();
            } else {
              this.pause();
            }
          });
        }, {rootMargin: '0px 0px 50px 0px'});
  
        observer.observe(this.iframe);
      },
  
      setAsLoading: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.loading);
      },
  
      setAsLoaded: function() {
        if (!this.parent) return;
        this.parent.classList.remove(classes.loading);
        this.parent.classList.add(classes.loaded);
        if (Shopify && Shopify.designMode) {
          if (window.AOS) {AOS.refreshHard()}
        }
      },
  
      enableInteraction: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.interactable);
      },
  
      play: function() {
        if (this.videoPlayer && typeof this.videoPlayer.play === 'function') {
          this.videoPlayer.play();
        }
      },
  
      pause: function() {
        if (this.videoPlayer && typeof this.videoPlayer.pause === 'function') {
          this.videoPlayer.pause();
        }
      },
  
      destroy: function() {
        if (this.videoPlayer && typeof this.videoPlayer.destroy === 'function') {
          this.videoPlayer.destroy();
        }
      }
    });
  
    return VimeoPlayer;
  })();
  
  window.onYouTubeIframeAPIReady = function() {
    theme.config.youTubeReady = true;
    document.dispatchEvent(new CustomEvent('youTubeReady'));
  }
  
  /*============================================================================
    YouTube SDK method
    Parameters:
      - player div id (required)
      - arguments
        - videoId (required)
        - videoParent (selector, optional for section loading state)
        - events (object, optional)
  ==============================================================================*/
  theme.YouTube = (function() {
    var classes = {
      loading: 'loading',
      loaded: 'loaded',
      interactable: 'video-interactable'
    }
  
    var defaults = {
      width: 1280,
      height: 720,
      playerVars: {
        autohide: 0,
        autoplay: 1,
        cc_load_policy: 0,
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      }
    };
  
    function YouTube(divId, options) {
      this.divId = divId;
      this.iframe = null;
  
      this.attemptedToPlay = false;
  
      // API callback events
      defaults.events = {
        onReady: this.onVideoPlayerReady.bind(this),
        onStateChange: this.onVideoStateChange.bind(this)
      };
  
      this.options = Object.assign({}, defaults, options);
  
      if (this.options) {
        if (this.options.videoParent) {
          this.parent = document.getElementById(this.divId).closest(this.options.videoParent);
        }
  
        // Most YT videos will autoplay. If in product media,
        // will handle in theme.Product instead
        if (!this.options.autoplay) {
          this.options.playerVars.autoplay = this.options.autoplay;
        }
  
        if (this.options.style === 'sound') {
          this.options.playerVars.controls = 1;
          this.options.playerVars.autoplay = 0;
        }
  
      }
  
      this.setAsLoading();
  
      if (theme.config.youTubeReady) {
        this.init();
      } else {
        theme.LibraryLoader.load('youtubeSdk');
        document.addEventListener('youTubeReady', this.init.bind(this));
      }
    }
  
    YouTube.prototype = Object.assign({}, YouTube.prototype, {
      init: function() {
        this.videoPlayer = new YT.Player(this.divId, this.options);
      },
  
      onVideoPlayerReady: function(evt) {
        this.iframe = document.getElementById(this.divId); // iframe once YT loads
        this.iframe.setAttribute('tabindex', '-1');
  
        if (this.options.style !== 'sound') {
          evt.target.mute();
        }
  
        // pause when out of view
        var observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.play();
            } else {
              this.pause();
            }
          });
        }, {rootMargin: '0px 0px 50px 0px'});
  
        observer.observe(this.iframe);
      },
  
      onVideoStateChange: function(evt) {
        switch (evt.data) {
          case -1: // unstarted
            // Handle low power state on iOS by checking if
            // video is reset to unplayed after attempting to buffer
            if (this.attemptedToPlay) {
              this.setAsLoaded();
              this.enableInteraction();
            }
            break;
          case 0: // ended, loop it
            this.play(evt);
            break;
          case 1: // playing
            this.setAsLoaded();
            break;
          case 3: // buffering
            this.attemptedToPlay = true;
            break;
        }
      },
  
      setAsLoading: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.loading);
      },
  
      setAsLoaded: function() {
        if (!this.parent) return;
        this.parent.classList.remove(classes.loading);
        this.parent.classList.add(classes.loaded);
        if (Shopify && Shopify.designMode) {
          if (window.AOS) {AOS.refreshHard()}
        }
      },
  
      enableInteraction: function() {
        if (!this.parent) return;
        this.parent.classList.add(classes.interactable);
      },
  
      play: function() {
        if (this.videoPlayer && typeof this.videoPlayer.playVideo === 'function') {
          this.videoPlayer.playVideo();
        }
      },
  
      pause: function() {
        if (this.videoPlayer && typeof this.videoPlayer.pauseVideo === 'function') {
          this.videoPlayer.pauseVideo();
        }
      },
  
      destroy: function() {
        if (this.videoPlayer && typeof this.videoPlayer.destroy === 'function') {
          this.videoPlayer.destroy();
        }
      }
    });
  
    return YouTube;
  })();
  
  // Patch Flickity resize event for iOS15 jank fix
  (function() {
    var originalResizeMethod = Flickity.prototype.resize;
    var lastWidth = window.innerWidth;
  
    Flickity.prototype.resize = function() {
      if (window.innerWidth === lastWidth) {
        return;
      }
  
      lastWidth = window.innerWidth;
      originalResizeMethod.apply(this, arguments); // Call original method
    }
  })();
  
  // Prevent vertical scroll while using flickity sliders
  (function() {
    var e = !1;
    var t;
  
    document.body.addEventListener('touchstart', function(i) {
      if (!i.target.closest('.flickity-slider')) {
        return e = !1;
        void 0;
      }
      e = !0;
      t = {
        x: i.touches[0].pageX,
        y: i.touches[0].pageY
      }
    })
  
    document.body.addEventListener('touchmove', function(i) {
      if (e && i.cancelable) {
        var n = {
          x: i.touches[0].pageX - t.x,
          y: i.touches[0].pageY - t.y
        };
        Math.abs(n.x) > Flickity.defaults.dragThreshold && i.preventDefault()
      }
    }, { passive: !1 })
  })();
  

  /**
   * Ajax Renderer
   * -----------------------------------------------------------------------------
   * Render sections without reloading the page.
   * @param {Object[]} sections - The section to update on render.
   * @param {string} sections[].sectionId - The ID of the section from Shopify.
   * @param {string} sections[].nodeId - The ID of the DOM node to replace.
   * @param {Function} sections[].onReplace (optional) - The custom render function.
   * @param {string[]} preserveParams - The param name to preserve in the URL.
   * @param {boolean} debug - Output logs to console for debugging.
   *
   */
  
  theme.AjaxRenderer = (function () {
    function AjaxRenderer({ sections, preserveParams, onReplace, debug } = {}) {
      this.sections = sections || [];
      this.preserveParams = preserveParams || [];
      this.cachedSections = [];
      this.onReplace = onReplace;
      this.debug = Boolean(debug);
    }
  
    AjaxRenderer.prototype = Object.assign({}, AjaxRenderer.prototype, {
      renderPage: function (basePath, searchParams, updateURLHash = true) {
        if (searchParams) this.appendPreservedParams(searchParams);
  
        const sectionRenders = this.sections.map(section => {
          const url = `${basePath}?section_id=${section.sectionId}&${searchParams}`;
          const cachedSectionUrl = cachedSection => cachedSection.url === url;
  
          return this.cachedSections.some(cachedSectionUrl)
            ? this.renderSectionFromCache(cachedSectionUrl, section)
            : this.renderSectionFromFetch(url, section);
        });
  
        if (updateURLHash) this.updateURLHash(searchParams);
  
        return Promise.all(sectionRenders);
      },
  
      renderSectionFromCache: function (url, section) {
        const cachedSection = this.cachedSections.find(url);
  
        this.log(`[AjaxRenderer] rendering from cache: url=${cachedSection.url}`);
        this.renderSection(cachedSection.html, section);
        return Promise.resolve(section);
      },
  
      renderSectionFromFetch: function (url, section) {
        this.log(`[AjaxRenderer] redering from fetch: url=${url}`);
  
        return new Promise((resolve, reject) => {
          fetch(url)
            .then(response => response.text())
            .then(responseText => {
              const html = responseText;
              this.cachedSections = [...this.cachedSections, { html, url }];
              this.renderSection(html, section);
              resolve(section);
            })
            .catch(err => reject(err));
        });
      },
  
      renderSection: function (html, section) {
        this.log(
          `[AjaxRenderer] rendering section: section=${JSON.stringify(section)}`,
        );
  
        const newDom = new DOMParser().parseFromString(html, 'text/html');
        if (this.onReplace) {
          this.onReplace(newDom, section);
        } else {
          if (typeof section.nodeId === 'string') {
            document.getElementById(section.nodeId).innerHTML =
              newDom.getElementById(section.nodeId).innerHTML;
          } else {
            section.nodeId.forEach(id => {
              document.getElementById(id).innerHTML =
                newDom.getElementById(id).innerHTML;
            });
          }
        }
  
        return section;
      },
  
      appendPreservedParams: function (searchParams) {
        this.preserveParams.forEach(paramName => {
          const param = new URLSearchParams(window.location.search).get(
            paramName,
          );
  
          if (param) {
            this.log(`[AjaxRenderer] Preserving ${paramName} param`);
            searchParams.append(paramName, param);
          }
        });
      },
  
      updateURLHash: function (searchParams) {
        history.pushState(
          {},
          '',
          `${window.location.pathname}${
            searchParams && '?'.concat(searchParams)
          }`,
        );
      },
  
      log: function (...args) {
        if (this.debug) {
          console.log(...args);
        }
      },
    });
  
    return AjaxRenderer;
  })();
  
  theme.cart = {
    getCart: function() {
      var url = ''.concat(theme.routes.cart, '?t=').concat(Date.now());
      return fetch(url, {
        credentials: 'same-origin',
        method: 'GET'
      }).then(response => response.json());
    },
  
    getCartProductMarkup: function() {
      var url = ''.concat(theme.routes.cartPage, '?t=').concat(Date.now());
  
      url = url.indexOf('?') === -1 ? (url + '?view=ajax') : (url + '&view=ajax');
  
      return fetch(url, {
        credentials: 'same-origin',
        method: 'GET'
      })
      .then(function(response) {return response.text()});
    },
  
    changeItem: function(key, qty) {
      return this._updateCart({
        url: ''.concat(theme.routes.cartChange, '?t=').concat(Date.now()),
        data: JSON.stringify({
          id: key,
          quantity: qty
        }),
        success: function(cart){
          // run the calculator with a target price of $75
          calculateProgress(cart.total_price, 7500);
        }
      })
    },
  
    _updateCart: function(params) {
      return fetch(params.url, {
        method: 'POST',
        body: params.data,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.json())
      .then(function(cart) {
        return cart;
      });
    },
  
    updateAttribute: function(key, value) {
      return this._updateCart({
        url: '/cart/update.js',
        data: JSON.stringify({
          attributes: {
            [key]: theme.cart.attributeToString(value)
          }
        })
      });
    },
  
    updateNote: function(note) {
      return this._updateCart({
        url: '/cart/update.js',
        data: JSON.stringify({
          note: theme.cart.attributeToString(note)
        })
      });
    },
  
    attributeToString: function(attribute) {
      if ((typeof attribute) !== 'string') {
        attribute += '';
        if (attribute === 'undefined') {
          attribute = '';
        }
      }
      return attribute.trim();
    }
  }
  
  /*============================================================================
    CartForm
    - Prevent checkout when terms checkbox exists
    - Listen to quantity changes, rebuild cart (both widget and page)
  ==============================================================================*/
  theme.CartForm = (function() {
    var selectors = {
      products: '[data-products]',
      qtySelector: '.js-qty__wrapper',
      discounts: '[data-discounts]',
      savings: '[data-savings]',
      subTotal: '[data-subtotal]',
  
      cartBubble: '.cart-link__bubble',
      cartNote: '[name="note"]',
      termsCheckbox: '.cart__terms-checkbox',
      checkoutBtn: '.cart__checkout'
    };
  
    var classes = {
      btnLoading: 'btn--loading'
    };
  
    var config = {
      requiresTerms: false
    };
  
    function CartForm(form) {
      if (!form) {
        return;
      }
  
      this.form = form;
      this.wrapper = form.parentNode;
      this.location = form.dataset.location;
      this.namespace = '.cart-' + this.location;
      this.products = form.querySelector(selectors.products)
      this.submitBtn = form.querySelector(selectors.checkoutBtn);
  
      this.discounts = form.querySelector(selectors.discounts);
      this.savings = form.querySelector(selectors.savings);
      this.subtotal = form.querySelector(selectors.subTotal);
      this.termsCheckbox = form.querySelector(selectors.termsCheckbox);
      this.noteInput = form.querySelector(selectors.cartNote);
  
      if (this.termsCheckbox) {
        config.requiresTerms = true;
      }
  
      this.init();
    }
  
    CartForm.prototype = Object.assign({}, CartForm.prototype, {
      init: function() {
        this.initQtySelectors();
  
        document.addEventListener('cart:quantity' + this.namespace, this.quantityChanged.bind(this));
  
        this.form.on('submit' + this.namespace, this.onSubmit.bind(this));
  
        if (this.noteInput) {
          this.noteInput.addEventListener('change', function() {
            var newNote = this.value;
            theme.cart.updateNote(newNote);
          });
        }
  
        // Dev-friendly way to build the cart
        document.addEventListener('cart:build', function() {
          this.buildCart();
        }.bind(this));
      },
  
      reInit: function() {
        this.initQtySelectors();
      },
  
      onSubmit: function(evt) {
        this.submitBtn.classList.add(classes.btnLoading);
  
        if (config.requiresTerms) {
          if (this.termsCheckbox.checked) {
            // continue to checkout
          } else {
            alert(theme.strings.cartTermsConfirmation);
            this.submitBtn.classList.remove(classes.btnLoading)
            evt.preventDefault();
            return false;
          }
        }
      },
  
      /*============================================================================
        Query cart page to get markup
      ==============================================================================*/
      _parseProductHTML: function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        return {
          items: doc.querySelector('.cart__items'),
          discounts: doc.querySelector('.cart__discounts')
        }
      },
  
      buildCart: function() {
        theme.cart.getCartProductMarkup().then(this.cartMarkup.bind(this));

           // Custom code for updating freeshipping bar
           var freeshipping_limit = parseFloat($("#cart_freeshipping_limit").val()) * 100;
           var short_amount = freeshipping_limit - cart.total_price;
   
           var progress_percent = parseInt(cart.total_price * 100 / freeshipping_limit);
           if(progress_percent > 100) {
             progress_percent = 100;
           }
           $(".drawer__freeshipping-bar .progressbar .progress-wrapper .progress").css("width", progress_percent + "%");
   
           if(short_amount <= 0) {
             $(".drawer__freeshipping-bar .commment-failed").addClass("hide");
             $(".drawer__freeshipping-bar .commment-success").removeClass("hide");
           }
           else {
             $(".drawer__freeshipping-bar .commment-failed").removeClass("hide");
             $(".drawer__freeshipping-bar .commment-success").addClass("hide");
             $(".drawer__freeshipping-bar .short_amount").text("$" + (short_amount / 100).toFixed(2));
           }
           ///////////////////////////////////////////////////

           
      },
  
      cartMarkup: function(html) {
        var markup = this._parseProductHTML(html);
        var items = markup.items;
        var count = parseInt(items.dataset.count);
        var subtotal = items.dataset.cartSubtotal;
        var savings = items.dataset.cartSavings;
  
        this.updateCartDiscounts(markup.discounts);
        this.updateSavings(savings);
  
        if (count > 0) {
          this.wrapper.classList.remove('is-empty');
        } else {
          this.wrapper.classList.add('is-empty');
        }
  
        this.updateCount(count);
  
        // Append item markup
        this.products.innerHTML = '';
        this.products.append(items);
  
        // Update subtotal
        this.subtotal.innerHTML = theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat);
  

             


        this.reInit();
  
        if (window.AOS) { AOS.refreshHard() }
  
        if (Shopify && Shopify.StorefrontExpressButtons) {
          Shopify.StorefrontExpressButtons.initialize();
        }
      },
  
      updateCartDiscounts: function(markup) {
        if (!this.discounts) {
          return;
        }
        this.discounts.innerHTML = '';
        this.discounts.append(markup);
      },
  
      /*============================================================================
        Quantity handling
      ==============================================================================*/
      initQtySelectors: function() {
        this.form.querySelectorAll(selectors.qtySelector).forEach(el => {
          var selector = new theme.QtySelector(el, {
            namespace: this.namespace,
            isCart: true
          });
        });
      },
  
      quantityChanged: function(evt) {
        var key = evt.detail[0];
        var qty = evt.detail[1];
        var el = evt.detail[2];
  
        if (!key || !qty) {
          return;
        }
  
        // Disable qty selector so multiple clicks can't happen while loading
        if (el) {
          el.classList.add('is-loading');
        }
  
        theme.cart.changeItem(key, qty)
          .then(function(cart) {
            if (cart.item_count > 0) {
              this.wrapper.classList.remove('is-empty');
            } else {
              this.wrapper.classList.add('is-empty');
            }
  
            this.buildCart();
  
            document.dispatchEvent(new CustomEvent('cart:updated', {
              detail: {
                cart: cart
              }
            }));
          }.bind(this))
          .catch(function(XMLHttpRequest){});
      },
  
      /*============================================================================
        Update elements of the cart
      ==============================================================================*/
      updateSubtotal: function(subtotal) {
        this.form.querySelector(selectors.subTotal).innerHTML = theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat);
        
      },
  



      updateSavings: function(savings) {
        if (!this.savings) {
          return;
        }
  
        if (savings > 0) {
          var amount = theme.Currency.formatMoney(savings, theme.settings.moneyFormat);
          this.savings.classList.remove('hide');
          this.savings.innerHTML = theme.strings.cartSavings.replace('[savings]', amount);
        } else {
          this.savings.classList.add('hide');
        }
      },
  
      updateCount: function(count) {
        var countEls = document.querySelectorAll('.cart-link__bubble-num');
  
        if (countEls.length) {
          countEls.forEach(el => {
            el.innerText = count;
          });
        }
  
        // show/hide bubble(s)
        var bubbles = document.querySelectorAll(selectors.cartBubble);
        if (bubbles.length) {
          if (count > 0) {
            bubbles.forEach(b => {
              b.classList.add('cart-link__bubble--visible');
            });
          } else {
            bubbles.forEach(b => {
              b.classList.remove('cart-link__bubble--visible');
            });
          }
        }
      }
    });
  
    return CartForm;
  })();
  
  // Either collapsible containers all acting individually,
  // or tabs that can only have one open at a time
  theme.collapsibles = (function() {
    var selectors = {
      trigger: '.collapsible-trigger',
      module: '.collapsible-content',
      moduleInner: '.collapsible-content__inner',
      tabs: '.collapsible-trigger--tab'
    };
  
    var classes = {
      hide: 'hide',
      open: 'is-open',
      autoHeight: 'collapsible--auto-height',
      tabs: 'collapsible-trigger--tab'
    };
  
    var namespace = '.collapsible';
  
    var isTransitioning = false;
  
    function init(scope) {
      var el = scope ? scope : document;
      el.querySelectorAll(selectors.trigger).forEach(trigger => {
        var state = trigger.classList.contains(classes.open);
        trigger.setAttribute('aria-expanded', state);
  
        trigger.off('click' + namespace);
        trigger.on('click' + namespace, toggle);
      });
    }
  
    function toggle(evt) {
      if (isTransitioning) {
        return;
      }
  
      isTransitioning = true;
  
      var el = evt.currentTarget;
      var isOpen = el.classList.contains(classes.open);
      var isTab = el.classList.contains(classes.tabs);
      var moduleId = el.getAttribute('aria-controls');
      var container = document.getElementById(moduleId);
  
      if (!moduleId) {
        moduleId = el.dataset.controls;
      }
  
      // No ID, bail
      if (!moduleId) {
        return;
      }
  
      // If container=null, there isn't a matching ID.
      // Check if data-id is set instead. Could be multiple.
      // Select based on being in the same parent div.
      if (!container) {
        var multipleMatches = document.querySelectorAll('[data-id="' + moduleId + '"]');
        if (multipleMatches.length > 0) {
          container = el.parentNode.querySelector('[data-id="' + moduleId + '"]');
        }
      }
  
      if (!container) {
        isTransitioning = false;
        return;
      }
  
      var height = container.querySelector(selectors.moduleInner).offsetHeight;
      var isAutoHeight = container.classList.contains(classes.autoHeight);
      var parentCollapsibleEl = container.parentNode.closest(selectors.module);
      var childHeight = height;
  
      if (isTab) {
        if(isOpen) {
          isTransitioning = false;
          return;
        }
  
        var newModule;
        document.querySelectorAll(selectors.tabs + '[data-id="'+ el.dataset.id +'"]').forEach(el => {
          el.classList.remove(classes.open);
          newModule = document.querySelector('#' + el.getAttribute('aria-controls'));
          setTransitionHeight(newModule, 0, true);
        });
      }
  
      // If isAutoHeight, set the height to 0 just after setting the actual height
      // so the closing animation works nicely
      if (isOpen && isAutoHeight) {
        setTimeout(function() {
          height = 0;
          setTransitionHeight(container, height, isOpen, isAutoHeight);
        }, 0);
      }
  
      if (isOpen && !isAutoHeight) {
        height = 0;
      }
  
      el.setAttribute('aria-expanded', !isOpen);
      if (isOpen) {
        el.classList.remove(classes.open);
      } else {
        el.classList.add(classes.open);
      }
  
      setTransitionHeight(container, height, isOpen, isAutoHeight);
  
      // If we are in a nested collapsible element like the mobile nav,
      // also set the parent element's height
      if (parentCollapsibleEl) {
        var totalHeight = isOpen
                          ? parentCollapsibleEl.offsetHeight - childHeight
                          : height + parentCollapsibleEl.offsetHeight;
  
        setTransitionHeight(parentCollapsibleEl, totalHeight, false, false);
      }
  
      // If Shopify Product Reviews app installed,
      // resize container on 'Write review' click
      // that shows form
      if (window.SPR) {
        var btn = container.querySelector('.spr-summary-actions-newreview');
        if (!btn) { return }
        btn.off('click' + namespace);
        btn.on('click' + namespace, function() {
          height = container.querySelector(selectors.moduleInner).offsetHeight;
          setTransitionHeight(container, height, isOpen, isAutoHeight);
        });
      }
    }
  
    function setTransitionHeight(container, height, isOpen, isAutoHeight) {
      container.classList.remove(classes.hide);
      theme.utils.prepareTransition(container, function() {
        container.style.height = height+'px';
        if (isOpen) {
          container.classList.remove(classes.open);
        } else {
          container.classList.add(classes.open);
        }
      });
  
      if (!isOpen && isAutoHeight) {
        var o = container;
        window.setTimeout(function() {
          o.css('height','auto');
          isTransitioning = false;
        }, 500);
      } else {
        isTransitioning = false;
      }
    }
  
    return {
      init: init
    };
  })();
  
  // Shopify-built select-like popovers for currency and language selection
  theme.Disclosure = (function() {
    var selectors = {
      disclosureForm: '[data-disclosure-form]',
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]'
    };
  
    var classes = {
      listVisible: 'disclosure-list--visible'
    };
  
    function Disclosure(disclosure) {
      this.container = disclosure;
      this._cacheSelectors();
      this._setupListeners();
    }
  
    Disclosure.prototype = Object.assign({}, Disclosure.prototype, {
      _cacheSelectors: function() {
        this.cache = {
          disclosureForm: this.container.closest(selectors.disclosureForm),
          disclosureList: this.container.querySelector(selectors.disclosureList),
          disclosureToggle: this.container.querySelector(
            selectors.disclosureToggle
          ),
          disclosureInput: this.container.querySelector(
            selectors.disclosureInput
          ),
          disclosureOptions: this.container.querySelectorAll(
            selectors.disclosureOptions
          )
        };
      },
  
      _setupListeners: function() {
        this.eventHandlers = this._setupEventHandlers();
  
        this.cache.disclosureToggle.addEventListener(
          'click',
          this.eventHandlers.toggleList
        );
  
        this.cache.disclosureOptions.forEach(function(disclosureOption) {
          disclosureOption.addEventListener(
            'click',
            this.eventHandlers.connectOptions
          );
        }, this);
  
        this.container.addEventListener(
          'keyup',
          this.eventHandlers.onDisclosureKeyUp
        );
  
        this.cache.disclosureList.addEventListener(
          'focusout',
          this.eventHandlers.onDisclosureListFocusOut
        );
  
        this.cache.disclosureToggle.addEventListener(
          'focusout',
          this.eventHandlers.onDisclosureToggleFocusOut
        );
  
        document.body.addEventListener('click', this.eventHandlers.onBodyClick);
      },
  
      _setupEventHandlers: function() {
        return {
          connectOptions: this._connectOptions.bind(this),
          toggleList: this._toggleList.bind(this),
          onBodyClick: this._onBodyClick.bind(this),
          onDisclosureKeyUp: this._onDisclosureKeyUp.bind(this),
          onDisclosureListFocusOut: this._onDisclosureListFocusOut.bind(this),
          onDisclosureToggleFocusOut: this._onDisclosureToggleFocusOut.bind(this)
        };
      },
  
      _connectOptions: function(event) {
        event.preventDefault();
  
        this._submitForm(event.currentTarget.dataset.value);
      },
  
      _onDisclosureToggleFocusOut: function(event) {
        var disclosureLostFocus =
          this.container.contains(event.relatedTarget) === false;
  
        if (disclosureLostFocus) {
          this._hideList();
        }
      },
  
      _onDisclosureListFocusOut: function(event) {
        var childInFocus = event.currentTarget.contains(event.relatedTarget);
  
        var isVisible = this.cache.disclosureList.classList.contains(
          classes.listVisible
        );
  
        if (isVisible && !childInFocus) {
          this._hideList();
        }
      },
  
      _onDisclosureKeyUp: function(event) {
        if (event.which !== 27) return;
        this._hideList();
        this.cache.disclosureToggle.focus();
      },
  
      _onBodyClick: function(event) {
        var isOption = this.container.contains(event.target);
        var isVisible = this.cache.disclosureList.classList.contains(
          classes.listVisible
        );
  
        if (isVisible && !isOption) {
          this._hideList();
        }
      },
  
      _submitForm: function(value) {
        this.cache.disclosureInput.value = value;
        this.cache.disclosureForm.submit();
      },
  
      _hideList: function() {
        this.cache.disclosureList.classList.remove(classes.listVisible);
        this.cache.disclosureToggle.setAttribute('aria-expanded', false);
      },
  
      _toggleList: function() {
        var ariaExpanded =
          this.cache.disclosureToggle.getAttribute('aria-expanded') === 'true';
        this.cache.disclosureList.classList.toggle(classes.listVisible);
        this.cache.disclosureToggle.setAttribute('aria-expanded', !ariaExpanded);
      },
  
      destroy: function() {
        this.cache.disclosureToggle.removeEventListener(
          'click',
          this.eventHandlers.toggleList
        );
  
        this.cache.disclosureOptions.forEach(function(disclosureOption) {
          disclosureOption.removeEventListener(
            'click',
            this.eventHandlers.connectOptions
          );
        }, this);
  
        this.container.removeEventListener(
          'keyup',
          this.eventHandlers.onDisclosureKeyUp
        );
  
        this.cache.disclosureList.removeEventListener(
          'focusout',
          this.eventHandlers.onDisclosureListFocusOut
        );
  
        this.cache.disclosureToggle.removeEventListener(
          'focusout',
          this.eventHandlers.onDisclosureToggleFocusOut
        );
  
        document.body.removeEventListener(
          'click',
          this.eventHandlers.onBodyClick
        );
      }
    });
  
    return Disclosure;
  })();
  
  theme.Drawers = (function() {
    function Drawers(id, name) {
      this.config = {
        id: id,
        close: '.js-drawer-close',
        open: '.js-drawer-open-' + name,
        openClass: 'js-drawer-open',
        closingClass: 'js-drawer-closing',
        activeDrawer: 'drawer--is-open',
        namespace: '.drawer-' + name
      };
  
      this.nodes = {
        page: document.querySelector('#MainContent')
      };
  
      this.drawer = document.querySelector('#' + id);
      this.isOpen = false;
  
      if (!this.drawer) {
        return;
      }
  
      this.init();
    }
  
    Drawers.prototype = Object.assign({}, Drawers.prototype, {
      init: function() {
        // Setup open button(s)
        document.querySelectorAll(this.config.open).forEach(openBtn => {
          openBtn.setAttribute('aria-expanded', 'false');
          openBtn.addEventListener('click', this.open.bind(this));
        });
  
        this.drawer.querySelector(this.config.close).addEventListener('click', this.close.bind(this));
  
        // Close modal if a drawer is opened
        document.addEventListener('modalOpen', function() {
          this.close();
        }.bind(this));
      },
  
      open: function(evt, returnFocusEl) {
        if (evt) {
          evt.preventDefault();
        }
  
        if (this.isOpen) {
          return;
        }
  
        // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
          // save the source of the click, we'll focus to this on close
          evt.currentTarget.setAttribute('aria-expanded', 'true');
          this.activeSource = evt.currentTarget;
        } else if (returnFocusEl) {
          returnFocusEl.setAttribute('aria-expanded', 'true');
          this.activeSource = returnFocusEl;
        }
  
        theme.utils.prepareTransition(this.drawer, function() {
          this.drawer.classList.add(this.config.activeDrawer);
        }.bind(this));
  
        document.documentElement.classList.add(this.config.openClass);
        this.isOpen = true;
  
        theme.a11y.trapFocus({
          container: this.drawer,
          namespace: 'drawer_focus'
        });
  
        document.dispatchEvent(new CustomEvent('drawerOpen'));
        document.dispatchEvent(new CustomEvent('drawerOpen.' + this.config.id));
  
        this.bindEvents();
      },
  
      close: function(evt) {
        if (!this.isOpen) {
          return;
        }
  
        // Do not close if click event came from inside drawer
        if (evt) {
          if (evt.target.closest('.js-drawer-close')) {
            // Do not close if using the drawer close button
          } else if (evt.target.closest('.drawer')) {
            return;
          }
        }
  
        // deselect any focused form elements
        document.activeElement.blur();
  
        theme.utils.prepareTransition(this.drawer, function() {
          this.drawer.classList.remove(this.config.activeDrawer);
        }.bind(this));
  
        document.documentElement.classList.remove(this.config.openClass);
        document.documentElement.classList.add(this.config.closingClass);
  
        window.setTimeout(function() {
          document.documentElement.classList.remove(this.config.closingClass);
          if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
            this.activeSource.setAttribute('aria-expanded', 'false');
            this.activeSource.focus();
          }
        }.bind(this), 500);
  
        this.isOpen = false;
  
        theme.a11y.removeTrapFocus({
          container: this.drawer,
          namespace: 'drawer_focus'
        });
  
        this.unbindEvents();
      },
  
      bindEvents: function() {
        // Clicking out of drawer closes it
        window.on('click' + this.config.namespace, function(evt) {
          this.close(evt)
          return;
        }.bind(this));
  
        // Pressing escape closes drawer
        window.on('keyup' + this.config.namespace, function(evt) {
          if (evt.keyCode === 27) {
            this.close();
          }
        }.bind(this));
  
        theme.a11y.lockMobileScrolling(this.config.namespace, this.nodes.page);
      },
  
      unbindEvents: function() {
        window.off('click' + this.config.namespace);
        window.off('keyup' + this.config.namespace);
  
        theme.a11y.unlockMobileScrolling(this.config.namespace, this.nodes.page);
      }
    });
  
    return Drawers;
  })();
  
  theme.Modals = (function() {
    function Modal(id, name, options) {
      var defaults = {
        close: '.js-modal-close',
        open: '.js-modal-open-' + name,
        openClass: 'modal--is-active',
        closingClass: 'modal--is-closing',
        bodyOpenClass: ['modal-open'],
        bodyOpenSolidClass: 'modal-open--solid',
        bodyClosingClass: 'modal-closing',
        closeOffContentClick: true
      };
  
      this.id = id;
      this.modal = document.getElementById(id);
  
      if (!this.modal) {
        return false;
      }
  
      this.modalContent = this.modal.querySelector('.modal__inner');
  
      this.config = Object.assign(defaults, options);
      this.modalIsOpen = false;
      this.focusOnOpen = this.config.focusIdOnOpen ? document.getElementById(this.config.focusIdOnOpen) : this.modal;
      this.isSolid = this.config.solid;
  
      this.init();
    }
  
    Modal.prototype.init = function() {
      document.querySelectorAll(this.config.open).forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', this.open.bind(this));
      });
  
      this.modal.querySelectorAll(this.config.close).forEach(btn => {
        btn.addEventListener('click', this.close.bind(this));
      });
  
      // Close modal if a drawer is opened
      document.addEventListener('drawerOpen', function() {
        this.close();
      }.bind(this));
    };
  
    Modal.prototype.open = function(evt) {
      // Keep track if modal was opened from a click, or called by another function
      var externalCall = false;
  
      // don't open an opened modal
      if (this.modalIsOpen) {
        return;
      }
  
      // Prevent following href if link is clicked
      if (evt) {
        evt.preventDefault();
      } else {
        externalCall = true;
      }
  
      // Without this, the modal opens, the click event bubbles up to $nodes.page
      // which closes the modal.
      if (evt && evt.stopPropagation) {
        evt.stopPropagation();
        // save the source of the click, we'll focus to this on close
        this.activeSource = evt.currentTarget.setAttribute('aria-expanded', 'true');
      }
  
      if (this.modalIsOpen && !externalCall) {
        this.close();
      }
  
      this.modal.classList.add(this.config.openClass);
  
      document.documentElement.classList.add(...this.config.bodyOpenClass);
  
      if (this.isSolid) {
        document.documentElement.classList.add(this.config.bodyOpenSolidClass);
      }
  
      this.modalIsOpen = true;
  
      theme.a11y.trapFocus({
        container: this.modal,
        elementToFocus: this.focusOnOpen,
        namespace: 'modal_focus'
      });
  
      document.dispatchEvent(new CustomEvent('modalOpen'));
      document.dispatchEvent(new CustomEvent('modalOpen.' + this.id));
  
      this.bindEvents();
    };
  
    Modal.prototype.close = function(evt) {
      // don't close a closed modal
      if (!this.modalIsOpen) {
        return;
      }
  
      // Do not close modal if click happens inside modal content
      if (evt) {
        if (evt.target.closest('.js-modal-close')) {
          // Do not close if using the modal close button
        } else if (evt.target.closest('.modal__inner')) {
          return;
        }
      }
  
      // deselect any focused form elements
      document.activeElement.blur();
  
      this.modal.classList.remove(this.config.openClass);
      this.modal.classList.add(this.config.closingClass);
  
      document.documentElement.classList.remove(...this.config.bodyOpenClass);
      document.documentElement.classList.add(this.config.bodyClosingClass);
  
      window.setTimeout(function() {
        document.documentElement.classList.remove(this.config.bodyClosingClass);
        this.modal.classList.remove(this.config.closingClass);
        if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
          this.activeSource.setAttribute('aria-expanded', 'false').focus();
        }
      }.bind(this), 500); // modal close css transition
  
      if (this.isSolid) {
        document.documentElement.classList.remove(this.config.bodyOpenSolidClass);
      }
  
      this.modalIsOpen = false;
  
      theme.a11y.removeTrapFocus({
        container: this.modal,
        namespace: 'modal_focus'
      });
  
      document.dispatchEvent(new CustomEvent('modalClose.' + this.id));
  
      this.unbindEvents();
    };
  
    Modal.prototype.bindEvents = function() {
      window.on('keyup.modal', function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }.bind(this));
  
      if (this.config.closeOffContentClick) {
        // Clicking outside of the modal content also closes it
        this.modal.on('click.modal', this.close.bind(this));
      }
    };
  
    Modal.prototype.unbindEvents = function() {
      document.documentElement.off('.modal');
  
      if (this.config.closeOffContentClick) {
        this.modal.off('.modal');
      }
    };
  
    return Modal;
  })();
  
  if (typeof window.noUiSlider === 'undefined') {
    throw new Error('theme.PriceRange is missing vendor noUiSlider: // =require vendor/nouislider.js');
  }
  
  theme.PriceRange = (function () {
    var defaultStep = 10;
    var selectors = {
      priceRange: '.price-range',
      priceRangeSlider: '.price-range__slider',
      priceRangeInputMin: '.price-range__input-min',
      priceRangeInputMax: '.price-range__input-max',
      priceRangeDisplayMin: '.price-range__display-min',
      priceRangeDisplayMax: '.price-range__display-max',
    };
  
    function PriceRange(container, {onChange, onUpdate, ...sliderOptions} = {}) {
      this.container = container;
      this.onChange = onChange;
      this.onUpdate = onUpdate;
      this.sliderOptions = sliderOptions || {};
  
      return this.init();
    }
  
    PriceRange.prototype = Object.assign({}, PriceRange.prototype, {
      init: function () {
        if (!this.container.classList.contains('price-range')) {
          throw new Error('You must instantiate PriceRange with a valid container')
        }
  
        this.formEl = this.container.closest('form');
        this.sliderEl = this.container.querySelector(selectors.priceRangeSlider);
        this.inputMinEl = this.container.querySelector(selectors.priceRangeInputMin);
        this.inputMaxEl = this.container.querySelector(selectors.priceRangeInputMax);
        this.displayMinEl = this.container.querySelector(selectors.priceRangeDisplayMin);
        this.displayMaxEl = this.container.querySelector(selectors.priceRangeDisplayMax);
  
        this.minRange = parseFloat(this.container.dataset.min) || 0;
        this.minValue = parseFloat(this.container.dataset.minValue) || 0;
        this.maxRange = parseFloat(this.container.dataset.max) || 100;
        this.maxValue = parseFloat(this.container.dataset.maxValue) || this.maxRange;
  
        return this.createPriceRange();
      },
  
      createPriceRange: function () {
        if (this.sliderEl && this.sliderEl.noUiSlider && typeof this.sliderEl.noUiSlider.destroy === 'function') {
          this.sliderEl.noUiSlider.destroy();
        }
  
        var slider = noUiSlider.create(this.sliderEl, {
          connect: true,
          step: defaultStep,
          ...this.sliderOptions,
          // Do not allow overriding these options
          start: [this.minValue, this.maxValue],
          range: {
            min: this.minRange,
            max: this.maxRange,
          },
        });
  
        slider.on('update', values => {
          this.displayMinEl.innerHTML = theme.Currency.formatMoney(
            values[0],
            theme.settings.moneyFormat,
          );
          this.displayMaxEl.innerHTML = theme.Currency.formatMoney(
            values[1],
            theme.settings.moneyFormat,
          );
  
          if (this.onUpdate) {
            this.onUpdate(values);
          }
        });
  
        slider.on('change', values => {
          this.inputMinEl.value = values[0];
          this.inputMaxEl.value = values[1];
  
          if (this.onChange) {
            const formData = new FormData(this.formEl);
            this.onChange(formData);
          }
        });
  
        return slider;
      },
    });
  
    return PriceRange;
  })();
  
  theme.AjaxProduct = (function() {
    var status = {
      loading: false
    };
  
    function ProductForm(form, submit, args) {
      this.form = form;
      this.args = args;
  
      var submitSelector = submit ? submit : '.add-to-cart';
  
      if (this.form) {
        this.addToCart = form.querySelector(submitSelector);
        this.form.addEventListener('submit', this.addItemFromForm.bind(this));
      }
    };
  
    ProductForm.prototype = Object.assign({}, ProductForm.prototype, {
      addItemFromForm: function(evt, callback){
        evt.preventDefault();
  
        if (status.loading) {
          return;
        }
  
        // Loading indicator on add to cart button
        this.addToCart.classList.add('btn--loading');
  
        status.loading = true;
  
        var data = theme.utils.serialize(this.form);
  
        fetch(theme.routes.cartAdd, {
          method: 'POST',
          body: data,
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
        .then(response => response.json())
        .then(function(data) {
          if (data.status === 422) {
            this.error(data);
          } else {
            var product = data;
            this.success(product);
          }
  
          status.loading = false;
          this.addToCart.classList.remove('btn--loading');
  
          // Reload page if adding product from a section on the cart page
          if (document.body.classList.contains('template-cart')) {
            window.scrollTo(0, 0);
            location.reload();
          }
        }.bind(this));
      },
  
      success: function(product) {
        var errors = this.form.querySelector('.errors');
        if (errors) {
          errors.remove();
        }
  
        document.dispatchEvent(new CustomEvent('ajaxProduct:added', {
          detail: {
            product: product,
            addToCartBtn: this.addToCart
          }
        }));
  
        if (this.args && this.args.scopedEventId) {
          document.dispatchEvent(new CustomEvent('ajaxProduct:added:' + this.args.scopedEventId, {
            detail: {
              product: product,
              addToCartBtn: this.addToCart
            }
          }));
        }
      },
  
      error: function(error) {
        if (!error.description) {
          console.warn(error);
          return;
        }
  
        var errors = this.form.querySelector('.errors');
        if (errors) {
          errors.remove();
        }
  
        var errorDiv = document.createElement('div');
        errorDiv.classList.add('errors', 'text-center');
        errorDiv.textContent = error.description;
        this.form.append(errorDiv);
  
        document.dispatchEvent(new CustomEvent('ajaxProduct:error', {
          detail: {
            errorMessage: error.description
          }
        }));
  
        if (this.args && this.args.scopedEventId) {
          document.dispatchEvent(new CustomEvent('ajaxProduct:error:' + this.args.scopedEventId, {
            detail: {
              errorMessage: error.description
            }
          }));
        }
      }
    });
  
    return ProductForm;
  })();
  
  theme.ProductMedia = (function() {
    var modelJsonSections = {};
    var models = {};
    var xrButtons = {};
  
    var selectors = {
      mediaGroup: '[data-product-single-media-group]',
      xrButton: '[data-shopify-xr]'
    };
  
    function init(modelViewerContainers, sectionId) {
      modelJsonSections[sectionId] = {
        loaded: false
      };
  
      modelViewerContainers.forEach(function(container, index) {
        var mediaId = container.dataset.mediaId;
        var modelViewerElement = container.querySelector('model-viewer');
        var modelId = modelViewerElement.dataset.modelId;
  
        if (index === 0) {
          var mediaGroup = container.closest(selectors.mediaGroup);
          var xrButton = mediaGroup.querySelector(selectors.xrButton);
          xrButtons[sectionId] = {
            element: xrButton,
            defaultId: modelId
          };
        }
  
        models[mediaId] = {
          modelId: modelId,
          sectionId: sectionId,
          container: container,
          element: modelViewerElement
        };
  
      });
  
      window.Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: setupShopifyXr
        },
        {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: setupModelViewerUi
        }
      ]);
  
      theme.LibraryLoader.load('modelViewerUiStyles');
    }
  
    function setupShopifyXr(errors) {
      if (errors) return;
  
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function() {
          setupShopifyXr();
        });
        return;
      }
  
      for (var sectionId in modelJsonSections) {
        if (modelJsonSections.hasOwnProperty(sectionId)) {
          var modelSection = modelJsonSections[sectionId];
  
          if (modelSection.loaded) continue;
  
          var modelJson = document.querySelector('#ModelJson-' + sectionId);
  
          window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
          modelSection.loaded = true;
        }
      }
      window.ShopifyXR.setupXRElements();
    }
  
    function setupModelViewerUi(errors) {
      if (errors) return;
  
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (!model.modelViewerUi && Shopify) {
            model.modelViewerUi = new Shopify.ModelViewerUI(model.element);
          }
          setupModelViewerListeners(model);
        }
      }
    }
  
    function setupModelViewerListeners(model) {
      var xrButton = xrButtons[model.sectionId];
  
      model.container.addEventListener('mediaVisible', function() {
        xrButton.element.setAttribute('data-shopify-model3d-id', model.modelId);
        if (theme.config.isTouch) return;
        model.modelViewerUi.play();
      });
  
      model.container.addEventListener('mediaHidden', function() {
        xrButton.element.setAttribute('data-shopify-model3d-id', xrButton.defaultId);
        model.modelViewerUi.pause();
      });
  
      model.container.addEventListener('xrLaunch', function() {
        model.modelViewerUi.pause();
      });
    }
  
    function removeSectionModels(sectionId) {
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (model.sectionId === sectionId) {
            delete models[key];
          }
        }
      }
      delete modelJsonSections[sectionId];
    }
  
    return {
      init: init,
      removeSectionModels: removeSectionModels
    };
  })();
  
  theme.QtySelector = (function() {
    var selectors = {
      input: '.js-qty__num',
      plus: '.js-qty__adjust--plus',
      minus: '.js-qty__adjust--minus'
    };
  
    function QtySelector(el, options) {
      this.wrapper = el;
      this.plus = el.querySelector(selectors.plus);
      this.minus = el.querySelector(selectors.minus);
      this.input = el.querySelector(selectors.input);
      this.minValue = this.input.getAttribute('min') || 1;
  
      var defaults = {
        namespace: null,
        isCart: false,
        key: this.input.dataset.id
      };
  
      this.options = Object.assign({}, defaults, options);
  
      this.init();
    }
  
    QtySelector.prototype = Object.assign({}, QtySelector.prototype, {
      init: function() {
        this.plus.addEventListener('click', function() {
          var qty = this._getQty();
          this._change(qty + 1);
        }.bind(this));
  
        this.minus.addEventListener('click', function() {
          var qty = this._getQty();
          this._change(qty - 1);
        }.bind(this));
  
        this.input.addEventListener('change', function(evt) {
          this._change(this._getQty());
        }.bind(this));
      },
  
      _getQty: function() {
        var qty = this.input.value;
        if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {
          // We have a valid number!
        } else {
          // Not a number. Default to 1.
          qty = 1;
        }
        return parseInt(qty);
      },
  
      _change: function(qty) {
        if (qty <= this.minValue) {
          qty = this.minValue;
        }
  
        this.input.value = qty;
  
        if (this.options.isCart) {
          document.dispatchEvent(new CustomEvent('cart:quantity' + this.options.namespace, {
              detail: [this.options.key, qty, this.wrapper]
          }));
        }
      }
    });
  
    return QtySelector;
  })();
  
  // theme.Slideshow handles all flickity based sliders
  // Child navigation is only setup to work on product images
  theme.Slideshow = (function() {
    var classes = {
      animateOut: 'animate-out',
      isPaused: 'is-paused',
      isActive: 'is-active'
    };
  
    var selectors = {
      allSlides: '.slideshow__slide',
      currentSlide: '.is-selected',
      wrapper: '.slideshow-wrapper',
      pauseButton: '.slideshow__pause'
    };
  
    var productSelectors = {
      thumb: '.product__thumb-item:not(.hide)',
      links: '.product__thumb-item:not(.hide) a',
      arrow: '.product__thumb-arrow'
    };
  
    var defaults = {
      adaptiveHeight: false,
      autoPlay: false,
      avoidReflow: false, // custom by Archetype
      childNav: null, // element. Custom by Archetype instead of asNavFor
      childNavScroller: null, // element
      childVertical: false,
      dragThreshold: 7,
      fade: false,
      friction: 0.8,
      initialIndex: 0,
      pageDots: false,
      pauseAutoPlayOnHover: false,
      prevNextButtons: false,
      rightToLeft: theme.config.rtl,
      selectedAttraction: 0.14,
      setGallerySize: true,
      wrapAround: true
    };
  
    function slideshow(el, args) {
      this.el = el;
      this.args = Object.assign({}, defaults, args);
  
      // Setup listeners as part of arguments
      this.args.on = {
        ready: this.init.bind(this),
        change: this.slideChange.bind(this),
        settle: this.afterChange.bind(this)
      };
  
      if (this.args.childNav) {
        this.childNavEls = this.args.childNav.querySelectorAll(productSelectors.thumb);
        this.childNavLinks = this.args.childNav.querySelectorAll(productSelectors.links);
        this.arrows = this.args.childNav.querySelectorAll(productSelectors.arrow);
        if (this.childNavLinks.length) {
          this.initChildNav();
        }
      }
  
      if (this.args.avoidReflow) {
        avoidReflow(el);
      }
  
      this.slideshow = new Flickity(el, this.args);
  
      if (this.args.autoPlay) {
        var wrapper = el.closest(selectors.wrapper);
        this.pauseBtn = wrapper.querySelector(selectors.pauseButton);
        if (this.pauseBtn) {
          this.pauseBtn.addEventListener('click', this._togglePause.bind(this));
        }
      }
  
      // Reset dimensions on resize
      window.on('resize', theme.utils.debounce(300, function() {
        this.resize();
      }.bind(this)));
  
      // Set flickity-viewport height to first element to
      // avoid awkward page reflows while initializing.
      // Must be added in a `style` tag because element does not exist yet.
      // Slideshow element must have an ID
      function avoidReflow(el) {
        if (!el.id) return;
        var firstChild = el.firstChild;
        while(firstChild != null && firstChild.nodeType == 3){ // skip TextNodes
          firstChild = firstChild.nextSibling;
        }
        var style = document.createElement('style');
        style.innerHTML = `#${el.id} .flickity-viewport{height:${firstChild.offsetHeight}px}`;
        document.head.appendChild(style);
      }
    }
  
    slideshow.prototype = Object.assign({}, slideshow.prototype, {
      init: function(el) {
        this.currentSlide = this.el.querySelector(selectors.currentSlide);
  
        // Optional onInit callback
        if (this.args.callbacks && this.args.callbacks.onInit) {
          if (typeof this.args.callbacks.onInit === 'function') {
            this.args.callbacks.onInit(this.currentSlide);
          }
        }
  
        if (window.AOS) { AOS.refresh() }
      },
  
      slideChange: function(index) {
        // Outgoing fade styles
        if (this.args.fade && this.currentSlide) {
          this.currentSlide.classList.add(classes.animateOut);
          this.currentSlide.addEventListener('transitionend', function() {
            this.currentSlide.classList.remove(classes.animateOut);
          }.bind(this));
        }
  
        // Match index with child nav
        if (this.args.childNav) {
          this.childNavGoTo(index);
        }
  
        // Optional onChange callback
        if (this.args.callbacks && this.args.callbacks.onChange) {
          if (typeof this.args.callbacks.onChange === 'function') {
            this.args.callbacks.onChange(index);
          }
        }
  
        // Show/hide arrows depending on selected index
        if (this.arrows && this.arrows.length) {
          this.arrows[0].classList.toggle('hide', index === 0);
          this.arrows[1].classList.toggle('hide', index === (this.childNavLinks.length - 1));
        }
      },
      afterChange: function(index) {
        // Remove all fade animation classes after slide is done
        if (this.args.fade) {
          this.el.querySelectorAll(selectors.allSlides).forEach(slide => {
            slide.classList.remove(classes.animateOut);
          });
        }
  
        this.currentSlide = this.el.querySelector(selectors.currentSlide);
  
        // Match index with child nav (in case slider height changed first)
        if (this.args.childNav) {
          this.childNavGoTo(this.slideshow.selectedIndex);
        }
      },
      destroy: function() {
        if (this.args.childNav && this.childNavLinks.length) {
          this.childNavLinks.forEach(a => {
            a.classList.remove(classes.isActive);
          });
        }
        this.slideshow.destroy();
      },
      _togglePause: function() {
        if (this.pauseBtn.classList.contains(classes.isPaused)) {
          this.pauseBtn.classList.remove(classes.isPaused);
          this.slideshow.playPlayer();
        } else {
          this.pauseBtn.classList.add(classes.isPaused);
          this.slideshow.pausePlayer();
        }
      },
      resize: function() {
        this.slideshow.resize();
      },
      play: function() {
        this.slideshow.playPlayer();
      },
      pause: function() {
        this.slideshow.pausePlayer();
      },
      goToSlide: function(i) {
        this.slideshow.select(i);
      },
      setDraggable: function(enable) {
        this.slideshow.options.draggable = enable;
        this.slideshow.updateDraggable();
      },
  
      initChildNav: function() {
        this.childNavLinks[this.args.initialIndex].classList.add('is-active');
  
        // Setup events
        this.childNavLinks.forEach((link, i) => {
          // update data-index because image-set feature may be enabled
          link.setAttribute('data-index', i);
  
          link.addEventListener('click', function(evt) {
            evt.preventDefault();
            this.goToSlide(this.getChildIndex(evt.currentTarget))
          }.bind(this));
          link.addEventListener('focus', function(evt) {
            this.goToSlide(this.getChildIndex(evt.currentTarget))
          }.bind(this));
          link.addEventListener('keydown', function(evt) {
            if (evt.keyCode === 13) {
              this.goToSlide(this.getChildIndex(evt.currentTarget))
            }
          }.bind(this));
        });
  
        // Setup optional arrows
        if (this.arrows.length) {
          this.arrows.forEach(arrow => {
            arrow.addEventListener('click', this.arrowClick.bind(this));
          });;
        }
      },
  
      getChildIndex: function(target) {
        return parseInt(target.dataset.index);
      },
  
      childNavGoTo: function(index) {
        this.childNavLinks.forEach(a => {
          a.classList.remove(classes.isActive);
        });
  
        var el = this.childNavLinks[index];
        el.classList.add(classes.isActive);
  
        if (!this.args.childNavScroller) {
          return;
        }
  
        if (this.args.childVertical) {
          var elTop = el.offsetTop;
          this.args.childNavScroller.scrollTop = elTop - 100;
        } else {
          var elLeft = el.offsetLeft;
          this.args.childNavScroller.scrollLeft = elLeft - 100;
        }
      },
  
      arrowClick: function(evt) {
        if (evt.currentTarget.classList.contains('product__thumb-arrow--prev')) {
          this.slideshow.previous();
        } else {
          this.slideshow.next();
        }
      }
    });
  
    return slideshow;
  })();
  
  /*============================================================================
    VariantAvailability
    - Cross out sold out or unavailable variants
    - To disable, set dynamicVariantsEnable to false in theme.liquid
    - Required markup:
      - class=variant-input-wrap to wrap select or button group
      - class=variant-input to wrap button/label
  ==============================================================================*/
  
  theme.VariantAvailability = (function() {
    var classes = {
      disabled: 'disabled'
    };
  
    function availability(args) {
      this.type = args.type;
      this.variantsObject = args.variantsObject;
      this.currentVariantObject = args.currentVariantObject;
      this.container = args.container;
      this.namespace = args.namespace;
  
      this.init();
    }
  
    availability.prototype = Object.assign({}, availability.prototype, {
      init: function() {
        this.container.on('variantChange' + this.namespace, this.setAvailability.bind(this));
  
        // Set default state based on current selected variant
        this.setAvailability(null, this.currentVariantObject);
      },
  
      setAvailability: function(evt, variant) {
        if (evt) {
          var variant = evt.detail.variant;
        }
  
        // Object to hold all options by value.
        // This will be what sets a button/dropdown as
        // sold out or unavailable (not a combo set as purchasable)
        var valuesToManage = {
          option1: [],
          option2: [],
          option3: []
        };
  
        var ignoreIndex = null;
        var availableVariants = this.variantsObject.filter(function(el) {
          if (!variant || variant.id === el.id) {
            return false;
          }
  
          if (variant.option2 === el.option2 && variant.option3 === el.option3) {
            return true;
          }
  
          if (variant.option1 === el.option1 && variant.option3 === el.option3) {
            return true;
          }
  
          if (variant.option1 === el.option1 && variant.option2 === el.option2) {
            return true;
          }
        });
  
        var variantObject = {
          variant: variant
        };
  
        var variants = Object.assign({}, {variant}, availableVariants);
  
        // Disable all options to start.
        // If coming from a variant change event, do not disable
        // options inside current index group
        this.container.querySelectorAll('.variant-input-wrap').forEach(group => {
          this.disableVariantGroup(group);
        });
  
        // Loop through each available variant to gather variant values
        for (var property in variants) {
          if (variants.hasOwnProperty(property)) {
            var item = variants[property];
            if (!item) {
              return;
            }
  
            var value1 = item.option1;
            var value2 = item.option2;
            var value3 = item.option3;
            var soldOut = item.available === false;
  
            if (value1 && ignoreIndex !== 'option1') {
              valuesToManage.option1.push({
                value: value1,
                soldOut: soldOut
              });
            }
            if (value2 && ignoreIndex !== 'option2') {
              valuesToManage.option2.push({
                value: value2,
                soldOut: soldOut
              });
            }
            if (value3 && ignoreIndex !== 'option3') {
              valuesToManage.option3.push({
                value: value3,
                soldOut: soldOut
              });
            }
          }
        }
  
        // Loop through all option levels and send each
        // value w/ args to function that determines to show/hide/enable/disable
        for (var [option, values] of Object.entries(valuesToManage)) {
          this.manageOptionState(option, values);
        }
      },
  
      manageOptionState: function(option, values) {
        var group = this.container.querySelector('.variant-input-wrap[data-index="'+ option +'"]');
  
        // Loop through each option value
        values.forEach(obj => {
          this.enableVariantOption(group, obj);
        });
      },
  
      enableVariantOptionByValue: function(array, index) {
        var group = this.container.querySelector('.variant-input-wrap[data-index="'+ index +'"]');
  
        for (var i = 0; i < array.length; i++) {
          this.enableVariantOption(group, array[i]);
        }
      },
  
      enableVariantOption: function(group, obj) {
        // Selecting by value so escape it
        var value = obj.value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');
  
        if (this.type === 'dropdown') {
          group.querySelector('option[value="'+ value +'"]').disabled = false;
        } else {
          var buttonGroup = group.querySelector('.variant-input[data-value="'+ value +'"]');
          var input = buttonGroup.querySelector('input');
          var label = buttonGroup.querySelector('label');
  
          // Variant exists - enable & show variant
          input.classList.remove(classes.disabled);
          label.classList.remove(classes.disabled);
  
          // Variant sold out - cross out option (remains selectable)
          if (obj.soldOut) {
            input.classList.add(classes.disabled);
            label.classList.add(classes.disabled);
          }
        }
      },
  
      disableVariantGroup: function(group) {
        if (this.type === 'dropdown') {
          group.querySelectorAll('option').forEach(option => {
            option.disabled = true;
          });
        } else {
          group.querySelectorAll('input').forEach(input => {
            input.classList.add(classes.disabled);
          });
          group.querySelectorAll('label').forEach(label => {
            label.classList.add(classes.disabled);
          });
        }
      }
  
    });
  
    return availability;
  })();
  
  // Video modal will auto-initialize for any anchor link that points to YouTube
  // MP4 videos must manually be enabled with:
  //   - .product-video-trigger--mp4 (trigger button)
  //   - .product-video-mp4-sound video player element (cloned into modal)
  //     - see media.liquid for example of this
  theme.videoModal = function() {
    var youtubePlayer;
  
    var videoHolderId = 'VideoHolder';
    var selectors = {
      youtube: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]',
      mp4Trigger: '.product-video-trigger--mp4',
      mp4Player: '.product-video-mp4-sound'
    };
  
    var youtubeTriggers = document.querySelectorAll(selectors.youtube);
    var mp4Triggers = document.querySelectorAll(selectors.mp4Trigger);
  
    if (!youtubeTriggers.length && !mp4Triggers.length) {
      return;
    }
  
    var videoHolderDiv = document.getElementById(videoHolderId);
  
    if (youtubeTriggers.length) {
      theme.LibraryLoader.load('youtubeSdk');
    }
  
    var modal = new theme.Modals('VideoModal', 'video-modal', {
      closeOffContentClick: true,
      bodyOpenClass: ['modal-open', 'video-modal-open'],
      solid: true
    });
  
    youtubeTriggers.forEach(btn => {
      btn.addEventListener('click', triggerYouTubeModal);
    });
  
    mp4Triggers.forEach(btn => {
      btn.addEventListener('click', triggerMp4Modal);
    });
  
    document.addEventListener('modalClose.VideoModal', closeVideoModal);
  
    function triggerYouTubeModal(evt) {
      // If not already loaded, treat as normal link
      if (!theme.config.youTubeReady) {
        return;
      }
  
      evt.preventDefault();
      emptyVideoHolder();
  
      modal.open(evt);
  
      var videoId = getYoutubeVideoId(evt.currentTarget.getAttribute('href'));
      youtubePlayer = new theme.YouTube(
        videoHolderId,
        {
          videoId: videoId,
          style: 'sound',
          events: {
            onReady: onYoutubeReady
          }
        }
      );
    }
  
    function triggerMp4Modal(evt) {
      emptyVideoHolder();
  
      var el = evt.currentTarget;
      var player = el.parentNode.querySelector(selectors.mp4Player);
  
      // Clone video element and place it in the modal
      var playerClone = player.cloneNode(true);
      playerClone.classList.remove('hide');
  
      videoHolderDiv.append(playerClone);
      modal.open(evt);
  
      // Play new video element
      videoHolderDiv.querySelector('video').play();
    }
  
    function onYoutubeReady(evt) {
      evt.target.unMute();
      evt.target.playVideo();
    }
  
    function getYoutubeVideoId(url) {
      var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      var match = url.match(regExp);
      return (match&&match[7].length==11)? match[7] : false;
    }
  
    function emptyVideoHolder() {
      videoHolderDiv.innerHTML = '';
    }
  
    function closeVideoModal() {
      if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
        youtubePlayer.destroy();
      } else {
        emptyVideoHolder();
      }
    }
  };
  
  

  theme.ProductScreen = (function() {
    var originalTitle = document.title;
    var namespace = 'productscreen';
    var windowPosition = 0;
    var page = document.getElementById('MainContent');
  
    var config = {
      close: '.js-screen-close',
      openClass: 'screen-layer--is-active',
      closeSlideAnimate: ['screen-layer--is-sliding'],
      bodyOpenClass: 'screen-layer-open',
      bodyClosingClass: ['screen-layer-closing'],
      bodyCloseAnimate: ['screen-layer-closing', 'screen-layer-animating'],
      loaderStart: 200,
      pullToCloseThreshold: -100
    }
  
    function ProductScreen(id, name) {
      this.id = id;
      this.screen = document.getElementById(id);
  
      if (!this.screen) {
        return;
      }
  
      this.nodes = {
        loader: document.getElementById('OverscrollLoader').querySelector('.icon-loader__path'),
        screenContent: this.screen.querySelector('.screen-layer__inner'),
        photoswipe: document.querySelector('.pswp')
      };
  
      this.title = this.screen.dataset.productTitle;
      this.openBtnClass = '.js-screen-open-' + name;
  
      this.initalized = false; // opened at least once
      this.isOpen = false;
      this.focusOnOpen = config.focusOnOpen ? this.screen.querySelector(config.focusOnOpen) : this.screen;
  
      this.init();
    }
  
    ProductScreen.prototype = Object.assign({}, ProductScreen.prototype, {
      init: function() {
        var openBtns = document.querySelectorAll(this.openBtnClass);
  
        openBtns.forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
          btn.addEventListener('click', this.open.bind(this));
        });
  
        var closeBtns = this.screen.querySelectorAll(config.close);
        closeBtns.forEach(btn => {
          btn.on('click.' + namespace, function(evt) {
            this.close(false, { noAnimate: true, back: true });
          }.bind(this));
        });
  
        // Close screen if product added to sticky cart
        if (theme.settings.cartType === 'sticky') {
          document.addEventListener('ajaxProduct:added:' + this.id, function() {
            theme.headerNav.toggleThumbMenu(false, true);
            var args = { back: true };
            this.close(false, args);
          }.bind(this));
  
          document.addEventListener('ajaxProduct:error:' + this.id, function() {
            if (this.initalized) {
              this.open();
            }
          }.bind(this));
        }
      },
  
      open: function(evt, data) {
        // Update reference to screen in case filters reloaded it
        this.screen = document.getElementById(this.id);
  
        // Keep track if modal was opened from a click, or called by another function
        var externalCall = false;
        var args = {
          updateCurrentPath: data ? data.updateCurrentPath : true
        };
  
        if (this.isOpen) {
          return;
        }
  
        // Prevent following href if link is clicked
        if (evt) {
          evt.preventDefault();
        } else {
          externalCall = true;
        }
  
        // Without this, the modal opens, the click event bubbles up to nodes.page
        // which closes the modal.
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
          // save the source of the click, we'll focus to this on close
          this.activeSource = evt.currentTarget;
        }
  
        if (this.isOpen && !externalCall) {
          this.close();
        }
  
        windowPosition = window.scrollY;
  
        theme.utils.prepareTransition(this.screen, function() {
          this.screen.classList.add(config.openClass);
        }.bind(this));
  
        document.documentElement.classList.add(config.bodyOpenClass);
        document.body.classList.add(config.bodyOpenClass);
        this.nodes.screenContent.scrollTo(0,0);
        window.scrollTo(0,0);
  
        theme.a11y.trapFocus({
          container: this.screen,
          elementToFocus: this.focusOnOpen,
          namespace: namespace
        });
  
        if (this.activeSource && this.activeSource.hasAttribute('aria-expanded')) {
          this.activeSource.setAttribute('aria-expanded', 'true');
        }
  
        var newUrl = this.activeSource.dataset.url;
  
        document.dispatchEvent(new CustomEvent('productModalOpen.' + this.id));
        document.dispatchEvent(new CustomEvent('newPopstate', {
          detail: {
            screen: this,
            url: newUrl,
            updateCurrentPath: args.updateCurrentPath
          }
        }));
  
        this.initalized = true;
        this.isOpen = true;
        document.title = this.title;
  
        // Trigger Google Analytics page view if enabled
        if (window.ga) { ga('send', 'pageview', { page: newUrl }) }
  
        this.bindEvents();
      },
  
      close: function(evt, args) {
        var evtData = args ? args : (evt ? evt.data : null);
        var goBack = evtData ? evtData.back : false;
        var noAnimate = (evtData && evtData.noAnimate) ? true : false;
        document.body.removeAttribute('style');
        this.nodes.loader.style.strokeDashoffset = config.loaderStart;
  
        if (goBack) {
          document.dispatchEvent(new CustomEvent('newPopstate', {
            detail: {
              screen: this,
              back: true
            }
          }));
        }
  
        var closeClass = noAnimate ? [] : config.closeSlideAnimate;
        var bodyCloseClass = noAnimate ? config.bodyClosingClass : config.bodyCloseAnimate;
  
        // Don't close if already closed
        if (!this.isOpen) {
          return;
        }
  
        // deselect any focused form elements
        document.activeElement.blur();
  
        theme.utils.prepareTransition(this.screen, function() {
          this.screen.classList.remove(config.openClass);
          this.screen.classList.add(...closeClass);
          this.screen.classList.remove('is-transitioning');
        }.bind(this));
  
        document.documentElement.classList.remove(config.bodyOpenClass);
        document.body.classList.remove(config.bodyOpenClass);
        document.documentElement.classList.add(...bodyCloseClass);
        document.body.classList.add(...bodyCloseClass);
  
        window.setTimeout(function() {
          this.screen.classList.remove(...closeClass);
          document.documentElement.classList.remove(...bodyCloseClass);
          document.body.classList.remove(...bodyCloseClass);
          window.scrollTo(0, windowPosition);
        }.bind(this), 500); // duration of css animation
  
        theme.a11y.removeTrapFocus({
          container: this.screen,
          namespace: namespace
        });
  
        if (this.activeSource && this.activeSource.hasAttribute('aria-expanded')) {
          this.activeSource.setAttribute('aria-expanded', 'false');
          this.activeSource.focus();
        }
  
        document.body.dispatchEvent(new CustomEvent('productModalClose'));
        document.body.dispatchEvent(new CustomEvent('productModalClose.' + this.id));
  
        window.scrollTo(0, windowPosition);
  
        this.isOpen = false;
        document.title = originalTitle;
  
        if (window.ga) { ga('send', 'pageview') }
  
        this.unbindEvents();
      },
  
      bindEvents: function() {
        // Pressing escape closes modal, unless the photoswipe screen is open
        window.on('keyup.' + namespace, function(evt) {
          if (evt.keyCode === 27) {
            if (this.nodes.photoswipe.classList.contains('pswp--open')) {
              return;
            }
            if (document.body.classList.contains('js-drawer-open')) {
              return;
            }
  
            this.close(false, { back: true });
          }
        }.bind(this));
  
        // If scrolling up while at top, close modal
        var bgAmount = 0;
        var loaderAmount = 0;
  
        window.on('touchmove.' + namespace, theme.utils.throttle(15, function() {
          var pos = window.scrollY;
          if (pos >= 0) {
            return;
          }
  
          bgAmount = -(pos/100);
          document.body.style.background = 'rgba(0,0,0,' + bgAmount + ')';
  
          // stroke fills from 200-0 (0 = full)
          loaderAmount = config.loaderStart + (pos * 2); // pos is negative number
  
          if (pos <= config.pullToCloseThreshold) {
            loaderAmount = 0;
          }
  
          this.nodes.loader.style.strokeDashoffset = loaderAmount;
        }.bind(this)));
  
        window.on('touchend.' + namespace, function() {
          var pos = window.scrollY;
          if (pos < config.pullToCloseThreshold) {
            var args = { back: true };
            this.close(false, args);
          }
        }.bind(this));
      },
  
      unbindEvents: function() {
        window.off('keyup.' + namespace);
        window.off('touchmove.' + namespace);
        window.off('touchend.' + namespace);
      }
    });
  
    return ProductScreen;
  })();
  
  /*
    Quick shop modals, or product screens, live inside
    product-grid-item markup until page load, where they're
    moved to #ProductScreens at the bottom of the page
   */
  
  theme.QuickShopScreens = (function() {
    var startingUrl = window.location.pathname;
    var currentPath = startingUrl;
    var prevPath = null;
    var currentScreen = null;
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  
    var selectors = {
      screensWrap: '#ProductScreens',
      screens: '[data-product-id]',
      trigger: '.quick-product__btn'
    };
  
    var activeIds = [];
  
    function init(container) {
      if (!theme.settings.quickView) {
        return;
      }
  
      var productIds = getProductIds();
      initProductScreens(productIds);
      initHistoryWatcher();
    }
  
    function initHistoryWatcher() {
      // No need to adjust URL in the editor since it handles the navigation
      if (Shopify.designMode) {
        return;
      }
  
      // Listen for product screens opening
      document.addEventListener('newPopstate', function(evt) {
        if (!evt.detail) {
          return;
        }
  
        var data = evt.detail;
  
        currentScreen = data.screen;
        // Manually trigger back, comes from esc key or close btns
        if (data.back) {
          prevPath = location.pathname;
          currentPath = startingUrl;
          history.pushState({}, '', startingUrl);
        }
  
        if (data.url) {
          if (data.updateCurrentPath) {
            prevPath = location.pathname;
            currentPath = data.url;
            history.pushState({}, '', data.url);
          }
        }
      });
  
      window.addEventListener('popstate', function(evt) {
        var goToUrl = false;
        prevPath = currentPath;
  
        // Hash change or no change, let browser take over
        if (location.pathname === currentPath) {
          return;
        }
  
        prevPath = currentPath;
        currentPath = location.pathname;
  
        // Back to where we started. Close existing screen if open
        if (location.pathname === startingUrl) {
          if (currentScreen && currentScreen.isOpen) {
            closeScreen(currentScreen);
          }
          return;
        }
  
        // Opening product
        if (location.pathname.indexOf('/products/') !== -1) {
          if (currentScreen) {
            currentScreen.open();
          } else {
            // No screen sent to function, trigger new click
            var btn = document.querySelector('.quick-product__btn[href="'+ location.pathname +'"]');
            btn.dispatchEvent(new Event('click'), { updateCurrentPath: false });
          }
  
          return;
        }
  
        if (evt.originalEvent && evt.originalEvent.state) {
          if (currentScreen && currentScreen.isOpen) {
            closeScreen(currentScreen);
            history.replaceState({}, '', startingUrl);
            return;
          }
  
          goToUrl = true;
        } else {
          if (currentScreen) {
            if (currentScreen.isOpen) {
              closeScreen(currentScreen);
              return;
            }
          } else {
            // No state/modal. Navigate to where browser wants
            goToUrl = true;
          }
        }
  
        // Fallback if none of our conditions are met
        if (goToUrl) {
          window.location.href = location.href;
        }
      }.bind(this));
    }
  
    function closeScreen(screen) {
      screen.close();
      currentScreen = null;
      window.dispatchEvent(new Event('resize'));
    }
  
    function getProductIds(scope) {
      var ids = [];
  
      var triggers = scope ? scope.querySelectorAll(selectors.trigger) : document.querySelectorAll(selectors.trigger);
  
      triggers.forEach(trigger => {
        var id = trigger.dataset.productId;
  
        // If another identical modal exists, remove from DOM
        if (ids.indexOf(id) > -1) {
          var duplicate = document.querySelector('.screen-layer--product[data-product-id="' + id + '"]');
          if (duplicate) {
            duplicate.parentNode.removeChild(duplicate);
          }
          return;
        }
  
        ids.push(id);
      });
  
      return ids;
    }
  
    function getIdsFromTriggers(triggers) {
      var ids = [];
  
      triggers.forEach(trigger => {
        var id = trigger.dataset.productId;
        ids.push(id);
      });
  
      return ids;
    }
  
    function initProductScreens(ids) {
      var screenId;
      var screenLayer;
      var screens = document.createDocumentFragment();
  
      // Init screens if they're not duplicates
      for (var i = 0; i < ids.length; i++) {
        if (activeIds.indexOf(ids[i]) === -1) {
          screenId = 'ProductScreen-' + ids[i];
          screenLayer = document.getElementById(screenId);
  
          if (screenLayer) {
            screens.appendChild(screenLayer);
            activeIds.push(ids[i]);
          }
        }
      }
  
      // Append screens to bottom of page
      document.querySelector(selectors.screensWrap).appendChild(screens);
  
      // Init active screens once they're appended
      for (var i = 0; i < activeIds.length; i++) {
        screenId = 'ProductScreen-' + activeIds[i];
        new theme.ProductScreen(screenId, 'product-' + activeIds[i]);
      }
    }
  
    // Section unloaded in theme editor.
    // Check if product exists in any other area
    // of the page, remove other's section.instance
    function unload(container) {
      if (!theme.settings.quickView) {
        return;
      }
  
      var removeIds = [];
      var productIds = getProductIds(container);
  
      // Get ids from buttons not in removed section
      var activeButtons = document.querySelectorAll(selectors.trigger);
      var stillActiveIds = getIdsFromTriggers(activeButtons);
  
      // If ID exists on active button, do not add to IDs to remove
      for (var i = 0; i < productIds.length; i++) {
        var id = productIds[i];
        if (stillActiveIds.indexOf(id) === -1) {
          removeIds.push(id);
        }
      }
  
      for (var i = 0; i < removeIds.length; i++) {
        sections._removeInstance(removeIds[i]);
      }
    }
  
    // Section container is sent, so must re-scrape for product IDs
    function reInit(container) {
      if (!theme.settings.quickView) {
        return;
      }
  
      var newProductIds = getProductIds(container);
      initProductScreens(newProductIds);
      removeDuplicateModals(newProductIds, container);
  
      // Re-register product templates in quick view modals.
      // Will not double-register.
      var screens = document.getElementById('ProductScreens');
      theme.sections.register('product-template', theme.Product, screens);
    }
  
    function removeDuplicateModals(ids, container) {
      for (var i = 0; i < ids.length; i++) {
        var duplicate = container.querySelector('.screen-layer--product[data-product-id="' + ids[i] + '"]');
        if (duplicate) {
          duplicate.parentNode.removeChild(duplicate);
        }
      }
    }
  
    return {
      init: init,
      unload: unload,
      reInit: reInit
    };
  })();
  
  theme.HoverProductGrid = (function() {
    var selectors = {
      product: '.grid-product',
      slider: '.product-slider',
    };
  
    function HoverProductGrid(container) {
      this.container = container;
      this.sectionId = this.container.getAttribute('data-section-id');
      this.namespace = '.product-image-slider-' + this.sectionId;
      this.activeIds = [];
      this.allSliders = {};
  
      if (!theme.settings.hoverProductGrid) {
        return;
      }
  
      this.products = container.querySelectorAll(selectors.product);
      this.slidersMobile = container.dataset.productSlidersMobile;
  
      // No products means no sliders
      if (this.products.length === 0) {
        return;
      }
  
      theme.promiseStylesheet().then(function() {
        this.init();
      }.bind(this));
    }
  
    HoverProductGrid.prototype = Object.assign({}, HoverProductGrid.prototype, {
      init: function() {
        this.destroyAllSliders();
        this.setupEventType();
        this.listnerSetup();
      },
  
      setupEventType: function() {
        this.products.forEach(prod => {
          prod.off('mouseenter' + this.namespace);
          prod.off('mouseout' + this.namespace);
        });
  
        window.off('scroll' + this.namespace);
  
        if (theme.config.bpSmall) {
          if (this.slidersMobile) {
            this.inViewSliderInit();
          }
        } else {
          this.mouseSliderInit();
        }
      },
  
      listnerSetup: function() {
        document.addEventListener('matchSmall', function() {
          this.destroyAllSliders();
          this.setupEventType();
        }.bind(this));
        document.addEventListener('unmatchSmall', function() {
          this.destroyAllSliders();
          this.setupEventType();
        }.bind(this));
      },
  
      inViewSliderInit: function() {
        this.products.forEach(prod => {
          var observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              var slider = prod.querySelector(selectors.slider);
              if (theme.config.bpSmall) {
                if (entry.isIntersecting) {
                  this.initSlider(slider);
                } else {
                  this.destroySlider(slider);
                }
              }
            });
          }, {threshold: 1});
  
          observer.observe(prod);
        });
      },
  
      mouseSliderInit: function() {
        this.products.forEach(prod => {
          var slider = prod.querySelector(selectors.slider);
  
          prod.on('mouseenter' + this.namespace, function() {
            this.initSlider(slider);
          }.bind(this));
  
          prod.on('mouseleave' + this.namespace, function(evt) {
            this.destroySlider(slider);
          }.bind(this));
        });
      },
  
      initSlider: function(slider) {
        if (!slider.dataset || slider.dataset.imageCount < 2) {
          return;
        }
  
        if (this.activeIds.indexOf(slider.dataset.id) !== -1) {
          return;
        }
  
        slider.classList.add('product-slider--init');
        this.allSliders[slider.dataset.id] = new theme.Slideshow(slider, {
          autoPlay: 1050,
          fade: true,
          avoidReflow: true
        });
  
        this.activeIds.push(slider.dataset.id);
      },
  
      destroySlider: function(slider) {
        if (!slider.dataset || slider.dataset.imageCount < 2) {
          return;
        }
  
        var alreadyActive = this.activeIds.indexOf(slider.dataset.id);
        if (alreadyActive !== -1) {
          this.activeIds.splice(alreadyActive, 1);
  
          var flickity = this.allSliders[slider.dataset.id];
          if (flickity && typeof flickity.destroy === 'function') {
            flickity.destroy();
          }
        }
      },
  
      destroyAllSliders: function() {
        this.products.forEach(prod => {
          var slider = prod.querySelector(selectors.slider);
          this.destroySlider(slider);
        });
      }
    });
  
    return HoverProductGrid;
  })();
  
  theme.slideNav = (function() {
  
    var selectors = {
      container: '#PageContainer',
      navWrapper: '.slide-nav__overflow',
      nav: '#SlideNav',
      toggleBtn: '.js-toggle-slide-nav',
      subNavToggleBtn: '.js-toggle-submenu',
      thumbNavToggle: '.site-nav__thumb-button'
    };
  
    var classes = {
      subNavLink: 'slide-nav__sublist-link',
      return: 'slide-nav__return-btn',
      isActive: 'is-active',
      isOpen: 'js-menu--is-open',
      subNavShowing: 'sub-nav--is-open',
      thirdNavShowing: 'third-nav--is-open'
    };
  
    var namespace = '.slideNav';
  
    var isTransitioning;
    var activeSubNav;
    var activeTrigger;
    var pageSlide = true;
    var menuLevel = 1;
    var container;
    var navWrapper;
    var toggleBtns;
    var subNavToggleBtns;
    var activeMenuToggle = null;
  
    function init() {
      var thumbNavToggle = document.querySelector(selectors.thumbNavToggle);
      if (thumbNavToggle) {
        pageSlide = false;
      }
  
      container = document.querySelector(selectors.container);
      navWrapper = document.querySelector(selectors.navWrapper);
  
      toggleBtns = document.querySelectorAll(selectors.toggleBtn);
      subNavToggleBtns = document.querySelectorAll(selectors.subNavToggleBtn);
  
      toggleBtns.forEach(btn => {
        btn.on('click' + namespace, toggleNav);
      });
  
      subNavToggleBtns.forEach(btn => {
        btn.on('click' + namespace, toggleSubNav);
      });
    }
  
    function toggleNav(evt) {
      activeMenuToggle = evt.currentTarget;
      if (activeMenuToggle.classList.contains(classes.isActive)) {
        closeNav();
      } else {
        openNav();
      }
    }
  
    function openNav(evt) {
      toggleBtns.forEach(btn => {
        btn.classList.add(classes.isActive);
      });
  
      theme.utils.prepareTransition(navWrapper, function() {
        navWrapper.classList.add(classes.isOpen);
      });
  
      if (pageSlide) {
        var navWrapperHeight = document.querySelector(selectors.navWrapper).clientHeight;
        container.style.transform = 'translate3d(0, ' + navWrapperHeight + 'px, 0)';
      }
  
      navWrapper.setAttribute('tabindex', '-1');
      navWrapper.focus();
  
      // close on escape
      window.on('keyup' + namespace, function(evt) {
        if (evt.keyCode === 27) {
          closeNav();
        }
      });
    }
  
    function closeNav() {
      toggleBtns.forEach(btn => {
        btn.classList.remove(classes.isActive);
      });
  
      theme.utils.prepareTransition(navWrapper, function() {
        navWrapper.classList.remove(classes.isOpen);
      });
  
      if (pageSlide) {
        container.removeAttribute('style');
      }
  
      activeMenuToggle.focus();
      activeMenuToggle = null;
  
      window.off('keyup' + namespace);
    }
  
    function toggleSubNav(evt) {
      if (isTransitioning) {
        return;
      }
  
      var toggleBtn = evt.currentTarget;
      var isReturn = toggleBtn.classList.contains(classes.return);
      isTransitioning = true;
  
      if (isReturn) {
        // Close all subnavs by removing active class on buttons
        var btns = document.querySelectorAll(selectors.subNavToggleBtn + '[data-level="' + (menuLevel - 1) + '"]');
        btns.forEach(btn => {
          btn.classList.remove(classes.isActive);
        });
  
        var menus = document.querySelectorAll('.slide-nav__dropdown[data-level="' + (menuLevel) + '"]');
        menus.forEach(menu => {
          theme.utils.prepareTransition(menu, function() {
            menu.classList.remove(classes.isActive);
          });
        });
  
        if (activeTrigger) {
          activeTrigger.classList.remove(classes.isActive);
        }
      } else {
        toggleBtn.classList.add(classes.isActive);
  
        var dropdown = toggleBtn.nextElementSibling;
        theme.utils.prepareTransition(dropdown, function() {
          dropdown.classList.add(classes.isActive);
        });
      }
  
      activeTrigger = toggleBtn;
  
      goToSubnav(toggleBtn.dataset.target);
    }
  
    function goToSubnav(target) {
      var targetMenu = target
        ? document.querySelector('.slide-nav__dropdown[data-parent="' + target + '"]')
        : document.querySelector(selectors.nav);
  
      menuLevel = targetMenu.dataset.level ? parseInt(targetMenu.dataset.level) : 1;
  
      activeSubNav = targetMenu;
  
      // Unused?
      // var $elementToFocus = target
      //   ? $targetMenu.find('.' + classes.subNavLink + ':first')
      //   : $activeTrigger;
  
      var translateMenuHeight = targetMenu.clientHeight;
  
      var openNavClass =
        menuLevel > 2 ? classes.thirdNavShowing : classes.subNavShowing;
  
      navWrapper.style.height = translateMenuHeight + 'px';
      navWrapper.classList.remove(classes.thirdNavShowing);
      navWrapper.classList.add(openNavClass);
  
      if (!target) {
        // Show top level nav
        navWrapper.classList.remove(classes.thirdNavShowing);
        navWrapper.classList.remove(classes.subNavShowing);
      }
  
      isTransitioning = false;
  
      // Match height of subnav
      if (pageSlide) {
        container.style.transform = 'translate3d(0, ' + translateMenuHeight + 'px, 0)';
      }
    }
  
    function unload() {
      window.off(namespace);
    }
  
    return {
      init: init,
      unload: unload
    };
  })();
  
  theme.promiseStylesheet = function(stylesheet) {
    var stylesheetUrl = stylesheet || theme.stylesheet;
  
    if (typeof this.stylesheetPromise === 'undefined') {
      this.stylesheetPromise = new Promise(function(resolve) {
        var link = document.querySelector('link[href="' + stylesheetUrl + '"]');
  
        if (link.loaded) {
          resolve();
          return;
        }
  
        // This doesn't work on Firefox consistently
        link.addEventListener('load', function() {
          setTimeout(resolve, 0);
        });
  
        // So use a forced timeout to resolve on Firefox
        setTimeout(resolve, 1);
      });
    }
  
    return this.stylesheetPromise;
  }
  
  window.onpageshow = function(evt) {
    // Removes unload class when returning to cached page
    if (evt.persisted) {
      document.body.classList.remove('unloading');
      document.querySelectorAll('.cart__checkout').forEach(el => {
        el.classList.remove('btn--loading');
      });
      document.querySelectorAll('#StickySubmit').forEach(btn => {
        btn.classList.remove('btn--loading');
      });
    }
  
    // Reset scroll position when coming from back button
    var historyPage = event.persisted || (typeof window.performance != 'undefined' && window.performance.navigation && window.performance.navigation.type === 2);
    if (historyPage) {
      theme.resetScrollPosition();
    }
  };
  
  theme.resetScrollPosition = function() {
    if (!theme.config.hasSessionStorage) { return; }
    var pathName = document.location.pathname;
  
    if (sessionStorage['scrollPosition_' + pathName]) {
      window.scrollTo(0, sessionStorage.getItem('scrollPosition_' + pathName));
    }
  };
  
  theme.storeScrollPositionOnUnload = function() {
    if (!theme.config.hasSessionStorage) { return; }
    var eventName = theme.config.isSafari ? 'pagehide' : 'beforeunload';
  
    window.addEventListener(eventName, function (event) {
      var pos = window.scrollY;
  
      sessionStorage.setItem('scrollPosition_' + document.location.pathname, pos.toString());
    });
  };
  
  theme.pageTransitions = function() {
    if (document.body.dataset.transitions === 'true') {
  
      // Hack test to fix Safari page cache issue.
      // window.onpageshow doesn't always run when navigating
      // back to the page, so the unloading class remains, leaving
      // a white page. Setting a timeout to remove that class when leaving
      // the page actually finishes running when they come back.
      if (theme.config.isSafari) {
        document.querySelectorAll('a').forEach(a => {
          window.setTimeout(function() {
            document.body.classList.remove('unloading');
          }, 1200);
        });
      }
  
      // Add disable transition class to malito, anchor, and YouTube links
      // Add disable transition class to various link types
      document.querySelectorAll('a[href^="mailto:"], a[href^="#"], a[target="_blank"], a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[download]').forEach(el => {
        el.classList.add('js-no-transition');
      });
  
      document.querySelectorAll('a:not(.js-no-transition)').forEach(el => {
        el.addEventListener('click', function(evt) {
          if (evt.metaKey) return true;
          var src = el.getAttribute('href');
  
          // Bail if it's a hash link
          if(src.indexOf(location.pathname) >= 0 && src.indexOf('#') >= 0) {
            return true;
          }
  
          evt.preventDefault();
          document.body.classList.add('unloading');
          window.setTimeout(function() {
            location.href = src;
          }, 50);
        });
      });
    }
  };
  
  theme.headerNav = (function() {
  
    var selectors = {
      wrapper: '.header-wrapper',
      siteHeader: '.site-header',
      logo: '.site-header__logo img',
      navItems: '.site-nav__item',
      navLinks: '.site-nav__link',
      navLinksWithDropdown: '.site-nav__link--has-dropdown',
      navDropdownLinks: '.site-nav__dropdown-link--second-level',
      thumbMenu: '.site-nav__thumb-menu'
    };
  
    var classes = {
      hasDropdownClass: 'site-nav--has-dropdown',
      hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
      dropdownActive: 'is-focused',
      stickyCartActive: 'body--sticky-cart-open',
      overlayEnabledClass: 'header-wrapper--overlay',
      overlayedClass: 'is-light',
      thumbMenuInactive: 'site-nav__thumb-menu--inactive',
      stickyClass: 'site-header--sticky',
      overlayStickyClass: 'header-wrapper--sticky',
      openTransitionClass: 'site-header--opening'
    };
  
    var config = {
      namespace: '.siteNav',
      overlayHeader: false,
      stickyActive: false,
      forceStickyOnMobile: false,
      forceCloseThumbNav: false
    };
  
    // Elements used in resize functions, defined in init
    var wrapper;
    var siteHeader;
  
    function init() {
      wrapper = document.querySelector(selectors.wrapper);
      siteHeader = document.querySelector(selectors.siteHeader);
  
      // Reset config
      theme.settings.overlayHeader = (siteHeader.dataset.overlay === 'true');
      config.stickyActive = false;
  
      accessibleDropdowns();
      var searchModal = new theme.Modals('SearchModal', 'search-modal', {
        closeOffContentClick: false,
        focusIdOnOpen: 'SearchModalInput'
      });
  
      // One listener for all header-related resize and load functions
      window.on('resize' + config.namespace, theme.utils.debounce(150, headerResize));
      window.on('load' + config.namespace, headerLoad);
  
      // Determine type of header:
        // desktop: sticky bar | sticky button | top only
        // mobile: always sticky button
      setHeaderStyle();
  
      // Sticky menu (bar or thumb) on scroll
      window.on('scroll' + config.namespace, theme.utils.throttle(150, stickyMenuOnScroll));
      // Make sure it fires after scrolling, to be safe and sure
      // the height is properly set
      window.on('scroll' + config.namespace, theme.utils.debounce(150, stickyMenuOnScroll));
  
      // Make sure sticky nav appears after header is reloaded in editor
      if (Shopify.designMode) {
        window.dispatchEvent(new Event('resize'));
      }
    }
  
    function headerLoad() {
      resizeLogo();
      initStickyThumbMenu();
  
      if (config.headerStyle === 'bar') {
        initStickyBarMenu();
      }
    }
  
    function headerResize() {
      resizeLogo();
      setHeaderStyle();
  
      if (config.headerStyle === 'bar') {
        stickyHeaderHeight();
      }
    }
  
    function setHeaderStyle() {
      if (theme.config.bpSmall) {
        config.headerStyle = 'button';
      } else {
        config.headerStyle = wrapper.dataset.headerStyle;
      }
  
      config.stickyThreshold = config.headerStyle === 'button' ? 100 : 250;
  
      if (config.headerStyle !== 'button') {
        toggleThumbMenu(false);
      }
    }
  
    function resizeLogo() {
      document.querySelectorAll(selectors.logo).forEach(logo => {
        var logoWidthOnScreen = logo.clientWidth;
        var containerWidth = logo.closest('.header-item').clientWidth;
  
        // If image exceeds container, let's make it smaller
        if (logoWidthOnScreen > containerWidth) {
          logo.style.maxWidth = containerWidth;
        }
        else {
          logo.removeAttribute('style')
        }
      });
    }
  
    function accessibleDropdowns() {
      var hasActiveDropdown = false;
      var hasActiveSubDropdown = false;
      var closeOnClickActive = false;
  
      // Touch devices open dropdown on first click, navigate to link on second
      if (theme.config.isTouch) {
        document.querySelectorAll(selectors.navLinksWithDropdown).forEach(el => {
          el.on('touchend' + config.namespace, function(evt) {
            var parent = evt.currentTarget.parentNode;
            if (!parent.classList.contains(classes.dropdownActive)) {
              evt.preventDefault();
              closeDropdowns();
              openFirstLevelDropdown(evt.currentTarget);
            } else {
              window.location.replace(evt.currentTarget.getAttribute('href'));
            }
          });
        });
      }
  
      // Open/hide top level dropdowns
      document.querySelectorAll(selectors.navLinks).forEach(el => {
        el.on('focusin' + config.namespace, accessibleMouseEvent);
        el.on('mouseover' + config.namespace, accessibleMouseEvent);
        el.on('mouseleave' + config.namespace, closeDropdowns);
      });
  
      document.querySelectorAll(selectors.navDropdownLinks).forEach(el => {
        if (theme.config.isTouch) {
          el.on('touchend' + config.namespace, function(evt) {
            var parent = evt.currentTarget.parentNode;
  
            // Open third level menu or go to link based on active state
            if (parent.classList.contains(classes.hasSubDropdownClass)) {
              if (!parent.classList.contains(classes.dropdownActive)) {
                evt.preventDefault();
                closeThirdLevelDropdown();
                openSecondLevelDropdown(evt.currentTarget);
              } else {
                window.location.replace(evt.currentTarget.getAttribute('href'));
              }
            } else {
              // No third level nav, go to link
              window.location.replace(evt.currentTarget.getAttribute('href'));
            }
          });
        }
  
        // Open/hide sub level dropdowns
        el.on('focusin' + config.namespace, function(evt) {
          closeThirdLevelDropdown();
          openSecondLevelDropdown(evt.currentTarget, true);
        })
      });
  
      function accessibleMouseEvent(evt) {
        if (hasActiveDropdown) {
          closeSecondLevelDropdown();
        }
  
        if (hasActiveSubDropdown) {
          closeThirdLevelDropdown();
        }
  
        openFirstLevelDropdown(evt.currentTarget);
      }
  
      // Private dropdown functions
      function openFirstLevelDropdown(el) {
        var parent = el.parentNode;
        if (parent.classList.contains(classes.hasDropdownClass)) {
          parent.classList.add(classes.dropdownActive);
          hasActiveDropdown = true;
        }
  
        if (!theme.config.isTouch) {
          if (!closeOnClickActive) {
            var eventType = theme.config.isTouch ? 'touchend' : 'click';
            closeOnClickActive = true;
            document.documentElement.on(eventType + config.namespace, function() {
              closeDropdowns();
              document.documentElement.off(eventType + config.namespace);
              closeOnClickActive = false;
            }.bind(this));
          }
        }
      }
  
      function openSecondLevelDropdown(el, skipCheck) {
        var parent = el.parentNode;
        if (parent.classList.contains(classes.hasSubDropdownClass) || skipCheck) {
          parent.classList.add(classes.dropdownActive);
          hasActiveSubDropdown = true;
        }
      }
  
      function closeDropdowns() {
        closeSecondLevelDropdown();
        closeThirdLevelDropdown();
      }
  
      function closeSecondLevelDropdown() {
        document.querySelectorAll(selectors.navItems).forEach(el => {
          el.classList.remove(classes.dropdownActive)
        });
      }
  
      function closeThirdLevelDropdown() {
        document.querySelectorAll(selectors.navDropdownLinks).forEach(el => {
          el.parentNode.classList.remove(classes.dropdownActive);
        });
      }
    }
  
    function initStickyBarMenu() {
      var wrapWith = document.createElement('div');
      wrapWith.classList.add('site-header-sticky');
      theme.utils.wrap(siteHeader, wrapWith);
  
      // No need to set a height on wrapper if positioned absolutely already
      if (theme.settings.overlayHeader) {
        return;
      }
  
      stickyHeaderHeight();
      setTimeout(function() {
        stickyHeaderHeight();
  
        // Don't let height get stuck on 0
        var stickyHeader = document.querySelector('.site-header-sticky');
        if (stickyHeader.offsetHeight === 0) {
          setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
          }, 500);
        }
      }, 200);
    }
  
    function stickyHeaderHeight() {
      var stickyHeader = document.querySelector('.site-header-sticky');
      if (stickyHeader) {
        var h = siteHeader.offsetHeight;
        stickyHeader.style.height = h + 'px';
      }
    }
  
    function initStickyThumbMenu() {
      if (document.body.classList.contains(classes.stickyCartActive)) {
        return;
      }
  
      if (theme.config.bpSmall && theme.template !== 'product') {
        setTimeout(function() {
          config.forceStickyOnMobile = true;
          toggleThumbMenu(true);
        }, 25);
      }
    }
  
    function stickyMenuOnScroll(evt) {
      if (window.scrollY > config.stickyThreshold) {
        if (config.forceStickyOnMobile) {
          config.forceStickyOnMobile = false;
        }
  
        if (config.stickyActive) {
          return;
        }
  
        if (config.headerStyle === 'button') {
          toggleThumbMenu(true);
        } else if (config.headerStyle === 'bar') {
          toggleBarMenu(true);
        }
      } else {
        // If menu is shown on mobile page load, do not
        // automatically hide it when you start scrolling
        if (config.forceStickyOnMobile) {
          return;
        }
  
        if (!config.stickyActive) {
          return;
        }
  
        if (config.headerStyle === 'button') {
          if (!theme.config.bpSmall) {
            toggleThumbMenu(false);
          }
        } else if (config.headerStyle === 'bar') {
          toggleBarMenu(false);
        }
  
        if (!theme.settings.overlayHeader) {
          stickyHeaderHeight();
        }
      }
    }
  
    function toggleThumbMenu(active, forceClose) {
      // If forced close, will not open again until page refreshes
      // because sticky nav is open
      if (config.forceCloseThumbNav) {
        return;
      }
  
      // If thumb menu is open, do not hide menu button
      var thumbBtn = document.querySelector('.slide-nav__overflow--thumb');
      if (thumbBtn.classList.contains('js-menu--is-open')) {
        return;
      }
  
      document.querySelector(selectors.thumbMenu).classList.toggle(classes.thumbMenuInactive, !active);
      config.stickyActive = active;
  
      config.forceCloseThumbNav = forceClose;
    }
  
    function toggleBarMenu(active) {
      if (config.headerStyle !== 'bar') {
        return;
      }
  
      if (active) {
        siteHeader.classList.add(classes.stickyClass);
        if (theme.settings.overlayHeader) {
          wrapper.classList.remove(classes.overlayedClass);
          wrapper.classList.add(classes.overlayStickyClass);
        }
  
        // Add open transition class after element is set to fixed
        // so CSS animation is applied correctly
        setTimeout(function() {
          siteHeader.classList.add(classes.openTransitionClass);
        }, 100);
      } else {
        siteHeader.classList.remove(classes.openTransitionClass);
        siteHeader.classList.remove(classes.stickyClass);
  
        if (theme.settings.overlayHeader) {
          wrapper.classList.add(classes.overlayedClass);
          wrapper.classList.remove(classes.overlayStickyClass);
        }
      }
  
      config.stickyActive = active;
    }
  
    // If the header setting to overlay the menu on the collection image
    // is enabled but the collection setting is disabled, we need to undo
    // the init of the sticky nav
    function disableOverlayHeader() {
      wrapper.classList.remove(config.overlayEnabledClass);
      wrapper.classList.remove(config.overlayedClass);
      theme.settings.overlayHeader = false;
    }
  
    function unload() {
      window.off(config.namespace);
    }
  
    return {
      init: init,
      disableOverlayHeader: disableOverlayHeader,
      toggleThumbMenu: toggleThumbMenu,
      unload: unload
    };
  })();
  
  theme.articleImages = function() {
    var wrappers = document.querySelectorAll('.rte--indented-images');
  
    if (!wrappers.length) {
      return;
    }
  
    wrappers.forEach(wrapper => {
      wrapper.querySelectorAll('img').forEach(image => {
        var attr = image.getAttribute('style');
        // Check if undefined for float: none
        if (!attr || attr == 'float: none;') {
          // Remove grid-breaking styles if image is not wider than parent
          if (image.width < wrapper.offsetWidth) {
            image.classList.add('rte__no-indent');
          }
        }
      });
    });
  };
  
  theme.customerTemplates = function() {
    checkUrlHash();
    initEventListeners();
    resetPasswordSuccess();
    customerAddressForm();
  
    function checkUrlHash() {
      var hash = window.location.hash;
  
      // Allow deep linking to recover password form
      if (hash === '#recover') {
        toggleRecoverPasswordForm();
      }
    }
  
    function toggleRecoverPasswordForm() {
      var passwordForm = document.getElementById('RecoverPasswordForm').classList.toggle('hide');
      var loginForm = document.getElementById('CustomerLoginForm').classList.toggle('hide');
    }
  
    function initEventListeners() {
      // Show reset password form
      var recoverForm = document.getElementById('RecoverPassword');
      if (recoverForm) {
        recoverForm.addEventListener('click', function(evt) {
          evt.preventDefault();
          toggleRecoverPasswordForm();
        });
      }
  
      // Hide reset password form
      var hideRecoverPassword = document.getElementById('HideRecoverPasswordLink');
      if (hideRecoverPassword) {
        hideRecoverPassword.addEventListener('click', function(evt) {
          evt.preventDefault();
          toggleRecoverPasswordForm();
        });
      }
    }
  
    function resetPasswordSuccess() {
      var formState = document.querySelector('.reset-password-success');
  
      // check if reset password form was successfully submitted
      if (!formState) {
        return;
      }
  
      // show success message
      document.getElementById('ResetSuccess').classList.remove('hide');
    }
  
    function customerAddressForm() {
      var newAddressForm = document.getElementById('AddressNewForm');
      var addressForms = document.querySelectorAll('.js-address-form');
  
      if (!newAddressForm || !addressForms.length) {
        return;
      }
  
      // Country/province selector can take a short time to load
      setTimeout(function() {
        document.querySelectorAll('.js-address-country').forEach(el => {
          var countryId = el.dataset.countryId;
          var provinceId = el.dataset.provinceId;
          var provinceContainerId = el.dataset.provinceContainerId;
  
          new Shopify.CountryProvinceSelector(
            countryId,
            provinceId,
            {
              hideElement: provinceContainerId
            }
          );
        });
      }, 1000);
  
      // Toggle new/edit address forms
      document.querySelectorAll('.address-new-toggle').forEach(el => {
        el.addEventListener('click', function() {
          newAddressForm.classList.toggle('hide');
        });
      });
  
      document.querySelectorAll('.address-edit-toggle').forEach(el => {
        el.addEventListener('click', function(evt) {
          var formId = evt.currentTarget.dataset.formId;
          document.getElementById('EditAddress_' + formId).classList.toggle('hide');
        });
      });
  
      document.querySelectorAll('.address-delete').forEach(el => {
        el.addEventListener('click', function(evt) {
          var formId = evt.currentTarget.dataset.formId;
          var confirmMessage = evt.currentTarget.dataset.confirmMessage;
  
          if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
            if (Shopify) {
              Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
            }
          }
        })
      });
    }
  };
  
  theme.CartDrawer = (function() {
    var selectors = {
      drawer: '#CartDrawer',
      form: '#CartDrawerForm'
    };
  
    function CartDrawer() {
      this.form = document.querySelector(selectors.form);
      this.drawer = new theme.Drawers('CartDrawer', 'cart');
  
      this.init();
    }
  
    CartDrawer.prototype = Object.assign({}, CartDrawer.prototype, {
      init: function() {
        this.cartForm = new theme.CartForm(this.form);
        this.cartForm.buildCart();
  
        document.addEventListener('ajaxProduct:added', function(evt) {
          this.cartForm.buildCart();
          this.open();
        }.bind(this));
  
        // Dev-friendly way to open cart
        document.addEventListener('cart:open', this.open.bind(this));
        document.addEventListener('cart:close', this.close.bind(this));
      },
  
      open: function() {
        this.drawer.open();
      },
  
      close: function() {
        this.drawer.close();
      }
    });
  
    return CartDrawer;
  })();
  
  theme.refreshCart = function() {
    if (theme.settings.cartType === 'sticky' && theme.StickyCart) {
      theme.cart.getCart().then(function(cart) {
        theme.StickyCart.refresh(cart);
      });
    }
  };
  
  theme.StickyCart = (function() {
    var config = {
      namespace: '.ajaxcart'
    };
  
    var selectors = {
      cart: '#StickyCart',
      items: '#StickyItems',
      subtotal: '#StickySubtotal',
      submit: '#StickySubmit'
    };
  
    var classes = {
      cartTemplate: 'template-cart',
      active: 'sticky-cart--open',
      activeBodyClass: 'body--sticky-cart-open'
    };
  
    function StickyCart() {
      this.status = {
        loaded: false,
        loading: false,
        open: document.body.classList.contains(classes.activeBodyClass)
      };
  
      if (!document.querySelector(selectors.cart)) {
        return;
      }
  
      this.initEventListeners();
    }
  
    function refresh(cart) {
      if (document.body.classList.contains(classes.cartTemplate)) {
        return;
      }
  
      if (cart.item_count > 0) {
        document.body.classList.add(classes.activeBodyClass);
        document.querySelector(selectors.cart).classList.add(classes.active);
      } else {
        document.body.classList.remove(classes.activeBodyClass);
        document.querySelector(selectors.cart).classList.remove(classes.active);
      }
  
      document.querySelector(selectors.items).innerText = theme.strings.cartItems.replace('[count]', cart.item_count);
      document.querySelector(selectors.subtotal).innerHTML = theme.Currency.formatMoney(cart.total_price, theme.settings.moneyFormat);
    }
  
    StickyCart.prototype = Object.assign({}, StickyCart.prototype, {
      initEventListeners: function() {
        var submitBtn = document.querySelector(selectors.submit);
        submitBtn.addEventListener('click', function() {
          submitBtn.classList.add('btn--loading');
        });
  
        document.addEventListener('ajaxProduct:added', function() {
          this.hideCart();
          theme.cart.getCart().then(function(cart) {
            this.buildCart(cart, true);
          }.bind(this));
        }.bind(this));
      },
  
      hideCart: function() {
        document.body.classList.remove(classes.activeBodyClass);
        document.querySelector(selectors.cart).classList.remove(classes.active);
      },
  
      showCart: function(count, subtotal) {
        if (count) {
          document.querySelector(selectors.items).innerText = theme.strings.cartItems.replace('[count]', count);
        }
        if (subtotal) {
          document.querySelector(selectors.subtotal).innerHTML = theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat);
        }
  
        document.body.classList.add(classes.activeBodyClass);
        document.querySelector(selectors.cart).classList.add(classes.active);
  
        this.status.open = true;
      },
  
      buildCart: function(cart, open) {
        console.log("buildCart");

        

        

        
        this.loading(true);
  
        this.status.loaded = true;
        this.loading(false);
  
        // If specifically asked, open the cart (only happens after product added from form)
        if (open === true) {
          this.showCart(cart.item_count, cart.total_price);
        }
      },
  
      loading: function(state) {
        this.status.loading = state;
  
        if (state) {
          document.querySelector(selectors.cart).classList.add('is-loading');
        } else {
          document.querySelector(selectors.cart).classList.remove('is-loading');
        }
      },
  
      updateError: function(XMLHttpRequest) {
        if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
          console.warn(XMLHttpRequest.responseJSON.description);
        }
      }
    });
  
    return {
      init: StickyCart,
      refresh: refresh
    }
  })();
  

  theme.Product = (function() {
    var videoObjects = {};
  
    var classes = {
      onSale: 'sale-price',
      disabled: 'disabled',
      isModal: 'is-modal',
      loading: 'loading',
      loaded: 'loaded',
      hidden: 'hide',
      visuallyHide: 'visually-invisible',
      thumbActive: 'thumb--current'
    };
  
    var selectors = {
      variantsJson: '[data-variant-json]',
      currentVariantJson: '[data-current-variant-json]',
  
      imageContainer: '[data-product-images]',
      mainSlider: '[data-product-photos]',
      thumbSlider: '[data-product-thumbs]',
      thumbScroller: '[data-product-thumbs-scroller]',
      photo: '[data-product-photo]',
      photoThumbs: '[data-product-thumb]',
      photoThumbItem: '[data-product-thumb-item]',
      zoomButton: '.product__photo-zoom',
      savingsPct: '[data-product-price-savings]',
      priceWrapper: '[data-price-wrapper]',
      price: '[data-product-price]',
      comparePrice: '[data-product-price-compare]',
      priceA11y: '[data-price-a11y]',
      comparePriceA11y: '[data-compare-a11y]',
      sku: '[data-sku]',
      inventory: '[data-product-inventory]',
      incomingInventory: '[data-product-incoming-inventory]',
      unitWrapper: '[data-product-unit-wrapper]',
  
      addToCart: '[data-add-to-cart]',
      addToCartText: '[data-add-to-cart-text]',
  
      variantType: '.variant-wrapper',
      originalSelectorId: '[data-product-select]',
      singleOptionSelector: '[data-variant-input]',
      variantColorSwatch: '[data-color-swatch]',
  
      productImageMain: '.product-image-main',
      productVideo: '[data-product-video]',
      videoParent: '.product__video-wrapper',
      slide: '.product-main-slide',
      currentSlide: '.is-selected',
      startingSlide: '.starting-slide',
  
      media: '[data-product-media-type-model]',
      closeMedia: '.product-single__close-media',
  
      blocks: '[data-product-blocks]',
      blocksHolder: '[data-blocks-holder]',
      formContainer: '.product-single__form',
      availabilityContainer: '[data-store-availability]'
    };
  
    function Product(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id')
      this.productId = container.getAttribute('data-product-id')
  
      this.inModal = (container.dataset.modal === 'true');
      this.modal;
  
      this.namespace = '.product-' + this.sectionId;
      this.namespaceImages = '.product-image-' + this.sectionId;
  
      this.settings = {
        enableHistoryState: (container.dataset.history === 'true') || false,
        namespace: '.product-' + this.sectionId,
        inventory: false,
        inventoryThreshold: 10,
        modalInit: false,
        hasImages: true,
        hasVideos: container.querySelectorAll(selectors.productVideo).length || false,
        videoStyle: container.dataset.videoStyle,
        has3d: false,
        imageSetName: null,
        imageSetIndex: null,
        currentImageSet: null,
        stackedImages: container.dataset.imagesStacked || false,
        stackedCurrent: 0,
        stackedImagePositions: [],
        imageSize: '620x',
        currentSlideIndex: 0,
        videoLooping: container.dataset.videoLooping
      };
  
      this.videos = {};
  
      // Overwrite some settings when loaded in modal
      if (this.inModal) {
        this.settings.enableHistoryState = false;
        this.namespace = '.product-' + this.sectionId + '-modal';
        this.modal = document.getElementById('ProductScreen-' + this.sectionId);
      }
  
      this.init();
    }
  
    Product.prototype = Object.assign({}, Product.prototype, {
      init: function() {
        this.mainSlider = this.container.querySelector(selectors.mainSlider);
        this.thumbSlider = this.container.querySelector(selectors.thumbSlider);
        this.firstProductImage = this.mainSlider.querySelector('img');
  
        if (!this.firstProductImage) {
          this.settings.hasImages = false;
        }
  
        var dataSetEl = this.mainSlider.querySelector('[data-set-name]');
        this.settings.imageSetName = dataSetEl ? dataSetEl.dataset.setName : false;
  
        if (this.inModal) {
          this.container.classList.add(classes.isModal);
          document.removeEventListener('productModalOpen.ProductScreen-' + this.sectionId, this.openModalProduct.bind(this));
          document.removeEventListener('productModalClose.ProductScreen-' + this.sectionId, this.openModalProduct.bind(this));
          document.addEventListener('productModalOpen.ProductScreen-' + this.sectionId, this.openModalProduct.bind(this));
          document.addEventListener('productModalClose.ProductScreen-' + this.sectionId, this.closeModalProduct.bind(this));
        }
  
        if (!this.inModal) {
          this.formSetup();
          this.preImageSetup();
          this.videoSetup();
          this.initProductSlider();
        }
      },
  
      formSetup: function() {
        this.initAjaxProductForm();
        this.availabilitySetup();
        this.initVariants();
  
        // We know the current variant now so setup image sets
        if (this.settings.imageSetName) {
          this.updateImageSet();
        }
      },
  
      availabilitySetup: function() {
        var container = this.container.querySelector(selectors.availabilityContainer);
        if (container) {
          this.storeAvailability = new theme.StoreAvailability(container);
        }
      },
  
      initVariants: function() {
        var variantJson = this.container.querySelector(selectors.variantsJson);
  
        if (!variantJson) {
          return;
        }
  
        this.variantsObject = JSON.parse(variantJson.innerHTML);
  
        var options = {
          container: this.container,
          enableHistoryState: this.settings.enableHistoryState,
          singleOptionSelector: selectors.singleOptionSelector,
          originalSelectorId: selectors.originalSelectorId,
          variants: this.variantsObject
        };
  
        var swatches = this.container.querySelectorAll(selectors.variantColorSwatch);
  
        if (swatches.length) {
          swatches.forEach(swatch => {
            swatch.addEventListener('change', function(evt) {
              var color = swatch.dataset.colorName;
              var index = swatch.dataset.colorIndex;
              this.updateColorName(color, index);
            }.bind(this))
          });
        }
  
        this.variants = new theme.Variants(options);
  
        // Product availability on page load
        if (this.storeAvailability) {
          var variant_id = this.variants.currentVariant ? this.variants.currentVariant.id : this.variants.variants[0].id;
  
          this.storeAvailability.updateContent(variant_id);
          this.container.on('variantChange' + this.settings.namespace, this.updateAvailability.bind(this));
        }
  
        this.container.on('variantChange' + this.namespace, this.updateCartButton.bind(this));
        this.container.on('variantImageChange' + this.settings.namespace, this.updateVariantImage.bind(this));
        this.container.on('variantPriceChange' + this.settings.namespace, this.updatePrice.bind(this));
        this.container.on('variantUnitPriceChange' + this.settings.namespace, this.updateUnitPrice.bind(this));
  
        if (this.container.querySelectorAll(selectors.sku).length) {
          this.container.on('variantSKUChange' + this.settings.namespace, this.updateSku.bind(this));
        }
  
        var inventoryEl = this.container.querySelector(selectors.inventory);
        if (inventoryEl) {
          this.settings.inventory = true;
          this.settings.inventoryThreshold = inventoryEl.dataset.threshold;
          this.container.on('variantChange' + this.settings.namespace, this.updateInventory.bind(this));
        }
  
        // Update individual variant availability on each selection
        if (theme.settings.dynamicVariantsEnable) {
          var currentVariantJson = this.container.querySelector(selectors.currentVariantJson);
  
          if (currentVariantJson) {
            var variantType = this.container.querySelector(selectors.variantType);
  
            if (variantType) {
              new theme.VariantAvailability({
                container: this.container,
                namespace: this.settings.namespace,
                type: variantType.dataset.type,
                variantsObject: this.variantsObject,
                currentVariantObject: JSON.parse(currentVariantJson.innerHTML),
                form: this.container.querySelector(selectors.formContainer)
              });
            }
          }
        }
  
        // image set names variant change listeners
        if (this.settings.imageSetName) {
          var variantWrapper = this.container.querySelector('.variant-input-wrap[data-handle="'+this.settings.imageSetName+'"]');
          if (variantWrapper) {
            this.settings.imageSetIndex = variantWrapper.dataset.index;
            this.container.on('variantChange' + this.settings.namespace, this.updateImageSet.bind(this))
          } else {
            this.settings.imageSetName = null;
          }
        }
      },
  
      initAjaxProductForm: function() {
        if (theme.settings.cartType === 'drawer' || theme.settings.cartType === 'sticky') {
          var form = this.container.querySelector(selectors.formContainer);
  
          new theme.AjaxProduct(form, selectors.addToCart, {
            scopedEventId: 'ProductScreen-' + this.sectionId
          });
        }
      },
  
      /*============================================================================
        Variant change methods
      ==============================================================================*/
      updateColorName: function(color, index) {
        // Updates on radio button change, not variant.js
        this.container.querySelector('#VariantColorLabel-' + this.sectionId + '-' + index).textContent = color;
      },
  
      updateCartButton: function(evt) {
        var variant = evt.detail.variant;
        var cartBtn = this.container.querySelector(selectors.addToCart);
        var cartBtnText = this.container.querySelector(selectors.addToCartText);
  
        if (variant) {
          if (variant.available) {
            // Available, enable the submit button and change text
            cartBtn.classList.remove(classes.disabled);
            cartBtn.disabled = false;
            var defaultText = cartBtnText.dataset.defaultText;
            cartBtnText.textContent = defaultText;
          } else {
            // Sold out, disable the submit button and change text
            cartBtn.classList.add(classes.disabled);
            cartBtn.disabled = true;
            cartBtnText.textContent = theme.strings.soldOut;
          }
        } else {
          // The variant doesn't exist, disable submit button
          cartBtn.classList.add(classes.disabled);
          cartBtn.disabled = true;
          cartBtnText.textContent = theme.strings.unavailable;
        }
      },
  
      updatePrice: function(evt) {
        var variant = evt.detail.variant;
  
        if (variant) {
          // Regular price
          this.container.querySelector(selectors.price).innerHTML = theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat);
  
          // Sale price, if necessary
          if (variant.compare_at_price > variant.price) {
            this.container.querySelector(selectors.comparePrice).innerHTML = theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat);
            var saving_total = ((1 - (variant.price) / (variant.compare_at_price))*100).toFixed(0);
            this.container.querySelector(selectors.savingsPct).innerHTML = saving_total;
            this.container.querySelector(selectors.priceWrapper).classList.remove(classes.hidden);
            this.container.querySelector(selectors.price).classList.add(classes.onSale);
            this.container.querySelector(selectors.comparePriceA11y).setAttribute('aria-hidden', 'false');
            this.container.querySelector(selectors.priceA11y).setAttribute('aria-hidden', 'false');
          } else {
            this.container.querySelector(selectors.priceWrapper).classList.add(classes.hidden);
            this.container.querySelector(selectors.price).classList.remove(classes.onSale);
            this.container.querySelector(selectors.comparePriceA11y).setAttribute('aria-hidden', 'true');
            this.container.querySelector(selectors.priceA11y).setAttribute('aria-hidden', 'true');
          }
        }
      },
  
      updateUnitPrice: function(evt) {
        var variant = evt.detail.variant;
  
        if (variant && variant.unit_price) {
          var price = theme.Currency.formatMoney(variant.unit_price, theme.settings.moneyFormat);
          var base = theme.Currency.getBaseUnit(variant);
  
          var el = this.container.querySelector(selectors.unitWrapper);
          el.innerHTML = price + '/' + base;
          el.classList.remove(...[classes.hidden, classes.visuallyHide]);
        } else {
          this.container.querySelector(selectors.unitWrapper).classList.add(classes.visuallyHide);
        }
      },
  
      imageSetArguments: function(variant) {
        var variant = variant ? variant : (this.variants ? this.variants.currentVariant : null);
        if (!variant) return;
  
        var setValue = this.settings.currentImageSet = this.getImageSetName(variant[this.settings.imageSetIndex]);
        var set = this.settings.imageSetName + '_' + setValue;
  
        // Always start on index 0
        this.settings.currentSlideIndex = 0;
  
        // Return object that adds cellSelector to mainSliderArgs
        return {
          cellSelector: '[data-group="'+set+'"]',
          imageSet: set,
          initialIndex: this.settings.currentSlideIndex
        }
      },
  
      updateImageSet: function(evt, reload) {
        // If called directly, use current variant
        var variant = evt ? evt.detail.variant : (this.variants ? this.variants.currentVariant : null);
        if (!variant) {
          return;
        }
  
        var setValue = this.getImageSetName(variant[this.settings.imageSetIndex]);
        var set = this.settings.imageSetName + '_' + setValue;
  
        // Already on the current image group
        if (this.settings.currentImageSet === setValue) {
          return;
        }
  
        if (!theme.config.bpSmall && this.settings.stackedImages) {
          // // Hide all thumbs and main images that are part of group
          this.container.querySelectorAll('[data-group]').forEach(el => {
            el.classList.add(classes.hidden);
  
            // Show if in group
            if (el.dataset.group && el.dataset.group === set) {
              el.classList.remove(classes.hidden);
            }
          });
  
          // reset stacked position
          this.stackedImagePositions();
          AOS.refresh();
          this.settings.currentImageSet = setValue;
          return;
        } else {
          // Reset image set visibility (required between breakpoints)
          if (theme.config.bpSmall && this.settings.stackedImages) {
            this.container.querySelectorAll('[data-group]').forEach(el => {
              el.classList.remove(classes.hidden);
            });
          }
  
          this.initProductSlider(variant);
        }
      },
  
      // Show/hide thumbnails based on current image set
      updateImageSetThumbs: function(set) {
        if (!this.settings.stackedImages) {
          this.thumbSlider.querySelectorAll('.product__thumb-item').forEach(thumb => {
            thumb.classList.toggle(classes.hidden, thumb.dataset.group !== set);
          });
        }
      },
  
      getImageSetName: function(string) {
        return string.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
      },
  
      updateSku: function(evt) {
        var variant = evt.detail.variant;
        var newSku = '';
        var hideSku = true;
  
        if (variant) {
          if (variant.sku) {
            newSku = variant.sku;
            hideSku = false;
          }
  
          this.container.querySelectorAll(selectors.sku).forEach(el => {
            el.classList.toggle(classes.hidden, hideSku);
            el.textContent = newSku;
          });
        }
      },
  
      updateInventory: function(evt) {
        var variant = evt.detail.variant;
  
        // Hide stock if no inventory management or policy is continue
        if (!variant || !variant.inventory_management || variant.inventory_policy === 'continue') {
          this.toggleInventoryQuantity(variant, false);
          this.toggleIncomingInventory(false);
          return;
        }
  
        if (variant.inventory_management === 'shopify' && window.inventories && window.inventories[this.productId]) {
          var variantInventoryObject = window.inventories[this.productId][variant.id];
  
          // Hide stock if policy is continue
          if (variantInventoryObject.policy === 'continue') {
            this.toggleInventoryQuantity(variant, false);
            this.toggleIncomingInventory(false);
            return;
          }
  
          var quantity = variantInventoryObject.quantity;
          var showInventory = true;
          var showIncomingInventory = false;
  
          if (quantity <= 0 || quantity > this.settings.inventoryThreshold) {
            showInventory = false;
          }
  
          this.toggleInventoryQuantity(variant, showInventory, quantity);
  
          // Only show incoming inventory when:
          // - inventory notice itself is hidden
          // - have incoming inventory
          // - current quantity is below theme setting threshold
          if (!showInventory && variantInventoryObject.incoming === 'true' && quantity <= this.settings.inventoryThreshold) {
            showIncomingInventory = true;
          }
  
          this.toggleIncomingInventory(showIncomingInventory, variant.available, variantInventoryObject.next_incoming_date);
        }
      },
  
      updateAvailability: function(evt) {
        var variant = evt.detail.variant;
        if (!variant) {
          return;
        }
  
        this.storeAvailability.updateContent(variant.id);
      },
  
      toggleInventoryQuantity: function(variant, show, qty) {
        if (!this.settings.inventory) {
          show = false;
        }
  
        var el = this.container.querySelector(selectors.inventory);
        var salesPoint = el.closest('.product-block');
  
        if (parseInt(qty) <= parseInt(this.settings.inventoryThreshold)) {
          el.parentNode.classList.add('inventory--low')
          el.textContent = theme.strings.stockLabel.replace('[count]', qty);
        } else {
          el.parentNode.classList.remove('inventory--low')
          el.textContent = theme.strings.inStockLabel;
        }
  
        if (variant && variant.available) {
          el.parentNode.classList.remove(classes.hidden);
          if (salesPoint) {
            salesPoint.classList.remove(classes.hidden);
          }
        } else {
          el.parentNode.classList.add(classes.hidden);
          if (salesPoint) {
            salesPoint.classList.add(classes.hidden);
          }
        }
      },
  
      toggleIncomingInventory: function(show, available, date) {
        var el = this.container.querySelector(selectors.incomingInventory);
        var salesPoint = el.closest('.product-block');
  
        if (!el) {
          return;
        }
  
        var textEl = el.querySelector('.js-incoming-text');
  
        if (show) {
          var string = available ?
                       theme.strings.willNotShipUntil.replace('[date]', date) :
                       theme.strings.willBeInStockAfter.replace('[date]', date);
  
          if (!date) {
            string = theme.strings.waitingForStock;
          }
  
          el.classList.remove(classes.hidden);
          if (salesPoint) {
            salesPoint.classList.remove(classes.hidden);
          }
          textEl.textContent = string;
        } else {
          el.classList.add(classes.hidden);
        }
      },
  
      /*============================================================================
        Product videos
      ==============================================================================*/
      videoSetup: function() {
        var productVideos = this.mainSlider.querySelectorAll(selectors.productVideo);
  
        // Stop if there are 0 videos
        if (!productVideos.length) {
          return false;
        }
  
        productVideos.forEach(vid => {
          var type = vid.dataset.videoType;
          if (type === 'youtube') {
            this.initYoutubeVideo(vid);
          } else if (type === 'mp4') {
            this.initMp4Video(vid);
          }
        });
      },
  
      initYoutubeVideo: function(div) {
        videoObjects[div.id] = new theme.YouTube(
          div.id,
          {
            videoId: div.dataset.youtubeId,
            videoParent: selectors.videoParent,
            autoplay: false, // will handle this in callback
            style: div.dataset.videoStyle,
            loop: div.dataset.videoLoop,
            events: {
              onReady: this.youtubePlayerReady.bind(this),
              onStateChange: this.youtubePlayerStateChange.bind(this)
            }
          }
        );
      },
  
      // Comes from YouTube SDK
      // Get iframe ID with evt.target.getIframe().id
      // Then access product video players with videoObjects[id]
      youtubePlayerReady: function(evt) {
        var iframeId = evt.target.getIframe().id;
  
        if (!videoObjects[iframeId]) {
          // No youtube player data
          return;
        }
  
        var obj = videoObjects[iframeId];
        var player = obj.videoPlayer;
  
        if (obj.options.style !== 'sound') {
          player.mute();
        }
  
        obj.parent.classList.remove('loading');
        obj.parent.classList.add('loaded');
  
        // If we have an element, it is in the visible/first slide,
        // and is muted, play it
        if (this._isFirstSlide(iframeId) && obj.options.style !== 'sound') {
          player.playVideo();
        }
      },
  
      _isFirstSlide: function(id) {
        return this.mainSlider.querySelector(selectors.startingSlide + ' ' + '#' + id);
      },
  
      youtubePlayerStateChange: function(evt) {
        var iframeId = evt.target.getIframe().id;
        var obj = videoObjects[iframeId];
  
        switch (evt.data) {
          case -1: // unstarted
            // Handle low power state on iOS by checking if
            // video is reset to unplayed after attempting to buffer
            if (obj.attemptedToPlay) {
              obj.parent.classList.add('video-interactable');
            }
            break;
          case 0: // ended
            if (obj && obj.options.loop === 'true') {
              obj.videoPlayer.playVideo();
            }
            break;
          case 3: // buffering
            obj.attemptedToPlay = true;
            break;
        }
      },
  
      initMp4Video: function(div) {
        videoObjects[div.id] = {
          id: div.id,
          type: 'mp4'
        };
  
        if (this._isFirstSlide(div.id)) {
          this.playMp4Video(div.id);
        }
      },
  
      stopVideos: function() {
        for (var [id, vid] of Object.entries(videoObjects)) {
          if (vid.videoPlayer) {
            if (typeof vid.videoPlayer.stopVideo === 'function') {
              vid.videoPlayer.stopVideo(); // YouTube player
            }
          } else if (vid.type === 'mp4') {
            this.stopMp4Video(vid.id); // MP4 player
          }
        }
      },
  
      _getVideoType: function(video) {
        return video.getAttribute('data-video-type');
      },
  
      _getVideoDivId: function(video) {
        return video.id;
      },
  
      playMp4Video: function(id) {
        var player = this.container.querySelector('#' + id);
        var playPromise = player.play();
  
        player.setAttribute('controls', '');
        player.focus();
  
        // When existing focus on the element, go back to thumbnail
        player.addEventListener('focusout', this.returnFocusToThumbnail.bind(this));
  
        if (playPromise !== undefined) {
          playPromise.then(function() {
            // Playing as expected
          })
          .catch(function(error) {
            // Likely low power mode on iOS, show controls
            player.setAttribute('controls', '');
            player.closest(selectors.videoParent).setAttribute('data-video-style', 'unmuted');
          });
        }
      },
  
      stopMp4Video: function(id) {
        var player = this.container.querySelector('#' + id);
        player.removeEventListener('focusout', this.returnFocusToThumbnail.bind(this));
        if (player && typeof player.pause === 'function') {
          player.removeAttribute('controls');
          player.pause();
        }
      },
  
      // Return focus to
      returnFocusToThumbnail: function() {
        var thumb = this.container.querySelector('.product__thumb-item[data-index="'+ this.settings.currentSlideIndex +'"] a');
        if (thumb) {
          thumb.focus();
        }
      },
  
      /*============================================================================
        Product images
      ==============================================================================*/
      preImageSetup: function() {
        this.setImageSizes();
        this.initImageSwitch();
        this.initImageZoom();
        this.customMediaListners();
        this.initModelViewerLibraries();
        this.initShopifyXrLaunch();
        theme.collapsibles.init(this.container);
  
        if (window.SPR) {SPR.initDomEls();SPR.loadBadges()}
      },
  
      initProductSlider: function(variant) {
        // Stop if only a single image, but add active class to first slide
        if (this.mainSlider.querySelectorAll(selectors.slide).length <= 1) {
          var slide = this.mainSlider.querySelector(selectors.slide);
          if (slide) {
            slide.classList.add('is-selected');
          }
          return;
        }
  
        this.settings.has3d = this.container.querySelectorAll(selectors.media).length;
  
        if (this.settings.videoStyle !== 'muted') {
          theme.videoModal(true);
        }
  
        // If variant argument exists, slideshow is reinitializing because of the
        // image set feature enabled and switching to a new group.
        // currentSlideIndex
        if (!variant) {
          var activeSlide = this.mainSlider.querySelector(selectors.startingSlide);
          this.settings.currentSlideIndex = this._slideIndex(activeSlide);
        }
  
        var mainSliderArgs = {
          adaptiveHeight: true,
          avoidReflow: true,
          initialIndex: this.settings.currentSlideIndex,
          childNav: this.thumbSlider,
          childNavScroller: this.container.querySelector(selectors.thumbScroller),
          childVertical: this.thumbSlider.dataset.position === 'beside',
          fade: this.settings.stackedImages ? false : true,
          pageDots: true, // mobile only with CSS
          wrapAround: true,
          callbacks: {
            onInit: this.onSliderInit.bind(this),
            onChange: this.onSlideChange.bind(this)
          }
        };
  
        // Override default settings if image set feature enabled
        if (this.settings.imageSetName) {
          var imageSetArgs = this.imageSetArguments(variant);
          mainSliderArgs = Object.assign({}, mainSliderArgs, imageSetArgs);
          this.updateImageSetThumbs(mainSliderArgs.imageSet);
        }
  
        this.initSliders(mainSliderArgs);
  
        // Re-init slider when a breakpoint is hit
        document.addEventListener('matchSmall', function() {
          this.initSliders(mainSliderArgs, true);
        }.bind(this));
        document.addEventListener('unmatchSmall', function() {
          this.initSliders(mainSliderArgs, true);
        }.bind(this));
      },
  
      onSliderInit: function(slide) {
        // If slider is initialized with image set feature active,
        // initialize any videos/media when they are first slide
        if (this.settings.imageSetName) {
          this.prepMediaOnSlide(slide);
        }
  
        // If height is 0, trigger resize to force height recalculation
        var height = this.mainSlider.offsetHeight;
        if (height === 0) {
          setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
          }, 250);
        }
      },
  
      onSlideChange: function(index) {
        if (!this.flickity) return;
  
        var prevSlide = this.mainSlider.querySelector('.product-main-slide[data-index="'+this.settings.currentSlideIndex+'"]');
  
        // If imageSetName exists, use a more specific selector
        var nextSlide = this.settings.imageSetName ?
                        this.mainSlider.querySelectorAll('.flickity-slider .product-main-slide')[index] :
                        this.mainSlider.querySelector('.product-main-slide[data-index="'+index+'"]');
  
        prevSlide.setAttribute('tabindex', '-1');
        nextSlide.setAttribute('tabindex', 0);
  
        // Pause any existing slide video/media
        this.stopMediaOnSlide(prevSlide);
  
        // Prep next slide video/media
        this.prepMediaOnSlide(nextSlide);
  
        // Update current slider index
        this.settings.currentSlideIndex = index;
      },
  
      stopMediaOnSlide(slide) {
        // Stop existing video
        var video = slide.querySelector(selectors.productVideo);
        if (video) {
          var videoType = this._getVideoType(video);
          var videoId = this._getVideoDivId(video);
          if (videoType === 'youtube') {
            if (videoObjects[videoId].videoPlayer) {
              videoObjects[videoId].videoPlayer.stopVideo();
              return;
            }
          } else if (videoType === 'mp4') {
            this.stopMp4Video(videoId);
            return;
          }
        }
  
        // Stop existing media
        var currentMedia = slide.querySelector(selectors.media);
        if (currentMedia) {
          currentMedia.dispatchEvent(
            new CustomEvent('mediaHidden', {
              bubbles: true,
              cancelable: true
            })
          );
        }
      },
  
      prepMediaOnSlide(slide) {
        var video = slide.querySelector(selectors.productVideo);
        if (video) {
          var videoType = this._getVideoType(video);
          var videoId = this._getVideoDivId(video);
          if (videoType === 'youtube') {
            if (videoObjects[videoId].videoPlayer && videoObjects[videoId].options.style !== 'sound') {
              videoObjects[videoId].videoPlayer.playVideo();
              return;
            }
          } else if (videoType === 'mp4') {
            this.playMp4Video(videoId);
          }
        }
  
        var nextMedia = slide.querySelector(selectors.media);
        if (nextMedia) {
          nextMedia.dispatchEvent(
            new CustomEvent('mediaVisible', {
              bubbles: true,
              cancelable: true
            })
          );
          slide.querySelector('.shopify-model-viewer-ui__button').setAttribute('tabindex', 0);
          slide.querySelector('.product-single__close-media').setAttribute('tabindex', 0);
        }
  
        this.hideZoomOverlay(nextMedia);
      },
  
      _slideIndex: function(el) {
        return el.getAttribute('data-index');
      },
  
      initImageZoom: function() {
        var container = this.container.querySelector(selectors.imageContainer);
  
        if (!container) {
          return;
        }
  
        var imageZoom = new theme.Photoswipe(container, this.sectionId);
  
        container.addEventListener('photoswipe:afterChange', function(evt) {
          if (this.flickity) {
            this.flickity.goToSlide(evt.detail.index);
          }
        }.bind(this));
      },
  
      getThumbIndex: function(target) {
        return target.dataset.index;
      },
  
      setImageSizes: function() {
        if (!this.settings.hasImages) {
          return;
        }
  
        // Get srcset image src, works on most modern browsers
        // otherwise defaults to settings.imageSize
        var currentImage = this.firstProductImage.currentSrc;
  
        if (currentImage) {
          this.settings.imageSize = theme.Images.imageSize(currentImage);
        }
      },
  
      updateVariantImage: function(evt) {
        var variant = evt.detail.variant;
        var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_media.preview_image.src, this.settings.imageSize);
  
        var newImage = this.container.querySelector('.product-main-slide[data-id="' + variant.featured_media.id + '"]');
        var imageIndex = this.getThumbIndex(newImage);
  
        // No image, bail
        if (typeof imageIndex === 'undefined') {
          return;
        }
  
        if (!theme.config.bpSmall && this.settings.stackedImages) {
          this.stackedScrollTo(imageIndex);
        } else {
          if (this.flickity) {
            this.flickity.goToSlide(imageIndex);
          }
        }
      },
  
      initImageSwitch: function() {
        var thumbs = this.container.querySelectorAll(selectors.photoThumbs);
        if (!thumbs.length) {
          return;
        }
  
        thumbs.forEach(thumb => {
          thumb.addEventListener('click', function(evt) {
            evt.preventDefault();
            if (!theme.config.bpSmall && this.settings.stackedImages) {
              var index = this.getThumbIndex(thumb);
              this.stackedScrollTo(index);
            }
          }.bind(this));
  
          thumb.addEventListener('focus', function(evt) {
            var index = this.getThumbIndex(thumb);
            if (!theme.config.bpSmall) {
              if (this.settings.stackedImages) {
                this.container.querySelectorAll(selectors.photoThumbItem).forEach(el => {
                  el.classList.remove(classes.thumbActive);
                });
                this.stackedScrollTo(index);
              } else {
                if (this.flickity) {
                  this.flickity.goToSlide(index);
                }
              }
            }
          }.bind(this));
  
          thumb.addEventListener('keydown', function(evt) {
            if (evt.keyCode === 13) {
              this.container.querySelector(selectors.currentSlide).focus();
            }
          }.bind(this));
        });
      },
  
      stackedImagesInit: function() {
        window.off(this.namespaceImages);
        this.stackedImagePositions();
  
        if (this.inModal) {
          // Slight delay in modal to accommodate loading videos
          setTimeout(function() {
            this.stackedActive(this.settings.stackedCurrent);
          }.bind(this), 1000);
        } else {
          this.stackedActive(this.settings.stackedCurrent);
        }
  
        // update image positions on resize
        window.on('resize' + this.namespaceImages, theme.utils.debounce(200, this.stackedImagePositions.bind(this)));
  
        // scroll listener to mark active thumbnail
        window.on('scroll' + this.namespaceImages, theme.utils.throttle(200, function() {
          var goal = window.scrollY;
          var closest = this.settings.stackedImagePositions.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
          });
          var index = this.settings.stackedImagePositions.indexOf(closest);
          if (this.settings.stackedCurrent !== index) {
            this.stackedActive(index);
          }
        }.bind(this)));
      },
  
      stackedImagePositions: function() {
        var positions = [];
        this.container.querySelectorAll(selectors.photo).forEach(el => {
          positions.push(Math.round(el.offsetTop))
        });
        this.settings.stackedImagePositions = positions;
      },
  
      stackedScrollTo: function(index) {
        var img = this.container.querySelectorAll(selectors.photo)[index];
        if (!img) {
          return;
        }
  
        // Scroll to top of large image
        var pos = img.offsetTop;
  
        window.scroll({
          top: pos,
          behavior: 'smooth'
        });
      },
  
      stackedActive: function(index) {
        this.container.querySelectorAll(selectors.photoThumbItem).forEach(el => {
          el.classList.remove(classes.thumbActive);
          el.classList.remove('is-active');
        });
  
        var thumb = this.container.querySelectorAll(selectors.photoThumbItem)[index];
        if (thumb) {
          thumb.classList.add(classes.thumbActive);
          this.settings.currentSlideIndex = thumb.dataset.index;
        }
  
        if (this.settings.hasVideos) {
          this.stopVideos();
  
          var video = this.container.querySelectorAll(selectors.photo)[index].querySelector('.product__video');
  
          if (video) {
            var videoType = this._getVideoType(video);
            var videoId = this._getVideoDivId(video);
            if (videoType === 'youtube') {
              if (videoObjects[videoId].videoPlayer && videoObjects[videoId].options.style !== 'sound') {
                videoObjects[videoId].videoPlayer.playVideo();
                return;
              }
            } else if (videoType === 'mp4') {
              this.playMp4Video(videoId);
            }
          }
        }
  
        if (this.settings.has3d) {
          var allMedia = this.container.querySelectorAll(selectors.media);
          if (allMedia.length) {
            allMedia.forEach(el => {
              el.dispatchEvent(
                new CustomEvent('mediaHidden')
              );
            });
          }
  
          var media = this.container.querySelectorAll(selectors.photo)[index].querySelector(selectors.media);
  
          if (media) {
            media.dispatchEvent(
              new CustomEvent('mediaVisible')
            );
          }
        }
  
        this.settings.stackedCurrent = index;
      },
  
      initSliders: function(args, reload) {
        this.destroyImageCarousels();
  
        if (!theme.config.bpSmall && this.settings.stackedImages) {
          this.stackedImagesInit();
        } else {
          theme.promiseStylesheet().then(function() {
            this.flickity = new theme.Slideshow(this.mainSlider, args);
          }.bind(this));
        }
      },
  
      destroyImageCarousels: function() {
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      hideZoomOverlay: function(hide) {
        var btn = this.container.querySelector(selectors.zoomButton);
        if (hide) {
          if (btn) {
            btn.classList.add(classes.hidden);
          }
        } else {
          if (btn) {
            btn.classList.remove(classes.hidden);
          }
        }
      },
  
      /*============================================================================
        Products when in quick view modal
      ==============================================================================*/
      openModalProduct: function() {
        var initialized = false;
  
        if (!this.settings.modalInit) {
          this.blocksHolder = this.container.querySelector(selectors.blocksHolder);
  
          var url = this.blocksHolder.dataset.url;
  
          fetch(url).then(function(response) {
            return response.text();
          }).then(function(html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var blocks = doc.querySelector(selectors.blocks);
  
            // Because the same product could be opened in quick view
            // on the page we load the form elements from, we need to
            // update any `id`, `for`, and `form` attributes
            blocks.querySelectorAll('[id]').forEach(el => {
              // Update input `id`
              var val = el.getAttribute('id');
              el.setAttribute('id', val + '-modal');
  
              // Update related label if it exists
              var label = blocks.querySelector(`[for="${val}"]`);
              if (label) {
                label.setAttribute('for', val + '-modal');
              }
  
              // Update any collapsible elements
              var collapsibleTrigger = blocks.querySelector(`[aria-controls="${val}"]`);
              if (collapsibleTrigger) {
                collapsibleTrigger.setAttribute('aria-controls', val + '-modal');
              }
            });
  
            // Update any elements with `form` attribute.
            // Form element already has `-modal` appended
            var form = blocks.querySelector(selectors.formContainer);
            var formId = form.getAttribute('id');
            blocks.querySelectorAll('[form]').forEach(el => {
              el.setAttribute('form', formId);
            });
  
            this.blocksHolder.innerHTML = '';
            this.blocksHolder.append(blocks);
  
            this.formSetup();
            this.updateModalProductInventory();
  
            if (Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
  
            // Re-hook up collapsible box triggers
            theme.collapsibles.init(this.container);
  
            // Append sections to page
            var allSections = doc.querySelectorAll('#MainContent .shopify-section:not(.shopify-section__product)');
            if (allSections.length) {
              this.loadProductSections(allSections);
            }
  
            var socialDiv = doc.querySelector('.index-section.social-section');
            if (socialDiv) {
              this.loadSocialSection(socialDiv);
            }
  
            if (window.SPR) {
              SPR.initDomEls();SPR.loadBadges();
            }
  
            theme.sections.loadSubSections(this.modal);
  
            document.dispatchEvent(new CustomEvent('quickview:loaded', {
              detail: {
                productId: this.sectionId
              }
            }));
  
            this.preImageSetup();
            this.initProductSlider();
            this.settings.modalInit = true;
          }.bind(this));
        } else {
          initialized = true;
          if (!theme.config.bpSmall && this.settings.stackedImages) {
            this.stackedActive(0);
          }
        }
  
        document.dispatchEvent(new CustomEvent('quickview:open', {
          detail: {
            initialized: initialized,
            productId: this.sectionId
          }
        }));
      },
  
      // Recommended products and quick view load via JS and don't add variant inventory to the
      // global variable that we later check. This function scrapes a data div
      // to get that info and manually add the values.
      updateModalProductInventory: function() {
        window.inventories = window.inventories || {};
        this.container.querySelectorAll('.js-product-inventory-data').forEach(el => {
          var productId = el.dataset.productId;
          window.inventories[productId] = {};
  
          el.querySelectorAll('.js-variant-inventory-data').forEach(el => {
            window.inventories[productId][el.dataset.id] = {
              'quantity': el.dataset.quantity,
              'policy': el.dataset.policy,
              'incoming': el.dataset.incoming,
              'next_incoming_date': el.dataset.date
            }
          });
        });
      },
  
      closeModalProduct: function() {
        this.stopVideos();
        window.off(this.namespace);
      },
  
      loadProductSections: function(content) {
        var holder = document.querySelector('#ProductSectionsHolder-' + this.productId);
        if (holder) {
          holder.innerHTML = '';
          holder.append(...content);
  
          // Re-hook up collapsible box triggers
          theme.collapsibles.init(holder);
        }
      },
  
      loadSocialSection: function(content) {
        var holder = document.querySelector('#SocialSectionHolder-' + this.productId);
        if (holder) {
          holder.replaceWith(content);
        }
      },
  
      /*============================================================================
        Product media (3D)
      ==============================================================================*/
      initModelViewerLibraries: function() {
        var modelViewerElements = this.container.querySelectorAll(selectors.media);
        if (modelViewerElements.length < 1) return;
  
        theme.ProductMedia.init(modelViewerElements, this.sectionId);
      },
  
      initShopifyXrLaunch: function() {
        document.addEventListener(
          'shopify_xr_launch',
          function() {
            var currentMedia = this.container.querySelector(
              selectors.productMediaWrapper +
                ':not(.' +
                self.classes.hidden +
                ')'
            );
            currentMedia.dispatchEvent(
              new CustomEvent('xrLaunch', {
                bubbles: true,
                cancelable: true
              })
            );
          }.bind(this)
        );
      },
  
      customMediaListners: function() {
        this.container.querySelectorAll(selectors.closeMedia).forEach(el => {
          el.addEventListener('click', function() {
            if (this.settings.stackedImages) {
              var slide = this.mainSlider.querySelector('.product-main-slide[data-index="'+this.settings.currentSlideIndex+'"]');
            } else {
              var slide = this.mainSlider.querySelector(selectors.currentSlide);
            }
  
            var media = slide.querySelector(selectors.media);
            if (media) {
              media.dispatchEvent(
                new CustomEvent('mediaHidden', {
                  bubbles: true,
                  cancelable: true
                })
              );
            }
          }.bind(this))
        });
  
  
        var modelViewers = this.container.querySelectorAll('model-viewer');
        if (modelViewers.length) {
          modelViewers.forEach(el => {
            el.addEventListener('shopify_model_viewer_ui_toggle_play', function(evt) {
              this.mediaLoaded(evt);
            }.bind(this));
  
            el.addEventListener('shopify_model_viewer_ui_toggle_pause', function(evt) {
              this.mediaUnloaded(evt);
            }.bind(this));
          });
        }
      },
  
      mediaLoaded: function(evt) {
        this.container.querySelectorAll(selectors.closeMedia).forEach(el => {
          el.classList.remove(classes.hidden);
        });
  
        if (this.flickity) {
          this.flickity.setDraggable(false);
        }
      },
  
      mediaUnloaded: function(evt) {
        this.container.querySelectorAll(selectors.closeMedia).forEach(el => {
          el.classList.add(classes.hidden);
        });
  
        if (this.flickity) {
          this.flickity.setDraggable(true);
        }
      },
  
      onUnload: function() {
        window.off(this.namespace);
        this.container.off(this.namespace);
        this.destroyImageCarousels();
        theme.ProductMedia.removeSectionModels(this.sectionId);
  
        if (AOS) {
          AOS.refresh();
        }
      }
    });
  
    return Product;
  })();
  
  theme.Blog = (function() {
  
    function Blog(container) {
      this.tagFilters();
    }
  
    Blog.prototype = Object.assign({}, Blog.prototype, {
      tagFilters: function() {
        var filterBy = document.getElementById('BlogTagFilter');
  
        if (!filterBy) {
          return;
        }
  
        filterBy.addEventListener('change', function() {
          location.href = filterBy.value;
        });
      }
    });
  
    return Blog;
  })();
  
  theme.HeaderSection = (function() {
    function HeaderSection(container) {
      this.initDrawers();
      theme.headerNav.init();
      theme.slideNav.init();
  
      // Reload any slideshow when the header is reloaded to make sure the
      // sticky header works as expected (it can be anywhere in the sections.instance array)
      if (Shopify && Shopify.designMode) {
        theme.sections.reinit('slideshow-section');
  
        // Set a timer to resize the header in case the logo changes size
        setTimeout(function() {
          window.dispatchEvent(new Event('resize'));
        }, 500);
      }
    }
  
    HeaderSection.prototype = Object.assign({}, HeaderSection.prototype, {
      initDrawers: function() {
        if (theme.settings.cartType === 'drawer') {
          if (!document.body.classList.contains('template-cart')) {
            new theme.CartDrawer();
          }
        }
      },
  
      onUnload: function() {
        theme.headerNav.unload();
        theme.slideNav.unload();
      }
    });
  
    return HeaderSection;
  })();
  
  theme.FooterSection = (function() {
  
    var selectors = {
      locale: '[data-disclosure-locale]',
      currency: '[data-disclosure-currency]'
    };
  
    function FooterSection(container) {
      this.container = container;
      this.localeDisclosure = null;
      this.currencyDisclosure = null;
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this),
        threshold: 1000
      });
    }
  
    FooterSection.prototype = Object.assign({}, FooterSection.prototype, {
      init: function() {
        var localeEl = this.container.querySelector(selectors.locale);
        var currencyEl = this.container.querySelector(selectors.currency);
  
        if (localeEl) {
          this.localeDisclosure = new theme.Disclosure(localeEl);
        }
  
        if (currencyEl) {
          this.currencyDisclosure = new theme.Disclosure(currencyEl);
        }
      },
      onUnload: function() {
        if (this.localeDisclosure) {
          this.localeDisclosure.destroy();
        }
  
        if (this.currencyDisclosure) {
          this.currencyDisclosure.destroy();
        }
      }
    });
  
    return FooterSection;
  })();
  
  theme.Collection = (function() {
    var isAnimating = false;
  
    var selectors = {
      sortSelect: '#SortBy'
    };
  
    function Collection(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id')
      this.namespace = '.collection-' + this.sectionId;
  
      var hasHeroImage = document.querySelector('.collection-hero');
  
      if (hasHeroImage) {
        this.checkIfNeedReload();
      } else if (theme.settings.overlayHeader) {
        theme.headerNav.disableOverlayHeader();
      }
  
      this.init();
    }
  
    Collection.prototype = Object.assign({}, Collection.prototype, {
      init: function() {
        // init is called on load and when tags are selected
        this.container = this.container;
        this.sectionId = this.container.getAttribute('data-section-id')
  
        this.sortSelect = document.querySelector(selectors.sortSelect);
        if (this.sortSelect) {
          this.sortSelect.on('change', this.onSortChange.bind(this));
          this.defaultSort = this.getDefaultSortValue();
        }
  
        new theme.HoverProductGrid(this.container);
  
        this.initParams();
        this.sortTags();
        this.bindBackButton();
      },
  
      initParams: function() {
        this.queryParams = {};
  
        if (location.search.length) {
          var aKeyValue;
          var aCouples = location.search.substr(1).split('&');
          for (var i = 0; i < aCouples.length; i++) {
            aKeyValue = aCouples[i].split('=');
            if (aKeyValue.length > 1) {
              this.queryParams[
                decodeURIComponent(aKeyValue[0])
              ] = decodeURIComponent(aKeyValue[1]);
            }
          }
        }
      },
  
      getSortValue: function() {
        return this.sortSelect.value || this.defaultSort;
      },
  
      getDefaultSortValue: function() {
        return this.sortSelect.dataset.sortBy;
      },
  
      onSortChange: function() {
        this.queryParams.sort_by = this.getSortValue();
  
        if (this.queryParams.page) {
          delete this.queryParams.page;
        }
  
        var params = new URLSearchParams(Object.entries(this.queryParams));
  
        window.location.search = params.toString();
      },
  
      sortTags: function() {
        var sortTags = document.getElementById('SortTags');
  
        if (!sortTags) {
          return;
        }
  
        sortTags.on('change', function(evt) {
          location.href = sortTags.value;
        });
      },
  
      bindBackButton: function() {
        window.off('popstate' + this.namespace);
        window.on('popstate' + this.namespace, (state) => {
          if (state) {
            // Bail if it's a hash link
            if (location.href.indexOf(location.pathname) >= 0) {
              return true;
            }
  
            const newUrl = new URL(window.location.href);
  
            theme.CollectionAjaxFilter(newUrl, false).then(() => {
              isAnimating = false;
              this.initPriceRange();
            });
          }
        });
      },
  
      // A liquid variable in the header needs a full page refresh
      // if the collection header hero image setting is enabled
      // and the header is set to sticky. Only necessary in the editor.
      checkIfNeedReload: function() {
        if (!Shopify.designMode) {
          return;
        }
  
        if (!theme.settings.overlayHeader) {
          return;
        }
  
        var headerWrapper = document.querySelector('.header-wrapper');
        if (!headerWrapper.classList.contains('header-wrapper--overlay')) {
          location.reload();
        }
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      onUnload: function() {
        window.off(this.namespace);
        this.container.off(this.namespace);
      }
  
    });
  
    return Collection;
  })();
  
  theme.CollectionFilter = (function() {
    var isAnimating = false;
  
    var selectors = {
      activeTagList: '.tag-list--active-tags',
      activeTags: '.tag-list a',
      filters: '.collection-filter',
      priceRange: '.price-range',
      tags: '.tag-list input',
      tagsForm: '.filter-form',
    };
  
    var classes = {
      activeTag: 'tag--active',
      removeTagParent: 'tag--remove'
    };
  
    function CollectionFilter(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id');
      this.namespace = '.collection-filter-' + this.sectionId;
  
      this.init();
    }
  
    CollectionFilter.prototype = Object.assign({}, CollectionFilter.prototype, {
      init: function() {
        document.querySelectorAll(selectors.activeTags).forEach(tag => {
          tag.on('click' + this.namespace, this.onTagClick.bind(this));
        });
  
        document.querySelectorAll(selectors.tagsForm).forEach(form => {
          form.addEventListener('input', this.onFormSubmit.bind(this));
        });
  
        this.initPriceRange();
      },
  
      initPriceRange: function() {
        const priceRangeEls = document.querySelectorAll(selectors.priceRange)
        priceRangeEls.forEach((el) => new theme.PriceRange(el, {
        
          // onChange passes in formData
          onChange: this.renderFromFormData.bind(this),
        }));
      },
  
      onTagClick: function(evt) {
        var tag = evt.currentTarget;
  
        if (tag.classList.contains('no-ajax')) {
          return;
        }
  
        evt.preventDefault();
        if (isAnimating) {
          return;
        }
  
        isAnimating = true;
  
        const parent = tag.parentNode;
        const newUrl = new URL(tag.href);
  
        this.renderActiveTag(parent, tag);
        this.startLoading();
        this.renderCollectionPage(newUrl.searchParams);
      },
  
      onFormSubmit: function(evt) {
        const tag = evt.target;
  
        // Do not ajax-load collection links
        if (tag.classList.contains('no-ajax')) {
          return;
        }
  
        evt.preventDefault();
        if (isAnimating) {
          return;
        }
  
        isAnimating = true;
  
        const parent = tag.closest('li');
        const formEl = tag.closest('form');
        const formData = new FormData(formEl);
  
        this.renderActiveTag(parent, tag);
        this.startLoading();
        this.renderFromFormData(formData);
      },
  
      renderCollectionPage: function(searchParams) {
        theme.CollectionAjaxFilter(searchParams)
          .then(() => {
            isAnimating = false;
            this.initPriceRange();
          });
      },
  
      renderFromFormData: function(formData) {
        const searchParams = new URLSearchParams(formData);
        this.renderCollectionPage(searchParams);
      },
  
      renderActiveTag: function(parent, el) {
        const textEl = parent.querySelector('.tag__text');
  
        if (parent.classList.contains(classes.activeTag)) {
          parent.classList.remove(classes.activeTag);
        } else {
          // If adding a tag, show new tag right away.
          // Otherwise, remove it before ajax finishes
          if (el.closest('li').classList.contains(classes.removeTagParent)) {
            parent.remove();
          } else {
            const newTag = document.createElement('li');
            newTag.classList.add(...['tag', 'tag--remove']);
            const tagLink = document.createElement('a');
            tagLink.classList.add(...['btn', 'btn--small', 'js-no-transition']);
            tagLink.innerText = textEl.innerText;
  
            newTag.appendChild(tagLink);
  
            const tagList = document.querySelector(selectors.activeTagList);
            if (tagList) tagList.append(newTag);
          }
  
          parent.classList.add(classes.activeTag);
        }
      },
  
      startLoading: function() {
        document.querySelectorAll('.grid-product').forEach(el => {
          el.classList.add('unload');
        });
      },
  
      forceReload: function() {
        this.init();
      }
    });
  
    return CollectionFilter;
  })();
  
  theme.CollectionAjaxFilter = function (searchParams, updateURLHash = true) {
    const selectors = {
      filterWrapperId: 'CollectionFiltersSection',
      productWrapperId: 'CollectionSection',
      productContentId: 'CollectionAjaxContent',
    };
    const filterWrapper = document.getElementById(selectors.filterWrapperId);
    const productWrapper = document.getElementById(selectors.productWrapperId);
  
    const ajaxRenderer = new theme.AjaxRenderer({
      sections: [
        {
          sectionId: filterWrapper.dataset.sectionId,
          nodeId: selectors.filterWrapperId,
        },
        {
          sectionId: productWrapper.dataset.sectionId,
          nodeId: selectors.productContentId,
        },
      ],
      preserveParams: ['sort_by'],
    });
  
    return ajaxRenderer
      .renderPage(window.location.pathname, searchParams, updateURLHash)
      .then(() => {
        theme.sections.reinit('collection-template');
        theme.sections.reinit('collection-filter');
  
        const newProductContent = document.getElementById(
          selectors.productContentId,
        );
        theme.reinitProductGridItem(newProductContent);
        theme.QuickShopScreens.reInit(newProductContent);
      });
  };
  
  // Handles multiple section interactions:
  //  - Featured collection slider
  //  - Featured collection grid (hover product sliders only)
  //  - Related products
  //  - Social reviews
  //
  // Options:
  //  - scrollable: overflow div with arrows
  //  - infinite pagination: only in slider format
  
  theme.FeaturedCollection = (function() {
    var selectors = {
      scrollWrap: '[data-pagination-wrapper]',
      productContainer: '[data-product-container]',
      collectionProductContainer: '[data-collection-container]',
      product: '[data-product-grid]',
      arrows: '[data-arrow]'
    };
  
    var classes = {
      loading: 'collection-loading',
      arrowLeft: 'overflow-scroller__arrow--left',
      disableScrollLeft: 'overflow-scroller--disable-left',
      disableScrollRight: 'overflow-scroller--disable-right'
    };
  
    function FeaturedCollection(container) {
      this.container = container;
      this.sectionId = this.container.getAttribute('data-section-id');
      this.scrollWrap = this.container.querySelector(selectors.scrollWrap);
      this.scrollArrows = this.container.querySelectorAll(selectors.arrows);
      this.namespace = '.featured-collection-' + this.sectionId;
  
      this.options = {
        scrollable: this.container.dataset.scrollable,
        paginate: this.container.dataset.paginate
      };
  
      var paginateBy = this.container.dataset.paginateBy;
      var productCount = this.container.dataset.collectionCount;
  
      this.settings = {
        url: this.container.dataset.collectionUrl,
        page: 1,
        pageCount: this.options.paginate ? Math.ceil(productCount / paginateBy) : 0,
        itemsToScroll: 3,
        gridItemWidth: this.container.dataset.gridItemWidth
      };
  
      this.state = {
        isInit: false,
        loading: false,
        scrollerEnabled: false,
        loadedAllProducts: false,
        scrollable: this.options.scrollable,
        scrollInterval: null,
        scrollSpeed: 3 // smaller is faster
      };
  
      this.sizing = {
        scroller: 0,
        itemWidth: 0
      };
  
      theme.promiseStylesheet().then(function() {
        theme.initWhenVisible({
          element: this.container,
          callback: this.init.bind(this)
        });
      }.bind(this));
    }
  
    FeaturedCollection.prototype = Object.assign({}, FeaturedCollection.prototype, {
      init: function() {
        new theme.HoverProductGrid(this.container);
  
        if (!this.state.scrollable) {
          return;
        }
  
        this.sizing = this.getScrollWidths();
  
        window.on('resize' + this.namespace, theme.utils.debounce(200, this.handleResize.bind(this)));
  
        this.toggleScrollListener(this.state.scrollable);
        this.arrowListeners(this.state.scrollable);
  
        this.state.isInit = true;
      },
  
      reInit: function() {
        new theme.HoverProductGrid(this.container);
  
        if (this.state.scrollable) {
          this.sizing = this.getScrollWidths();
          this.toggleScrollListener(this.state.scrollable);
        }
  
        theme.reinitProductGridItem();
      },
  
      loadingState: function(loading) {
        this.state.loading = loading;
        this.container.classList.toggle(classes.loading, loading);
      },
  
      getScrollWidths: function() {
        var container = this.scrollWrap.offsetWidth;
        var scroller = this.scrollWrap.scrollWidth;
        var item = this.scrollWrap.querySelector('.grid__item');
        var itemWidth = item.offsetWidth;
  
        // First time this runs there is a 200px CSS animation that JS doesn't
        // take into account, so manually subtract from the scroller width
        if (!this.state.isInit) {
          scroller = scroller - 200;
        }
  
        if (scroller <= container) {
          this.disableArrow(null, true);
        }
  
        return {
          scroller: scroller,
          scrollSize: scroller - container,
          itemWidth: itemWidth
        };
      },
  
      handleResize: function() {
        if (this.state.scrollable) {
          this.sizing = this.getScrollWidths();
        }
        this.toggleScrollListener(this.state.scrollable);
        this.arrowListeners(this.state.scrollable);
      },
  
      toggleScrollListener: function(enable) {
        if (enable) {
          if (this.state.scrollerEnabled) { return; }
          this.scrollWrap.on('scroll' + this.namespace, theme.utils.throttle(250, this.scrollCheck.bind(this)));
          this.state.scrollerEnabled = true;
        } else {
          this.scrollWrap.off('scroll' + this.namespace);
          this.state.scrollerEnabled = false;
        }
      },
  
      scrollCheck: function(evt) {
        if (this.state.loading) {
          this.toggleScrollListener(false);
          return;
        }
  
        // If a value is 0, we need to recalculate starting points
        if (this.sizing.scrollSize === 0) {
          this.sizing = this.getScrollWidths();
        }
  
        var scrollLeft = evt.currentTarget.scrollLeft ? evt.currentTarget.scrollLeft : 0;
        var percent = Math.floor(scrollLeft / this.sizing.scrollSize * 100);
        var fromEnd = this.sizing.scrollSize - scrollLeft;
  
        if (this.options.paginate) {
          if (!this.state.loadedAllProducts && percent > 50) {
            this.getNewProducts();
          }
        }
  
        if (!percent) {
          percent = 0;
        }
  
        this.disableArrow(percent);
      },
  
      arrowListeners: function(enable) {
        this.scrollArrows.forEach(arrow => {
          arrow.off('click' + this.namespace);
          if (enable) {
            arrow.classList.remove('hide');
            arrow.on('click' + this.namespace, this.arrowScroll.bind(this));
          } else {
            arrow.classList.add('hide');
          }
        });
      },
  
      arrowScroll: function(evt) {
        var direction = evt.currentTarget.classList.contains(classes.arrowLeft) ? 'left' : 'right';
        var iteration = theme.config.bpSmall ? 1 : 2;
  
        if (evt.type === 'mouseenter') {
          this.state.scrollInterval = setInterval(function(){
            var currentPos = this.scrollWrap.scrollLeft;
            var newPos = direction === 'left' ? (currentPos - iteration) : (currentPos + iteration);
            this.scrollWrap.scrollLeft = newPos;
          }.bind(this), this.state.scrollSpeed);
        } else if (evt.type === 'mouseleave') {
          clearInterval(this.state.scrollInterval);
        } else if (evt.type === 'click') {
          clearInterval(this.state.scrollInterval);
          var currentPos = this.scrollWrap.scrollLeft;
          var scrollAmount = this.sizing.itemWidth * this.settings.itemsToScroll;
          var newPos = direction === 'left' ? (currentPos - scrollAmount) : (currentPos + scrollAmount);
  
          this.scrollWrap.scroll({
            left: newPos,
            behavior: 'smooth'
          });
        }
  
        if (newPos <= 0) {
          this.disableArrow(newPos);
        }
      },
  
      disableArrow: function(pos, all) {
        this.scrollArrows.forEach(arrow => {
          arrow.classList.remove(classes.disableScrollRight);
          arrow.classList.remove(classes.disableScrollLeft);
  
          if (all) {
            arrow.classList.add(classes.disableScrollRight);
            arrow.classList.add(classes.disableScrollLeft);
            return;
          }
  
          // Max left scroll
          if (pos <= 10) {
            arrow.classList.add(classes.disableScrollLeft);
            return;
          }
  
          // Max right scroll
          if (pos >= 96) {
            arrow.classList.add(classes.disableScrollRight);
            return;
          }
        });
      },
  
      getNewProducts: function() {
        this.loadingState(true);
        var newPage = this.settings.page + 1;
        var itemWidth = this.settings.gridItemWidth;
  
        // No more pages, disable features
        if (newPage > this.settings.pageCount) {
          this.loadingState(false);
          this.state.loadedAllProducts = true;
          return;
        }
  
        var newUrl = this.settings.url + '?page=' + (newPage);
  
        fetch(newUrl).then(function(response) {
          return response.text();
        }).then(function(html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newProducts = doc.querySelectorAll(selectors.collectionProductContainer + ' .grid-product');
          var fragment = document.createDocumentFragment();
  
          newProducts.forEach(prod => {
            prod.classList.add(itemWidth);
            fragment.appendChild(prod);
          });
  
          this.container.querySelector(selectors.productContainer).appendChild(fragment);
  
          this.ajaxSuccess();
        }.bind(this));
      },
  
      ajaxSuccess: function() {
        this.loadingState(false);
        this.settings.page = this.settings.page + 1;
        this.reInit();
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      // Only runs in the editor while a user is activating.
      // Rearranges quick shop modals to fix potentially broken layout
      onLoad: function() {
        theme.QuickShopScreens.reInit(this.container);
      },
  
      onUnload: function() {
        window.off(this.namespace);
        window.dispatchEvent(new Event('resize'));
        this.scrollWrap.off(this.namespace);
        theme.QuickShopScreens.unload(this.container);
      }
  
    });
  
    return FeaturedCollection;
  })();
  
  theme.Testimonials = (function() {
    var defaults = {
      adaptiveHeight: false,
      avoidReflow: true,
      pageDots: true,
      prevNextButtons: false,
      wrapAround: true
    };
  
    function Testimonials(container) {
      this.container = container;
      var sectionId = container.getAttribute('data-section-id')
      this.slideshow = container.querySelector('#Testimonials-' + sectionId);
  
      if (!this.slideshow) { return }
  
      theme.promiseStylesheet().then(function() {
        theme.initWhenVisible({
          element: this.container,
          callback: this.init.bind(this),
          threshold: 600
        });
      }.bind(this));
    }
  
    Testimonials.prototype = Object.assign({}, Testimonials.prototype, {
      init: function(obj, args) {
        // Do not wrap when only a few blocks
        if (this.slideshow.dataset.count <= 3) {
          defaults.wrapAround = false;
          defaults.contain = true;
        }
  
        this.flickity = new theme.Slideshow(this.slideshow, defaults);
        this.flickity.resize();
      },
  
      onUnload: function() {
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      onDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      },
  
      onBlockSelect: function(evt) {
        var slide = this.slideshow.querySelector('.testimonials-slide--' + evt.detail.blockId)
        var index = parseInt(slide.dataset.index);
  
        clearTimeout(this.timeout);
  
        if (this.flickity && typeof this.flickity.pause === 'function') {
          this.flickity.goToSlide(index);
          this.flickity.pause();
        }
      },
  
      onBlockDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      }
    });
  
    return Testimonials;
  })();
  
  theme.HeroAnimated = (function() {
  
    var classes = {
      active: 'animated__slide--active',
      inactive: 'animated__slide--inactive'
    }
  
    function HeroAnimated(container) {
      this.container = container;
      var imageCount = container.dataset.count;
  
      var imageContainer = container.querySelector('.hero');
      if (imageContainer) {
        theme.loadImageSection(imageContainer);
      }
      this.allImages = container.querySelectorAll('.animated__slide');
  
      this.state = {
        activeIndex: 0
      };
  
      if (imageCount === 1) {
        this.setFades(true);
        return;
      }
  
      this.interval;
      this.intervalSpeed = container.dataset.interval;
      this.maxIndex = imageCount - 1;
  
      theme.promiseStylesheet().then(function() {
        theme.initWhenVisible({
          element: this.container,
          callback: this.initInterval.bind(this)
        });
      }.bind(this));
    }
  
    HeroAnimated.prototype = Object.assign({}, HeroAnimated.prototype, {
      initInterval: function() {
        this.setFades(true);
        this.interval = setInterval(function() {
          this.setFades();
        }.bind(this), this.intervalSpeed);
      },
  
      setFades: function(first) {
        // Get next image index
        var nextIndex = this.state.activeIndex === this.maxIndex ? 0 : this.state.activeIndex + 1;
  
        if (first) {
          nextIndex = this.state.activeIndex;
        }
  
        // Unset existing image
        if (!first) {
          var image = this.allImages[this.state.activeIndex];
          image.classList.remove(classes.active);
          image.classList.add(classes.inactive);
        }
  
        // Set next image as active
        var nextImage = this.allImages[nextIndex];
        nextImage.classList.remove(classes.inactive);
        nextImage.classList.add(classes.active);
  
        this.state.activeIndex = nextIndex;
      },
  
      onUnload: function() {
        clearInterval(this.interval);
      }
    });
  
    return HeroAnimated;
  })();
  

  theme.Maps = (function() {
    var config = {
      zoom: 14
    };
    var apiStatus = null;
    var mapsToLoad = [];
  
    var errors = {};
  
    var selectors = {
      section: '[data-section-type="map"]',
      map: '[data-map]',
      mapOverlay: '.map-section__overlay'
    };
  
    // Global function called by Google on auth errors.
    // Show an auto error message on all map instances.
    window.gm_authFailure = function() {
      if (!Shopify.designMode) {
        return;
      }
  
      document.querySelectorAll(selectors.section).forEach(section => {
        section.classList.add('map-section--load-error');
      });
  
      document.querySelectorAll(selectors.map).forEach(map => {
        map.parentNode.removeChild(map);
      });
  
      window.mapError(theme.strings.authError);
    };
  
    window.mapError = function(error) {
      var message = document.createElement('div');
      message.classList.add('map-section__error', 'errors', 'text-center');
      message.innerHTML = error;
      document.querySelectorAll(selectors.mapOverlay).forEach(overlay => {
        overlay.parentNode.prepend(message);
      });
      document.querySelectorAll('.map-section__link').forEach(link => {
        link.classList.add('hide');
      });
    };
  
    function Map(container) {
      this.container = container;
      this.sectionId = this.container.getAttribute('data-section-id');
      this.namespace = '.map-' + this.sectionId;
      this.map = container.querySelector(selectors.map);
      this.key = this.map.dataset.apiKey;
  
      errors = {
        addressNoResults: theme.strings.addressNoResults,
        addressQueryLimit: theme.strings.addressQueryLimit,
        addressError: theme.strings.addressError,
        authError: theme.strings.authError
      };
  
      if (!this.key) {
        return;
      }
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.prepMapApi.bind(this),
        threshold: 20
      });
    }
  
    // API has loaded, load all Map instances in queue
    function initAllMaps() {
      mapsToLoad.forEach(instance => {
        instance.createMap();
      });
    }
  
    function geolocate(map) {
      var geocoder = new google.maps.Geocoder();
  
      if (!map) {
        return;
      }
  
      var address = map.dataset.addressSetting;
  
      var deferred = new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, function(results, status) {
          if (status !== google.maps.GeocoderStatus.OK) {
            reject(status);
          }
          resolve(results);
        });
      });
  
      return deferred;
    }
  
    Map.prototype = Object.assign({}, Map.prototype, {
      prepMapApi: function() {
        if (apiStatus === 'loaded') {
          this.createMap();
        } else {
          mapsToLoad.push(this);
  
          if (apiStatus !== 'loading') {
            apiStatus = 'loading';
            if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined' ) {
  
              var script = document.createElement('script');
              script.onload = function () {
                apiStatus = 'loaded';
                initAllMaps();
              };
              script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.key;
              document.head.appendChild(script);
            }
          }
        }
      },
  
      createMap: function() {
        var mapDiv = this.map;
  
        return geolocate(mapDiv)
          .then(
            function(results) {
              var mapOptions = {
                zoom: config.zoom,
                backgroundColor: 'none',
                center: results[0].geometry.location,
                draggable: false,
                clickableIcons: false,
                scrollwheel: false,
                disableDoubleClickZoom: true,
                disableDefaultUI: true
              };
  
              var map = (this.map = new google.maps.Map(mapDiv, mapOptions));
              var center = (this.center = map.getCenter());
  
              var marker = new google.maps.Marker({
                map: map,
                position: map.getCenter()
              });
  
              google.maps.event.addDomListener(
                window,
                'resize',
                theme.utils.debounce(250, function() {
                  google.maps.event.trigger(map, 'resize');
                  map.setCenter(center);
                  mapDiv.removeAttribute('style');
                })
              );
  
              if (Shopify.designMode) {
                if (window.AOS) { AOS.refreshHard() }
              }
            }.bind(this)
          )
          .catch(function(status) {
            var errorMessage;
  
            switch (status) {
              case 'ZERO_RESULTS':
                errorMessage = errors.addressNoResults;
                break;
              case 'OVER_QUERY_LIMIT':
                errorMessage = errors.addressQueryLimit;
                break;
              case 'REQUEST_DENIED':
                errorMessage = errors.authError;
                break;
              default:
                errorMessage = errors.addressError;
                break;
            }
  
            // Show errors only to merchant in the editor.
            if (Shopify.designMode) {
              window.mapError(errorMessage);
            }
          });
      },
  
      onUnload: function() {
        if (this.map.length === 0) {
          return;
        }
        // Causes a harmless JS error when a section without an active map is reloaded
        if (google && google.maps && google.maps.event) {
          google.maps.event.clearListeners(this.map, 'resize');
        }
      }
    });
  
    return Map;
  })();
  
  theme.SlideshowSection = (function() {
  
    var selectors = {
      parallaxContainer: '.parallax-container'
    };
  
    function SlideshowSection(container) {
      this.container = container;
      var sectionId = container.getAttribute('data-section-id');
      this.slideshow = container.querySelector('#Slideshow-' + sectionId);
      this.namespace = '.' + sectionId;
  
      this.initialIndex = 0;
  
      if (!this.slideshow) { return }
  
      // Get shopify-created div that section markup lives in,
      // then get index of it inside its parent
      var sectionEl = container.parentElement;
      var sectionIndex = [].indexOf.call(sectionEl.parentElement.children, sectionEl);
  
      if (sectionIndex === 0) {
        this.init();
      } else {
        theme.initWhenVisible({
          element: this.container,
          callback: this.init.bind(this)
        });
      }
  
    }
  
    SlideshowSection.prototype = Object.assign({}, SlideshowSection.prototype, {
      init: function() {
        var slides = this.slideshow.querySelectorAll('.slideshow__slide');
  
        if (this.container.hasAttribute('data-immediate-load')) {
          this.slideshow.classList.remove('loading', 'loading--delayed');
          this.slideshow.classList.add('loaded');
        } else {
          // Wait for image to load before marking as done
          theme.loadImageSection(this.slideshow);
        }
  
        if (slides.length > 1) {
          var sliderArgs = {
            prevNextButtons: this.slideshow.hasAttribute('data-arrows'),
            pageDots: this.slideshow.hasAttribute('data-dots'),
            fade: true,
            setGallerySize: false,
            initialIndex: this.initialIndex,
            autoPlay: this.slideshow.dataset.autoplay === 'true'
              ? parseInt(this.slideshow.dataset.speed)
              : false
          };
  
          this.flickity = new theme.Slideshow(this.slideshow, sliderArgs);
        } else {
          // Add loaded class to first slide
          slides[0].classList.add('is-selected');
        }
  
        if (this.container.hasAttribute('data-parallax')) {
          // Create new parallax for each slideshow image
          this.container.querySelectorAll(selectors.parallaxContainer).forEach(function(el, i) {
            new theme.Parallax(el, {
              namespace: this.namespace + '-parallax-' + i
            });
          }.bind(this));
        }
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      onUnload: function() {
        if (this.flickity && typeof this.flickity.destroy === 'function') {
          this.flickity.destroy();
        }
      },
  
      onDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          this.flickity.play();
        }
      },
  
      onBlockSelect: function(evt) {
        var slide = this.slideshow.querySelector('.slideshow__slide--' + evt.detail.blockId)
        var index = parseInt(slide.dataset.index);
  
        if (this.flickity && typeof this.flickity.pause === 'function') {
          this.flickity.goToSlide(index);
          this.flickity.pause();
        } else {
          // If section reloads, slideshow might not have been setup yet, wait a second and try again
          this.initialIndex = index;
          setTimeout(function() {
            if (this.flickity && typeof this.flickity.pause === 'function') {
              this.flickity.pause();
            }
          }.bind(this), 1000);
        }
      },
  
      onBlockDeselect: function() {
        if (this.flickity && typeof this.flickity.play === 'function') {
          if (this.flickity.args.autoPlay) {
            this.flickity.play();
          }
        }
      }
    });
  
    return SlideshowSection;
  })();
  
  theme.NewsletterPopup = (function() {
    function NewsletterPopup(container) {
      this.container = container;
      var sectionId = this.container.getAttribute('data-section-id');
      this.cookieName = 'newsletter-' + sectionId;
  
      if (!container) {
        return;
      }
  
      // Prevent popup on Shopify robot challenge page
      if (window.location.pathname === '/challenge') {
        return;
      }
  
      this.data = {
        secondsBeforeShow: container.dataset.delaySeconds,
        daysBeforeReappear: container.dataset.delayDays,
        cookie: Cookies.get(this.cookieName),
        testMode: container.dataset.testMode
      };
  
      this.modal = new theme.Modals('NewsletterPopup-' + sectionId, 'newsletter-popup-modal');
  
      // Open modal if errors or success message exist
      if (container.querySelector('.errors') || container.querySelector('.note--success')) {
        this.modal.open();
      }
  
      // Set cookie as opened if success message
      if (container.querySelector('.note--success')) {
        this.closePopup(true);
        return;
      }
  
      document.addEventListener('modalClose.' + container.id, this.closePopup.bind(this));
  
      if (!this.data.cookie || this.data.testMode === 'true') {
        this.initPopupDelay();
      }
    }
  
    NewsletterPopup.prototype = Object.assign({}, NewsletterPopup.prototype, {
      initPopupDelay: function() {
        if (Shopify && Shopify.designMode) {
          return;
        }
        setTimeout(function() {
          this.modal.open();
        }.bind(this), this.data.secondsBeforeShow * 1000);
      },
  
      closePopup: function(success) {
        // Remove a cookie in case it was set in test mode
        if (this.data.testMode === 'true') {
          Cookies.remove(this.cookieName, { path: '/' });
          return;
        }
  
        var expiry = success ? 200 : this.data.daysBeforeReappear;
        Cookies.set(this.cookieName, 'opened', { path: '/', expires: expiry });
      },
  
      onLoad: function() {
        this.modal.open();
      },
  
      onSelect: function() {
        this.modal.open();
      },
  
      onDeselect: function() {
        this.modal.close();
      }
    });
  
    return NewsletterPopup;
  })();
  
  theme.PasswordHeader = (function() {
    function PasswordHeader() {
      this.init();
    }
  
    PasswordHeader.prototype = Object.assign({}, PasswordHeader.prototype, {
      init: function() {
        if (!document.querySelector('#LoginModal')) {
          return;
        }
  
        var passwordModal = new theme.Modals('LoginModal', 'login-modal', {
          focusIdOnOpen: 'password',
          solid: true
        });
  
        // Open modal if errors exist
        if (document.querySelectorAll('.errors').length) {
          passwordModal.open();
        }
      }
    });
  
    return PasswordHeader;
  })();
  
  theme.Photoswipe = (function() {
    var selectors = {
      trigger: '.js-photoswipe__zoom',
      images: '.photoswipe__image',
      slideshowTrack: '.flickity-viewport ',
      activeImage: '.is-selected'
    };
  
    function Photoswipe(container, sectionId) {
      this.container = container;
      this.sectionId = sectionId;
      this.namespace = '.photoswipe-' + this.sectionId;
      this.gallery;
      this.images;
      this.items;
      this.inSlideshow = false;
  
      if (!container || container.dataset.zoom === 'false') {
        return;
      }
  
      if (container.dataset.hasSlideshow === 'true') {
        this.inSlideshow = true;
      }
  
      this.init();
    }
  
    Photoswipe.prototype = Object.assign({}, Photoswipe.prototype, {
      init: function() {
        this.container.querySelectorAll(selectors.trigger).forEach(trigger => {
          trigger.on('click' + this.namespace, this.triggerClick.bind(this));
        });
      },
  
      triggerClick: function(evt) {
        this.items = this.getImageData();
  
        var image = this.inSlideshow ? this.container.querySelector(selectors.activeImage) : evt.currentTarget;
  
        var index = this.inSlideshow ? this.getChildIndex(image) : image.dataset.index;
  
        this.initGallery(this.items, index);
      },
  
      // Because of image set feature, need to get index based on location in parent
      getChildIndex: function(el) {
        var i = 0;
        while( (el = el.previousSibling) != null ) {
          i++;
        }
  
        // 1-based index required
        return i + 1;
      },
  
      getImageData: function() {
        this.images = this.inSlideshow
                        ? this.container.querySelectorAll(selectors.slideshowTrack + selectors.images)
                        : this.container.querySelectorAll(selectors.images);
  
        var items = [];
        var options = {};
  
        this.images.forEach(el => {
          var item = {
            msrc: el.currentSrc || el.src,
            src: el.getAttribute('data-photoswipe-src'),
            w: el.getAttribute('data-photoswipe-width'),
            h: el.getAttribute('data-photoswipe-height'),
            el: el,
            initialZoomLevel: 0.5
          }
  
          items.push(item);
        });
  
        return items;
      },
  
      initGallery: function(items, index) {
        var pswpElement = document.querySelectorAll('.pswp')[0];
  
        var options = {
          allowPanToNext: false,
          captionEl: false,
          closeOnScroll: false,
          counterEl: false,
          history: false,
          index: index - 1,
          pinchToClose: false,
          preloaderEl: false,
          scaleMode: 'zoom',
          shareEl: false,
          tapToToggleControls: false,
          getThumbBoundsFn: function(index) {
            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
            var thumbnail = items[index].el;
            var rect = thumbnail.getBoundingClientRect();
            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
          }
        }
  
        this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
  
        this.gallery.init();
        this.gallery.listen('afterChange', this.afterChange.bind(this));
      },
  
      afterChange: function() {
        var index = this.gallery.getCurrentIndex();
        this.container.dispatchEvent(new CustomEvent('photoswipe:afterChange', {
          detail: {
            index: index
          }
        }));
      }
    });
  
    return Photoswipe;
  })();
  
  
  theme.Recommendations = (function() {
    var selectors = {
      placeholder: '.product-recommendations-placeholder',
      sectionClass: ' .product-recommendations',
      productResults: '.grid-product'
    }
  
    function Recommendations(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id');
      this.url = container.dataset.url;
  
      selectors.recommendations = 'Recommendations-' + this.sectionId;
  
      theme.initWhenVisible({
        element: container,
        callback: this.init.bind(this),
        threshold: 500
      });
    }
  
    Recommendations.prototype = Object.assign({}, Recommendations.prototype, {
      init: function() {
        var section = document.getElementById(selectors.recommendations);
  
        if (!section || section.dataset.enable === 'false') {
          return;
        }
  
        var id = section.dataset.productId;
        var limit = section.dataset.limit;
  
        var url = this.url + '?section_id=product-recommendations&limit='+ limit +'&product_id=' + id;
  
        // When section his hidden and shown, make sure it starts empty
        if (Shopify.designMode) {
          var wrapper = section.querySelector(selectors.sectionClass)
          if (wrapper) {
            wrapper.innerHTML = '';
          }
        }
  
        fetch(url).then(function(response) {
          return response.text();
        }).then(function(html) {
          // Convert the HTML string into a document object
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var div = doc.querySelector(selectors.sectionClass);
          var placeholder = section.querySelector(selectors.placeholder);
          if (!placeholder) {
            return;
          }
  
          placeholder.innerHTML = '';
  
          if (!div) {
            this.container.classList.add('hide');
            return;
          }
  
          placeholder.appendChild(div);
  
          theme.reinitProductGridItem(section);
  
          document.dispatchEvent(new CustomEvent('recommendations:loaded', {
            detail: {
              section: section
            }
          }));
  
          // If no results, hide the entire section
          var results = div.querySelectorAll(selectors.productResults);
          if (results.length === 0) {
            this.container.classList.add('hide');
          }
        }.bind(this));
      }
    });
  
    return Recommendations;
  })();
  
  theme.StoreAvailability = (function() {
    var selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      modalOpenBtn: '.js-modal-open-availability',
      productTitle: '[data-availability-product-title]'
    };
  
    function StoreAvailability(container) {
      this.container = container;
      this.baseUrl = container.dataset.baseUrl;
      this.productTitle = container.dataset.productName;
    }
  
    StoreAvailability.prototype = Object.assign({}, StoreAvailability.prototype, {
      updateContent: function(variantId) {
        var variantSectionUrl =
          this.baseUrl +
          '/variants/' +
          variantId +
          '/?section_id=store-availability';
  
        var self = this;
  
        fetch(variantSectionUrl)
          .then(function(response) {
            return response.text();
          })
          .then(function(html) {
            if (html.trim() === '') {
              this.container.innerHTML = '';
              return;
            }
  
            self.container.innerHTML = html;
            self.container.innerHTML = self.container.firstElementChild.innerHTML;
  
            // Setup drawer if have open button
            if (self.container.querySelector(selectors.drawerOpenBtn)) {
              self.drawer = new theme.Drawers('StoreAvailabilityDrawer', 'availability');
            }
  
            // Setup modal if have open button
            if (self.container.querySelector(selectors.modalOpenBtn)) {
              self.modal = new theme.Modals('StoreAvailabilityModal', 'availability');
            }
  
            var title = self.container.querySelector(selectors.productTitle);
            if (title) {
              title.textContent = self.productTitle;
            }
          });
      }
    });
  
    return StoreAvailability;
  })();
  
  theme.VideoSection = (function() {
    var selectors = {
      videoParent: '.video-parent-section'
    };
  
    function videoSection(container) {
      this.container = container;
      this.sectionId = container.getAttribute('data-section-id');
      this.namespace = '.video-' + this.sectionId;
      this.videoObject;
  
      theme.initWhenVisible({
        element: this.container,
        callback: this.init.bind(this),
        threshold: 500
      });
    }
  
    videoSection.prototype = Object.assign({}, videoSection.prototype, {
      init: function() {
        var dataDiv = this.container.querySelector('.video-div');
        if (!dataDiv) {
          return;
        }
        var type = dataDiv.dataset.type;
  
        switch(type) {
          case 'youtube':
            var videoId = dataDiv.dataset.videoId;
            this.initYoutubeVideo(videoId);
            break;
          case 'vimeo':
            var videoId = dataDiv.dataset.videoId;
            this.initVimeoVideo(videoId);
            break;
          case 'mp4':
            this.initMp4Video();
            break;
        }
      },
  
      initYoutubeVideo: function(videoId) {
        this.videoObject = new theme.YouTube(
          'YouTubeVideo-' + this.sectionId,
          {
            videoId: videoId,
            videoParent: selectors.videoParent
          }
        );
      },
  
      initVimeoVideo: function(videoId) {
        this.videoObject = new theme.VimeoPlayer(
          'Vimeo-' + this.sectionId,
          videoId,
          {
            videoParent: selectors.videoParent
          }
        );
      },
  
      initMp4Video: function() {
        var mp4Video = 'Mp4Video-' + this.sectionId;
        var mp4Div = document.getElementById(mp4Video);
        var parent = mp4Div.closest(selectors.videoParent);
  
        if (mp4Div) {
          parent.classList.add('loaded');
  
          var playPromise = document.querySelector('#' + mp4Video).play();
  
          // Edge does not return a promise (video still plays)
          if (playPromise !== undefined) {
            playPromise.then(function() {
                // playback normal
              }).catch(function() {
                mp4Div.setAttribute('controls', '');
                parent.classList.add('video-interactable');
              });
          }
        }
      },
  
      onUnload: function(evt) {
        var sectionId = evt.target.id.replace('shopify-section-', '');
        if (this.videoObject && typeof this.videoObject.destroy === 'function') {
          this.videoObject.destroy();
        }
      }
    });
  
    return videoSection;
  })();
  

  theme.isStorageSupported = function(type) {
    // Return false if we are in an iframe without access to sessionStorage
    if (window.self !== window.top) {
      return false;
    }

    var testKey = 'test';
    var storage;
    if (type === 'session') {
      storage = window.sessionStorage;
    }
    if (type === 'local') {
      storage = window.localStorage;
    }

    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  theme.reinitProductGridItem = function() {
    if (AOS) {
      AOS.refreshHard();
    }

    // Refresh reviews app
    if (window.SPR) {
      SPR.initDomEls();SPR.loadBadges();
    }

    // Re-hook up collapsible box triggers
    theme.collapsibles.init();
  };

  theme.reviewAppLinkListener = function() {
    document.addEventListener('click', function (evt) {
      if (!window.SPR) {
        return;
      }

      var parent = evt.target.parentNode;
      var scroller = null;

      if (parent.matches('.spr-pagination-next') || parent.matches('.spr-pagination-page')) {
        scroller = parent.closest('.spr-reviews');
      }

      if (scroller) {
        scroller.scrollTo(0,0);
      }
    });
  };

  theme.checkForAnchorLink = function() {
    if(window.location.hash) {
      var el = document.querySelector(window.location.hash);
      if (el) {
        window.scrollTo(0, el.offsetTop - 100);
      }
    }
  };

  theme.init = function() {
    theme.QuickShopScreens.init();
    theme.rteInit();
    theme.articleImages();
    theme.collapsibles.init();
    if (theme.settings.cartType === 'sticky') {
      new theme.StickyCart.init();
    }
    theme.videoModal();

    // Two ways to determine if page was loaded from cache from back button
    // Most use `pageshow` + evt.persisted, Chrome uses `performance.navigation.type`
    window.addEventListener('pageshow', function(evt) {
      if (evt.persisted) {
        theme.refreshCart();
      }
    });

    if (performance && performance.navigation.type === 2) {
      theme.refreshCart();
    }
  };

  theme.initSecondary = function() {
    document.body.classList.add('js-animate');

    AOS.init({
      easing: 'ease-out-quad',
      once: false,
      mirror: true,
      offset: 100,
      disableMutationObserver: true
    });

    document.addEventListener('lazyloaded', function(evt) {
      var img = evt.target
      if (img) {
        img.parentNode.classList.add('loaded');
      }
    });

    theme.storeScrollPositionOnUnload();
    theme.reviewAppLinkListener();
    theme.checkForAnchorLink();
  };

  /*============================================================================
    Things that don't require DOM to be ready
  ==============================================================================*/
  theme.config.hasSessionStorage = theme.isStorageSupported('session');
  theme.config.hasLocalStorage = theme.isStorageSupported('local');

  /*============================================================================
    Things that require DOM to be ready
  ==============================================================================*/
  function DOMready(callback) {
    if (document.readyState != 'loading') callback();
    else document.addEventListener('DOMContentLoaded', callback);
  }

  DOMready(function(){
    // Init CSS-dependent scripts
    theme.promiseStylesheet().then(function() {
      theme.initSecondary();
      document.dispatchEvent(new CustomEvent('page:loaded'));
    });

    theme.sections = new theme.Sections();

    theme.init();

    if (theme.settings.isCustomerTemplate) {
      theme.customerTemplates();
    }

    theme.sections.register('slideshow-section', theme.SlideshowSection);
    theme.sections.register('header-section', theme.HeaderSection);
    theme.sections.register('hero-animated', theme.HeroAnimated);
    theme.sections.register('video-section', theme.VideoSection);
    theme.sections.register('product', theme.Product);
    theme.sections.register('product-recommendations', theme.Recommendations);
    theme.sections.register('password-header', theme.PasswordHeader);
    theme.sections.register('product-template', theme.Product);
    theme.sections.register('featured-collection', theme.FeaturedCollection);
    theme.sections.register('collection-template', theme.Collection);
    theme.sections.register('collection-filter', theme.CollectionFilter);
    theme.sections.register('testimonials', theme.Testimonials);
    theme.sections.register('newsletter-popup', theme.NewsletterPopup);
    theme.sections.register('map', theme.Maps);
    theme.sections.register('blog', theme.Blog);
    theme.sections.register('footer-section', theme.FooterSection);
    theme.sections.register('new-nav-section', theme.FooterSection);
    theme.sections.register('store-availability', theme.StoreAvailability);
    if (document.body.classList.contains('template-cart')) {
      var cartPageForm = document.getElementById('CartPageForm');
      if (cartPageForm) {
        new theme.CartForm(cartPageForm);
      }
    }

    theme.pageTransitions();
  });
})();
