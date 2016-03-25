(function() {

  $.fn.fadeOutWithDelay = function(delay) {
    var self;
    self = this;
    return setTimeout((function() {
      return self.fadeOut(400);
    }), delay);
  };

  window.main = {
    m: {
      debug: {},
      settings: {
        console: $('div#console'),
        $notification: $('div#notification_wrap'),
        $body: $('body'),
        $window: $(window)
      },
      state: {},
      fetchPosts: function() {
        main.makeProfile('fetchPost', 'Collapsed');
        return main.makeProfileEnd('fetchPost', 'Collapsed');
      }
    },
    o: {
      init: function() {
        main.makeProfile('init');
        main.v.console('init ok');
        main.v.console('init warning', 'warning');
        main.v.console('init alert', 'alert');
        main.e.listen();
        return main.makeProfileEnd('init');
      }
    },
    v: {
      console: function(string, type) {
        return main.m.settings.console.prepend("<p class=\"" + (type || 'ok') + "\">" + string + "<p>");
      },
      showNoty: function(options) {
        var $curr_noty, defaults;
        defaults = {
          text: 'I\'m default noty',
          type: 'ok',
          hide: 4000,
          callback: (function() {})
        };
        options = $.extend({}, defaults, options || {});
        main.m.settings.$notification.prepend("<div id=\"noty\" class=\"" + options.type + "\">" + options.text + "</div>");
        $curr_noty = main.m.settings.$notification.find('div#noty').first();
        $curr_noty.fadeOutWithDelay(options.hide);
        $curr_noty.fadeIn();
        return $curr_noty.data({
          callback: options.callback
        });
      }
    },
    e: {
      listen: function() {
        main.makeProfile('listen', 'Collapsed');
        main.m.settings.$notification.on('click', 'div#noty', (function() {
          $(this).fadeOut(500, (function() {
            return $(this).remove();
          }));
          if ($(this).data().callback) return $(this).data().callback();
        }));
        return main.makeProfileEnd('listen');
      }
    },
    makeProfile: function(name, type) {},
    makeProfileEnd: function(name) {}
  };

  main.o.init();

}).call(this);
