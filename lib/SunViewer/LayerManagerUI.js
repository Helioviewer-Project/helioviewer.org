/**
 * @author Keith Hughitt     keith.hughitt@gmail.com
 */
/**
 * @class LayerManagerUI A UI Component for managing layers.
 * @see   LayerManager
/*global Class, document, $ */
var LayerManagerUI = Class.create();

LayerManagerUI.prototype = {
    /**
     * @constructor
     */
    initialize: function (htmlContainer){
        this.className = "layerManagerUI";
        this.container = $(htmlContainer);
        
        // Call methods to construct initial layer manager menu
        this.createMenu();
        this.initEvents();
    },
    
    createMenu: function (){
        //toggleButton
        this.toggleButton = Builder.node('a', {'href': '#', className: 'gray'}, 'Layers');
        this.container.appendChild(this.toggleButton);
        
        //Hidable menu
        this.menuContainer = Builder.node ('div', {style: 'display: none'});
        this.container.appendChild(this.menuContainer);
        
        this.menu  = Builder.node ('div', {id: 'layerManager-Menu', style: 'width:100%; height:95%; background-color:white'}, 'menu');
        this.menuContainer.appendChild(this.menu);
        
        //Menu table
        this.menuTable = Builder.node ('table', {id: 'layerManager-Menu-Table', width: '100%',cellpadding: '2',cellspacing: '0',border: '0'});
        var tbody =      Builder.node('tbody');
        var th =         Builder.node('th');

        tbody.appendChild(th);
        this.menuTable.appendChild(tbody);
    },
    
    /**
     * @method initEvents
     */
    initEvents: function (){
        Event.observe(this.toggleButton, 'click', this.onToggleButtonClick.bindAsEventListener(this));      
    },
    
    /**
     * onHeaderClick
     */
     onToggleButtonClick: function (){
         Effect.toggle(this.menuContainer, 'slide', {duration:0.4});
     }
};

/**
 * Functions to include:
 *  - 
 *  - AdLayer
 *  - RemoveLayer
 * 
 */
