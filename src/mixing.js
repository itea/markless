  var

  _args = function (_arguments) {
      var i = 0, j = _arguments.length, args = [];
      for (; i< j; i++) args.push( _arguments[i] );
      return args;
  },

  mix = function () {
      var view, initfn, extendx = [], i = 0, j = arguments.length, e;

      if (typeof arguments[0] === "string" || arguments[0] == null) {
          view = arguments[ i++ ];
      }

      if (i < j && (typeof arguments[i] === "function" || arguments[i] == null)) {
          initfn = arguments[ i++ ];
      }
      
      while (i < j) {
          e = arguments[ i++ ];
          if ( !e ) continue;
          if ( typeof e === "object" ) extendx.push(e);
      }

      if (typeof arguments[ j -1 ] === "function" && ! initfn)
          initfn = arguments[ j -1 ];

      return mixing(view, initfn, extendx);
  },

  mixing = function (view, initfn, extendx) {
      var Mixed = function () {
          var node, initval;

          /* if Mixed.view is a blank string, markless returns a DocumentFragment.
             if Mixed.view is null/undefined, node is undefined. */
          if (Mixed.view != null && typeof Mixed.view === "string") node = markless(Mixed.view);

          if ( this instanceof Mixed ) { // new instance of Mixed, constructor invokement
              this.node = node;
              if (node) node._mix = this;

          } else { // function invoke
              /* for function invoke, if node is undefined/null, create a DocumentFragment for it. */
              if (!node) node = document.createDocumentFragment();

              /* make _mix and node property point to node itself,
               * so that extended methods is usable for both function invokement
               * and constructor invokement. */
              node._mix = node.node = node;
              extend.apply( null, [node].concat(extendx) );
          }
          
          if (Mixed.initfn) initval = Mixed.initfn.apply( node || this, _args(arguments) );
          
          if (initval != null) return initval;
          if (node) return node;
      };

      Mixed.view = view;
      Mixed.initfn = initfn;

      if (extendx && extendx.length > 0) {
          extend.apply( null, [Mixed.prototype].concat(extendx) );
      }
      return Mixed;
  };

