(function() {

  require.config({
    paths: {
      'jquery': 'lib/jquery-1.8.2.min',
      'prefixfree': 'plugins/prefixfree.min',
      'prettify': 'plugins/prettify'
    }
  });

  require(['main_c']);

  require(['prettify'], function() {
    return prettyPrint();
  });

  require(['prefixfree']);

}).call(this);
