var
  _command_fn_index = {},

  _put_command_fn = function(cmd, fn) {
      if (typeof cmd === 'string') {
          _command_fn_index[cmd] = fn;

      } else if (typeof cmd === 'object') {
          for (var v in cmd) {
              _command_fn_index[v] = cmd[v];
          }
      }
  },

  _get_command_fn = function(cmd) {
      var fn = _command_fn_index[cmd];
      if ( !fn ) { error('Undefined command: ' + cmd); }
      return fn;
  },

  _asset_args = function(types, args) {
      if ( ! types instanceof Array ) {
          types = types.split(/\s+/);
      }

      var i, j, e, arg;
      for (i = 0, j = types.length; i < j; i++) {
          e = types[i];
          arg = args[i];

          switch(e) {
          case 'S': // Symbol
              if ( ! arg instanceof Symbol ) return false;
              break;

          case 's': // String
              if ( ! typeof arg === 'string' ) return false;
              break;

          case 'C': // CtxContent
              if ( ! arg instanceof CtxContent ) return false;
              break;
          }
      }

      return true;
  },
  
  Symbol = function(name) {
      this.name = name;
  };

  Symbol.prototype.toString = function() {
      return this.name;
  };

  _put_command_fn({

  'forEach': function(args, ctx) {
      if ( ! _asset_args('S S C', args) ) error('Inproper arguments: ' + args);

      var symbol = args[0],
          iter = args[2].realize(ctx),
          i, j, c, e, f, newCtx, docFrag = ctx.createDocumentFragment();

      for ( e in iter) {
          c = {};
          c[symbol.name] = iter[e];
          newCtx = _build_context(ctx, c);

          for (i = 0, j = this.childNodes.length; i < j; i++) {
              f = this.childNodes[i];
              docFrag.appendChild( f.realize(newCtx) );
          }
      }

      return docFrag;
  }

  });
