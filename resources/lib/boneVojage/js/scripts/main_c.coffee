# define 'main_c',[ 'jquery'],($)->

	# show noty fadeOut with delay fun
	$.fn.fadeOutWithDelay = (delay)->
		self = this
		setTimeout (->
			self.fadeOut(400)
		), delay

	window.main = {

		m : 
			
			#vars to debug in console here
			debug:{}
			
			#settungs to main class
			settings:
				console 			: $('div#console')			# console container
				$notification 		: $('div#notification_wrap')# notification container
				$body 				: $('body') 				# body wrapped in JQ
				$window				: $(window)  				# window wrapped in JQ
			
			#current state of main class
			state:{}

			fetchPosts:()->
				main.makeProfile 		'fetchPost','Collapsed' 
				main.makeProfileEnd 	'fetchPost','Collapsed'

		o :
			init: ()->
				#console log global debug object
				#consoles to zero-level console
				# console.log main.m.debug
				main.makeProfile('init');
				#----------body------------
				main.v.console 'init ok' 
				main.v.console 'init warning', 'warning' 
				main.v.console 'init alert', 'alert' 


				#listen to global events
				main.e.listen()

				# main.v.showNoty 

				# 			text : 'ok, i\'m average long message, you got me?'
				# 			type : 'ok'
				# 			hide : 6000

				#----------body ends-------
				main.makeProfileEnd('init');


		# MVC MOVE views
		v : 
			console: (string,type)->
				main.m.settings.console.prepend "<p class=\"#{(type||'ok')}\">#{string}<p>" 

			showNoty : (options) ->

				defaults = {
					text: 'I\'m default noty'
					type: 'ok'
					hide: 4000
					callback:(->)
				}

				options = $.extend {}, defaults, options || {}

				#prepend noty
				main.m.settings.$notification.prepend "<div id=\"noty\" class=\"#{options.type}\">#{options.text}</div>"
				
				#get current noty
				$curr_noty = main.m.settings.$notification.find('div#noty').first()

				$curr_noty.fadeOutWithDelay options.hide
				
				# show noty
				$curr_noty.fadeIn() 

				# write callback to data object, to get it on click
				$curr_noty.data 
					callback: options.callback




		e : 
			listen: ()->
				main.makeProfile 		'listen','Collapsed'
				#----------body------------

				# notification on click->close listener
				main.m.settings.$notification.on 'click', 'div#noty', (->
					$(this).fadeOut 500,(->
						$(this).remove()
					)

					if $(this).data().callback then $(this).data().callback()
				)

				#----------body ends-------
				main.makeProfileEnd 	'listen'

		# // generate profile end
		makeProfile : (name,type)->
			# console["group#{type||''}"] name
			# console.profile name
			# console.time ("#{name} takes")
		# 	// generate console.profile end
		makeProfileEnd :(name)->
			# console.timeEnd ("#{name} takes")
			# console.profileEnd name
			# console.groupEnd name
	}

	# init main class
	main.o.init()