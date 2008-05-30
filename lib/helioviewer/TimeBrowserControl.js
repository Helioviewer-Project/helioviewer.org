/*global Class, UIElement, $, $H, $A, Ajax, Event, Effect, document */
var TimeBrowserControl = Class.create(UIElement, {
    toggling: false,
    numDays: 5,
    minHeight: 55,

    initialize: function (elementId, viewport) {
        this.domNode = $(elementId);
        this.descriptionsDomNode = $(elementId + 'Descriptions');
        this.leftDomNode = $(elementId + 'Left');
        this.rightDomNode = $(elementId + 'Right');
        //this.spacerDomNode = $(elementId + 'Spacer');
        //this.separateTimeLinesDomNode = $(elementId + 'SeparateTimeLines');
        this.toggleDomNode = $(elementId + 'Toggle');
        this.viewport = viewport;
        Event.observe(elementId + 'Toggle', 'click', this.toggle.bindAsEventListener(this));
        
        var url = TimeBrowserControl.descriptionHtmlUrl(this.viewport.sources.events);
        var trash = new Ajax.Updater(this.descriptionsDomNode, url);
        this.resetDayElements();
    },
    
    resetDayElements: function () {
        if (!this.dayElements) {
            this.dayElements = $A([]);
        }
        var max = Math.max(this.dayElements.length, this.numDays + 2);
        for (var i = 0; i < max; i++) {
            var d = i - (this.numDays + 1) / 2;
            var p = Math.round(100 / this.numDays);
            var w = ( (i === this.numDays - 1) ? (100 - p * (this.numDays - 1)) : p);
            var date = new Date(this.viewport.controller.date.getTime() + d*24*60*60*1000);

            if (i >= this.numDays) {
                if (this.dayElements[i] && this.dayElements[i].parentNode) {
                	this.dayElements[i].remove();
                }
                delete this.dayElements[i];
            }
            if (i >= this.dayElements.length) {
                this.dayElements[i] = this.addDayElement(date, (d === 0));
            }
            this.dayElements[i].setStyle({
                width: w + '%',
                left: p * (i-1) + '%'
            });
			//this.dayElements[i].date;
            //this.dayElements[i].innerHTML = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
        }
        this.dayElements.length = this.numDays;
    },
    
    addDayElement: function (date, active) {
        var newDayElement = $(document.createElement('div'));
        newDayElement.addClassName('timeLineDay');
        if (active) {
        	newDayElement.addClassName('activeDay');
        }
        newDayElement.innerHTML = date.getUTCFullYear() + '-' + (date.getUTCMonth()+1) + '-' + date.getUTCDate();
        var url = TimeBrowserControl.dayHtmlUrl(this.viewport.controller.sources.events, date);
        
//$('output').innerHTML += date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + '=> ' + url + '\n'; 

        var trash = new Ajax.Updater(newDayElement, url);
        
        return this.rightDomNode.appendChild(newDayElement);
    },
    
    toggle: function (e) {
        if (this.toggling) {
        	return;
        }
        
        var moveUp = (this.rightDomNode.getHeight() > this.minHeight);
        var before = function () {
        	this.toggling = true;
       	};
        var after = function () {
            this.toggling = false;
            $(this.toggleDomNode).firstDescendant().src = (moveUp ? TimeBrowserControl.img.down : TimeBrowserControl.img.up);
        };
        
        var parameters = {
            duration: 0.5,
            beforeStart: before.bind(this),
            afterFinish: after.bind(this) 
        };
        
        var trash = null;
        
        if (moveUp) {
            //new Effect.BlindUp(this.spacerDomNode, parameters);
            parameters.style = { height: this.minHeight + 'px' };
            trash = new Effect.Parallel(
                [ trash = new Effect.Morph(this.leftDomNode, parameters),
                    trash = new Effect.Morph(this.rightDomNode, parameters) ],
                parameters
            );
        } else {
            parameters.style = { height: this.minHeight + this.descriptionsDomNode.getHeight() + 10 + 'px' };
//            new Effect.Morph(this.rightDomNode, { style: { height: 42 + this.descriptionsDomNode.getHeight() + 'px' } });
            //this.spacerDomNode.setStyle({ height: this.descriptionsDomNode.getHeight() + 'px' });
            //new Effect.BlindDown(this.spacerDomNode, parameters);
            trash = new Effect.Parallel(
                [ trash = new Effect.Morph(this.leftDomNode, parameters),
                    trash = new Effect.Morph(this.rightDomNode, parameters) ],
                parameters
            );
        }

        Event.stop(e);
    }
});

Object.extend(TimeBrowserControl, {
    img: { down: 'images/TimeBrowser/down.gif', up: 'images/TimeBrowser/up.gif' },
    dayHtmlPrefix: 'timeBrowser.php?action=getDayHtml',
    descriptionHtmlPrefix: 'timeBrowser.php?action=getDescriptionHtml',

    descriptionHtmlUrl: function( srcs) {
    var str = TimeBrowserControl.descriptionHtmlPrefix;
    var i = 0;
    $H(srcs).each(function (pair) {
      str += '&src[' + i++ + ']=' + pair.key;
    });
    
    return str;
  },

  dayHtmlUrl: function (srcs, date) {
    var str = TimeBrowserControl.dayHtmlPrefix;
    var i = 0;
    $H(srcs).each(function (pair) {
      str += '&src[' + i++ + ']=' + pair.key;
    });
        
    str += '&date=' + (date.getTime() / 1000); 
    
    return str;
  }
});