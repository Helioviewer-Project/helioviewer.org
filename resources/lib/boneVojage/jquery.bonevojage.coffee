window.boneVojage = ( points, options )->

		# main class
		window.boneVojage_main = 
			
			settings: {

				$body 				: 	$('body') 		# body wrapped in JQ
				
				$window 			: 	$(window) 		# body wrapped in JQ
				
				$document 			: 	$(document) 	# document wrapped in JQ

				$body_html 			:  	$('body,html')	# for animatable scroll purposes	
				
				currPoint 			:   0 				# current point in Vojage

				tryPositionCount 	: 	0       		# try position count

				points 				: 	[] 				# points of our Vojage

				
				# will be set in initialization

				$modalTop 	: 	0 			# top part for modal

				$modalBottom: 	0 			# bottom part for modal

				$modalLeft 	: 	0 			# left part for modal

				$modalRight : 	0 			# right part for modal
				
				$tooltip 	: 	0 			# tooltip


			}

			# plugin's defaults
			options :
				# delay between points
				delay 	: 1000
				# offset from init element
				offset 	: 4
				# position priority array
				positionPriority : [ 'bottom', 'top', 'left', 'right', 'bottom_left', 'bottom_right', 'top_left', 'top_right' ]
				# position
				position 	: 'best'
				# next button
				button_next : 39
				# previuos button
				button_prev : 37
				# show map 
				map 		: true
				# buttons
				buttons 	: true


			constructor:( points, options )->

				if boneVojage_main.options.buttons
					buttons = '<div id="buttons">'+
											'<div id="prev">prev</div>'+
											'<div id="next">next</div>'+
										'</div>'
				else buttons= ''

				boneVojage_main.settings.$body.append '<div id="modal_top"></div>'+

										'<div id="modal_bottom"></div>'+

										'<div id="modal_left"></div>'+

										'<div id="modal_right"></div>'+
										
										'<div id="tooltip"><div id="close"></div>'+
										'<div id="text"></div>'+
										buttons+
										'<ul></ul>'+
										'</div>'




				boneVojage_main.settings.$modalTop 		= $('div#modal_top')

				boneVojage_main.settings.$modalBottom 	= $('div#modal_bottom')

				boneVojage_main.settings.$modalLeft 	= $('div#modal_left')

				boneVojage_main.settings.$modalRight 	= $('div#modal_right')
				
				boneVojage_main.settings.$tooltip 		= $('div#tooltip')

				boneVojage_main.settings.points = points
				
				boneVojage_main.settings.scrollBeforeVojageY = boneVojage_main.settings.$window.scrollTop()
				boneVojage_main.settings.scrollBeforeVojageX = boneVojage_main.settings.$window.scrollLeft()

				if boneVojage_main.options.map
					
					boneVojage_main.O.makeMap()

				boneVojage_main.O.makeModalPosition( points[boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset )

				.done =>
					boneVojage_main.O.showModal()

				boneVojage_main.E.listen()


			E:
				listen:()=>

					boneVojage_main.settings.$document.on 'keyup',(e)->

						switch e.keyCode

							when parseInt(boneVojage_main.options.button_next,10)
								
								if boneVojage_main.settings.currPoint < boneVojage_main.settings.points.length - 1
									
									boneVojage_main.O.next()

							when parseInt(boneVojage_main.options.button_prev,10)
								
								if boneVojage_main.settings.currPoint > 0
									
									boneVojage_main.O.prev()

					boneVojage_main.settings.$tooltip.on 'click','#next',=>

						boneVojage_main.O.next()

					.on 'click', '#prev',=>
						
						boneVojage_main.O.prev()
						

					.on 'click','#close',->
						
						boneVojage_main.settings.tryPositionCount = 0
						
						boneVojage_main.O.hideModal()

						boneVojage_main.settings.$body_html.animate

														'scrollTop' : boneVojage_main.settings.scrollBeforeVojageY

														'scrollLeft': boneVojage_main.settings.scrollBeforeVojageX

														, (boneVojage_main.options.delay)

					.on 'click','li',boneVojage_main.O.makeVojageProgress



			O:
				makeMap:()->

					map = ''

					for i in [0..points.length-1]
						
							map += '<li></li>'

					boneVojage_main.settings.$tooltip.find('ul').html map

				makeVojageProgress:()->

					boneVojage_main.settings.tryPositionCount = 0

					boneVojage_main.settings.currPoint = $(this).index()

					boneVojage_main.O.makeModalPosition( boneVojage_main.settings.points[boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset )
					
					.done =>
					
						boneVojage_main.O.showModal( )

				next:()->

					boneVojage_main.settings.tryPositionCount = 0

					boneVojage_main.O.makeModalPosition( boneVojage_main.settings.points[++boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset )
					
					.done =>
					
						boneVojage_main.O.showModal( )

				prev:()->

					boneVojage_main.settings.tryPositionCount = 0
						
					boneVojage_main.O.makeModalPosition( boneVojage_main.settings.points[--boneVojage_main.settings.currPoint].selector, boneVojage_main.options.offset )
					
					.done =>
					
						boneVojage_main.O.showModal( )

				getGSides:( $el )->

					g_right = if boneVojage_main.settings.$tooltip.outerWidth() > $el.outerWidth()

					then $el.offset().left + $el.outerWidth() + (Math.abs( $el.outerWidth() - boneVojage_main.settings.$tooltip.outerWidth() )/2)

					else $el.offset().left + $el.outerWidth()

					g_left = if boneVojage_main.settings.$tooltip.outerWidth() > $el.outerWidth()

					then $el.offset().left - (Math.abs( $el.outerWidth() - boneVojage_main.settings.$tooltip.outerWidth() )/2)

					else $el.offset().left

					{g_right:g_right,g_left:g_left}

				makeTooltipPosition:( pos, $el, offset )->

					# console.log "pos: #{pos} $el: #{$el} offset: #{offset}"

					norm = boneVojage_main.O.getPosition $el

					boneVojage_main.settings.$tooltip.css

													'position' : norm.fixed

					if pos != 'best'

						boneVojage_main.settings.$tooltip.attr 'class',''

						boneVojage_main.settings.$tooltip.addClass pos

					switch pos

						when 'left'

							# console.log 'left'

							boneVojage_main.settings.$tooltip.css 
										
										top: $el.offset().top - (boneVojage_main.settings.$tooltip.outerHeight()/2) + ($el.outerHeight()/2) - norm.normH
									
										left: $el.offset().left - (boneVojage_main.settings.$tooltip.outerWidth()) - offset - norm.normY

						when 'right'
							# console.log 'right'

							boneVojage_main.settings.$tooltip.css 
										
										top: $el.offset().top - (boneVojage_main.settings.$tooltip.outerHeight()/2) + ($el.outerHeight()/2) - norm.normH
									
										left: $el.offset().left + $el.outerWidth() + offset - norm.normY

						when 'top'
							# console.log 'top'

							boneVojage_main.settings.$tooltip.css 
										
										top: $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - offset - 7 - norm.normH # 6 is box-shadow length
									
										left: $el.offset().left + ( $el.outerWidth()/2 ) - (boneVojage_main.settings.$tooltip.outerWidth()/2) - norm.normY

						when 'top_left'
							# console.log 'top-left'

							boneVojage_main.settings.$tooltip.css 
										
										top: $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight()  - 7 - norm.normH
									
										left: $el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() - norm.normY

						when 'top_right'
							# console.log 'top-right'

							boneVojage_main.settings.$tooltip.css 
										
										top: $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight()  - 7 - norm.normH
									
										left: $el.offset().left + $el.outerWidth() - norm.normY

						when 'bottom'

							# console.log 'bottom'

							boneVojage_main.settings.$tooltip.css 
								
												top: $el.offset().top + $el.outerHeight() + offset - norm.normH
											
												left: $el.offset().left + ( $el.outerWidth()/2 ) - (boneVojage_main.settings.$tooltip.outerWidth()/2) - norm.normY 
	
						when 'bottom_right'

							# console.log 'bottom-right'

							boneVojage_main.settings.$tooltip.css 
								
												top: $el.offset().top + $el.outerHeight() - norm.normH
											
												left: $el.outerWidth() + $el.offset().left - norm.normY

						when 'bottom_left'

							# console.log 'bottom-left'

							boneVojage_main.settings.$tooltip.css 
								
												top: $el.offset().top + $el.outerHeight() - norm.normH
											
												left: $el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() - norm.normY



						when 'best'
							
							i = boneVojage_main.settings.tryPositionCount++

							if i < boneVojage_main.options.positionPriority.length

								boneVojage_main.O.makeTooltipPosition boneVojage_main.O.tryPosition[boneVojage_main.options.positionPriority[i]]( $el, boneVojage_main.options.offset ), $el,  boneVojage_main.options.offset

							else 
								# position didn't found
								boneVojage_main.O.makeTooltipPosition boneVojage_main.options.positionPriority[0], $el, boneVojage_main.options.offset

					$el

				tryPosition:

					left:( $el, offset )->

						# console.log 'try left'

						if ( $el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() ) - offset > boneVojage_main.settings.$window.scrollLeft() and (
							( 
								$el.offset().top - ( 
									Math.abs( $el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight() )/2
									) 
							
							) > boneVojage_main.settings.$window.scrollTop() ) and (
							
									$el.offset().top + ( 
									
										Math.abs( $el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight() )/2
									
									) <  boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight()
								)


						then return 'left'

						else return 'best'

					right:( $el, offset )->

						# console.log 'try right'

						if $el.offset().left + $el.outerWidth() + offset < boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth() and (
							( 
								$el.offset().top - ( 
									Math.abs( $el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight() )/2
									) 
							
							) > boneVojage_main.settings.$window.scrollTop() ) and (
							
									$el.offset().top + ( 
									
										Math.abs( $el.outerHeight() - boneVojage_main.settings.$tooltip.outerHeight() )/2
									
									) <  boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight()
								)

						then return 'right'

						else return 'best'

					top:( $el, offset )->

						# console.log 'try top'

						g = boneVojage_main.O.getGSides $el

						if $el.offset().top - offset - boneVojage_main.settings.$tooltip.outerHeight() > boneVojage_main.settings.$window.scrollTop() and (g.g_left > boneVojage_main.settings.$window.scrollLeft() ) and  ( g.g_right <  boneVojage_main.settings.$window.outerWidth() + boneVojage_main.settings.$window.scrollLeft() )
							
						then return 'top'

						else return 'best'


					top_left:( $el, offset )->

						# console.log 'try top_left'

						if $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - offset - boneVojage_main.settings.$tooltip.outerHeight() > boneVojage_main.settings.$window.scrollTop() and (

							( $el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() ) > boneVojage_main.settings.$window.scrollLeft() ) 

						then return 'top_left'

						else return 'best'

					top_right:( $el, offset )->

						# console.log 'try top_right'

						if $el.offset().top - boneVojage_main.settings.$tooltip.outerHeight() - offset - boneVojage_main.settings.$tooltip.outerHeight() > boneVojage_main.settings.$window.scrollTop() and (

							( $el.offset().left + $el.outerWidth() + boneVojage_main.settings.$tooltip.outerWidth() ) < boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth() ) 

						then return 'top_right'

						else return 'best'

					bottom:( $el, offset )->

						g = boneVojage_main.O.getGSides $el

						if ( $el.offset().top + $el.outerHeight() + offset + boneVojage_main.settings.$tooltip.outerHeight() ) < ( boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight() ) and ( g.g_left > boneVojage_main.settings.$window.scrollLeft() ) and ( g.g_right <  boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth() )

						then return 'bottom'

						else return 'best'

					bottom_left:( $el, offset )->

						if ( $el.offset().top + $el.outerHeight() + offset + boneVojage_main.settings.$tooltip.outerHeight() ) < ( boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight() ) and (
							
									$el.offset().left - boneVojage_main.settings.$tooltip.outerWidth() >  boneVojage_main.settings.$window.scrollLeft() # + boneVojage_main.settings.$window.outerWidth()
								)

						then return 'bottom_left'

						else return 'best'

					bottom_right:( $el, offset )->

						if ( $el.offset().top + $el.outerHeight() + offset + boneVojage_main.settings.$tooltip.outerHeight() ) < ( boneVojage_main.settings.$window.scrollTop() + boneVojage_main.settings.$window.outerHeight() ) and (
							
									$el.offset().left + $el.outerWidth() + boneVojage_main.settings.$tooltip.outerWidth() <  boneVojage_main.settings.$window.scrollLeft() + boneVojage_main.settings.$window.outerWidth()
								
								)

						then return 'bottom_right'

						else return 'best'


				showModal:( )->

					boneVojage_main.settings.$modalTop.fadeIn()
					boneVojage_main.settings.$modalBottom.fadeIn()
					boneVojage_main.settings.$modalLeft.fadeIn()
					boneVojage_main.settings.$modalRight.fadeIn()
					boneVojage_main.settings.$tooltip.fadeIn()

				addControls:()->
					if boneVojage_main.settings.currPoint < boneVojage_main.settings.points.length - 1
						
						boneVojage_main.settings.$tooltip.find('#next').show()

					if boneVojage_main.settings.currPoint > 0

						boneVojage_main.settings.$tooltip.find('#prev').show()

				hideModal:()->

					boneVojage_main.settings.$tooltip.find('#next,#prev').hide()
					boneVojage_main.settings.$tooltip.hide()
					boneVojage_main.settings.$modalTop.hide()
					boneVojage_main.settings.$modalBottom.hide()
					boneVojage_main.settings.$modalLeft.hide()
					boneVojage_main.settings.$modalRight.hide()

				getPosition:( $el )->
					
					fixed = $el.css 'position'

					normScrollH = ( $el.offset().top - (boneVojage_main.settings.$window.outerHeight()/2))
					normScrollY = ( $el.offset().left - (boneVojage_main.settings.$window.outerWidth()/2))
					normH 		= 0
					normY 		= 0

					if fixed != 'fixed' then fixed = 'absolute'
					
					else 
						normScrollH = boneVojage_main.settings.$window.scrollTop();
						normScrollY = boneVojage_main.settings.$window.scrollLeft();
						normH 		= boneVojage_main.settings.$window.scrollTop();
						normY 		= boneVojage_main.settings.$window.scrollLeft();

					{ fixed: fixed, normH : normH, normY : normY, normScrollH : normScrollH, normScrollY : normScrollY }

				makeModalPosition:( element )->

					# console.time 'make position takes: '

					$el = $(element)

					norm = boneVojage_main.O.getPosition $el

					boneVojage_main.O.hideModal()

					dfr = $.Deferred()

					cnt = 0

					offset = boneVojage_main.options.offset

					boneVojage_main.settings.$tooltip.find('li').eq(boneVojage_main.settings.currPoint).addClass('active').siblings().removeClass 'active'

					boneVojage_main.settings.$body_html.stop(true,false).animate

									'scrollTop' : norm.normScrollH
									'scrollLeft': norm.normScrollY
									, (boneVojage_main.options.delay) ,()->

										
										if cnt++ is 0
											dfr.resolve()

											# make position of top part of modal
											boneVojage_main.settings.$modalTop.css 	
																					position: norm.fixed
																					height 	: ($el.offset().top - offset) - norm.normH
																					width 	: $el.outerWidth() + (offset*2) 
																					left 	: $el.offset().left - offset - norm.normY

											# make position of bottom part of modal
											boneVojage_main.settings.$modalBottom.css 
																					position: norm.fixed
																					height 	: $(document).outerHeight() - $el.offset().top  - $el.outerHeight() - offset + norm.normY
																					width 	: $el.outerWidth() + (offset*2)
																					left 	: $el.offset().left - offset - norm.normY
																					top	 	: $el.offset().top + $el.outerHeight() + (offset) - norm.normH

											# make position of bottom part of modal
											boneVojage_main.settings.$modalLeft.css
																		position: norm.fixed
																		width 	: boneVojage_main.settings.$body.outerWidth() - (boneVojage_main.settings.$body.outerWidth()-$el.offset().left) - offset - norm.normY
																		height 	: $(document).outerHeight() - norm.normH

											# make position of bottom part of modal
											boneVojage_main.settings.$modalRight.css
																		position: norm.fixed
																		left  	: ( $el.offset().left + $el.outerWidth() + offset ) - norm.normY
																		height  : $(document).outerHeight() - norm.normH
																		width  	: boneVojage_main.settings.$body.outerWidth() - ( $el.offset().left + $el.outerWidth() ) - offset

											boneVojage_main.settings.$tooltip.find('#text').text	boneVojage_main.settings.points[boneVojage_main.settings.currPoint].text

											boneVojage_main.O.addControls()

											boneVojage_main.O.makeTooltipPosition boneVojage_main.options.position, $el, offset

											# console.timeEnd 'make position takes: '

					return dfr.promise()

		# initialize boneVojage main class

		# extend defaults by options
		boneVojage_main.options = $.extend {}, boneVojage_main.options, options || {}

		boneVojage_main.constructor points