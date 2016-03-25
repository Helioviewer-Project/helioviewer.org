(function() {

  window.boneVojage = function(points, options) {
    var _this = this;
    window.boneVojage_main = {
      settings: {
        $body: $('body'),
        $window: $(window),
        $document: $(document),
        $body_html: $('body,html'),
        currPoint: 0,
        tryPositionCount: 0,
        points: [],
        $modalTop: 0,
        $modalBottom: 0,
        $modalLeft: 0,
        $modalRight: 0,
        $tooltip: 0
      },
      options: {
        delay: 1000,
        offset: 4,
        positionPriority: ['bottom', 'top', 'left', 'right', 'bottom_left', 'bottom_right', 'top_left', 'top_right'],
        position: 'best',
        button_next: 39,
        button_prev: 37,
        map: true,
        buttons: true
      },
      constructor: function(points, options) {
        var buttons,
          _this = this;
        if (boneVojage_main.options.buttons) {
          buttons = '<div id="buttons">' + '<div id="prev">prev</div>' + '<div id="next">next</div>' + '</div>';
        } else {
          buttons = '';
        }
        boneVojage_main.settings.$body.append('<div id="modal_top"></div>' + '<div id="modal_bottom"></div>' + '<div id="modal_left"></div>' + '<div id="modal_right"></div>' + '<div id="tooltip"><div id="close"></div>' + '<div id="text"></div>' + buttons + '<ul></ul>' + '</div>');
        boneVojage_main.settings.$modalTop = $('div#modal_top');
        boneVojage_main.settings.$modalBottom = $('div#modal_bottom');
        boneVojage_main.settings.$modalLeft = $('div#modal_left');
        boneVojage_main.settings.$modalRight = $('div#modal_right');
        boneVojage_main.settings.$tooltip = $('div#tooltip');
        boneVojage_main.settings.points = points;
        boneVojage_main.settings.scrollBeforeVojageY = boneVojage_main.settings.$window.scrollTop();
        boneVojage_main.settings.scrollBeforeVojageX = boneVojage_main.settings.$window.scrollLeft();
        if (boneVojage_main.options.map) boneVojage_main.O.makeMap();
        boneVojage_main.O.makeModalPosition(points[boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset).done(function() {
          return boneVojage_main.O.showModal();
        });
        return boneVojage_main.E.listen();
      },
      E: {
        listen: function() {
          boneVojage_main.settings.$document.on('keyup', function(e) {
            switch (e.keyCode) {
              case parseInt(boneVojage_main.options.button_next, 10):
                if (boneVojage_main.settings.currPoint < boneVojage_main.settings.points.length - 1) {
                  return boneVojage_main.O.next();
                }
                break;
              case parseInt(boneVojage_main.options.button_prev, 10):
                if (boneVojage_main.settings.currPoint > 0) {
                  return boneVojage_main.O.prev();
                }
            }
          });
          return boneVojage_main.settings.$tooltip.on('click', '#next', function() {
            return boneVojage_main.O.next();
          }).on('click', '#prev', function() {
            return boneVojage_main.O.prev();
          }).on('click', '#close', function() {
            boneVojage_main.settings.tryPositionCount = 0;
            boneVojage_main.O.hideModal();
            return boneVojage_main.settings.$body_html.animate({
              'scrollTop': boneVojage_main.settings.scrollBeforeVojageY,
              'scrollLeft': boneVojage_main.settings.scrollBeforeVojageX
            }, boneVojage_main.options.delay);
          }).on('click', 'li', boneVojage_main.O.makeVojageProgress);
        }
      },
      O: {
        makeMap: function() {
          var i, map, _ref;
          map = '';
          for (i = 0, _ref = points.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
            map += '<li></li>';
          }
          return boneVojage_main.settings.$tooltip.find('ul').html(map);
        },
        makeVojageProgress: function() {
          var _this = this;
          boneVojage_main.settings.tryPositionCount = 0;
          boneVojage_main.settings.currPoint = $(this).index();
          return boneVojage_main.O.makeModalPosition(boneVojage_main.settings.points[boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset).done(function() {
            return boneVojage_main.O.showModal();
          });
        },
        next: function() {
          var _this = this;
          boneVojage_main.settings.tryPositionCount = 0;
          return boneVojage_main.O.makeModalPosition(boneVojage_main.settings.points[++boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset).done(function() {
            return boneVojage_main.O.showModal();
          });
        },
        prev: function() {
          var _this = this;
          boneVojage_main.settings.tryPositionCount = 0;
          return boneVojage_main.O.makeModalPosition(boneVojage_main.settings.points[--boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset).done(function() {
            return boneVojage_main.O.showModal();
          });
        },
        getGSides: function($el) {
          var g_left, g_right;
          g_right = boneVojage_main.settings.$tooltip.outerWidth() > $el.outerWidth() ? $el.offset().left + $el.outerWidth() + (Math.abs($el.outerWidth() - boneVojage_main.settings.$tooltip.outerWidth()) / 2) : $el.offset().left + $el.outerWidth();
          g_left = boneVojage_main.settings.$tooltip.outerWidth() > $el.outerWidth() ? $el.offset().left - (Math.abs($el.outerWidth() - boneVojage_main.settings.$tooltip.outerWidth()) / 2) : $el.offset().left;
          return {
            g_right: g_right,
            g_left: g_left
          };
        },
        makeTooltipPosition: function(pos, $el, offset) {
          var i, norm;
          norm = boneVojage_main.O.getPosition($el);
          boneVojage_main.settings.$tooltip.css({
            'position': norm.fixed
          });
          if (pos !== 'best') {
            boneVojage_main.settings.$tooltip.attr('class', '');
            boneVojage_main.settings.$tooltip.addClass(pos);
          }
          switch (pos) {
            case 'left':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top - (boneVojage_main.settings.$tooltip.outerHeight() / 2) + ($el.outerHeight() / 2) - norm.normH,
                left: $el.offset().left - (boneVojage_main.settings.$tooltip.outerWidth()) - offset - norm.normY
              });
              break;
            case 'right':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top - (boneVojage_main.settings.$tooltip.outerHeight() / 2) + ($el.outerHeight() / 2) - norm.normH,
                left: $el.offset().left + $el.outerWidth() + offset - norm.normY
              });
              break;
            case 'top':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - offset - 7 - norm.normH,
                left: $el.offset().left + ($el.outerWidth() / 2) - (boneVojage_main.settings.$tooltip.outerWidth() / 2) - norm.normY
              });
              break;
            case 'top_left':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - 7 - norm.normH,
                left: $el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() - norm.normY
              });
              break;
            case 'top_right':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - 7 - norm.normH,
                left: $el.offset().left + $el.outerWidth() - norm.normY
              });
              break;
            case 'bottom':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top + $el.outerHeight() + offset - norm.normH,
                left: $el.offset().left + ($el.outerWidth() / 2) - (boneVojage_main.settings.$tooltip.outerWidth() / 2) - norm.normY
              });
              break;
            case 'bottom_right':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top + $el.outerHeight() - norm.normH,
                left: $el.outerWidth() + $el.offset().left - norm.normY
              });
              break;
            case 'bottom_left':
              boneVojage_main.settings.$tooltip.css({
                top: $el.offset().top + $el.outerHeight() - norm.normH,
                left: $el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() - norm.normY
              });
              break;
            case 'best':
              i = boneVojage_main.settings.tryPositionCount++;
              if (i < boneVojage_main.options.positionPriority.length) {
                boneVojage_main.O.makeTooltipPosition(boneVojage_main.O.tryPosition[boneVojage_main.options.positionPriority[i]]($el, boneVojage_main.options.offset), $el, boneVojage_main.options.offset);
              } else {
                boneVojage_main.O.makeTooltipPosition(boneVojage_main.options.positionPriority[0], $el, boneVojage_main.options.offset);
              }
          }
          return $el;
        },
        tryPosition: {
          left: function($el, offset) {
            if (($el.offset().left - boneVojage_main.settings.$tooltip.outerWidth()) - offset > boneVojage_main.settings.$window.scrollLeft() && (($el.offset().top - (Math.abs($el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight()) / 2)) > boneVojage_main.settings.$window.scrollTop()) && ($el.offset().top + (Math.abs($el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight()) / 2) < boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight())) {
              return 'left';
            } else {
              return 'best';
            }
          },
          right: function($el, offset) {
            if ($el.offset().left + $el.outerWidth() + offset < boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth() && (($el.offset().top - (Math.abs($el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight()) / 2)) > boneVojage_main.settings.$window.scrollTop()) && ($el.offset().top + (Math.abs($el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight()) / 2) < boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight())) {
              return 'right';
            } else {
              return 'best';
            }
          },
          top: function($el, offset) {
            var g;
            g = boneVojage_main.O.getGSides($el);
            if ($el.offset().top - offset - boneVojage_main.settings.$tooltip.outerHeight() > boneVojage_main.settings.$window.scrollTop() && (g.g_left > boneVojage_main.settings.$window.scrollLeft()) && (g.g_right < boneVojage_main.settings.$window.outerWidth() + boneVojage_main.settings.$window.scrollLeft())) {
              return 'top';
            } else {
              return 'best';
            }
          },
          top_left: function($el, offset) {
            if ($el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - offset - boneVojage_main.settings.$tooltip.outerHeight() > boneVojage_main.settings.$window.scrollTop() && (($el.offset().left - boneVojage_main.settings.$tooltip.outerWidth()) > boneVojage_main.settings.$window.scrollLeft())) {
              return 'top_left';
            } else {
              return 'best';
            }
          },
          top_right: function($el, offset) {
            if ($el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - offset - boneVojage_main.settings.$tooltip.outerHeight() > boneVojage_main.settings.$window.scrollTop() && (($el.offset().left + $el.outerWidth() + boneVojage_main.settings.$tooltip.outerWidth()) < boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth())) {
              return 'top_right';
            } else {
              return 'best';
            }
          },
          bottom: function($el, offset) {
            var g;
            g = boneVojage_main.O.getGSides($el);
            if (($el.offset().top + $el.outerHeight() + offset + boneVojage_main.settings.$tooltip.outerHeight()) < (boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight()) && (g.g_left > boneVojage_main.settings.$window.scrollLeft()) && (g.g_right < boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth())) {
              return 'bottom';
            } else {
              return 'best';
            }
          },
          bottom_left: function($el, offset) {
            if (($el.offset().top + $el.outerHeight() + offset + boneVojage_main.settings.$tooltip.outerHeight()) < (boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight()) && ($el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() > boneVojage_main.settings.$window.scrollLeft())) {
              return 'bottom_left';
            } else {
              return 'best';
            }
          },
          bottom_right: function($el, offset) {
            if (($el.offset().top + $el.outerHeight() + offset + boneVojage_main.settings.$tooltip.outerHeight()) < (boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight()) && ($el.offset().left + $el.outerWidth() + boneVojage_main.settings.$tooltip.outerWidth() < boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth())) {
              return 'bottom_right';
            } else {
              return 'best';
            }
          }
        },
        showModal: function() {
          boneVojage_main.settings.$modalTop.fadeIn();
          boneVojage_main.settings.$modalBottom.fadeIn();
          boneVojage_main.settings.$modalLeft.fadeIn();
          boneVojage_main.settings.$modalRight.fadeIn();
          return boneVojage_main.settings.$tooltip.fadeIn();
        },
        addControls: function() {
          if (boneVojage_main.settings.currPoint < boneVojage_main.settings.points.length - 1) {
            boneVojage_main.settings.$tooltip.find('#next').show();
          }
          if (boneVojage_main.settings.currPoint > 0) {
            return boneVojage_main.settings.$tooltip.find('#prev').show();
          }
        },
        hideModal: function() {
          boneVojage_main.settings.$tooltip.find('#next,#prev').hide();
          boneVojage_main.settings.$tooltip.hide();
          boneVojage_main.settings.$modalTop.hide();
          boneVojage_main.settings.$modalBottom.hide();
          boneVojage_main.settings.$modalLeft.hide();
          return boneVojage_main.settings.$modalRight.hide();
        },
        getPosition: function($el) {
          var fixed, normH, normScrollH, normScrollY, normY;
          fixed = $el.css('position');
          normScrollH = $el.offset().top - (boneVojage_main.settings.$window.outerHeight() / 2);
          normScrollY = $el.offset().left - (boneVojage_main.settings.$window.outerWidth() / 2);
          normH = 0;
          normY = 0;
          if (fixed !== 'fixed') {
            fixed = 'absolute';
          } else {
            normScrollH = boneVojage_main.settings.$window.scrollTop();
            normScrollY = boneVojage_main.settings.$window.scrollLeft();
            normH = boneVojage_main.settings.$window.scrollTop();
            normY = boneVojage_main.settings.$window.scrollLeft();
          }
          return {
            fixed: fixed,
            normH: normH,
            normY: normY,
            normScrollH: normScrollH,
            normScrollY: normScrollY
          };
        },
        makeModalPosition: function(element) {
          var $el, cnt, dfr, norm, offset;
          $el = $(element);
          norm = boneVojage_main.O.getPosition($el);
          boneVojage_main.O.hideModal();
          dfr = $.Deferred();
          cnt = 0;
          offset = boneVojage_main.options.offset;
          boneVojage_main.settings.$tooltip.find('li').eq(boneVojage_main.settings.currPoint).addClass('active').siblings().removeClass('active');
          boneVojage_main.settings.$body_html.stop(true, false).animate({
            'scrollTop': norm.normScrollH,
            'scrollLeft': norm.normScrollY
          }, boneVojage_main.options.delay, function() {
            if (cnt++ === 0) {
              dfr.resolve();
              boneVojage_main.settings.$modalTop.css({
                position: norm.fixed,
                height: ($el.offset().top - offset) - norm.normH,
                width: $el.outerWidth() + (offset * 2),
                left: $el.offset().left - offset - norm.normY
              });
              boneVojage_main.settings.$modalBottom.css({
                position: norm.fixed,
                height: $(document).outerHeight() - $el.offset().top - $el.outerHeight() - offset + norm.normY,
                width: $el.outerWidth() + (offset * 2),
                left: $el.offset().left - offset - norm.normY,
                top: $el.offset().top + $el.outerHeight() + offset - norm.normH
              });
              boneVojage_main.settings.$modalLeft.css({
                position: norm.fixed,
                width: boneVojage_main.settings.$body.outerWidth() - (boneVojage_main.settings.$body.outerWidth() - $el.offset().left) - offset - norm.normY,
                height: $(document).outerHeight() - norm.normH
              });
              boneVojage_main.settings.$modalRight.css({
                position: norm.fixed,
                left: ($el.offset().left + $el.outerWidth() + offset) - norm.normY,
                height: $(document).outerHeight() - norm.normH,
                width: boneVojage_main.settings.$body.outerWidth() - ($el.offset().left + $el.outerWidth()) - offset
              });
              boneVojage_main.settings.$tooltip.find('#text').text(boneVojage_main.settings.points[boneVojage_main.settings.currPoint].text);
              boneVojage_main.O.addControls();
              return boneVojage_main.O.makeTooltipPosition(boneVojage_main.options.position, $el, offset);
            }
          });
          return dfr.promise();
        }
      }
    };
    boneVojage_main.options = $.extend({}, boneVojage_main.options, options || {});
    return boneVojage_main.constructor(points);
  };

}).call(this);
