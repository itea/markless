  if (true) {

      String.prototype.markless = function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this);
          return markless.apply(null, args);
      };

      String.prototype.markmore = function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this);
          return markmore.apply(null, args);
      };

      if (Object.defineProperty) {
          Object.defineProperty(String.prototype, 'markless', {'enumerable': false});
          Object.defineProperty(String.prototype, 'markmore', {'enumerable': false});
      }
  }

  markless.markmore = markmore;
  markless.extendPesudo = _extend_pesudo;
  markless.buildContext = _build_context;
  markless.Context = Context;

  markless.debug = function() {
      markless._pesudo_map = _pesudo_map;
      markless._document = _document;
  };

