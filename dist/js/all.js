/**
 * Autofill event polyfill ##version:1.0.0##
 * (c) 2014 Google, Inc.
 * License: MIT
 */
(function (window) {
  var $ = window.jQuery || window.angular.element;
  var rootElement = window.document.documentElement,
      $rootElement = $(rootElement);

  addGlobalEventListener('change', markValue);
  addValueChangeByJsListener(markValue);

  $.prototype.checkAndTriggerAutoFillEvent = jqCheckAndTriggerAutoFillEvent;

  // Need to use blur and not change event
  // as Chrome does not fire change events in all cases an input is changed
  // (e.g. when starting to type and then finish the input by auto filling a username)
  addGlobalEventListener('blur', function (target) {
    // setTimeout needed for Chrome as it fills other
    // form fields a little later...
    window.setTimeout(function () {
      findParentForm(target).find('input').checkAndTriggerAutoFillEvent();
    }, 20);
  });

  window.document.addEventListener('DOMContentLoaded', function () {
    // mark all values that are present when the DOM is ready.
    // We don't need to trigger a change event here,
    // as js libs start with those values already being set!
    forEach(document.getElementsByTagName('input'), markValue);

    // The timeout is needed for Chrome as it auto fills
    // login forms some time after DOMContentLoaded!
    window.setTimeout(function () {
      $rootElement.find('input').checkAndTriggerAutoFillEvent();
    }, 200);
  }, false);

  return;

  // ----------

  function jqCheckAndTriggerAutoFillEvent() {
    var i, el;
    for (i = 0; i < this.length; i++) {
      el = this[i];
      if (!valueMarked(el)) {
        markValue(el);
        triggerChangeEvent(el);
      }
    }
  }

  function valueMarked(el) {
    if (!("$$currentValue" in el)) {
      // First time we see an element we take it's value attribute
      // as real value. This might have been filled in the backend,
      // ...
      // Note: it's important to not use the value property here!
      el.$$currentValue = el.getAttribute('value');
    }

    var val = el.value,
        $$currentValue = el.$$currentValue;
    if (!val && !$$currentValue) {
      return true;
    }
    return val === $$currentValue;
  }

  function markValue(el) {
    el.$$currentValue = el.value;
  }

  function addValueChangeByJsListener(listener) {
    var jq = window.jQuery || window.angular.element,
        jqProto = jq.prototype;
    var _val = jqProto.val;
    jqProto.val = function (newValue) {
      var res = _val.apply(this, arguments);
      if (arguments.length > 0) {
        forEach(this, function (el) {
          listener(el, newValue);
        });
      }
      return res;
    };
  }

  function addGlobalEventListener(eventName, listener) {
    // Use a capturing event listener so that
    // we also get the event when it's stopped!
    // Also, the blur event does not bubble.
    rootElement.addEventListener(eventName, onEvent, true);

    function onEvent(event) {
      var target = event.target;
      listener(target);
    }
  }

  function findParentForm(el) {
    while (el) {
      if (el.nodeName === 'FORM') {
        return $(el);
      }
      el = el.parentNode;
    }
    return $();
  }

  function forEach(arr, listener) {
    if (arr.forEach) {
      return arr.forEach(listener);
    }
    var i;
    for (i = 0; i < arr.length; i++) {
      listener(arr[i]);
    }
  }

  function triggerChangeEvent(element) {
    var doc = window.document;
    var event = doc.createEvent("HTMLEvents");
    event.initEvent("change", true, true);
    element.dispatchEvent(event);
  }
})(window);
/*!
 * Datepicker for Bootstrap v1.5.1 (https://github.com/eternicode/bootstrap-datepicker)
 *
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 * Licensed under the Apache License v2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 */(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	} else if (typeof exports === 'object') {
		factory(require('jquery'));
	} else {
		factory(jQuery);
	}
})(function ($, undefined) {

	function UTCDate() {
		return new Date(Date.UTC.apply(Date, arguments));
	}
	function UTCToday() {
		var today = new Date();
		return UTCDate(today.getFullYear(), today.getMonth(), today.getDate());
	}
	function isUTCEquals(date1, date2) {
		return date1.getUTCFullYear() === date2.getUTCFullYear() && date1.getUTCMonth() === date2.getUTCMonth() && date1.getUTCDate() === date2.getUTCDate();
	}
	function alias(method) {
		return function () {
			return this[method].apply(this, arguments);
		};
	}
	function isValidDate(d) {
		return d && !isNaN(d.getTime());
	}

	var DateArray = function () {
		var extras = {
			get: function (i) {
				return this.slice(i)[0];
			},
			contains: function (d) {
				// Array.indexOf is not cross-browser;
				// $.inArray doesn't work with Dates
				var val = d && d.valueOf();
				for (var i = 0, l = this.length; i < l; i++) if (this[i].valueOf() === val) return i;
				return -1;
			},
			remove: function (i) {
				this.splice(i, 1);
			},
			replace: function (new_array) {
				if (!new_array) return;
				if (!$.isArray(new_array)) new_array = [new_array];
				this.clear();
				this.push.apply(this, new_array);
			},
			clear: function () {
				this.length = 0;
			},
			copy: function () {
				var a = new DateArray();
				a.replace(this);
				return a;
			}
		};

		return function () {
			var a = [];
			a.push.apply(a, arguments);
			$.extend(a, extras);
			return a;
		};
	}();

	// Picker object

	var Datepicker = function (element, options) {
		$(element).data('datepicker', this);
		this._process_options(options);

		this.dates = new DateArray();
		this.viewDate = this.o.defaultViewDate;
		this.focusDate = null;

		this.element = $(element);
		this.isInline = false;
		this.isInput = this.element.is('input');
		this.component = this.element.hasClass('date') ? this.element.find('.tclock, .input-group-addon, .btn') : false;
		this.hasInput = this.component && this.element.find('input').length;
		if (this.component && this.component.length === 0) this.component = false;

		this.picker = $(DPGlobal.template);
		this._buildEvents();
		this._attachEvents();

		if (this.isInline) {
			this.picker.addClass('datepicker-inline').appendTo(this.element);
		} else {
			this.picker.addClass('datepicker-dropdown dropdown-menu');
		}

		if (this.o.rtl) {
			this.picker.addClass('datepicker-rtl');
		}

		this.viewMode = this.o.startView;

		if (this.o.calendarWeeks) this.picker.find('thead .datepicker-title, tfoot .today, tfoot .clear').attr('colspan', function (i, val) {
			return parseInt(val) + 1;
		});

		this._allow_update = false;

		this.setStartDate(this._o.startDate);
		this.setEndDate(this._o.endDate);
		this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);
		this.setDaysOfWeekHighlighted(this.o.daysOfWeekHighlighted);
		this.setDatesDisabled(this.o.datesDisabled);

		this.fillDow();
		this.fillMonths();

		this._allow_update = true;

		this.update();
		this.showMode();

		if (this.isInline) {
			this.show();
		}
	};

	Datepicker.prototype = {
		constructor: Datepicker,

		_process_options: function (opts) {
			// Store raw options for reference
			this._o = $.extend({}, this._o, opts);
			// Processed options
			var o = this.o = $.extend({}, this._o);

			// Check if "de-DE" style date is available, if not language should
			// fallback to 2 letter code eg "de"
			var lang = o.language;
			if (!dates[lang]) {
				lang = lang.split('-')[0];
				if (!dates[lang]) lang = defaults.language;
			}
			o.language = lang;

			switch (o.startView) {
				case 2:
				case 'decade':
					o.startView = 2;
					break;
				case 1:
				case 'year':
					o.startView = 1;
					break;
				default:
					o.startView = 0;
			}

			switch (o.minViewMode) {
				case 1:
				case 'months':
					o.minViewMode = 1;
					break;
				case 2:
				case 'years':
					o.minViewMode = 2;
					break;
				default:
					o.minViewMode = 0;
			}

			switch (o.maxViewMode) {
				case 0:
				case 'days':
					o.maxViewMode = 0;
					break;
				case 1:
				case 'months':
					o.maxViewMode = 1;
					break;
				default:
					o.maxViewMode = 2;
			}

			o.startView = Math.min(o.startView, o.maxViewMode);
			o.startView = Math.max(o.startView, o.minViewMode);

			// true, false, or Number > 0
			if (o.multidate !== true) {
				o.multidate = Number(o.multidate) || false;
				if (o.multidate !== false) o.multidate = Math.max(0, o.multidate);
			}
			o.multidateSeparator = String(o.multidateSeparator);

			o.weekStart %= 7;
			o.weekEnd = (o.weekStart + 6) % 7;

			var format = DPGlobal.parseFormat(o.format);
			if (o.startDate !== -Infinity) {
				if (!!o.startDate) {
					if (o.startDate instanceof Date) o.startDate = this._local_to_utc(this._zero_time(o.startDate));else o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
				} else {
					o.startDate = -Infinity;
				}
			}
			if (o.endDate !== Infinity) {
				if (!!o.endDate) {
					if (o.endDate instanceof Date) o.endDate = this._local_to_utc(this._zero_time(o.endDate));else o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
				} else {
					o.endDate = Infinity;
				}
			}

			o.daysOfWeekDisabled = o.daysOfWeekDisabled || [];
			if (!$.isArray(o.daysOfWeekDisabled)) o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
			o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function (d) {
				return parseInt(d, 10);
			});

			o.daysOfWeekHighlighted = o.daysOfWeekHighlighted || [];
			if (!$.isArray(o.daysOfWeekHighlighted)) o.daysOfWeekHighlighted = o.daysOfWeekHighlighted.split(/[,\s]*/);
			o.daysOfWeekHighlighted = $.map(o.daysOfWeekHighlighted, function (d) {
				return parseInt(d, 10);
			});

			o.datesDisabled = o.datesDisabled || [];
			if (!$.isArray(o.datesDisabled)) {
				var datesDisabled = [];
				datesDisabled.push(DPGlobal.parseDate(o.datesDisabled, format, o.language));
				o.datesDisabled = datesDisabled;
			}
			o.datesDisabled = $.map(o.datesDisabled, function (d) {
				return DPGlobal.parseDate(d, format, o.language);
			});

			var plc = String(o.orientation).toLowerCase().split(/\s+/g),
			    _plc = o.orientation.toLowerCase();
			plc = $.grep(plc, function (word) {
				return (/^auto|left|right|top|bottom$/.test(word)
				);
			});
			o.orientation = { x: 'auto', y: 'auto' };
			if (!_plc || _plc === 'auto') ; // no action
			else if (plc.length === 1) {
					switch (plc[0]) {
						case 'top':
						case 'bottom':
							o.orientation.y = plc[0];
							break;
						case 'left':
						case 'right':
							o.orientation.x = plc[0];
							break;
					}
				} else {
					_plc = $.grep(plc, function (word) {
						return (/^left|right$/.test(word)
						);
					});
					o.orientation.x = _plc[0] || 'auto';

					_plc = $.grep(plc, function (word) {
						return (/^top|bottom$/.test(word)
						);
					});
					o.orientation.y = _plc[0] || 'auto';
				}
			if (o.defaultViewDate) {
				var year = o.defaultViewDate.year || new Date().getFullYear();
				var month = o.defaultViewDate.month || 0;
				var day = o.defaultViewDate.day || 1;
				o.defaultViewDate = UTCDate(year, month, day);
			} else {
				o.defaultViewDate = UTCToday();
			}
		},
		_events: [],
		_secondaryEvents: [],
		_applyEvents: function (evs) {
			for (var i = 0, el, ch, ev; i < evs.length; i++) {
				el = evs[i][0];
				if (evs[i].length === 2) {
					ch = undefined;
					ev = evs[i][1];
				} else if (evs[i].length === 3) {
					ch = evs[i][1];
					ev = evs[i][2];
				}
				el.on(ev, ch);
			}
		},
		_unapplyEvents: function (evs) {
			for (var i = 0, el, ev, ch; i < evs.length; i++) {
				el = evs[i][0];
				if (evs[i].length === 2) {
					ch = undefined;
					ev = evs[i][1];
				} else if (evs[i].length === 3) {
					ch = evs[i][1];
					ev = evs[i][2];
				}
				el.off(ev, ch);
			}
		},
		_buildEvents: function () {
			var events = {
				keyup: $.proxy(function (e) {
					if ($.inArray(e.keyCode, [27, 37, 39, 38, 40, 32, 13, 9]) === -1) this.update();
				}, this),
				keydown: $.proxy(this.keydown, this),
				paste: $.proxy(this.paste, this)
			};

			if (this.o.showOnFocus === true) {
				events.focus = $.proxy(this.show, this);
			}

			if (this.isInput) {
				// single input
				this._events = [[this.element, events]];
			} else if (this.component && this.hasInput) {
				// component: input + button
				this._events = [
				// For components that are not readonly, allow keyboard nav
				[this.element.find('input'), events], [this.component, {
					click: $.proxy(this.show, this)
				}]];
			} else if (this.element.is('div')) {
				// inline datepicker
				this.isInline = true;
			} else {
				this._events = [[this.element, {
					click: $.proxy(this.show, this)
				}]];
			}
			this._events.push(
			// Component: listen for blur on element descendants
			[this.element, '*', {
				blur: $.proxy(function (e) {
					this._focused_from = e.target;
				}, this)
			}],
			// Input: listen for blur on element
			[this.element, {
				blur: $.proxy(function (e) {
					this._focused_from = e.target;
				}, this)
			}]);

			if (this.o.immediateUpdates) {
				// Trigger input updates immediately on changed year/month
				this._events.push([this.element, {
					'changeYear changeMonth': $.proxy(function (e) {
						this.update(e.date);
					}, this)
				}]);
			}

			this._secondaryEvents = [[this.picker, {
				click: $.proxy(this.click, this)
			}], [$(window), {
				resize: $.proxy(this.place, this)
			}], [$(document), {
				mousedown: $.proxy(function (e) {
					// Clicked outside the datepicker, hide it
					if (!(this.element.is(e.target) || this.element.find(e.target).length || this.picker.is(e.target) || this.picker.find(e.target).length || this.picker.hasClass('datepicker-inline'))) {
						this.hide();
					}
				}, this)
			}]];
		},
		_attachEvents: function () {
			this._detachEvents();
			this._applyEvents(this._events);
		},
		_detachEvents: function () {
			this._unapplyEvents(this._events);
		},
		_attachSecondaryEvents: function () {
			this._detachSecondaryEvents();
			this._applyEvents(this._secondaryEvents);
		},
		_detachSecondaryEvents: function () {
			this._unapplyEvents(this._secondaryEvents);
		},
		_trigger: function (event, altdate) {
			var date = altdate || this.dates.get(-1),
			    local_date = this._utc_to_local(date);

			this.element.trigger({
				type: event,
				date: local_date,
				dates: $.map(this.dates, this._utc_to_local),
				format: $.proxy(function (ix, format) {
					if (arguments.length === 0) {
						ix = this.dates.length - 1;
						format = this.o.format;
					} else if (typeof ix === 'string') {
						format = ix;
						ix = this.dates.length - 1;
					}
					format = format || this.o.format;
					var date = this.dates.get(ix);
					return DPGlobal.formatDate(date, format, this.o.language);
				}, this)
			});
		},

		show: function () {
			var element = this.component ? this.element.find('input') : this.element;
			if (element.attr('readonly') && this.o.enableOnReadonly === false) return;
			if (!this.isInline) this.picker.appendTo(this.o.container);
			this.place();
			this.picker.show();
			this._attachSecondaryEvents();
			this._trigger('show');
			if ((window.navigator.msMaxTouchPoints || 'ontouchstart' in document) && this.o.disableTouchKeyboard) {
				$(this.element).blur();
			}
			return this;
		},

		hide: function () {
			if (this.isInline) return this;
			if (!this.picker.is(':visible')) return this;
			this.focusDate = null;
			this.picker.hide().detach();
			this._detachSecondaryEvents();
			this.viewMode = this.o.startView;
			this.showMode();

			if (this.o.forceParse && (this.isInput && this.element.val() || this.hasInput && this.element.find('input').val())) this.setValue();
			this._trigger('hide');
			return this;
		},

		remove: function () {
			this.hide();
			this._detachEvents();
			this._detachSecondaryEvents();
			this.picker.remove();
			delete this.element.data().datepicker;
			if (!this.isInput) {
				delete this.element.data().date;
			}
			return this;
		},

		paste: function (evt) {
			var dateString;
			if (evt.originalEvent.clipboardData && evt.originalEvent.clipboardData.types && $.inArray('text/plain', evt.originalEvent.clipboardData.types) !== -1) {
				dateString = evt.originalEvent.clipboardData.getData('text/plain');
			} else if (window.clipboardData) {
				dateString = window.clipboardData.getData('Text');
			} else {
				return;
			}
			this.setDate(dateString);
			this.update();
			evt.preventDefault();
		},

		_utc_to_local: function (utc) {
			return utc && new Date(utc.getTime() + utc.getTimezoneOffset() * 60000);
		},
		_local_to_utc: function (local) {
			return local && new Date(local.getTime() - local.getTimezoneOffset() * 60000);
		},
		_zero_time: function (local) {
			return local && new Date(local.getFullYear(), local.getMonth(), local.getDate());
		},
		_zero_utc_time: function (utc) {
			return utc && new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()));
		},

		getDates: function () {
			return $.map(this.dates, this._utc_to_local);
		},

		getUTCDates: function () {
			return $.map(this.dates, function (d) {
				return new Date(d);
			});
		},

		getDate: function () {
			return this._utc_to_local(this.getUTCDate());
		},

		getUTCDate: function () {
			var selected_date = this.dates.get(-1);
			if (typeof selected_date !== 'undefined') {
				return new Date(selected_date);
			} else {
				return null;
			}
		},

		clearDates: function () {
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component) {
				element = this.element.find('input');
			}

			if (element) {
				element.val('');
			}

			this.update();
			this._trigger('changeDate');

			if (this.o.autoclose) {
				this.hide();
			}
		},
		setDates: function () {
			var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
			this.update.apply(this, args);
			this._trigger('changeDate');
			this.setValue();
			return this;
		},

		setUTCDates: function () {
			var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
			this.update.apply(this, $.map(args, this._utc_to_local));
			this._trigger('changeDate');
			this.setValue();
			return this;
		},

		setDate: alias('setDates'),
		setUTCDate: alias('setUTCDates'),

		setValue: function () {
			var formatted = this.getFormattedDate();
			if (!this.isInput) {
				if (this.component) {
					this.element.find('input').val(formatted);
				}
			} else {
				this.element.val(formatted);
			}
			return this;
		},

		getFormattedDate: function (format) {
			if (format === undefined) format = this.o.format;

			var lang = this.o.language;
			return $.map(this.dates, function (d) {
				return DPGlobal.formatDate(d, format, lang);
			}).join(this.o.multidateSeparator);
		},

		setStartDate: function (startDate) {
			this._process_options({ startDate: startDate });
			this.update();
			this.updateNavArrows();
			return this;
		},

		setEndDate: function (endDate) {
			this._process_options({ endDate: endDate });
			this.update();
			this.updateNavArrows();
			return this;
		},

		setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
			this._process_options({ daysOfWeekDisabled: daysOfWeekDisabled });
			this.update();
			this.updateNavArrows();
			return this;
		},

		setDaysOfWeekHighlighted: function (daysOfWeekHighlighted) {
			this._process_options({ daysOfWeekHighlighted: daysOfWeekHighlighted });
			this.update();
			return this;
		},

		setDatesDisabled: function (datesDisabled) {
			this._process_options({ datesDisabled: datesDisabled });
			this.update();
			this.updateNavArrows();
		},

		place: function () {
			if (this.isInline) return this;
			var calendarWidth = this.picker.outerWidth(),
			    calendarHeight = this.picker.outerHeight(),
			    visualPadding = 10,
			    container = $(this.o.container),
			    windowWidth = container.width(),
			    scrollTop = this.o.container === 'body' ? $(document).scrollTop() : container.scrollTop(),
			    appendOffset = container.offset();

			var parentsZindex = [];
			this.element.parents().each(function () {
				var itemZIndex = $(this).css('z-index');
				if (itemZIndex !== 'auto' && itemZIndex !== 0) parentsZindex.push(parseInt(itemZIndex));
			});
			var zIndex = Math.max.apply(Math, parentsZindex) + this.o.zIndexOffset;
			var offset = this.component ? this.component.parent().offset() : this.element.offset();
			var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
			var width = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
			var left = offset.left - appendOffset.left,
			    top = offset.top - appendOffset.top;

			if (this.o.container !== 'body') {
				top += scrollTop;
			}

			this.picker.removeClass('datepicker-orient-top datepicker-orient-bottom ' + 'datepicker-orient-right datepicker-orient-left');

			if (this.o.orientation.x !== 'auto') {
				this.picker.addClass('datepicker-orient-' + this.o.orientation.x);
				if (this.o.orientation.x === 'right') left -= calendarWidth - width;
			}
			// auto x orientation is best-placement: if it crosses a window
			// edge, fudge it sideways
			else {
					if (offset.left < 0) {
						// component is outside the window on the left side. Move it into visible range
						this.picker.addClass('datepicker-orient-left');
						left -= offset.left - visualPadding;
					} else if (left + calendarWidth > windowWidth) {
						// the calendar passes the widow right edge. Align it to component right side
						this.picker.addClass('datepicker-orient-right');
						left += width - calendarWidth;
					} else {
						// Default to left
						this.picker.addClass('datepicker-orient-left');
					}
				}

			// auto y orientation is best-situation: top or bottom, no fudging,
			// decision based on which shows more of the calendar
			var yorient = this.o.orientation.y,
			    top_overflow;
			if (yorient === 'auto') {
				top_overflow = -scrollTop + top - calendarHeight;
				yorient = top_overflow < 0 ? 'bottom' : 'top';
			}

			this.picker.addClass('datepicker-orient-' + yorient);
			if (yorient === 'top') top -= calendarHeight + parseInt(this.picker.css('padding-top'));else top += height;

			if (this.o.rtl) {
				var right = windowWidth - (left + width);
				this.picker.css({
					top: top,
					right: right,
					zIndex: zIndex
				});
			} else {
				this.picker.css({
					top: top,
					left: left,
					zIndex: zIndex
				});
			}
			return this;
		},

		_allow_update: true,
		update: function () {
			if (!this._allow_update) return this;

			var oldDates = this.dates.copy(),
			    dates = [],
			    fromArgs = false;
			if (arguments.length) {
				$.each(arguments, $.proxy(function (i, date) {
					if (date instanceof Date) date = this._local_to_utc(date);
					dates.push(date);
				}, this));
				fromArgs = true;
			} else {
				dates = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
				if (dates && this.o.multidate) dates = dates.split(this.o.multidateSeparator);else dates = [dates];
				delete this.element.data().date;
			}

			dates = $.map(dates, $.proxy(function (date) {
				return DPGlobal.parseDate(date, this.o.format, this.o.language);
			}, this));
			dates = $.grep(dates, $.proxy(function (date) {
				return !this.dateWithinRange(date) || !date;
			}, this), true);
			this.dates.replace(dates);

			if (this.dates.length) this.viewDate = new Date(this.dates.get(-1));else if (this.viewDate < this.o.startDate) this.viewDate = new Date(this.o.startDate);else if (this.viewDate > this.o.endDate) this.viewDate = new Date(this.o.endDate);else this.viewDate = this.o.defaultViewDate;

			if (fromArgs) {
				// setting date by clicking
				this.setValue();
			} else if (dates.length) {
				// setting date by typing
				if (String(oldDates) !== String(this.dates)) this._trigger('changeDate');
			}
			if (!this.dates.length && oldDates.length) this._trigger('clearDate');

			this.fill();
			this.element.change();
			return this;
		},

		fillDow: function () {
			var dowCnt = this.o.weekStart,
			    html = '<tr>';
			if (this.o.calendarWeeks) {
				this.picker.find('.datepicker-days .datepicker-switch').attr('colspan', function (i, val) {
					return parseInt(val) + 1;
				});
				html += '<th class="cw">&#160;</th>';
			}
			while (dowCnt < this.o.weekStart + 7) {
				html += '<th class="dow">' + dates[this.o.language].daysMin[dowCnt++ % 7] + '</th>';
			}
			html += '</tr>';
			this.picker.find('.datepicker-days thead').append(html);
		},

		fillMonths: function () {
			var html = '',
			    i = 0;
			while (i < 12) {
				html += '<span class="month">' + dates[this.o.language].monthsShort[i++] + '</span>';
			}
			this.picker.find('.datepicker-months td').html(html);
		},

		setRange: function (range) {
			if (!range || !range.length) delete this.range;else this.range = $.map(range, function (d) {
				return d.valueOf();
			});
			this.fill();
		},

		getClassNames: function (date) {
			var cls = [],
			    year = this.viewDate.getUTCFullYear(),
			    month = this.viewDate.getUTCMonth(),
			    today = new Date();
			if (date.getUTCFullYear() < year || date.getUTCFullYear() === year && date.getUTCMonth() < month) {
				cls.push('old');
			} else if (date.getUTCFullYear() > year || date.getUTCFullYear() === year && date.getUTCMonth() > month) {
				cls.push('new');
			}
			if (this.focusDate && date.valueOf() === this.focusDate.valueOf()) cls.push('focused');
			// Compare internal UTC date with local today, not UTC today
			if (this.o.todayHighlight && date.getUTCFullYear() === today.getFullYear() && date.getUTCMonth() === today.getMonth() && date.getUTCDate() === today.getDate()) {
				cls.push('today');
			}
			if (this.dates.contains(date) !== -1) cls.push('active');
			if (!this.dateWithinRange(date) || this.dateIsDisabled(date)) {
				cls.push('disabled');
			}
			if ($.inArray(date.getUTCDay(), this.o.daysOfWeekHighlighted) !== -1) {
				cls.push('highlighted');
			}

			if (this.range) {
				if (date > this.range[0] && date < this.range[this.range.length - 1]) {
					cls.push('range');
				}
				if ($.inArray(date.valueOf(), this.range) !== -1) {
					cls.push('selected');
				}
				if (date.valueOf() === this.range[0]) {
					cls.push('range-start');
				}
				if (date.valueOf() === this.range[this.range.length - 1]) {
					cls.push('range-end');
				}
			}
			return cls;
		},

		fill: function () {
			var d = new Date(this.viewDate),
			    year = d.getUTCFullYear(),
			    month = d.getUTCMonth(),
			    startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
			    startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
			    endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
			    endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
			    todaytxt = dates[this.o.language].today || dates['en'].today || '',
			    cleartxt = dates[this.o.language].clear || dates['en'].clear || '',
			    titleFormat = dates[this.o.language].titleFormat || dates['en'].titleFormat,
			    tooltip;
			if (isNaN(year) || isNaN(month)) return;
			this.picker.find('.datepicker-days thead .datepicker-switch').text(DPGlobal.formatDate(new UTCDate(year, month), titleFormat, this.o.language));
			this.picker.find('tfoot .today').text(todaytxt).toggle(this.o.todayBtn !== false);
			this.picker.find('tfoot .clear').text(cleartxt).toggle(this.o.clearBtn !== false);
			this.picker.find('thead .datepicker-title').text(this.o.title).toggle(this.o.title !== '');
			this.updateNavArrows();
			this.fillMonths();
			var prevMonth = UTCDate(year, month - 1, 28),
			    day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
			var nextMonth = new Date(prevMonth);
			if (prevMonth.getUTCFullYear() < 100) {
				nextMonth.setUTCFullYear(prevMonth.getUTCFullYear());
			}
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var clsName;
			while (prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getUTCDay() === this.o.weekStart) {
					html.push('<tr>');
					if (this.o.calendarWeeks) {
						// ISO 8601: First week contains first thursday.
						// ISO also states week starts on Monday, but we can be more abstract here.
						var
						// Start of current week: based on weekstart/current date
						ws = new Date(+prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
						   
						// Thursday of this week
						th = new Date(Number(ws) + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
						   
						// First Thursday of year, year from thursday
						yth = new Date(Number(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 864e5),
						   
						// Calendar week: ms between thursdays, div ms per day, div 7 days
						calWeek = (th - yth) / 864e5 / 7 + 1;
						html.push('<td class="cw">' + calWeek + '</td>');
					}
				}
				clsName = this.getClassNames(prevMonth);
				clsName.push('day');

				if (this.o.beforeShowDay !== $.noop) {
					var before = this.o.beforeShowDay(this._utc_to_local(prevMonth));
					if (before === undefined) before = {};else if (typeof before === 'boolean') before = { enabled: before };else if (typeof before === 'string') before = { classes: before };
					if (before.enabled === false) clsName.push('disabled');
					if (before.classes) clsName = clsName.concat(before.classes.split(/\s+/));
					if (before.tooltip) tooltip = before.tooltip;
				}

				clsName = $.unique(clsName);
				html.push('<td class="' + clsName.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + prevMonth.getUTCDate() + '</td>');
				tooltip = null;
				if (prevMonth.getUTCDay() === this.o.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
			}
			this.picker.find('.datepicker-days tbody').empty().append(html.join(''));

			var monthsTitle = dates[this.o.language].monthsTitle || dates['en'].monthsTitle || 'Months';
			var months = this.picker.find('.datepicker-months').find('.datepicker-switch').text(this.o.maxViewMode < 2 ? monthsTitle : year).end().find('span').removeClass('active');

			$.each(this.dates, function (i, d) {
				if (d.getUTCFullYear() === year) months.eq(d.getUTCMonth()).addClass('active');
			});

			if (year < startYear || year > endYear) {
				months.addClass('disabled');
			}
			if (year === startYear) {
				months.slice(0, startMonth).addClass('disabled');
			}
			if (year === endYear) {
				months.slice(endMonth + 1).addClass('disabled');
			}

			if (this.o.beforeShowMonth !== $.noop) {
				var that = this;
				$.each(months, function (i, month) {
					if (!$(month).hasClass('disabled')) {
						var moDate = new Date(year, i, 1);
						var before = that.o.beforeShowMonth(moDate);
						if (before === false) $(month).addClass('disabled');
					}
				});
			}

			html = '';
			year = parseInt(year / 10, 10) * 10;
			var yearCont = this.picker.find('.datepicker-years').find('.datepicker-switch').text(year + '-' + (year + 9)).end().find('td');
			year -= 1;
			var years = $.map(this.dates, function (d) {
				return d.getUTCFullYear();
			}),
			    classes;
			for (var i = -1; i < 11; i++) {
				classes = ['year'];
				tooltip = null;

				if (i === -1) classes.push('old');else if (i === 10) classes.push('new');
				if ($.inArray(year, years) !== -1) classes.push('active');
				if (year < startYear || year > endYear) classes.push('disabled');

				if (this.o.beforeShowYear !== $.noop) {
					var yrBefore = this.o.beforeShowYear(new Date(year, 0, 1));
					if (yrBefore === undefined) yrBefore = {};else if (typeof yrBefore === 'boolean') yrBefore = { enabled: yrBefore };else if (typeof yrBefore === 'string') yrBefore = { classes: yrBefore };
					if (yrBefore.enabled === false) classes.push('disabled');
					if (yrBefore.classes) classes = classes.concat(yrBefore.classes.split(/\s+/));
					if (yrBefore.tooltip) tooltip = yrBefore.tooltip;
				}

				html += '<span class="' + classes.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + year + '</span>';
				year += 1;
			}
			yearCont.html(html);
		},

		updateNavArrows: function () {
			if (!this._allow_update) return;

			var d = new Date(this.viewDate),
			    year = d.getUTCFullYear(),
			    month = d.getUTCMonth();
			switch (this.viewMode) {
				case 0:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()) {
						this.picker.find('.prev').css({ visibility: 'hidden' });
					} else {
						this.picker.find('.prev').css({ visibility: 'visible' });
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()) {
						this.picker.find('.next').css({ visibility: 'hidden' });
					} else {
						this.picker.find('.next').css({ visibility: 'visible' });
					}
					break;
				case 1:
				case 2:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() || this.o.maxViewMode < 2) {
						this.picker.find('.prev').css({ visibility: 'hidden' });
					} else {
						this.picker.find('.prev').css({ visibility: 'visible' });
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() || this.o.maxViewMode < 2) {
						this.picker.find('.next').css({ visibility: 'hidden' });
					} else {
						this.picker.find('.next').css({ visibility: 'visible' });
					}
					break;
			}
		},

		click: function (e) {
			e.preventDefault();
			e.stopPropagation();
			var target = $(e.target).closest('span, td, th'),
			    year,
			    month,
			    day;
			if (target.length === 1) {
				switch (target[0].nodeName.toLowerCase()) {
					case 'th':
						switch (target[0].className) {
							case 'datepicker-switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className === 'prev' ? -1 : 1);
								switch (this.viewMode) {
									case 0:
										this.viewDate = this.moveMonth(this.viewDate, dir);
										this._trigger('changeMonth', this.viewDate);
										break;
									case 1:
									case 2:
										this.viewDate = this.moveYear(this.viewDate, dir);
										if (this.viewMode === 1) this._trigger('changeYear', this.viewDate);
										break;
								}
								this.fill();
								break;
							case 'today':
								this.showMode(-2);
								var which = this.o.todayBtn === 'linked' ? null : 'view';
								this._setDate(UTCToday(), which);
								break;
							case 'clear':
								this.clearDates();
								break;
						}
						break;
					case 'span':
						if (!target.hasClass('disabled')) {
							this.viewDate.setUTCDate(1);
							if (target.hasClass('month')) {
								day = 1;
								month = target.parent().find('span').index(target);
								year = this.viewDate.getUTCFullYear();
								this.viewDate.setUTCMonth(month);
								this._trigger('changeMonth', this.viewDate);
								if (this.o.minViewMode === 1) {
									this._setDate(UTCDate(year, month, day));
									this.showMode();
								} else {
									this.showMode(-1);
								}
							} else {
								day = 1;
								month = 0;
								year = parseInt(target.text(), 10) || 0;
								this.viewDate.setUTCFullYear(year);
								this._trigger('changeYear', this.viewDate);
								if (this.o.minViewMode === 2) {
									this._setDate(UTCDate(year, month, day));
								}
								this.showMode(-1);
							}
							this.fill();
						}
						break;
					case 'td':
						if (target.hasClass('day') && !target.hasClass('disabled')) {
							day = parseInt(target.text(), 10) || 1;
							year = this.viewDate.getUTCFullYear();
							month = this.viewDate.getUTCMonth();
							if (target.hasClass('old')) {
								if (month === 0) {
									month = 11;
									year -= 1;
								} else {
									month -= 1;
								}
							} else if (target.hasClass('new')) {
								if (month === 11) {
									month = 0;
									year += 1;
								} else {
									month += 1;
								}
							}
							this._setDate(UTCDate(year, month, day));
						}
						break;
				}
			}
			if (this.picker.is(':visible') && this._focused_from) {
				$(this._focused_from).focus();
			}
			delete this._focused_from;
		},

		_toggle_multidate: function (date) {
			var ix = this.dates.contains(date);
			if (!date) {
				this.dates.clear();
			}

			if (ix !== -1) {
				if (this.o.multidate === true || this.o.multidate > 1 || this.o.toggleActive) {
					this.dates.remove(ix);
				}
			} else if (this.o.multidate === false) {
				this.dates.clear();
				this.dates.push(date);
			} else {
				this.dates.push(date);
			}

			if (typeof this.o.multidate === 'number') while (this.dates.length > this.o.multidate) this.dates.remove(0);
		},

		_setDate: function (date, which) {
			if (!which || which === 'date') this._toggle_multidate(date && new Date(date));
			if (!which || which === 'view') this.viewDate = date && new Date(date);

			this.fill();
			this.setValue();
			if (!which || which !== 'view') {
				this._trigger('changeDate');
			}
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component) {
				element = this.element.find('input');
			}
			if (element) {
				element.change();
			}
			if (this.o.autoclose && (!which || which === 'date')) {
				this.hide();
			}
		},

		moveDay: function (date, dir) {
			var newDate = new Date(date);
			newDate.setUTCDate(date.getUTCDate() + dir);

			return newDate;
		},

		moveWeek: function (date, dir) {
			return this.moveDay(date, dir * 7);
		},

		moveMonth: function (date, dir) {
			if (!isValidDate(date)) return this.o.defaultViewDate;
			if (!dir) return date;
			var new_date = new Date(date.valueOf()),
			    day = new_date.getUTCDate(),
			    month = new_date.getUTCMonth(),
			    mag = Math.abs(dir),
			    new_month,
			    test;
			dir = dir > 0 ? 1 : -1;
			if (mag === 1) {
				test = dir === -1
				// If going back one month, make sure month is not current month
				// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
				? function () {
					return new_date.getUTCMonth() === month;
				}
				// If going forward one month, make sure month is as expected
				// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
				: function () {
					return new_date.getUTCMonth() !== new_month;
				};
				new_month = month + dir;
				new_date.setUTCMonth(new_month);
				// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
				if (new_month < 0 || new_month > 11) new_month = (new_month + 12) % 12;
			} else {
				// For magnitudes >1, move one month at a time...
				for (var i = 0; i < mag; i++)
				// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
				new_date = this.moveMonth(new_date, dir);
				// ...then reset the day, keeping it in the new month
				new_month = new_date.getUTCMonth();
				new_date.setUTCDate(day);
				test = function () {
					return new_month !== new_date.getUTCMonth();
				};
			}
			// Common date-resetting loop -- if date is beyond end of month, make it
			// end of month
			while (test()) {
				new_date.setUTCDate(--day);
				new_date.setUTCMonth(new_month);
			}
			return new_date;
		},

		moveYear: function (date, dir) {
			return this.moveMonth(date, dir * 12);
		},

		moveAvailableDate: function (date, dir, fn) {
			do {
				date = this[fn](date, dir);

				if (!this.dateWithinRange(date)) return false;

				fn = 'moveDay';
			} while (this.dateIsDisabled(date));

			return date;
		},

		weekOfDateIsDisabled: function (date) {
			return $.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1;
		},

		dateIsDisabled: function (date) {
			return this.weekOfDateIsDisabled(date) || $.grep(this.o.datesDisabled, function (d) {
				return isUTCEquals(date, d);
			}).length > 0;
		},

		dateWithinRange: function (date) {
			return date >= this.o.startDate && date <= this.o.endDate;
		},

		keydown: function (e) {
			if (!this.picker.is(':visible')) {
				if (e.keyCode === 40 || e.keyCode === 27) {
					// allow down to re-show picker
					this.show();
					e.stopPropagation();
				}
				return;
			}
			var dateChanged = false,
			    dir,
			    newViewDate,
			    focusDate = this.focusDate || this.viewDate;
			switch (e.keyCode) {
				case 27:
					// escape
					if (this.focusDate) {
						this.focusDate = null;
						this.viewDate = this.dates.get(-1) || this.viewDate;
						this.fill();
					} else this.hide();
					e.preventDefault();
					e.stopPropagation();
					break;
				case 37: // left
				case 38: // up
				case 39: // right
				case 40:
					// down
					if (!this.o.keyboardNavigation || this.o.daysOfWeekDisabled.length === 7) break;
					dir = e.keyCode === 37 || e.keyCode === 38 ? -1 : 1;
					if (e.ctrlKey) {
						newViewDate = this.moveAvailableDate(focusDate, dir, 'moveYear');

						if (newViewDate) this._trigger('changeYear', this.viewDate);
					} else if (e.shiftKey) {
						newViewDate = this.moveAvailableDate(focusDate, dir, 'moveMonth');

						if (newViewDate) this._trigger('changeMonth', this.viewDate);
					} else if (e.keyCode === 37 || e.keyCode === 39) {
						newViewDate = this.moveAvailableDate(focusDate, dir, 'moveDay');
					} else if (!this.weekOfDateIsDisabled(focusDate)) {
						newViewDate = this.moveAvailableDate(focusDate, dir, 'moveWeek');
					}
					if (newViewDate) {
						this.focusDate = this.viewDate = newViewDate;
						this.setValue();
						this.fill();
						e.preventDefault();
					}
					break;
				case 13:
					// enter
					if (!this.o.forceParse) break;
					focusDate = this.focusDate || this.dates.get(-1) || this.viewDate;
					if (this.o.keyboardNavigation) {
						this._toggle_multidate(focusDate);
						dateChanged = true;
					}
					this.focusDate = null;
					this.viewDate = this.dates.get(-1) || this.viewDate;
					this.setValue();
					this.fill();
					if (this.picker.is(':visible')) {
						e.preventDefault();
						e.stopPropagation();
						if (this.o.autoclose) this.hide();
					}
					break;
				case 9:
					// tab
					this.focusDate = null;
					this.viewDate = this.dates.get(-1) || this.viewDate;
					this.fill();
					this.hide();
					break;
			}
			if (dateChanged) {
				if (this.dates.length) this._trigger('changeDate');else this._trigger('clearDate');
				var element;
				if (this.isInput) {
					element = this.element;
				} else if (this.component) {
					element = this.element.find('input');
				}
				if (element) {
					element.change();
				}
			}
		},

		showMode: function (dir) {
			if (dir) {
				this.viewMode = Math.max(this.o.minViewMode, Math.min(this.o.maxViewMode, this.viewMode + dir));
			}
			this.picker.children('div').hide().filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName).show();
			this.updateNavArrows();
		}
	};

	var DateRangePicker = function (element, options) {
		$(element).data('datepicker', this);
		this.element = $(element);
		this.inputs = $.map(options.inputs, function (i) {
			return i.jquery ? i[0] : i;
		});
		delete options.inputs;

		datepickerPlugin.call($(this.inputs), options).on('changeDate', $.proxy(this.dateUpdated, this));

		this.pickers = $.map(this.inputs, function (i) {
			return $(i).data('datepicker');
		});
		this.updateDates();
	};
	DateRangePicker.prototype = {
		updateDates: function () {
			this.dates = $.map(this.pickers, function (i) {
				return i.getUTCDate();
			});
			this.updateRanges();
		},
		updateRanges: function () {
			var range = $.map(this.dates, function (d) {
				return d.valueOf();
			});
			$.each(this.pickers, function (i, p) {
				p.setRange(range);
			});
		},
		dateUpdated: function (e) {
			// `this.updating` is a workaround for preventing infinite recursion
			// between `changeDate` triggering and `setUTCDate` calling.  Until
			// there is a better mechanism.
			if (this.updating) return;
			this.updating = true;

			var dp = $(e.target).data('datepicker');

			if (typeof dp === "undefined") {
				return;
			}

			var new_date = dp.getUTCDate(),
			    i = $.inArray(e.target, this.inputs),
			    j = i - 1,
			    k = i + 1,
			    l = this.inputs.length;
			if (i === -1) return;

			$.each(this.pickers, function (i, p) {
				if (!p.getUTCDate()) p.setUTCDate(new_date);
			});

			if (new_date < this.dates[j]) {
				// Date being moved earlier/left
				while (j >= 0 && new_date < this.dates[j]) {
					this.pickers[j--].setUTCDate(new_date);
				}
			} else if (new_date > this.dates[k]) {
				// Date being moved later/right
				while (k < l && new_date > this.dates[k]) {
					this.pickers[k++].setUTCDate(new_date);
				}
			}
			this.updateDates();

			delete this.updating;
		},
		remove: function () {
			$.map(this.pickers, function (p) {
				p.remove();
			});
			delete this.element.data().datepicker;
		}
	};

	function opts_from_el(el, prefix) {
		// Derive options from element data-attrs
		var data = $(el).data(),
		    out = {},
		    inkey,
		    replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])');
		prefix = new RegExp('^' + prefix.toLowerCase());
		function re_lower(_, a) {
			return a.toLowerCase();
		}
		for (var key in data) if (prefix.test(key)) {
			inkey = key.replace(replace, re_lower);
			out[inkey] = data[key];
		}
		return out;
	}

	function opts_from_locale(lang) {
		// Derive options from locale plugins
		var out = {};
		// Check if "de-DE" style date is available, if not language should
		// fallback to 2 letter code eg "de"
		if (!dates[lang]) {
			lang = lang.split('-')[0];
			if (!dates[lang]) return;
		}
		var d = dates[lang];
		$.each(locale_opts, function (i, k) {
			if (k in d) out[k] = d[k];
		});
		return out;
	}

	var old = $.fn.datepicker;
	var datepickerPlugin = function (option) {
		var args = Array.apply(null, arguments);
		args.shift();
		var internal_return;
		this.each(function () {
			var $this = $(this),
			    data = $this.data('datepicker'),
			    options = typeof option === 'object' && option;
			if (!data) {
				var elopts = opts_from_el(this, 'date'),
				   
				// Preliminary otions
				xopts = $.extend({}, defaults, elopts, options),
				    locopts = opts_from_locale(xopts.language),
				   
				// Options priority: js args, data-attrs, locales, defaults
				opts = $.extend({}, defaults, locopts, elopts, options);
				if ($this.hasClass('input-daterange') || opts.inputs) {
					$.extend(opts, {
						inputs: opts.inputs || $this.find('input').toArray()
					});
					data = new DateRangePicker(this, opts);
				} else {
					data = new Datepicker(this, opts);
				}
				$this.data('datepicker', data);
			}
			if (typeof option === 'string' && typeof data[option] === 'function') {
				internal_return = data[option].apply(data, args);
			}
		});

		if (internal_return === undefined || internal_return instanceof Datepicker || internal_return instanceof DateRangePicker) return this;

		if (this.length > 1) throw new Error('Using only allowed for the collection of a single element (' + option + ' function)');else return internal_return;
	};
	$.fn.datepicker = datepickerPlugin;

	var defaults = $.fn.datepicker.defaults = {
		autoclose: false,
		beforeShowDay: $.noop,
		beforeShowMonth: $.noop,
		beforeShowYear: $.noop,
		calendarWeeks: false,
		clearBtn: false,
		toggleActive: false,
		daysOfWeekDisabled: [],
		daysOfWeekHighlighted: [],
		datesDisabled: [],
		endDate: Infinity,
		forceParse: true,
		format: 'mm/dd/yyyy',
		keyboardNavigation: true,
		language: 'en',
		minViewMode: 0,
		maxViewMode: 2,
		multidate: false,
		multidateSeparator: ',',
		orientation: "auto",
		rtl: false,
		startDate: -Infinity,
		startView: 0,
		todayBtn: false,
		todayHighlight: false,
		weekStart: 0,
		disableTouchKeyboard: false,
		enableOnReadonly: true,
		showOnFocus: true,
		zIndexOffset: 10,
		container: 'body',
		immediateUpdates: false,
		title: ''
	};
	var locale_opts = $.fn.datepicker.locale_opts = ['format', 'rtl', 'weekStart'];
	$.fn.datepicker.Constructor = Datepicker;
	var dates = $.fn.datepicker.dates = {
		en: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today",
			clear: "Clear",
			titleFormat: "MM yyyy"
		}
	};

	var DPGlobal = {
		modes: [{
			clsName: 'days',
			navFnc: 'Month',
			navStep: 1
		}, {
			clsName: 'months',
			navFnc: 'FullYear',
			navStep: 1
		}, {
			clsName: 'years',
			navFnc: 'FullYear',
			navStep: 10
		}],
		isLeapYear: function (year) {
			return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
		},
		getDaysInMonth: function (year, month) {
			return [31, DPGlobal.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
		nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
		parseFormat: function (format) {
			if (typeof format.toValue === 'function' && typeof format.toDisplay === 'function') return format;
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts, '\0').split('\0'),
			    parts = format.match(this.validParts);
			if (!separators || !separators.length || !parts || parts.length === 0) {
				throw new Error("Invalid date format.");
			}
			return { separators: separators, parts: parts };
		},
		parseDate: function (date, format, language) {
			if (!date) return undefined;
			if (date instanceof Date) return date;
			if (typeof format === 'string') format = DPGlobal.parseFormat(format);
			if (format.toValue) return format.toValue(date, format, language);
			var part_re = /([\-+]\d+)([dmwy])/,
			    parts = date.match(/([\-+]\d+)([dmwy])/g),
			    fn_map = {
				d: 'moveDay',
				m: 'moveMonth',
				w: 'moveWeek',
				y: 'moveYear'
			},
			    part,
			    dir,
			    i,
			    fn;
			if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
				date = new Date();
				for (i = 0; i < parts.length; i++) {
					part = part_re.exec(parts[i]);
					dir = parseInt(part[1]);
					fn = fn_map[part[2]];
					date = Datepicker.prototype[fn](date, dir);
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
			}
			parts = date && date.match(this.nonpunctuation) || [];
			date = new Date();
			var parsed = {},
			    setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
			    setters_map = {
				yyyy: function (d, v) {
					return d.setUTCFullYear(v);
				},
				yy: function (d, v) {
					return d.setUTCFullYear(2000 + v);
				},
				m: function (d, v) {
					if (isNaN(d)) return d;
					v -= 1;
					while (v < 0) v += 12;
					v %= 12;
					d.setUTCMonth(v);
					while (d.getUTCMonth() !== v) d.setUTCDate(d.getUTCDate() - 1);
					return d;
				},
				d: function (d, v) {
					return d.setUTCDate(v);
				}
			},
			    val,
			    filtered;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			date = UTCToday();
			var fparts = format.parts.slice();
			// Remove noop parts
			if (parts.length !== fparts.length) {
				fparts = $(fparts).filter(function (i, p) {
					return $.inArray(p, setters_order) !== -1;
				}).toArray();
			}
			// Process remainder
			function match_part() {
				var m = this.slice(0, parts[i].length),
				    p = parts[i].slice(0, m.length);
				return m.toLowerCase() === p.toLowerCase();
			}
			if (parts.length === fparts.length) {
				var cnt;
				for (i = 0, cnt = fparts.length; i < cnt; i++) {
					val = parseInt(parts[i], 10);
					part = fparts[i];
					if (isNaN(val)) {
						switch (part) {
							case 'MM':
								filtered = $(dates[language].months).filter(match_part);
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(match_part);
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
						}
					}
					parsed[part] = val;
				}
				var _date, s;
				for (i = 0; i < setters_order.length; i++) {
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s])) {
						_date = new Date(date);
						setters_map[s](_date, parsed[s]);
						if (!isNaN(_date)) date = _date;
					}
				}
			}
			return date;
		},
		formatDate: function (date, format, language) {
			if (!date) return '';
			if (typeof format === 'string') format = DPGlobal.parseFormat(format);
			if (format.toDisplay) return format.toDisplay(date, format, language);
			var val = {
				d: date.getUTCDate(),
				D: dates[language].daysShort[date.getUTCDay()],
				DD: dates[language].days[date.getUTCDay()],
				m: date.getUTCMonth() + 1,
				M: dates[language].monthsShort[date.getUTCMonth()],
				MM: dates[language].months[date.getUTCMonth()],
				yy: date.getUTCFullYear().toString().substring(2),
				yyyy: date.getUTCFullYear()
			};
			val.dd = (val.d < 10 ? '0' : '') + val.d;
			val.mm = (val.m < 10 ? '0' : '') + val.m;
			date = [];
			var seps = $.extend([], format.separators);
			for (var i = 0, cnt = format.parts.length; i <= cnt; i++) {
				if (seps.length) date.push(seps.shift());
				date.push(val[format.parts[i]]);
			}
			return date.join('');
		},
		headTemplate: '<thead>' + '<tr>' + '<th colspan="7" class="datepicker-title"></th>' + '</tr>' + '<tr>' + '<th class="prev">&#171;</th>' + '<th colspan="5" class="datepicker-switch"></th>' + '<th class="next">&#187;</th>' + '</tr>' + '</thead>',
		contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
		footTemplate: '<tfoot>' + '<tr>' + '<th colspan="7" class="today"></th>' + '</tr>' + '<tr>' + '<th colspan="7" class="clear"></th>' + '</tr>' + '</tfoot>'
	};
	DPGlobal.template = '<div class="datepicker">' + '<div class="datepicker-days">' + '<table class=" table-condensed">' + DPGlobal.headTemplate + '<tbody></tbody>' + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-months">' + '<table class="table-condensed">' + DPGlobal.headTemplate + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-years">' + '<table class="table-condensed">' + DPGlobal.headTemplate + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '</div>';

	$.fn.datepicker.DPGlobal = DPGlobal;

	/* DATEPICKER NO CONFLICT
 * =================== */

	$.fn.datepicker.noConflict = function () {
		$.fn.datepicker = old;
		return this;
	};

	/* DATEPICKER VERSION
  * =================== */
	$.fn.datepicker.version = '1.5.1';

	/* DATEPICKER DATA-API
 * ================== */

	$(document).on('focus.datepicker.data-api click.datepicker.data-api', '[data-provide="datepicker"]', function (e) {
		var $this = $(this);
		if ($this.data('datepicker')) return;
		e.preventDefault();
		// component click requires us to explicitly show it
		datepickerPlugin.call($this, 'show');
	});
	$(function () {
		datepickerPlugin.call($('[data-provide="datepicker-inline"]'));
	});
});
/**
 * @license
 * =========================================================
 * bootstrap-datetimepicker.js
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Contributions:
 *  - Andrew Rowls
 *  - Thiago de Arruda
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================
 */
(function ($) {
  var smartPhone = window.orientation != undefined;var DateTimePicker = function (element, options) {
    this.id = dpgId++;this.init(element, options);
  };var dateToDate = function (dt) {
    if (typeof dt === "string") {
      return new Date(dt);
    }return dt;
  };DateTimePicker.prototype = { constructor: DateTimePicker, init: function (element, options) {
      var icon;if (!(options.pickTime || options.pickDate)) throw new Error("Must choose at least one picker");this.options = options;this.$element = $(element);this.language = options.language in dates ? options.language : "en";this.pickDate = options.pickDate;this.pickTime = options.pickTime;this.isInput = this.$element.is("input");this.component = false;if (this.$element.find(".input-append") || this.$element.find(".input-prepend")) this.component = this.$element.find(".tclock");this.format = options.format;if (!this.format) {
        if (this.isInput) this.format = this.$element.data("format");else this.format = this.$element.find("input").data("format");if (!this.format) this.format = "MM/dd/yyyy";
      }this._compileFormat();if (this.component) {
        icon = this.component.find("i");
      }if (this.pickTime) {
        if (icon && icon.length) this.timeIcon = icon.data("time-icon");if (!this.timeIcon) this.timeIcon = "icon-time";icon.addClass(this.timeIcon);
      }if (this.pickDate) {
        if (icon && icon.length) this.dateIcon = icon.data("date-icon");if (!this.dateIcon) this.dateIcon = "icon-calendar";icon.removeClass(this.timeIcon);icon.addClass(this.dateIcon);
      }this.widget = $(getTemplate(this.timeIcon, options.pickDate, options.pickTime, options.pick12HourFormat, options.pickSeconds, options.collapse)).appendTo("body");this.minViewMode = options.minViewMode || this.$element.data("date-minviewmode") || 0;if (typeof this.minViewMode === "string") {
        switch (this.minViewMode) {case "months":
            this.minViewMode = 1;break;case "years":
            this.minViewMode = 2;break;default:
            this.minViewMode = 0;break;}
      }this.viewMode = options.viewMode || this.$element.data("date-viewmode") || 0;if (typeof this.viewMode === "string") {
        switch (this.viewMode) {case "months":
            this.viewMode = 1;break;case "years":
            this.viewMode = 2;break;default:
            this.viewMode = 0;break;}
      }this.startViewMode = this.viewMode;this.weekStart = options.weekStart || this.$element.data("date-weekstart") || 0;this.weekEnd = this.weekStart === 0 ? 6 : this.weekStart - 1;this.setStartDate(options.startDate || this.$element.data("date-startdate"));this.setEndDate(options.endDate || this.$element.data("date-enddate"));this.fillDow();this.fillMonths();this.fillHours();this.fillMinutes();this.fillSeconds();this.update();this.showMode();this._attachDatePickerEvents();
    }, show: function (e) {
      this.widget.show();this.height = this.component ? this.component.outerHeight() : this.$element.outerHeight();this.place();this.$element.trigger({ type: "show", date: this._date });this._attachDatePickerGlobalEvents();if (e) {
        e.stopPropagation();e.preventDefault();
      }
    }, disable: function () {
      this.$element.find("input").prop("disabled", true);this._detachDatePickerEvents();
    }, enable: function () {
      this.$element.find("input").prop("disabled", false);this._attachDatePickerEvents();
    }, hide: function () {
      var collapse = this.widget.find(".collapse");for (var i = 0; i < collapse.length; i++) {
        var collapseData = collapse.eq(i).data("collapse");if (collapseData && collapseData.transitioning) return;
      }this.widget.hide();this.viewMode = this.startViewMode;this.showMode();this.set();this.$element.trigger({ type: "hide", date: this._date });this._detachDatePickerGlobalEvents();
    }, set: function () {
      var formatted = "";if (!this._unset) formatted = this.formatDate(this._date);if (!this.isInput) {
        if (this.component) {
          var input = this.$element.find("input");input.val(formatted);this._resetMaskPos(input);
        }this.$element.data("date", formatted);
      } else {
        this.$element.val(formatted);this._resetMaskPos(this.$element);
      }
    }, setValue: function (newDate) {
      if (!newDate) {
        this._unset = true;
      } else {
        this._unset = false;
      }if (typeof newDate === "string") {
        this._date = this.parseDate(newDate);
      } else if (newDate) {
        this._date = new Date(newDate);
      }this.set();this.viewDate = UTCDate(this._date.getUTCFullYear(), this._date.getUTCMonth(), 1, 0, 0, 0, 0);this.fillDate();this.fillTime();
    }, getDate: function () {
      if (this._unset) return null;return new Date(this._date.valueOf());
    }, setDate: function (date) {
      if (!date) this.setValue(null);else this.setValue(date.valueOf());
    }, setStartDate: function (date) {
      if (date instanceof Date) {
        this.startDate = date;
      } else if (typeof date === "string") {
        this.startDate = new UTCDate(date);if (!this.startDate.getUTCFullYear()) {
          this.startDate = -Infinity;
        }
      } else {
        this.startDate = -Infinity;
      }if (this.viewDate) {
        this.update();
      }
    }, setEndDate: function (date) {
      if (date instanceof Date) {
        this.endDate = date;
      } else if (typeof date === "string") {
        this.endDate = new UTCDate(date);if (!this.endDate.getUTCFullYear()) {
          this.endDate = Infinity;
        }
      } else {
        this.endDate = Infinity;
      }if (this.viewDate) {
        this.update();
      }
    }, getLocalDate: function () {
      if (this._unset) return null;var d = this._date;return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
    }, setLocalDate: function (localDate) {
      if (!localDate) this.setValue(null);else this.setValue(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), localDate.getHours(), localDate.getMinutes(), localDate.getSeconds(), localDate.getMilliseconds()));
    }, place: function () {
      var position = "absolute";var offset = this.component ? this.component.offset() : this.$element.offset();this.width = this.component ? this.component.outerWidth() : this.$element.outerWidth();offset.top = offset.top + this.height;var $window = $(window);if (this.options.width != undefined) {
        this.widget.width(this.options.width);
      }if (this.options.orientation == "left") {
        this.widget.addClass("left-oriented");offset.left = offset.left - this.widget.width() + 20;
      }if (this._isInFixed()) {
        position = "fixed";offset.top -= $window.scrollTop();offset.left -= $window.scrollLeft();
      }if ($window.width() < offset.left + this.widget.outerWidth()) {
        offset.right = $window.width() - offset.left - this.width;offset.left = "auto";this.widget.addClass("pull-right");
      } else {
        offset.right = "auto";this.widget.removeClass("pull-right");
      }this.widget.css({ position: position, top: offset.top, left: offset.left, right: offset.right });
    }, notifyChange: function () {
      this.$element.trigger({ type: "changeDate", date: this.getDate(), localDate: this.getLocalDate() });
    }, update: function (newDate) {
      var dateStr = newDate;if (!dateStr) {
        if (this.isInput) {
          dateStr = this.$element.val();
        } else {
          dateStr = this.$element.find("input").val();
        }if (dateStr) {
          this._date = this.parseDate(dateStr);
        }if (!this._date) {
          var tmp = new Date();this._date = UTCDate(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), tmp.getHours(), tmp.getMinutes(), tmp.getSeconds(), tmp.getMilliseconds());
        }
      }this.viewDate = UTCDate(this._date.getUTCFullYear(), this._date.getUTCMonth(), 1, 0, 0, 0, 0);this.fillDate();this.fillTime();
    }, fillDow: function () {
      var dowCnt = this.weekStart;var html = $("<tr>");while (dowCnt < this.weekStart + 7) {
        html.append('<th class="dow">' + dates[this.language].daysMin[dowCnt++ % 7] + "</th>");
      }this.widget.find(".datepicker-days thead").append(html);
    }, fillMonths: function () {
      var html = "";var i = 0;while (i < 12) {
        html += '<span class="month">' + dates[this.language].monthsShort[i++] + "</span>";
      }this.widget.find(".datepicker-months td").append(html);
    }, fillDate: function () {
      var year = this.viewDate.getUTCFullYear();var month = this.viewDate.getUTCMonth();var currentDate = UTCDate(this._date.getUTCFullYear(), this._date.getUTCMonth(), this._date.getUTCDate(), 0, 0, 0, 0);var startYear = typeof this.startDate === "object" ? this.startDate.getUTCFullYear() : -Infinity;var startMonth = typeof this.startDate === "object" ? this.startDate.getUTCMonth() : -1;var endYear = typeof this.endDate === "object" ? this.endDate.getUTCFullYear() : Infinity;var endMonth = typeof this.endDate === "object" ? this.endDate.getUTCMonth() : 12;this.widget.find(".datepicker-days").find(".disabled").removeClass("disabled");this.widget.find(".datepicker-months").find(".disabled").removeClass("disabled");this.widget.find(".datepicker-years").find(".disabled").removeClass("disabled");this.widget.find(".datepicker-days th:eq(1)").text(dates[this.language].months[month] + " " + year);var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0);var day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());prevMonth.setUTCDate(day);prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);if (year == startYear && month <= startMonth || year < startYear) {
        this.widget.find(".datepicker-days th:eq(0)").addClass("disabled");
      }if (year == endYear && month >= endMonth || year > endYear) {
        this.widget.find(".datepicker-days th:eq(2)").addClass("disabled");
      }var nextMonth = new Date(prevMonth.valueOf());nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);nextMonth = nextMonth.valueOf();var html = [];var row;var clsName;while (prevMonth.valueOf() < nextMonth) {
        if (prevMonth.getUTCDay() === this.weekStart) {
          row = $("<tr>");html.push(row);
        }clsName = "";if (prevMonth.getUTCFullYear() < year || prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() < month) {
          clsName += " old";
        } else if (prevMonth.getUTCFullYear() > year || prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() > month) {
          clsName += " new";
        }if (prevMonth.valueOf() === currentDate.valueOf()) {
          clsName += " active";
        }if (prevMonth.valueOf() + 864e5 <= this.startDate) {
          clsName += " disabled";
        }if (prevMonth.valueOf() > this.endDate) {
          clsName += " disabled";
        }row.append('<td class="day' + clsName + '">' + prevMonth.getUTCDate() + "</td>");prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
      }this.widget.find(".datepicker-days tbody").empty().append(html);var currentYear = this._date.getUTCFullYear();var months = this.widget.find(".datepicker-months").find("th:eq(1)").text(year).end().find("span").removeClass("active");if (currentYear === year) {
        months.eq(this._date.getUTCMonth()).addClass("active");
      }if (currentYear - 1 < startYear) {
        this.widget.find(".datepicker-months th:eq(0)").addClass("disabled");
      }if (currentYear + 1 > endYear) {
        this.widget.find(".datepicker-months th:eq(2)").addClass("disabled");
      }for (var i = 0; i < 12; i++) {
        if (year == startYear && startMonth > i || year < startYear) {
          $(months[i]).addClass("disabled");
        } else if (year == endYear && endMonth < i || year > endYear) {
          $(months[i]).addClass("disabled");
        }
      }html = "";year = parseInt(year / 10, 10) * 10;var yearCont = this.widget.find(".datepicker-years").find("th:eq(1)").text(year + "-" + (year + 9)).end().find("td");this.widget.find(".datepicker-years").find("th").removeClass("disabled");if (startYear > year) {
        this.widget.find(".datepicker-years").find("th:eq(0)").addClass("disabled");
      }if (endYear < year + 9) {
        this.widget.find(".datepicker-years").find("th:eq(2)").addClass("disabled");
      }year -= 1;for (var i = -1; i < 11; i++) {
        html += '<span class="year' + (i === -1 || i === 10 ? " old" : "") + (currentYear === year ? " active" : "") + (year < startYear || year > endYear ? " disabled" : "") + '">' + year + "</span>";year += 1;
      }yearCont.html(html);
    }, fillHours: function () {
      var table = this.widget.find(".timepicker .timepicker-hours table");table.parent().hide();var html = "";if (this.options.pick12HourFormat) {
        var current = 1;for (var i = 0; i < 3; i += 1) {
          html += "<tr>";for (var j = 0; j < 4; j += 1) {
            var c = current.toString();html += '<td class="hour">' + padLeft(c, 2, "0") + "</td>";current++;
          }html += "</tr>";
        }
      } else {
        var current = 0;for (var i = 0; i < 6; i += 1) {
          html += "<tr>";for (var j = 0; j < 4; j += 1) {
            var c = current.toString();html += '<td class="hour">' + padLeft(c, 2, "0") + "</td>";current++;
          }html += "</tr>";
        }
      }table.html(html);
    }, fillMinutes: function () {
      var table = this.widget.find(".timepicker .timepicker-minutes table");table.parent().hide();var html = "";var current = 0;for (var i = 0; i < 5; i++) {
        html += "<tr>";for (var j = 0; j < 4; j += 1) {
          var c = current.toString();html += '<td class="minute">' + padLeft(c, 2, "0") + "</td>";current += 3;
        }html += "</tr>";
      }table.html(html);
    }, fillSeconds: function () {
      var table = this.widget.find(".timepicker .timepicker-seconds table");table.parent().hide();var html = "";var current = 0;for (var i = 0; i < 5; i++) {
        html += "<tr>";for (var j = 0; j < 4; j += 1) {
          var c = current.toString();html += '<td class="second">' + padLeft(c, 2, "0") + "</td>";current += 3;
        }html += "</tr>";
      }table.html(html);
    }, fillTime: function () {
      if (!this._date) return;var timeComponents = this.widget.find(".timepicker span[data-time-component]");var table = timeComponents.closest("table");var is12HourFormat = this.options.pick12HourFormat;var hour = this._date.getUTCHours();var period = "AM";if (is12HourFormat) {
        if (hour >= 12) period = "PM";if (hour === 0) hour = 12;else if (hour != 12) hour = hour % 12;this.widget.find(".timepicker [data-action=togglePeriod]").text(period);
      }hour = padLeft(hour.toString(), 2, "0");var minute = padLeft(this._date.getUTCMinutes().toString(), 2, "0");var second = padLeft(this._date.getUTCSeconds().toString(), 2, "0");timeComponents.filter("[data-time-component=hours]").text(hour);timeComponents.filter("[data-time-component=minutes]").text(minute);timeComponents.filter("[data-time-component=seconds]").text(second);
    }, click: function (e) {
      e.stopPropagation();e.preventDefault();this._unset = false;var target = $(e.target).closest("span, td, th");if (target.length === 1) {
        if (!target.is(".disabled")) {
          switch (target[0].nodeName.toLowerCase()) {case "th":
              switch (target[0].className) {case "switch":
                  this.showMode(1);break;case "prev":case "next":
                  var vd = this.viewDate;var navFnc = DPGlobal.modes[this.viewMode].navFnc;var step = DPGlobal.modes[this.viewMode].navStep;if (target[0].className === "prev") step = step * -1;vd["set" + navFnc](vd["get" + navFnc]() + step);this.fillDate();this.set();break;}break;case "span":
              if (target.is(".month")) {
                var month = target.parent().find("span").index(target);this.viewDate.setUTCMonth(month);
              } else {
                var year = parseInt(target.text(), 10) || 0;this.viewDate.setUTCFullYear(year);
              }if (this.viewMode !== 0) {
                this._date = UTCDate(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), this.viewDate.getUTCDate(), this._date.getUTCHours(), this._date.getUTCMinutes(), this._date.getUTCSeconds(), this._date.getUTCMilliseconds());this.notifyChange();
              }this.showMode(-1);this.fillDate();this.set();break;case "td":
              if (target.is(".day")) {
                var day = parseInt(target.text(), 10) || 1;var month = this.viewDate.getUTCMonth();var year = this.viewDate.getUTCFullYear();if (target.is(".old")) {
                  if (month === 0) {
                    month = 11;year -= 1;
                  } else {
                    month -= 1;
                  }
                } else if (target.is(".new")) {
                  if (month == 11) {
                    month = 0;year += 1;
                  } else {
                    month += 1;
                  }
                }this._date = UTCDate(year, month, day, this._date.getUTCHours(), this._date.getUTCMinutes(), this._date.getUTCSeconds(), this._date.getUTCMilliseconds());this.viewDate = UTCDate(year, month, Math.min(28, day), 0, 0, 0, 0);this.fillDate();this.set();this.notifyChange();
              }break;}
        }
      }
    }, actions: { incrementHours: function (e) {
        this._date.setUTCHours(this._date.getUTCHours() + 1);
      }, incrementMinutes: function (e) {
        this._date.setUTCMinutes(this._date.getUTCMinutes() + 1);
      }, incrementSeconds: function (e) {
        this._date.setUTCSeconds(this._date.getUTCSeconds() + 1);
      }, decrementHours: function (e) {
        this._date.setUTCHours(this._date.getUTCHours() - 1);
      }, decrementMinutes: function (e) {
        this._date.setUTCMinutes(this._date.getUTCMinutes() - 1);
      }, decrementSeconds: function (e) {
        this._date.setUTCSeconds(this._date.getUTCSeconds() - 1);
      }, togglePeriod: function (e) {
        var hour = this._date.getUTCHours();if (hour >= 12) hour -= 12;else hour += 12;this._date.setUTCHours(hour);
      }, showPicker: function () {
        this.widget.find(".timepicker > div:not(.timepicker-picker)").hide();this.widget.find(".timepicker .timepicker-picker").show();
      }, showHours: function () {
        this.widget.find(".timepicker .timepicker-picker").hide();this.widget.find(".timepicker .timepicker-hours").show();
      }, showMinutes: function () {
        this.widget.find(".timepicker .timepicker-picker").hide();this.widget.find(".timepicker .timepicker-minutes").show();
      }, showSeconds: function () {
        this.widget.find(".timepicker .timepicker-picker").hide();this.widget.find(".timepicker .timepicker-seconds").show();
      }, selectHour: function (e) {
        var tgt = $(e.target);var value = parseInt(tgt.text(), 10);if (this.options.pick12HourFormat) {
          var current = this._date.getUTCHours();if (current >= 12) {
            if (value != 12) value = (value + 12) % 24;
          } else {
            if (value === 12) value = 0;else value = value % 12;
          }
        }this._date.setUTCHours(value);this.actions.showPicker.call(this);
      }, selectMinute: function (e) {
        var tgt = $(e.target);var value = parseInt(tgt.text(), 10);this._date.setUTCMinutes(value);this.actions.showPicker.call(this);
      }, selectSecond: function (e) {
        var tgt = $(e.target);var value = parseInt(tgt.text(), 10);this._date.setUTCSeconds(value);this.actions.showPicker.call(this);
      } }, doAction: function (e) {
      e.stopPropagation();e.preventDefault();if (!this._date) this._date = UTCDate(1970, 0, 0, 0, 0, 0, 0);var action = $(e.currentTarget).data("action");var rv = this.actions[action].apply(this, arguments);this.set();this.fillTime();this.notifyChange();return rv;
    }, stopEvent: function (e) {
      e.stopPropagation();e.preventDefault();
    }, keydown: function (e) {
      var self = this,
          k = e.which,
          input = $(e.target);if (k == 8 || k == 46) {
        setTimeout(function () {
          self._resetMaskPos(input);
        });
      }
    }, keypress: function (e) {
      var k = e.which;if (k == 8 || k == 46) {
        return;
      }var input = $(e.target);var c = String.fromCharCode(k);var val = input.val() || "";val += c;var mask = this._mask[this._maskPos];if (!mask) {
        return false;
      }if (mask.end != val.length) {
        return;
      }if (!mask.pattern.test(val.slice(mask.start))) {
        val = val.slice(0, val.length - 1);while ((mask = this._mask[this._maskPos]) && mask.character) {
          val += mask.character;this._maskPos++;
        }val += c;if (mask.end != val.length) {
          input.val(val);return false;
        } else {
          if (!mask.pattern.test(val.slice(mask.start))) {
            input.val(val.slice(0, mask.start));return false;
          } else {
            input.val(val);this._maskPos++;return false;
          }
        }
      } else {
        this._maskPos++;
      }
    }, change: function (e) {
      var input = $(e.target);var val = input.val();if (this._formatPattern.test(val)) {
        this.update();this.setValue(this._date.getTime());this.notifyChange();this.set();
      } else if (val && val.trim()) {
        this.setValue(this._date.getTime());if (this._date) this.set();else input.val("");
      } else {
        if (this._date) {
          this.setValue(null);this.notifyChange();this._unset = true;
        }
      }this._resetMaskPos(input);
    }, showMode: function (dir) {
      if (dir) {
        this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
      }this.widget.find(".datepicker > div").hide().filter(".datepicker-" + DPGlobal.modes[this.viewMode].clsName).show();
    }, destroy: function () {
      this._detachDatePickerEvents();this._detachDatePickerGlobalEvents();this.widget.remove();this.$element.removeData("datetimepicker");this.component.removeData("datetimepicker");
    }, formatDate: function (d) {
      return this.format.replace(formatReplacer, function (match) {
        var methodName,
            property,
            rv,
            len = match.length;if (match === "ms") len = 1;property = dateFormatComponents[match].property;if (property === "Hours12") {
          rv = d.getUTCHours();if (rv === 0) rv = 12;else if (rv !== 12) rv = rv % 12;
        } else if (property === "Period12") {
          if (d.getUTCHours() >= 12) return "PM";else return "AM";
        } else {
          methodName = "get" + property;rv = d[methodName]();
        }if (methodName === "getUTCMonth") rv = rv + 1;if (methodName === "getUTCYear") rv = rv + 1900 - 2e3;return padLeft(rv.toString(), len, "0");
      });
    }, parseDate: function (str) {
      var match,
          i,
          property,
          methodName,
          value,
          parsed = {};if (!(match = this._formatPattern.exec(str))) return null;for (i = 1; i < match.length; i++) {
        property = this._propertiesByIndex[i];if (!property) continue;value = match[i];if (/^\d+$/.test(value)) value = parseInt(value, 10);parsed[property] = value;
      }return this._finishParsingDate(parsed);
    }, _resetMaskPos: function (input) {
      var val = input.val();for (var i = 0; i < this._mask.length; i++) {
        if (this._mask[i].end > val.length) {
          this._maskPos = i;break;
        } else if (this._mask[i].end === val.length) {
          this._maskPos = i + 1;break;
        }
      }
    }, _finishParsingDate: function (parsed) {
      var year, month, date, hours, minutes, seconds, milliseconds;year = parsed.UTCFullYear;if (parsed.UTCYear) year = 2e3 + parsed.UTCYear;if (!year) year = 1970;if (parsed.UTCMonth) month = parsed.UTCMonth - 1;else month = 0;date = parsed.UTCDate || 1;hours = parsed.UTCHours || 0;minutes = parsed.UTCMinutes || 0;seconds = parsed.UTCSeconds || 0;milliseconds = parsed.UTCMilliseconds || 0;if (parsed.Hours12) {
        hours = parsed.Hours12;
      }if (parsed.Period12) {
        if (/pm/i.test(parsed.Period12)) {
          if (hours != 12) hours = (hours + 12) % 24;
        } else {
          hours = hours % 12;
        }
      }return UTCDate(year, month, date, hours, minutes, seconds, milliseconds);
    }, _compileFormat: function () {
      var match,
          component,
          components = [],
          mask = [],
          str = this.format,
          propertiesByIndex = {},
          i = 0,
          pos = 0;while (match = formatComponent.exec(str)) {
        component = match[0];if (component in dateFormatComponents) {
          i++;propertiesByIndex[i] = dateFormatComponents[component].property;components.push("\\s*" + dateFormatComponents[component].getPattern(this) + "\\s*");mask.push({ pattern: new RegExp(dateFormatComponents[component].getPattern(this)), property: dateFormatComponents[component].property, start: pos, end: pos += component.length });
        } else {
          components.push(escapeRegExp(component));mask.push({ pattern: new RegExp(escapeRegExp(component)), character: component, start: pos, end: ++pos });
        }str = str.slice(component.length);
      }this._mask = mask;this._maskPos = 0;this._formatPattern = new RegExp("^\\s*" + components.join("") + "\\s*$");this._propertiesByIndex = propertiesByIndex;
    }, _attachDatePickerEvents: function () {
      var self = this;this.widget.on("click", ".datepicker *", $.proxy(this.click, this));this.widget.on("click", "[data-action]", $.proxy(this.doAction, this));this.widget.on("mousedown", $.proxy(this.stopEvent, this));if (this.pickDate && this.pickTime) {
        this.widget.on("click.togglePicker", ".accordion-toggle", function (e) {
          e.stopPropagation();var $this = $(this);var $parent = $this.closest("ul");var expanded = $parent.find(".collapse.in");var closed = $parent.find(".collapse:not(.in)");if (expanded && expanded.length) {
            var collapseData = expanded.data("collapse");if (collapseData && collapseData.transitioning) return;expanded.collapse("hide");closed.collapse("show");$this.find("i").toggleClass(self.timeIcon + " " + self.dateIcon);self.$element.find(".tclock i").toggleClass(self.timeIcon + " " + self.dateIcon);
          }
        });
      }if (this.isInput) {
        this.$element.on({ focus: $.proxy(this.show, this), change: $.proxy(this.change, this) });if (this.options.maskInput) {
          this.$element.on({ keydown: $.proxy(this.keydown, this), keypress: $.proxy(this.keypress, this) });
        }
      } else {
        this.$element.on({ change: $.proxy(this.change, this) }, "input");if (this.options.maskInput) {
          this.$element.on({ keydown: $.proxy(this.keydown, this), keypress: $.proxy(this.keypress, this) }, "input");
        }if (this.component) {
          this.component.on("click", $.proxy(this.show, this));
        } else {
          this.$element.on("click", $.proxy(this.show, this));
        }
      }
    }, _attachDatePickerGlobalEvents: function () {
      $(window).on("resize.datetimepicker" + this.id, $.proxy(this.place, this));if (!this.isInput) {
        $(document).on("mousedown.datetimepicker" + this.id, $.proxy(this.hide, this));
      }
    }, _detachDatePickerEvents: function () {
      this.widget.off("click", ".datepicker *", this.click);this.widget.off("click", "[data-action]");this.widget.off("mousedown", this.stopEvent);if (this.pickDate && this.pickTime) {
        this.widget.off("click.togglePicker");
      }if (this.isInput) {
        this.$element.off({ focus: this.show, change: this.change });if (this.options.maskInput) {
          this.$element.off({ keydown: this.keydown, keypress: this.keypress });
        }
      } else {
        this.$element.off({ change: this.change }, "input");if (this.options.maskInput) {
          this.$element.off({ keydown: this.keydown, keypress: this.keypress }, "input");
        }if (this.component) {
          this.component.off("click", this.show);
        } else {
          this.$element.off("click", this.show);
        }
      }
    }, _detachDatePickerGlobalEvents: function () {
      $(window).off("resize.datetimepicker" + this.id);if (!this.isInput) {
        $(document).off("mousedown.datetimepicker" + this.id);
      }
    }, _isInFixed: function () {
      if (this.$element) {
        var parents = this.$element.parents();var inFixed = false;for (var i = 0; i < parents.length; i++) {
          if ($(parents[i]).css("position") == "fixed") {
            inFixed = true;break;
          }
        }return inFixed;
      } else {
        return false;
      }
    } };$.fn.datetimepicker = function (option, val) {
    return this.each(function () {
      var $this = $(this),
          data = $this.data("datetimepicker"),
          options = typeof option === "object" && option;if (!data) {
        $this.data("datetimepicker", data = new DateTimePicker(this, $.extend({}, $.fn.datetimepicker.defaults, options)));
      }if (typeof option === "string") data[option](val);
    });
  };$.fn.datetimepicker.defaults = { maskInput: false, pickDate: true, pickTime: true, pick12HourFormat: false, pickSeconds: true, startDate: -Infinity, endDate: Infinity, collapse: true };$.fn.datetimepicker.Constructor = DateTimePicker;var dpgId = 0;var dates = $.fn.datetimepicker.dates = { en: { days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] } };var dateFormatComponents = { dd: { property: "UTCDate", getPattern: function () {
        return "(0?[1-9]|[1-2][0-9]|3[0-1])\\b";
      } }, MM: { property: "UTCMonth", getPattern: function () {
        return "(0?[1-9]|1[0-2])\\b";
      } }, yy: { property: "UTCYear", getPattern: function () {
        return "(\\d{2})\\b";
      } }, yyyy: { property: "UTCFullYear", getPattern: function () {
        return "(\\d{4})\\b";
      } }, hh: { property: "UTCHours", getPattern: function () {
        return "(0?[0-9]|1[0-9]|2[0-3])\\b";
      } }, mm: { property: "UTCMinutes", getPattern: function () {
        return "(0?[0-9]|[1-5][0-9])\\b";
      } }, ss: { property: "UTCSeconds", getPattern: function () {
        return "(0?[0-9]|[1-5][0-9])\\b";
      } }, ms: { property: "UTCMilliseconds", getPattern: function () {
        return "([0-9]{1,3})\\b";
      } }, HH: { property: "Hours12", getPattern: function () {
        return "(0?[1-9]|1[0-2])\\b";
      } }, PP: { property: "Period12", getPattern: function () {
        return "(AM|PM|am|pm|Am|aM|Pm|pM)\\b";
      } } };var keys = [];for (var k in dateFormatComponents) keys.push(k);keys[keys.length - 1] += "\\b";keys.push(".");var formatComponent = new RegExp(keys.join("\\b|"));keys.pop();var formatReplacer = new RegExp(keys.join("\\b|"), "g");function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }function padLeft(s, l, c) {
    if (l < s.length) return s;else return Array(l - s.length + 1).join(c || " ") + s;
  }function getTemplate(timeIcon, pickDate, pickTime, is12Hours, showSeconds, collapse) {
    if (pickDate && pickTime) {
      return '<div class="bootstrap-datetimepicker-widget dropdown-menu">' + "<ul>" + "<li" + (collapse ? ' class="collapse in"' : "") + ">" + '<div class="datepicker">' + DPGlobal.template + "</div>" + "</li>" + '<li class="picker-switch accordion-toggle"><a><i class="' + timeIcon + '"></i></a></li>' + "<li" + (collapse ? ' class="collapse"' : "") + ">" + '<div class="timepicker">' + TPGlobal.getTemplate(is12Hours, showSeconds) + "</div>" + "</li>" + "</ul>" + "</div>";
    } else if (pickTime) {
      return '<div class="bootstrap-datetimepicker-widget dropdown-menu">' + '<div class="timepicker">' + TPGlobal.getTemplate(is12Hours, showSeconds) + "</div>" + "</div>";
    } else {
      return '<div class="bootstrap-datetimepicker-widget dropdown-menu">' + '<div class="datepicker">' + DPGlobal.template + "</div>" + "</div>";
    }
  }function UTCDate() {
    return new Date(Date.UTC.apply(Date, arguments));
  }var DPGlobal = { modes: [{ clsName: "days", navFnc: "UTCMonth", navStep: 1 }, { clsName: "months", navFnc: "UTCFullYear", navStep: 1 }, { clsName: "years", navFnc: "UTCFullYear", navStep: 10 }], isLeapYear: function (year) {
      return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    }, getDaysInMonth: function (year, month) {
      return [31, DPGlobal.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    }, headTemplate: "<thead>" + "<tr>" + '<th class="prev">&lsaquo;</th>' + '<th colspan="5" class="switch"></th>' + '<th class="next">&rsaquo;</th>' + "</tr>" + "</thead>", contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>' };DPGlobal.template = '<div class="datepicker-days">' + '<table class="table-condensed">' + DPGlobal.headTemplate + "<tbody></tbody>" + "</table>" + "</div>" + '<div class="datepicker-months">' + '<table class="table-condensed">' + DPGlobal.headTemplate + DPGlobal.contTemplate + "</table>" + "</div>" + '<div class="datepicker-years">' + '<table class="table-condensed">' + DPGlobal.headTemplate + DPGlobal.contTemplate + "</table>" + "</div>";var TPGlobal = { hourTemplate: '<span data-action="showHours" data-time-component="hours" class="timepicker-hour"></span>', minuteTemplate: '<span data-action="showMinutes" data-time-component="minutes" class="timepicker-minute"></span>', secondTemplate: '<span data-action="showSeconds" data-time-component="seconds" class="timepicker-second"></span>' };TPGlobal.getTemplate = function (is12Hours, showSeconds) {
    return '<div class="timepicker-picker">' + '<table class="table-condensed"' + (is12Hours ? ' data-hour-format="12"' : "") + ">" + "<tr>" + '<td><a href="#" class="btn" data-action="incrementHours"><i class="icon-chevron-up"></i></a></td>' + '<td class="separator"></td>' + '<td><a href="#" class="btn" data-action="incrementMinutes"><i class="icon-chevron-up"></i></a></td>' + (showSeconds ? '<td class="separator"></td>' + '<td><a href="#" class="btn" data-action="incrementSeconds"><i class="icon-chevron-up"></i></a></td>' : "") + (is12Hours ? '<td class="separator"></td>' : "") + "</tr>" + "<tr>" + "<td>" + TPGlobal.hourTemplate + "</td> " + '<td class="separator">:</td>' + "<td>" + TPGlobal.minuteTemplate + "</td> " + (showSeconds ? '<td class="separator">:</td>' + "<td>" + TPGlobal.secondTemplate + "</td>" : "") + (is12Hours ? '<td class="separator"></td>' + "<td>" + '<button type="button" class="btn btn-primary" data-action="togglePeriod"></button>' + "</td>" : "") + "</tr>" + "<tr>" + '<td><a href="#" class="btn" data-action="decrementHours"><i class="icon-chevron-down"></i></a></td>' + '<td class="separator"></td>' + '<td><a href="#" class="btn" data-action="decrementMinutes"><i class="icon-chevron-down"></i></a></td>' + (showSeconds ? '<td class="separator"></td>' + '<td><a href="#" class="btn" data-action="decrementSeconds"><i class="icon-chevron-down"></i></a></td>' : "") + (is12Hours ? '<td class="separator"></td>' : "") + "</tr>" + "</table>" + "</div>" + '<div class="timepicker-hours" data-action="selectHour">' + '<table class="table-condensed">' + "</table>" + "</div>" + '<div class="timepicker-minutes" data-action="selectMinute">' + '<table class="table-condensed">' + "</table>" + "</div>" + (showSeconds ? '<div class="timepicker-seconds" data-action="selectSecond">' + '<table class="table-condensed">' + "</table>" + "</div>" : "");
  };
})(window.jQuery);

// Date Picker functions Bootstrap
$(function () {
    $('#datetimepicker1').datepicker({
        autoclose: true
    });
    $('#datetimepicker2').datepicker({
        autoclose: true
    });
});

//Google Address Autocomplete
//This will allow a user to begin putting in an address and use google to find it and complete the adrress

var autocomplete;
var componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};

function initAutocomplete() {
    // Create the autocomplete object, restricting the search to geographical
    // location types.
    autocomplete = new google.maps.places.Autocomplete(document.getElementById('eventLocationAddress'), { types: ['geocode'] });

    // When the user selects an address from the dropdown, populate the address
    // fields in the form.
    autocomplete.addListener('place_changed', fillInAddress);
}

// function fillInAddress() {
//   // Get the place details from the autocomplete object.
//   var place = autocomplete.getPlace();

//   for (var component in componentForm) {
//     document.getElementById(component).value = '';
//     document.getElementById(component).disabled = false;
//   }

//   // Get each component of the address from the place details
//   // and fill the corresponding field on the form.
//   for (var i = 0; i < place.address_components.length; i++) {
//     var addressType = place.address_components[i].types[0];
//     if (componentForm[addressType]) {
//       var val = place.address_components[i][componentForm[addressType]];
//       document.getElementById(addressType).value = val;
//     }
//   }
// }

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
                center: geolocation,
                radius: position.coords.accuracy
            });
            autocomplete.setBounds(circle.getBounds());
        });
    }
}

// HTML canvas creating the invitation using knockout observables

$(document).ready(function () {

    function MyViewModel() {
        var self = this;
        //Event form variables
        self.eventForm = ko.observable(true);
        self.eventType = ko.observable('');
        self.eventName = ko.observable('');
        self.hostName = ko.observable('');
        self.hostPTN = ko.observable('');
        self.eventLocationName = ko.observable('');
        self.eventLocationAddress = ko.observable('');
        self.eventStartDate = ko.observable('');
        self.startTime = ko.observable('');
        self.eventEndDate = ko.observable('');
        self.endTime = ko.observable('');
        self.datevisible = ko.observable(false);
        self.eventMessage = ko.observable('');
        self.addEndButton = ko.observable('Add End Date');
        self.dateButtonClass = ko.observable('btn btn-default');
        //Profile form variables
        self.personalForm = ko.observable(false);
        self.moreDetails = ko.observable(false);
        self.detailButtonText = ko.observable('Add Detail Profile');
        self.detailButtonClass = ko.observable('btn btn-default');
        //Guest List variables
        self.guestButton = ko.observable('Create Guest List');
        self.guestList = ko.observable(false);
        self.guestNameToAdd = ko.observable('');
        self.guestEmailToAdd = ko.observable('');
        self.guestListArray = ko.observableArray('');
        var idNum = 1001;

        //Print to screen for review of event details
        self.printEventName = ko.computed(function () {
            return self.eventName();
        });
        self.printName = ko.computed(function () {
            return self.hostName();
        });
        self.printHostPTN = ko.computed(function () {
            return self.hostPTN();
        });
        self.printEventLocationName = ko.computed(function () {
            return self.eventLocationName();
        });
        self.printEventLocationAddress = ko.computed(function () {
            return self.eventLocationAddress();
        });
        self.printEventDates = ko.computed(function () {
            if (self.eventStartDate() === '') {
                return;
            } else {
                if (self.startTime() === '') {
                    if (self.eventEndDate() === '') {
                        return 'Start Date: ' + self.eventStartDate();
                    } else {
                        if (self.endTime() === '') {
                            return 'Start Date: ' + self.eventStartDate() + ' to ' + self.eventEndDate();
                        } else {
                            return 'Start Date: ' + self.eventStartDate() + ' to ' + self.eventEndDate() + ' at ' + self.endTime();
                        }
                    }
                } else {
                    if (self.eventEndDate() === '') {
                        return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime();
                    } else {
                        if (self.endTime() === '') {
                            return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime() + ' to ' + self.eventEndDate();
                        } else {
                            return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime() + ' to ' + self.eventEndDate() + ' at ' + self.endTime();
                        }
                    }
                }
            }
        });
        self.printEventMessage = ko.computed(function () {
            return self.eventMessage();
        });
        self.printEventType = ko.computed(function () {

            return self.eventType();
        });

        //Add end date if requested
        self.showEndDate = function () {
            if (self.datevisible()) {
                self.addEndButton('Add End Date');
                self.datevisible(false);
                self.dateButtonClass('btn btn-default');
                self.eventEndDate('');
                self.endTime('');
            } else {
                self.datevisible(true);
                self.addEndButton('Remove End Date');
                self.dateButtonClass('btn btn-danger');
            }
        };

        //show the guest list table and form options
        self.showGuestList = function () {
            if (self.guestList()) {
                self.guestList(false);
                self.guestButton('Create Guest List');
            } else {
                self.guestList(true);
                self.guestButton('Hide Guest List');
            }
        };
        //Add guest to list and print to screen
        self.capName = ko.computed(function () {
            var guestNameArray = [];
            var searchString = /\s/g;
            var subSpace = self.guestNameToAdd().toLowerCase().split(searchString);

            function lastName() {
                for (i = 0; i < subSpace.length; i++) {
                    var nameVar = subSpace[i];
                    var nameSubFirst = nameVar.substr(0, 1).toUpperCase();
                    var nameSubLast = nameVar.substr(1);
                    var nameResult = nameSubFirst + nameSubLast;
                    guestNameArray.push(nameResult);
                }
            };
            var callfunction = lastName();
            var subLast = guestNameArray.join(" ");

            return subLast;
        }, self);

        self.validEmail = ko.computed(function () {
            var emailGuest = self.guestEmailToAdd();
            var containsAt = emailGuest.search(/[a-zA-Z]@[a-zA-z]/g) > -1;
            var indexPeriod = emailGuest.search(/\./g);
            var isWeb = emailGuest.substr(indexPeriod);
            var containsPeriod = 3 < isWeb.length < 5;
            function validationCheck() {
                if (containsAt === containsPeriod) {
                    return emailGuest;
                } else {
                    return 'Invalid Email';
                }
            };
            var emailCheck = validationCheck();
            return emailCheck;
        });
        self.addGuest = function () {
            if (self.guestNameToAdd() != '') {
                idNum += 1;

                var nameGuest = self.capName();
                var emailGuest = self.validEmail();
                self.guestListArray.push({ guestName: nameGuest, guestEmail: emailGuest, guestID: idNum });
                self.guestNameToAdd('');
                self.guestEmailToAdd('');
            }
        }.bind(self);

        self.removeGuest = function (guest) {
            self.guestListArray.remove(guest);
        };

        //Request personal information after event form is saved
        self.showPersonal = function () {
            self.eventForm(false);
            self.personalForm(true);
        };

        //Allow for greater profile details if desired
        self.showMoreDetails = function () {
            if (self.moreDetails()) {
                self.moreDetails(false);
                self.detailButtonText('Add Detail Profile');
                self.detailButtonClass('btn btn-default');
            } else {
                self.moreDetails(true);
                self.detailButtonText('Hide Detail Profile');
                self.detailButtonClass('btn btn-danger');
            }
        };
    }

    ko.bindingHandlers.enterkey = {
        init: function (element, valueAccessor, allBindings, viewModel) {
            var callback = valueAccessor();
            $(element).keypress(function (event) {
                var keyCode = event.which ? event.which : event.keyCode;
                if (keyCode === 13) {
                    callback.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };

    var vm = new MyViewModel();

    ko.applyBindings(vm);
});