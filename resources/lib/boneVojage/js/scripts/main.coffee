require.config 
		
		paths: 
			# jquery path
			'jquery' : 'lib/jquery-1.8.2.min'
			# prefixfree path
			'prefixfree' : 'plugins/prefixfree.min'
			# prettify plugin
			'prettify' : 'plugins/prettify'

# main module
require ['main_c']

# prettify plugin
require ['prettify'],->
	# trettify my code
	prettyPrint()

# prefixfree plugin
require ['prefixfree']
