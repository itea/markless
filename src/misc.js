var
  _templates = function(str) {
      var docFrag = _markmore(str), map = {},
          i, j, e, name, tp;

      for (i = 0, j = docFrag.childNodes.length; i < j; i++) {
          e = docFrag.childNodes[i];

          if ( e instanceof CtxCommand ) {
              name = e._args[0];
              tp = e.realize(_document)[1];
              map[name] = tp;

          } else if ( e instanceof _Node ) {
              if (tp) { tp.appendChild(e); }
          }
      }

      return map;
  };

  if (true) {

      String.prototype.markless = function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this);
          return _markless.apply(null, args);
      };

      String.prototype.markmore = function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this);
          return _markmore.apply(null, args);
      };

      if (Object.defineProperty) {
          Object.defineProperty(String.prototype, 'markless', {'enumerable': false});
          Object.defineProperty(String.prototype, 'markmore', {'enumerable': false});
      }
  }

  _markless.markmore = _markmore;
  _markless.templates = _templates;
  _markless.extendPesudo = _extend_pesudo;

  _markless.debug = function() {
      _markless._pesudo_map = _pesudo_map;
      _markless._document = _document;
      _markless._Context = Context;
  };

