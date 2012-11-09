define(['zoe', './zest-render'], function(zoe, $z) {
  
  // it is the use of component that adds zoe
  zoe.extend($z, zoe);
  
  /*
   * Component
   * Creates a component with rendering or as attach-only
   *
   * The component is entirely rendered by $z.render.
   *
   * Attachment::
   *
   * Attachment is triggered when a "$$" element array options parameter is provided to the constructor.
   * This is the consecutive DOM elements currently definining the rendered widget to attach.
   *
   * Attachment::
   *
   * Components attach based on the options.attach specification.
   *
   * Example:
   *
   *  options.attach = {
   *    Component: '#[component]$', //dollar sign indicates only finding components directly inside this region
   *    $element: '#an-element',
   *    region: '.a-region'
   *  }
   *
   * If there is more than one match, an error is thrown.
   *
   * The DOM element being attached is then checked to see if it is a component or dynamic region
   * (featuring a 'component' or 'region' attribute)
   * If it is a component, it is attached from its $z property
   * If it is a region, it is dynamically built from the region wrapper.
   *
   * The notation of $element, region (small letter) and Component (capital) is a highly recommended convention.
   * There is no consequence for failing to follow this though.
   *
   *
   * Disposal::
   *
   * The dispose method is automatically appended with functionality to remove the
   * html elements generated by the template from the DOM.
   *
   * If the component adds any other DOM elements, it must include their removal
   * in a dispose hook.
   *
   * *More importantly, ALL events registered by the component should be manuallly
   * removed by a dispose method.
   *
   * Suggested syntax (with jQuery as an example):
   *
   * functionInstances: ['click'], //ensures that the click event is bound to this and unique to this
   * construct: function() {
   *   this.$el.click(this.click);
   *   this.dispose.on(function() {
   *     this.$el.unbind('click', this.click);
   *   });
   * }
   * 
   * This is very important for removing memory leaks.
   * 
   *
   * NB Never use a pre-constructor override with the Create functionality. This could
   *    interfere with having all creation logic handled by the template and structure
   *    methods.
   *
   */
  
  var dynamic = false;
  $z.fn.STOP_FIRST_DEFINED = function(self, args, fns) {
    var output = fns[0].apply(self, args);
    if (output !== 'undefined')
      return;
    for (var i = 1; i < fns.length; i++)
      fns[i].apply(self, args);
  }
  var Component = {
    
    _implement: [$z.Constructor],
    
    _extend: {
      type: 'REPLACE',
      pipe: 'CHAIN',
      load: $z.extend.makeChain($z.fn.ASYNC),
      template: 'REPLACE',
      options: 'APPEND',
      css: function STR_FUNC_APPEND(a, b) {
        if (a === undefined)
          return b;
        
        var funcify = function(str) {
          return function() {
            return str;
          }
        }
        if (typeof a != 'function' && typeof b != 'function')
          return a + b;
        
        
        if (typeof a == 'string')
          a = funcify(a);
        if (typeof b == 'string')
          b = funcify(b);
          
        if (!a.run) {
          var _a = a;
          a = $z.fn($z.fn.executeReduce('', function(a, b) {
            return a + b;
          }));
          a.on(_a);
        }
        
        a.on(b);
      },
      attachExclusions: 'ARR_APPEND',
      attachInclusions: 'ARR_APPEND',
      'prototype.dispose': $z.extend.makeChain($z.fn.STOP_FIRST_DEFINED)
    },
    
    attach: function($$, options) {
      options.$$ = $$;
      return new this(options);
    },
    
    _make: function() {
      dynamic = false;
    },
    _integrate: function(def) {
      if (dynamic)
        return;
  
      if (def.construct || def.dynamic === true)
        dynamic = true;
        
      if (def.prototype)
        for (p in def.prototype) {
          dynamic = true;
          return;
        }
    },
    _built: function() {
      if (!dynamic)
        delete this.attach;
    },
    
    construct: function(options) {
      if (!options.$$)
        return $z.render(this.constructor, options, document.createDocumentFragment());
      
      this.id = options.id;
      this.type = options.type;
      this.$$ = options.$$;
      delete options.$$;
      
      $z._components[this.$$[0].$zid] = this;
      
      this.o = options;
    },
    prototype: {
      $: $z.$,
      $z: $z.$z,
      _unbind: true,
      dispose: function(system) {
        //cut out and call $z.dispose to do the work, it will call this back with the system flag
        //basically, $z.dispose(el) is the right method.
        //   component.dispose(true) does 'extra' disposal.
        //   everything else is in $z.dispose, hence we revert to it by convenience
        if (!system) {
          $z.dispose(this.$$);
          return true;
        }
        
        //automatically unbind jquery events on the elements
        if (this._unbind && $.fn && $.fn.jquery)
          this.$('*').unbind();
          
        delete this.$$;
      }
    }
  };

  if (typeof window === 'undefined')
    Component.construct = function() {
      throw 'Components are not designed to be constructed on the server! Use $z.render instead.';
    }
  
  return Component;
});