var
  _command_fn_index = {},

  _put_command_fn = function(cmd, fn) {
      if (typeof cmd === 'string') {
          _command_fn_index[cmd] = fn;

      } else if (typeof cmd === 'object') {
          for (var v in cmd) {
              _command_fn_index[v] = k[v];
          }
      }
  },

  _get_command_fn = function(cmd) {
      var fn = _command_fn_index[cmd];
      if ( !fn ) { error('Undefined command: ' + cmd); }
      return fn;
  };

