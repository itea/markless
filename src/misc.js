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
  _markless.extendPesudo = _extend_pesudo;
  _markless.buildContext = _build_context;

  _markless.debug = function() {
      _markless._pesudo_map = _pesudo_map;
      _markless._document = _document;
      _markless._Context = Context;
  };

  window.markless = _markless;

