var
  _pesudo_map = {
      'text':     ['type', 'text'],
      'password': ['type', 'password'],
      'button':   ['type', 'button'],
      'file':     ['type', 'file'],
      'search':   ['type', 'search'],
      'tel':      ['type', 'tel'],
      'url':      ['type', 'url'],
      'email':    ['type', 'email'],
      'datetime': ['type', 'datetime'],
      'date':     ['type', 'date'],
      'month':    ['type', 'month'],
      'week':     ['type', 'week'],
      'time':     ['type', 'time'],
      'datetime-local': ['type', 'datetime-local'],
      'number':   ['type', 'number'],
      'range':    ['type', 'range'],
      'color':    ['type', 'color'],
      'checkbox': ['type', 'checkbox'],
      'radio':    ['type', 'radio'],
      'image':    ['type', 'image'],
      'hidden':   ['type', 'hidden'],
      'submit':   ['type', 'submit'],
      'reset':    ['type', 'reset'],
      'disabled': ['disabled', 'disabled'],
      'readonly': ['readonly', 'readonly'],
      'checked':  ['checked', 'checked']
  },

  _extend_pesudo = function(k, v1, v2) {
      if (typeof k === 'string') {
          _pesudo_map[k] = [ v1, v2 ];

      } else if (typeof k === 'object') {
          for (v1 in k) {
              _pesudo_map[v1] = k[v1];
          }
      }
  },

  _build_ctx = function(args) {
      var doc, vargs = {}, i, len = args.length, e;

      doc = window.document;

      if (args[len -1] instanceof HTMLDocument || args[len -1] === _document) {
          doc = args[len -1];
          len --;
      }
      for (i = len; i >= 0; i--) {
          e = args[i];
          vargs[i] = e;
      }
      return new _Context(doc, vargs);
  },

  _find_end_quote = function(str, quote, start) {
      var j = start || 0, l = quote.length;
      do {
          j = str.indexOf(quote, j + l);
          if (j === -1) { error('Missing end quote: ' + str); }
      } while (str.charAt(j -1) === '\\');
      return j;
  },

  _parse_string = function(str, start) {

      /** Borrowed some code from json_parse.js by crokford. */
      start = start || 0;

      var ch = str.charAt(start), at = start + 1, quote = ch, at_quote = str.indexOf(quote, at),
          hex, i, uffff, string = '',

          next = function() {
              return ch = str.charAt(at ++);
          },

          find = function() {

              if (at_quote < at) {
                  at_quote = str.indexOf(quote, at);
                  if (at_quote === -1) {
                      error('expecting end quote: ' + str);
                  }
              }
              var at0 = at, m;
              at = str.indexOf('\\', at);
              if (at === -1) {
                  at = at_quote;
              } else if ( at_quote < at) {
                  m = at_quote;
                  at_quote = str.indexOf(quote, at);
                  at = m;

                  if (at_quote === -1) {
                      error('expecting end quote: ' + str);
                  }
              }
              if (at0 !== at) {
                  string += str.slice(at0, at);
              }
              return ch = str.charAt(at++);
          },

          escapee = {
              '"':  '"',
              "'":  "'",
              '\\': '\\',
              '/':  '/',
              'b':  '\b',
              'f':  '\f',
              'n':  '\n',
              'r':  '\r',
              't':  '\t'
          };
      
      while (find()) {
          if (ch === quote) {
              return [ string, at ];
          }
          if (ch === '\\') {
              next();
              if (ch === 'u') {
                  uffff = 0;
                  for (i = 0; i < 4; i += 1) {
                      hex = parseInt(next(), 16);
                      if (!isFinite(hex)) {
                          break;
                      }
                      uffff = uffff * 16 + hex;
                  }
                  string += String.fromCharCode(uffff);
              } else if (typeof escapee[ch] === 'string') {
                  string += escapee[ch];
              } else {
                  break;
              }
          }
      }
      error('Bad string: ' + str);
  },

  _ctx_node = function(s, ctx) {
      var i = 0, j, str = s, name, val;
      j = str.search(/\s|$/);
      name = str.substring(1, j);
      node = ctx.getCtxNode(name);

      return [ node, trim_fn.call(str.substring(j)) ];
  },

  _text = function(str, ctx) {
      var j = 0, quote = str.charAt(0), group, val;

      if (str.substring(0, 3) === '"""') {
          j = _find_end_quote(str, '"""', 0);
          val = str.substring(3, j).replace(/\\"""/, '"""');
          j += 3;
      } else {
          group = _parse_string(str);
          val = group[0];
          j = group[1];
      }
      return [ ctx.createTextNode(val), trim_fn.call(str.substring(j)) ];
  },

  regx_nonblank_pos = /(?=\S)/g,

  _nonblank = function(str, start) {
      regx_nonblank_pos.lastIndex = start || 0;
      if ( !regx_nonblank_pos.exec(str) ) { return str.length; }
      return regx_nonblank_pos.lastIndex;
  },

  regx_command = /\s*!([\w-]+)/,

  regx_cmdarg = /["']|\$?([\w\.-]+)/g,

  _command = function(str, ctx) {
      var group = regx_command.exec(str), i, args = [], ch, cmd, arg, grp;

      if ( !group ) { error('Invalid command name: ' + str); }

      cmd = ctx.createCtxCommand( group[1] );

      i = group[0].length;
      while (true) {
          i = _nonblank(str, i);
          if ( i === str.length ) break;

          regx_cmdarg.lastIndex = i;
          group = regx_cmdarg.exec(str);

          if ( !group || group.index !== i ) { error('Inproper argument: ' + str.substring(i)); }

          switch ( str.charAt(i) ) {
          case '$':
              args.push( str.substring(i, regx_cmdarg.lastIndex) );
              break;

          case '"':
          case "'":
              grp = _parse_string(str, i);
              args.push( '"' + grp[0] );
              regx_cmdarg.lastIndex = grp[1];
              break;

          default:
              // it's a symbol
              args.push( ':' + group[1] );
          }

          i = regx_cmdarg.lastIndex;
      }

      cmd.setArguments(args);

      return [ cmd, null ];
  },

  regx_attr = /([\w-]+)\s*=\s*(?:["']|(?:\$([\d\.\w]+)))/g,

  _set_attrs = function(str, element, ctx) {
      var group, j = 0, name, val;
      
      while (true) {
          regx_attr.lastIndex = j;
          group = regx_attr.exec(str);
          if (!group) { return j; }
          if ( group.index !== j ) { error('Inproper attribute list: ' + str); }

          name = group[1];

          if (group[2]) {
              val = ctx.getCtxText( group[2] );
              j = regx_attr.lastIndex;
          } else {
              group = _parse_string(str, regx_attr.lastIndex -1);
              val = group[0];
              j = regx_attr.lastIndex = group[1];
          }

          element.setAttribute(name, val);

          j = _nonblank(str, j);
      }
  },

  _set_text = function(str, element, ctx) {

      var j = 0, quote = str.charAt(0), val, group;

      if (str.substring(0, 3) === '"""') {
          j = _find_end_quote(str, '"""', 0);
          val = str.substring(3, j).replace('\\"""', '"""');
          j += 3;
      } else {
          group = _parse_string(str);
          val = group[0];
          j = group[1];
      }

      element.appendChild(ctx.createTextNode(val));
      return _nonblank(str, j);
  },

  _set_ctx_text = function(str, element, ctx) {

      var quote = str.charAt(0),
          j = str.search(/\s|$/),
          name = str.substring(1, j);

      element.appendChild(ctx.getCtxTextNode(name));
      return _nonblank(str, j);
  },

  regx_element = /^\s*(\w+)(?:#([\d\w-]+))?((?:\.[\d\w-]+)*)?((?:\:[\w-]+)*)?(?:&([\d\w\.-]+))?(?:\s+([^\s]+[^\0]*)?)?$/,

  _element = function(s, ctx) {
      var group = regx_element.exec(s),
          element, ls, i, j, sub_expr, ch0;

      if (!group) { error('Incorrect element expression: '+ s); }

      element = ctx.createElement(group[1]);

      if (group[2]) {
          element.setAttribute('id', group[2]);
      }
      if (group[3]) {
          element.setAttribute('class', group[3].substring(1).replace(/\./, ' '));
      }
      if (group[5]) {
          element.setAttribute('name', group[5]);
      }
      if (group[4]) {
          ls = group[4].split(/:/);
          for (i = 1,j = ls.length; i<j; i++) {
              element.setAttribute.apply(element, _pesudo_map[ls[i]]);
          }
      }
      if (group[6]) {
          sub_expr = trim_fn.call(group[6]);
          ch0 = sub_expr.charAt(0);
          if (ch0 === '>') {
              return [element, sub_expr];
          }
          if (ch0 !== '"' && ch0 !== "'") { // attributes
              sub_expr = sub_expr.substring( _set_attrs(sub_expr, element, ctx) );
              ch0 = sub_expr.charAt(0);
          } 
          if (ch0 === '"' || ch0 === "'") { // text
              sub_expr = sub_expr.substring(_set_text(sub_expr, element, ctx));
              ch0 = sub_expr.charAt(0);
          } else if (ch0 === '$') { // or ctx_text
              sub_expr = sub_expr.substring(_set_ctx_text(sub_expr, element, ctx));
              ch0 = sub_expr.charAt(0);
          }
          if (sub_expr.length > 0) {
              if (ch0 === '>') {
                  return [element, sub_expr];
              } else {
                  error('Unkown expression: '+ sub_expr);
              }
           }
      }
      return [element, null];
  },

  _fn_idx = {
      '!': _command,
      '$': _ctx_node,
      '"': _text,
      "'": _text
  },

  _expression = function(s, ctx) {
      s = s.replace(/^\s*/, '');
      var rt, fn = _fn_idx[s.charAt(0)] || _element, e, subs;
      rt = fn(s, ctx);
      element = rt[0];
      subs = rt[1];
      if (!! subs) {
          if (subs.charAt(0) === '>') {
              element.appendChild(_expression(subs.substring(1), ctx));
          } else {
              error('Unkown expression: '+ subs);
          }
      }
      return element;
  },

  _markless = function(s) {
      var ctx = _build_ctx(arguments);
      return _expression(s, ctx);
  };

