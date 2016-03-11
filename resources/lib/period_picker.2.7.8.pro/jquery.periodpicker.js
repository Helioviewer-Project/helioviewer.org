/**
 * @preserve jQuery PeriodPicker plugin v2.7.8
 * @homepage http://xdsoft.net/jqplugins/periodpicker/
 * @copyright (c) 2016 xdsoft.net Chupurnov Valeriy
 * @license PRO http://xdsoft.net/jqplugins/periodpicker/license/
 */
(function ($, window, document) {
    'use strict';
    var uniqueid = 0;

    function TimeWrapper(str, format, date) {
        var that = date || new Date(), value;
        that.isTW = true;
        that.weekdays = function (start) {
            var weekdays = moment.weekdaysShort(), ret, i;
            ret = weekdays.splice(1);
            ret[6] = weekdays[0];
            weekdays = ret;// [m,t,w,th,f,s,sn]
            ret = weekdays.splice(start - 1);
            for (i = 0; i < start - 1; i += 1) {
                ret.push(weekdays[i]);
            }
            return ret;
        };
        that.clone = function (y, m, d, h, i, s) {
            var tmp = new TimeWrapper();
            tmp.setFullYear(y || that.getFullYear());
            tmp.setMonth(m || that.getMonth());
            tmp.setDate(d || that.getDate());
            tmp.setHours(h || that.getHours());
            tmp.setMinutes(i || that.getMinutes());
            tmp.setSeconds(s || that.getSeconds());
            return tmp;
        };
        that.inRange = function (value, range) {
            return moment(value).isBetween(range[0], range[1], 'day') || moment(value).isSame(range[0], 'day') || moment(value).isSame(range[1], 'day');
        };
        that.isValid = function () {
            if (Object.prototype.toString.call(that) !== "[object Date]") {
                return false;
            }
            return !isNaN(that.getTime());
        };
        that.parseStr = function (str, format) {
            var time =  $.type(str) === 'string' ? moment(str, format) : str;
            if (time && time.isValid()) {
                that = !time.isTW ? new TimeWrapper(0, 0, time.toDate()) : time;
                return that;
            }
            return null;
        };
        that.isEqualDate = function (date1, date2) {
            if (!date1 || !date1.isValid() || !date2 || !date2.isValid()) {
                return false;
            }
            return (date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getMonth() === date2.getMonth());
        };
        that.format = function (format) {
            value = moment(that).format(format);
            return new RegExp('^[0-9]+$').test(value) ? parseInt(value, 10) : value;
        };
        that.countDaysInMonth = function () {
            return new Date(that.getFullYear(), that.getMonth() + 1, 0).getDate();
        };
        if (str && format) {
            that.parseStr(str, format);
        }
        return that;
    }

    function PeriodPicker(startinput, options) {
        var that = this, date;
        that.options = options;
        that.picker = $('<div unselectable="on" class="period_picker_box xdsoft_noselect ' + (options.fullsize ? 'period_picker_maximize' : '') + '" style="">' +
            (options.resizeButton ? '<div class="period_picker_resizer"></div>' : '') +
            '<div class="period_picker_head">' +
                (options.title ? '<span class="period_picker_head_title">' + this.i18n(options.norange ? 'Select date' : 'Select period') + '</span>' : '') +
                (options.fullsizeButton ? '<span class="period_picker_max_min" title="' + this.i18n('Open fullscreen') + '"></span>' : '') +
                (options.closeButton ? '<span class="period_picker_close" title="' + this.i18n('Close') + '"></span>' : '') +
            '</div>' +
            (options.yearsLine ? '<div class="period_picker_years">' +
                '<div class="period_picker_years_inner">' +
                    '<div class="period_picker_years_selector">' +
                        '<div class="period_picker_years_selector_container" style="width: 5960px; left: 0px;">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '</div>' : '') +
            '<div class="period_picker_work">' +
                (that.options.navigate ? '<a href="" class="xdsoft_navigate xdsoft_navigate_prev"></a>' : '') +
                ((that.options.timepicker && $.fn.TimePicker !== undefined) ? '<div class="period_picker_timepicker_box"><input data-index="0" class="timepicker" type="hidden"></div>' : '') +
                '<div class="period_picker_days">' +
                    '<table>' +
                        '<tbody>' +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
                ((that.options.timepicker && $.fn.TimePicker !== undefined && !that.options.norange) ? '<div class="period_picker_timepicker_box"><input  data-index="1"  class="timepicker" type="hidden"></div>' : '') +
                (that.options.navigate ? '<a href="" class="xdsoft_navigate xdsoft_navigate_next"></a>' : '') +
            '</div>' +
            '<div class="period_picker_submit_shadow"></div>' +
            '<div class="period_picker_submit_dates">' +
                ((that.options.timepicker && $.fn.TimePicker !== undefined) ? '<span class="period_picker_from_time_block period_picker_time">' +
                    '<span class="input_box"><input data-index="0"  class="input_control period_picker_from_time"></span>' +
                '</span>' : '') +
                '<span class="period_picker_from_block period_picker_date">' +
                    '<span class="input_box"><input class="input_control period_picker_from" maxlength="10"></span>' +
                '</span>' +
                '<span>&#8212;</span>' +
                '<span class="period_picker_to_block period_picker_date">' +
                    '<span class="input_box"><input class="input_control period_picker_to" maxlength="10"></span>' +
                '</span>' +
                ((that.options.timepicker && $.fn.TimePicker !== undefined && !that.options.norange) ? '<span class="period_picker_to_time_block period_picker_time">' +
                    '<span class="input_box"><input data-index="1" class="input_control period_picker_to_time"></span>' +
                '</span>' : '') +
                (options.okButton ? '<button class="period_picker_show " role="button" type="button">' +
                    '<span class="button_text">' + this.i18n('OK') + '</span>' +
                '</button>' : '') +
            '</div>' +
            '</div>');

        if (that.options.timepicker && $.fn.TimePicker !== undefined) {
            that.picker.addClass('with_first_timepicker');
        }
        if (that.options.timepicker && $.fn.TimePicker !== undefined && !that.options.norange) {
            that.picker.addClass('with_second_timepicker');
        }

        if (options.animation) {
            that.picker.addClass('animation');
        }
        if (options.norange) {
            that.picker.addClass('xdsoft_norange');
        }
        that.pickerdays = that.picker.find('.period_picker_days');
        that.calendarbox = that.pickerdays.find('> table > tbody');
        that.yearsline = that.picker.find('.period_picker_years_selector_container');
        that.yearslineparent = that.picker.find('.period_picker_years_selector');
        that.timepicker = that.picker.find('.period_picker_timepicker_box');
        that.button = $('<button class="period_picker_input" type="button">' +
            '<span class="period_button_text">' +
                '<span class="period_button_content_wrapper">' +
                    '<span class="period_button_content">' +
                        '<span class="icon_calendar"></span>' +
                        '<span>' + this.i18n(options.norange ? 'Choose date' : 'Choose period') + '</span>' +
                    '</span>' +
                '</span>' +
            '</span>' +
            '</button>');
        that.startinput = options.start ? $(options.start) : $(startinput);
        that.endinput = $(options.end);
        that.periodtime = [[]];
        that.period = [[]];
        that.director = 0;
        date = new TimeWrapper();
        that.addRange([date.parseStr(that.startinput.val(), options.formatDateTime), date.parseStr(that.endinput.val(), options.formatDateTime)]);

        that.uniqueid = uniqueid;
        that.month = that.period.length ? that.period[0].getMonth() + 1 : options.startMonth;
        that.year = that.period.length ? that.period[0].getFullYear() : options.startYear;

        that.onAfterShow = [];
        that.onAfterHide = [];
        that.onAfterRegenerate = [];
        if (that.options.onAfterShow !== undefined && $.isFunction(that.options.onAfterShow)) {
            that.onAfterShow.push(that.options.onAfterShow);
        }
        if (that.options.onAfterHide !== undefined && $.isFunction(that.options.onAfterHide)) {
            that.onAfterHide.push(that.options.onAfterHide);
        }
        if (that.options.onAfterRegenerate !== undefined && $.isFunction(that.options.onAfterRegenerate)) {
            that.onAfterRegenerate.push(that.options.onAfterRegenerate);
        }
        that.maxdate = options.maxDate ? new TimeWrapper(options.maxDate, options.formatDate) : false;
        that.mindate = options.minDate ? new TimeWrapper(options.minDate, options.formatDate) : false;

        that.monthcount = this.options.cells[0] * this.options.cells[1];
        that.timer1 = 0;
        that.timer2 = 0;
        that.timer3 = 0;
        uniqueid += 1;
        that.init();
        if (options.timepicker && $.fn.TimePicker !== undefined) {
            that.addRangeTime(that.period[0], that.period[1]);
        }
    }
    PeriodPicker.prototype.returnPeriod = function () {
        this.picker.find('input.period_picker_from').val(this.period !== undefined ? this.period : '');
        this.picker.find('input.period_picker_to').val(this.period[1] !== undefined ? this.period[1] : this.picker.find('input.period_picker_from').val());
    };
    PeriodPicker.prototype.moveTimeToDate = function () {
        if (this.options.timepicker && this.periodtime.length && this.periodtime[0].length) {
            if (this.period[0] !== null && this.period[0].format  && this.periodtime[0][0].format) {
                this.period[0].setSeconds(this.periodtime[0][0].getSeconds());
                this.period[0].setMinutes(this.periodtime[0][0].getMinutes());
                this.period[0].setHours(this.periodtime[0][0].getHours());
            }
            if (this.periodtime[0][1] !== null && this.period[1] !== null && this.period[1].format && this.periodtime[0][1].format) {
                this.period[1].setSeconds(this.periodtime[0][1].getSeconds());
                this.period[1].setMinutes(this.periodtime[0][1].getMinutes());
                this.period[1].setHours(this.periodtime[0][1].getHours());
            }
        }
    };
    PeriodPicker.prototype.getInputsValue = function () {
        var result = [], format, tw = new TimeWrapper(), tinputs = this.timepicker.find('input.timepicker');

        if ($.fn.TimePicker !== undefined) {
            if (tw.isEqualDate(this.period[0], this.period[1])) {
                tinputs.eq(0).TimePicker('setMax', tinputs.eq(1).val());
                tinputs.eq(1).TimePicker('setMin', tinputs.eq(0).val());
            } else {
                tinputs.eq(0).TimePicker('setMax', false);
                tinputs.eq(1).TimePicker('setMin', false);
            }
        }

        if (this.startinput.length && this.period && this.period && this.period.length) {
            this.moveTimeToDate();
            format = this.options.timepicker ? this.options.formatDateTime : this.options.formatDate;
            if (this.period[0] && this.period[0].format) {
                result.push(this.period[0].format(format));
            }
            if (this.endinput.length && this.period[1] && this.period[1].format) {
                result.push(this.period[1].format(format));
            }
        }
        return result;
    };
    PeriodPicker.prototype.setInputsValue = function () {
        var result = this.getInputsValue();
        if (result.length) {
            if (result[0]) {
                this.startinput.val(result[0]).trigger('change');
            }
            if (result[1]) {
                this.endinput.val(result[1]).trigger('change');
            }
        }
    };
    PeriodPicker.prototype.getLabel = function () {
        var result = [], formats;
        if (this.period.length) {
            this.moveTimeToDate();

            formats = !this.options.timepicker ? [
                this.options.formatDecoreDateWithYear || this.options.formatDecoreDate || this.options.formatDate,
                this.options.formatDecoreDateWithoutMonth || this.options.formatDecoreDate || this.options.formatDate,
                this.options.formatDecoreDate || this.options.formatDate,
                this.options.formatDate
            ] : [
                this.options.formatDecoreDateTimeWithYear || this.options.formatDecoreDateTime || this.options.formatDateTime,
                this.options.formatDecoreDateTimeWithoutMonth || this.options.formatDecoreDateTime || this.options.formatDateTime,
                this.options.formatDecoreDateTime || this.options.formatDateTime,
                this.options.formatDateTime
            ];

            if (this.period[1] === undefined || !this.period[1] || this.period[1].format === undefined || !this.period[1].format || this.period[0].format(formats[3]) === this.period[1].format(formats[3])) {
                result.push(this.period[0].format(formats[0]));
            } else {
                result.push(this.period[0].format(this.period[0].format('YYYY') !== this.period[1].format('YYYY') ? formats[0] : (this.period[0].format('M') !== this.period[1].format('M') ? formats[2] : formats[1])));
                result.push(this.period[1].format(formats[0]));
            }
        }
        return result;
    };
    PeriodPicker.prototype.setLabel = function () {
        var result = this.getLabel();
        if (result.length) {
            if (result.length === 1) {
                this.button.find('.period_button_content').html('<span class="icon_calendar"></span><span>' + result[0] + '</span>');
            } else {
                this.button.find('.period_button_content').html('<span class="icon_calendar"></span><span>' +
                    result[0] +
                    '</span>' +
                    '<span class="period_button_dash">&#8212;</span>' +
                    '<span>' + result[1] + '</span>');
            }
        } else {
            this.button.find('.period_button_content').html('<span class="icon_calendar"></span><span>' + '<span>' + this.i18n(this.options.norange ? 'Choose date' : 'Choose period') + '</span>');
        }
    };

    PeriodPicker.prototype.highlightPeriod = function () {
        var that = this;
        clearTimeout(that.timer1);
        that.timer1 = setTimeout(function () {
            var date = new TimeWrapper();
            that.picker.find('.period_picker_cell.period_picker_selected').removeClass('period_picker_selected');
            if (that.period.length) {
                moment.locale(that.options.lang);
                that.picker.find('.period_picker_cell').each(function () {
                    var current = date.parseStr($(this).data('date'), that.options.formatDate);
                    if (date.inRange(current, that.period)) {
                        $(this).addClass('period_picker_selected');
                    }
                });
                that.picker.find('.period_picker_years_period').css({
                    width: Math.floor((that.options.yearSizeInPixels / 365) * Math.abs(moment(that.period[1]).diff(that.period[0], 'day'))) + 'px',
                    left: Math.floor((that.options.yearSizeInPixels / 365) * -(moment([that.options.yearsPeriod[0], 1, 1]).diff(that.period[0], 'day')))
                });
                that.picker.find('input.period_picker_from:not(:focus)').val((that.period[0] !== undefined && that.period[0]) ? that.period[0].format(that.options.formatDate) : '');
                that.picker.find('input.period_picker_to:not(:focus)').val((that.period[1] !== undefined && that.period[1]) ? that.period[1].format(that.options.formatDate) : that.picker.find('input.period_picker_from').val());

                that.picker.find('input.period_picker_from:not(:focus),input.period_picker_to:not(:focus)').trigger('change');
                that.setLabel();
                that.setInputsValue();
            }
        }, 50);
    };
    PeriodPicker.prototype.addRangeTime = function (value1, value2) {
        var date = new TimeWrapper();

        this.periodtime[0][0] = date.parseStr(value1, this.options.timepickerOptions.inputFormat);
        if (!this.options.norange) {
            this.periodtime[0][1] = date.parseStr(value2, this.options.timepickerOptions.inputFormat);
            if (this.periodtime[0][0] === null && this.periodtime[0][1]) {
                this.periodtime[0][0] = this.periodtime[0][1];
            }
        } else {
            this.periodtime[0][1] = this.periodtime[0][0];
        }

        if (this.periodtime[0][0] === null) {
            this.periodtime[0] = [];
        }
        this.setLabel();
        this.setInputsValue();
        if (this.periodtime.length && this.periodtime[0].length && $.fn.TimePicker) {
            if (this.periodtime[0][0]) {
                this.timepicker.find('input.timepicker').eq(0).TimePicker('setValue', this.periodtime[0][0]);
            }
            if (this.periodtime[0][1] && !this.options.norange) {
                this.timepicker.find('input.timepicker').eq(1).TimePicker('setValue', this.periodtime[0][1]);
            }
        }
    };
    PeriodPicker.prototype.addRange = function (value) {
        var date = new TimeWrapper(), buff;
        if (this.options.norange) {
            this.director = 0;
        }
        if ($.isArray(value)) {
            this.period = [date.parseStr(value[0], this.options.formatDate), date.parseStr(value[1], this.options.formatDate)];
            if (this.period[0] === null) {
                this.period = [];
            }
            this.director = 0;
        } else {
            if (this.period === undefined) {
                this.period = [];
            }
            this.period[this.options.norange ? 0 : this.director] = date.parseStr(value, this.options.formatDate);
            if (this.period[this.director] === null) {
                this.period = [];
                this.highlightPeriod();
                return;
            }
            if (!this.director) {
                this.period[1] = this.period[this.director].clone();
            }
            if (this.period[0] > this.period[1]) {
                buff = this.period[0];
                this.period[0] = this.period[1];
                this.period[1] = buff;
            }
            this.director = this.director ? 0 : 1;
        }
        if (this.options.norange && this.period[0] && this.period[1] && this.period[1] !== this.period[0]) {
            this.period[1] = this.period[0].clone();
        }
        this.highlightPeriod();
        if (this.options.hideAfterSelect && this.period[0] && this.period[1] && this.period[0] !== this.period[1]) {
            this.hide();
        }
    };

    PeriodPicker.prototype.recalcDraggerPosition = function () {
        var that = this;
        clearTimeout(this.timer2);
        this.timer2 = setTimeout(function () {
            var parentLeft = Math.abs(parseInt(that.yearsline.css('left'), 10)),
                perioddragger = that.picker.find('.period_picker_years_dragger'),
                left = parseInt(perioddragger.css('left'), 10);
            if (left < parentLeft) {
                that.yearsline.css('left', -left + 'px');
            } else if (left + perioddragger.width()  > parentLeft + that.yearslineparent.width()) {
                that.yearsline.css('left', -(left + perioddragger.width() - that.yearslineparent.width()) + 'px');
            }
        }, 100);
    };

    PeriodPicker.prototype.getRealDateTime = function () {
        var date = new Date();
        date.setFullYear(this.year);
        date.setMonth(this.month - 1);
        date.setDate(1);
        return [date.getMonth(), date.getFullYear()];
    };
    PeriodPicker.prototype.regenerate = function () {
        if (!this.picker.is(':visible')) {
            return;
        }
        var that = this, width = parseInt(that.pickerdays.width(), 10), height = parseInt(that.pickerdays.parent()[0].offsetHeight, 10), i;
        moment.locale(that.options.lang);
        this.options.cells = [Math.floor((height - that.options.someYOffset) / that.options.monthHeightInPixels) || 1, Math.floor(width / that.options.monthWidthInPixels) || 1];
        if (this.options.cells[0] < 0) {
            this.options.cells[0] = 1;
        }
        that.monthcount = this.options.cells[0] * this.options.cells[1];
        that.generateCalendars(that.month, that.year);
        that.generateYearsLine();
        that.recalcDraggerPosition();
        that.highlightPeriod();
        for (i = 0; i < this.onAfterRegenerate.length; i += 1) {
            this.onAfterRegenerate[i].call(this);
        }
    };
    PeriodPicker.prototype.init = function () {
        var that = this, offset, start, diff, drag, perioddrag, perioddragger, left, headdrag, period_picker_years_selector, period_picker_years_selector_container, period_picker_time_inputs;
        that.button.on('click', function () {
            that.toggle();
        });
        that.startinput.after(that.button);
        offset = that.startinput.offset();
        that.picker.find('.period_picker_submit_dates input')
            .on('focus', function () {
                $(this).parent().parent().addClass('input_focused_yes');
            })
            .on('blur', function () {
                $(this).parent().parent().removeClass('input_focused_yes');
            });

        // enter date in center fields
        that.picker.find('.period_picker_submit_dates .period_picker_date input')
            .on('keydown', function () {
                var input = this;
                clearTimeout(that.timer3);
                that.timer3 = setTimeout(function () {
                    if ($(input).val()) {
                        var time = moment($(input).val(), that.options.formatDate);
                        if (!time.isValid()) {
                            $(input).parent().parent().addClass('period_picker_error');
                            return;
                        }
                        that.addRange([that.picker.find('.period_picker_submit_dates .period_picker_date input').eq(0).val(), that.picker.find('.period_picker_submit_dates .period_picker_date input').eq(1).val()]);
                    }
                    $(input).parent().parent().removeClass('period_picker_error');
                }, 200);
            });

        if (that.options.timepicker && $.fn.TimePicker) {
            // enter time in center inputs
            period_picker_time_inputs = that.picker.find('.period_picker_submit_dates .period_picker_time input')
                .on('keydown change', function () {
                    var input = this;
                    clearTimeout(that.timer4);
                    that.timer4 = setTimeout(function () {
                        var time, tw = new TimeWrapper();
                        if ($(input).val()) {
                            time = moment($(input).val(), that.options.timepickerOptions.inputFormat);
                            if (!time.isValid()) {
                                $(input).parent().parent().addClass('period_picker_error');
                                return;
                            }
                            if (this.period && this.period.length && tw.isEqualDate(this.period[0], this.period[1]) && moment(period_picker_time_inputs.eq(0).val(), that.options.timepickerOptions.inputFormat).getDate().getTime() > moment(period_picker_time_inputs.eq(1).val(), that.options.timepickerOptions.inputFormat).getDate().getTime()) {
                                $(input).parent().parent().addClass('period_picker_error');
                                return;
                            }
                            that.addRangeTime(that.picker.find('.period_picker_submit_dates .period_picker_time input').eq(0).val(), that.picker.find('.period_picker_submit_dates .period_picker_time input').eq(1).val());
                        }
                        $(input).parent().parent().removeClass('period_picker_error');
                    }, 200);
                });
        }
        that.picker.find('.period_picker_max_min').on('click', function () {
            that.picker.toggleClass('period_picker_maximize');
            that.regenerate();
        });
        if (that.options.fullsizeOnDblClick) {
            that.picker.find('.period_picker_head').on('dblclick', function () {
                that.picker.toggleClass('period_picker_maximize');
                that.regenerate();
            });
        }
        that.picker.find('.period_picker_close').on('click', function () {
            that.hide();
        });
        if (that.options.mousewheel) {
            that.picker.on('mousewheel', function (e) {
                that.month += (that.options.reverseMouseWheel ? -1 : 1) * e.deltaY;
                that.regenerate();
                return false;
            });
        }
        if (that.options.navigate) {
            that.picker.find('.xdsoft_navigate').on('click', function () {
                that.month += $(this).hasClass('xdsoft_navigate_prev') ? -1 : 1;
                that.regenerate();
                return false;
            });
        }
        that.picker.on('click', '.period_picker_show', function () {
            that.hide();
        });
        that.picker.on('click', '.period_picker_years_selector .period_picker_year', function () {
            that.year = parseInt($(this).text(), 10);
            that.month = -Math.floor(that.monthcount / 2) + 1;
            that.regenerate();
        });
        that.picker.on('mousedown', '.period_picker_days td td,.period_picker_month', function () {
            if ($(this).hasClass('period_picker_month')) {
                that.addRange([$(this).data('datestart'), $(this).data('dateend')]);
            } else {
                if (!$(this).hasClass('period_picker_gray_period')) {
                    if ($(this).hasClass('period_picker_selector_week')) {
                        var last = $(this).parent().find('td.period_picker_cell:not(.period_picker_gray_period):last'),
                            first = $(this).parent().find('td.period_picker_cell:not(.period_picker_gray_period):first');
                        if (last.length) {
                            that.addRange([first.data('date'), last.data('date')]);
                        }
                    } else {
                        if (that.picker.find('.period_picker_selected').length !== 1) {
                            that.picker.find('.period_picker_selected').removeClass('period_picker_selected');
                            $(this).addClass('period_picker_selected');
                        } else {
                            $(this).addClass('period_picker_selected');
                        }
                        that.addRange($(this).data('date'));
                    }
                }
            }
        });
        that.picker.on('mousedown', '.period_picker_years_selector_container', function (e) {
            period_picker_years_selector = $(this);
            period_picker_years_selector_container = true;
            start = [e.clientX, e.clientY, parseInt(period_picker_years_selector.css('left') || 0, 10)];
            e.preventDefault();
        });
        that.picker.on('mousedown', '.period_picker_years_dragger', function (e) {
            perioddragger = $(this);
            perioddrag = true;
            start = [e.clientX, e.clientY, parseInt(perioddragger.css('left'), 10)];
            e.stopPropagation();
            e.preventDefault();
        });
        if (that.options.draggable) {
            that.picker.on('mousedown', '.period_picker_head', function (e) {
                headdrag = true;
                start = [e.clientX, e.clientY, parseInt(that.picker.css('left'), 10), parseInt(that.picker.css('top'), 10)];
                e.preventDefault();
            });
        }

        that.picker.on('mouseup', function (e) {
            drag = false;
            perioddrag = false;
            headdrag = false;
            period_picker_years_selector_container = false;
            if (that.options.timepicker && $.fn.TimePicker) {
                that.timepicker.find('input.timepicker').TimePicker('stopDrag');
            }
            e.stopPropagation();
        });
        that.picker.find('.period_picker_resizer').on('mousedown', function (e) {
            drag = true;
            start = [e.clientX, e.clientY, parseInt(that.picker.css('width'), 10), parseInt(that.picker.css('height'), 10)];
            e.preventDefault();
        });
        that.picker.css({
            left: offset.left,
            top: offset.top + that.button.height(),
            width: this.options.cells[1] * that.options.monthWidthInPixels + ((that.options.timepicker && $.fn.TimePicker) ? 87 * (!that.options.norange ? 2 : 1) : 0) + 50,
            height: (this.options.cells[0] * that.options.monthHeightInPixels) + that.options.someYOffset
        });
        that.startinput.hide();
        that.endinput.hide();
        $(document.body).append(that.picker);
        $(window)
            .on('resize.xdsoft' + that.uniqueid, function () {
                that.regenerate();
            })
            .on('mouseup.xdsoft' + that.uniqueid, function () {
                if (drag || perioddrag || headdrag || period_picker_years_selector_container) {
                    drag = false;
                    perioddrag = false;
                    headdrag = false;
                    period_picker_years_selector_container = false;
                } else {
                    that.hide();
                }
            })
            .on('mousemove.xdsoft' + that.uniqueid, function (e) {
                if (headdrag) {
                    diff = [e.clientX - start[0], e.clientY - start[1]];
                    if (!that.picker.hasClass('xdsoft_i_moved')) {
                        that.picker.addClass('xdsoft_i_moved');
                    }
                    that.picker.css({
                        left: start[2] + diff[0],
                        top: start[3] + diff[1]
                    });
                }
                if (drag) {
                    diff = [e.clientX - start[0], e.clientY - start[1]];
                    that.picker.css({
                        width: start[2] + diff[0],
                        height: start[3] + diff[1]
                    });
                    that.regenerate();
                }
                if (perioddrag) {
                    diff = [e.clientX - start[0], e.clientY - start[1]];
                    left = start[2] + diff[0];
                    perioddragger.css('left', left);
                    that.calcMonthOffsetFromPeriodDragger(left);
                    that.generateCalendars(that.month, that.year);
                    that.recalcDraggerPosition();
                }
                if (period_picker_years_selector_container) {
                    diff = [e.clientX - start[0], e.clientY - start[1]];
                    left = start[2] + diff[0];
                    period_picker_years_selector.css('left', left);
                }
            });
        that.generateTimePicker();
    };
    PeriodPicker.prototype.generateTimePicker = function () {
        var that = this;
        if (that.options.timepicker && $.fn.TimePicker !== undefined && !that.timepickerAlreadyGenerated) {
            that.timepicker.each(function () {
                var $this = $(this).find('input.timepicker'), index = parseInt($this.data('index') || 0, 10);
                if ($this.length && !$this.data('timepicker') && $.fn.TimePicker !== undefined) {
                    // init timepicker
                    $this.TimePicker(that.options.timepickerOptions, $(this));
                    that.onAfterRegenerate.push(function () {
                        $this.TimePicker('regenerate');
                    });
                    $this.on('change', function () {
                        that.picker.find('.period_picker_submit_dates .period_picker_time input').eq(index)
                            .val(this.value)
                            .trigger('change');
                    });
                }
            });
            that.timepickerAlreadyGenerated = true;
        }
    };
    PeriodPicker.prototype.generateCalendars = function (month, year) {
        moment.locale(this.options.lang);
        var that = this, i, out = [], date = that.getRealDateTime(), weekdays = (new TimeWrapper()).weekdays(that.options.dayOfWeekStart);
        if (date[1] > that.options.yearsPeriod[1]) {
            that.year = that.options.yearsPeriod[1];
            year = that.year;
            that.month = 12 - that.monthcount;
            month = that.month;
        }
        if (date[1] < that.options.yearsPeriod[0]) {
            that.year = that.options.yearsPeriod[0];
            year = that.year;
            that.month = 1;
            month = that.month;
        }
        out.push('<tr class="period_picker_first_letters_tr">');
        function generateWeek() {
            var k, out2 = [];
            for (k = 0; k < weekdays.length; k += 1) {
                out2.push('<th class="' + (that.options.weekEnds.indexOf(k + that.options.dayOfWeekStart > 7 ? (k + that.options.dayOfWeekStart) % 7 : k + that.options.dayOfWeekStart) !== -1 ? 'period_picker_holiday' : '') + '">' + weekdays[k] + '</th>');
            }
            return out2.join('');
        }
        for (i = 0; i < that.options.cells[1]; i += 1) {
            out.push('<td class="period_picker_first_letters_td">' +
                '<table class="period_picker_first_letters_table">' +
                    '<tbody>' +
                        '<tr>' +
                            '<th class="period_picker_selector_week_cap">' +
                                '<span class="period_picker_selector_week_cap"></span>' +
                            '</th>' +
                            generateWeek() +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
                '</td>');
        }
        out.push('</tr>');
        for (i = 0; i < that.options.cells[0]; i += 1) {
            out.push('<tr>');
            out.push(that.generateCalendarLine(month + i * that.options.cells[1], year, that.options.cells[1]));
            out.push('</tr>');
        }
        that.calendarbox.html(out.join(''));
        that.highlightPeriod();
    };
    PeriodPicker.prototype.i18n = function (key) {
        return (this.options.i18n[this.options.lang] !== undefined &&
                    this.options.i18n[this.options.lang][key] !== undefined) ? this.options.i18n[this.options.lang][key] : key;
    };
    PeriodPicker.prototype.calcPixelOffsetForPeriodDragger = function () {
        var date = this.getRealDateTime();
        return (date[1] - this.options.yearsPeriod[0]) * this.options.yearSizeInPixels + date[0] * Math.floor(this.options.yearSizeInPixels / 12);
    };
    PeriodPicker.prototype.calcMonthOffsetFromPeriodDragger = function (left) {
        this.year = Math.floor(left / this.options.yearSizeInPixels) + this.options.yearsPeriod[0];
        this.month = Math.floor((left % this.options.yearSizeInPixels) / Math.floor(this.options.yearSizeInPixels / 12)) + 1;
    };
    PeriodPicker.prototype.generateYearsLine = function () {
        if (!this.options.yearsLine) {
            return;
        }
        var y, out = [], i = 0;
        out.push('<div class="period_picker_years_dragger" title="' + this.i18n('Move to select the desired period') + '" style="left: ' + this.calcPixelOffsetForPeriodDragger() + 'px; width: ' + (Math.floor(this.options.yearSizeInPixels / 12) * this.monthcount) + 'px;"></div>');
        out.push('<div class="period_picker_years_period" style="display: block; width: 0px; left: 300px;"></div>');
        if (this.options.yearsPeriod && $.isArray(this.options.yearsPeriod)) {
            for (y = this.options.yearsPeriod[0]; y <= this.options.yearsPeriod[1]; y += 1) {
                out.push('<div class="period_picker_year" style="left:' + (i * this.options.yearSizeInPixels) + 'px">' + y + '</div>');
                i += 1;
            }
        }
        this.yearsline.css('width', (i * this.options.yearSizeInPixels) + 'px');
        this.yearsline.html(out.join(''));
    };
    PeriodPicker.prototype.generateCalendarLine = function (month, year, count) {
        var i, j, k, out = [], date = new TimeWrapper(), countDaysInMonth, currentMonth, ticker;
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(1);
        for (i = 0; i < count; i = i + 1) {
            currentMonth = date.getMonth() + 1;
            countDaysInMonth = date.countDaysInMonth();
            out.push('<td class="period_picker_month' + date.format('M') + '">' + '<table>' + '<tbody>');
            out.push('<tr>' +
                '<th class="period_picker_month" data-datestart="' + date.format(this.options.formatDate) + '"  data-dateend="' + date.clone(0, 0, countDaysInMonth).format(this.options.formatDate) + '" colspan="8" title="' + date.format(this.options.formatMonth) + '">' + date.format(this.options.formatMonth) + '<b>' + date.format('M.YYYY') + '</b></th>' +
                '</tr>'
                );
            ticker = 0;
            while (date.format('E') !== this.options.dayOfWeekStart && ticker < 7) {
                date.setDate(date.getDate() - 1);
                ticker += 1;
            }
            j = 1;
            ticker = 0;
            while (j <= countDaysInMonth && ticker < 100) {
                out.push('<tr>');
                out.push('<td class="period_picker_selector_week" title="' + this.i18n('Select week #') + ' ' + date.format('W') + '">' +
                    '<span class="period_picker_selector_week"></span>' +
                    '</td>');

                for (k = 1; k <= 7; k += 1) {
                    if (date.format('M') !== currentMonth) {
                        out.push('<td class="period_picker_empty">&nbsp;</td>');
                    } else {
                        if ((!this.maxdate || date < this.maxdate) && (!this.mindate || date > this.mindate) && this.options.disableDays.indexOf(date.format(this.options.formatDate)) === -1) {
                            out.push('<td data-date="' + date.format(this.options.formatDate) + '"');
                            out.push('    class="period_picker_cell ');
                            out.push((this.options.weekEnds.indexOf(date.format('E')) !== -1 || this.options.holidays.indexOf(date.format(this.options.formatDate)) !== -1) ? ' period_picker_holiday' : ' period_picker_weekday');
                            out.push(((k === 7 || date.format('D') === countDaysInMonth) ? ' period_picker_last_cell' : '') + '">' + date.format('D') + '</td>');
                        } else {
                            out.push('<td class="period_picker_gray_period">' + date.format('D') + '</td>');
                        }
                        j += 1;
                    }
                    date.setDate(date.getDate() + 1);
                }
                ticker += 1;
                out.push('</tr>');
            }
            month += 1;
            date.setDate(1);
            date.setFullYear(year);
            date.setMonth(month - 1);
            currentMonth = date.getMonth() + 1;
            out.push('</tbody>' + '</table>' + '</td>');
        }
        return out.join('');
    };

    PeriodPicker.prototype.toggle = function () {
        if (this.picker.hasClass('active')) {
            this.hide();
        } else {
            this.show();
        }
    };
    PeriodPicker.prototype.show = function () {
        var i, offset, top, left;
        this.picker.addClass('visible').addClass('active');
        if (this.options.fullsize) {
            this.picker.addClass('period_picker_maximize');
        } else {
            if (!this.picker.hasClass('xdsoft_i_moved')) {
                offset = this.button.offset();

                top = offset.top + this.button.outerHeight() - 1;
                left = offset.left;

                if (top + this.picker.outerHeight() > $(window).height() + $(window).scrollTop()) {
                    top = offset.top - this.picker.outerHeight() - 1;
                }
                if (top < 0) {
                    top = 0;
                }
                if (left + this.picker.outerWidth() > $(window).width()) {
                    left = $(window).width() - this.picker.outerWidth();
                }

                this.picker.css({
                    left: left,
                    top: top,
                });
            }
        }
        this.regenerate();
        for (i = 0; i < this.onAfterShow.length; i += 1) {
            this.onAfterShow[i].call(this);
        }
    };
    PeriodPicker.prototype.hide = function () {
        var that = this;
        if (that.picker.hasClass('visible')) {
            that.picker.removeClass('active');
            if (that.picker.hasClass('animation')) {
                setTimeout(function () {
                    if (!that.picker.hasClass('active')) {
                        that.picker.removeClass('visible');
                    }
                }, 300);
            } else {
                that.picker.removeClass('visible');
            }
        }
    };
    PeriodPicker.prototype.destroy = function () {
        this.picker.remove();
        this.button.remove();
        this.startinput.show();
        this.endinput.show();
        $(window).off('.xdsoft' + this.uniqueid);
    };
    $.fn.periodpicker = function (opt, opt2, opt3) {
        var returnValue = this;
        this.each(function () {
            var options,
                $this = $(this),
                periodpicker = $this.data('periodpicker');
            if (!periodpicker) {
                options = $.extend(true, {}, $.fn.periodpicker.defaultOptions, opt);
                if (window.moment === undefined) {
                    window.moment = function (value) {
                        var c = $.type(value) === 'string' ? new Date(parseInt(value.split('.')[2], 10), parseInt(value.split('.')[1], 10) - 1, parseInt(value.split('.')[0], 10)) : new Date(value),
                            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        return {
                            getDOY: function (a) {
                                return Math.ceil(a / 86400000);
                            },
                            isSame: function (a) {
                                return a !== undefined && c.getDate() === a.getDate() && c.getMonth() === a.getMonth() && c.getFullYear() === a.getFullYear();
                            },
                            format: function (f) {
                                var target, dayNr, jan4, dayDiff;
                                switch (f) {
                                case 'MMMM YYYY':
                                    return months[c.getMonth()] + ' ' + c.getFullYear();
                                case '.MM.YYYY':
                                    return '.' + (c.getMonth() + 1) + '.' + c.getFullYear();
                                case 'YYYY':
                                    return c.getFullYear();
                                case 'D':
                                    return c.getDate();
                                case 'M':
                                    return c.getMonth() + 1;
                                case 'E':
                                    return c.getDay() + 1;
                                case 'W':
                                    target  = new Date(c.valueOf());
                                    dayNr   = (c.getDay() + 6) % 7;
                                    target.setDate(target.getDate() - dayNr + 3);
                                    jan4    = new Date(target.getFullYear(), 0, 4);
                                    dayDiff = (target - jan4) / 86400000;
                                    return 1 + Math.ceil(dayDiff / 7);
                                }
                                return c.getDate() + '.' + (c.getMonth() > 8 ? c.getMonth() + 1 : '0' + (c.getMonth() + 1)) + '.' + c.getFullYear();
                            },
                            isValid: function () {
                                if (Object.prototype.toString.call(c) !== "[object Date]") {
                                    return false;
                                }
                                return !isNaN(c.getTime());
                            },
                            diff: function (a) {
                                a = new Date(a);
                                return this.getDOY(a) - this.getDOY(c);
                            },
                            toDate: function () {
                                return c;
                            },
                            isBetween: function (a, b) {
                                return a <= c && b >= c;
                            }
                        };
                    };
                    window.moment.locale = function () {
                        return this;
                    };
                    window.moment.weekdaysShort = function () {return ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat', 'San']; };
                }
                periodpicker = new PeriodPicker(this, options);
                $this.data('periodpicker', periodpicker);
            } else {
                switch (opt) {
                case 'picker':
                    returnValue = periodpicker;
                    break;
                case 'setOption':
                    periodpicker.options[opt2] = opt3;
                    break;
                case 'setOptions':
                    periodpicker.options = $.extend(true, {}, periodpicker.options, opt2);
                    break;
                case 'clear':
                    periodpicker.addRange();
                    break;
                case 'change':
                    periodpicker.addRange([periodpicker.startinput.val(), periodpicker.endinput.val()]);
                    break;
                case 'destroy':
                    periodpicker.hide();
                    break;
                case 'hide':
                    periodpicker.hide();
                    break;
                case 'show':
                    periodpicker.show();
                    break;
                case 'value':
                    if (opt2 !== undefined) {
                        periodpicker.addRange(opt2);
                    } else {
                        returnValue = periodpicker.period;
                    }
                    break;
                case 'valueStringStrong':
                    returnValue =  periodpicker.getInputsValue().join('-');
                    break;
                case 'valueString':
                    returnValue =  periodpicker.getLabel().join('-');
                    break;
                }
            }
        });
        return returnValue;
    };
    $.fn.periodpicker.defaultOptions = {
        animation: true,
        lang: 'en',
        i18n: {
            'en' : {
                'Select week #' : 'Select week #',
                'Select period' : 'Select period',
                'Select date' : 'Select date',
                'Choose period' : 'Select period',
                'Choose date' : 'Select date'
            },
            'ru' : {
                'Move to select the desired period' : 'Переместите, чтобы выбрать нужный период',
                'Select week #' : 'Выбрать неделю №',
                'Select period' : 'Выбрать период',
                'Select date' : 'Выбрать дату',
                'Open fullscreen' : 'Открыть на весь экран',
                'Close' : 'Закрыть',
                'OK' : 'OK',
                'Choose period' : 'Выбрать период',
                'Choose date' : 'Выбрать дату'
            },
            'fr' : {
                'Move to select the desired period' : 'Déplacer pour sélectionner la période désirée',
                'Select week #' : 'Sélectionner la semaine #',
                'Select period' : 'Choisissez une date',
                'Select date' : 'Sélectionner la date',
                'Open fullscreen' : 'Ouvrir en plein écran',
                'Close' : 'Fermer',
                'OK' : 'OK',
                'Choose period' : 'Choisir la période',
                'Choose date' : 'Choisir une date'
            }
        },
        timepicker: false,
        timepickerOptions: {
            inputFormat: 'HH:mm'
        },
        yearsLine: true,
        title: true,

        okButton: true,
        closeButton: true,
        fullsizeButton: true,
        resizeButton: true,
        navigate: true,

        //buttons
        fullsizeOnDblClick: true,
        fullsize: false,
        draggable: true,
        mousewheel: true,
        reverseMouseWheel: true,
        hideAfterSelect: false,
        norange: false,

        //formats
        formatMonth: 'MMMM YYYY',

        formatDecoreDate: 'D MMMM',
        formatDecoreDateWithYear: 'D MMMM YYYY',
        formatDecoreDateWithoutMonth: 'D',
        formatDate: 'YYYY/MM/D',

        formatDecoreDateTimeWithoutMonth: 'HH:mm D',
        formatDecoreDateTime: 'HH:mm D MMMM',
        formatDecoreDateTimeWithYear: 'HH:mm D MMMM YYYY',
        formatDateTime: 'HH:mm YYYY/MM/D',

        //end period input identificator
        end: '',

        startMonth: (new Date()).getMonth() + 1,
        startYear: (new Date()).getFullYear(),
        dayOfWeekStart: 1, //Mon - 1,t,Wen - 3,th,f,s,Sun - 7
        yearSizeInPixels: 120,
        timepickerWidthInPixels: 50,
        monthWidthInPixels: 184,
        monthHeightInPixels: 174,
        someYOffset: 100,
        yearsPeriod: [2000, (new Date()).getFullYear() + 20],
        weekEnds: [6, 7],    // 1 - is Mon, 7 - is Sun
        holidays: [],        // in formatDate format
        disableDays: [],    // in formatDate format
        minDate: false,        // in formatDate format
        maxDate: false,
        cells: [1, 3]
    };
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            var i, j;
            j = this.length;
            for (i = (start || 0); i < j; i += 1) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        };
    }
}(jQuery, window, document));