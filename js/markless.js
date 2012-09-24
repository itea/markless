/* Markless
 * version 1.0
 * itea 2012
 * https://github.com/itea/markless
 * MIT-LICENSE
 */
(function(window) {

var
  trim_fn = String.prototype.trim || function() { return this.replace(/^\s*|\s*$/, ''); },

  error = function(s) {
      throw new Error(s);
  },

  extend = function(target, src) {
      for (var e in src) {
          target[e] = src[e];
      }
      return target;
  };

var
  _Node = function() {},

  _Element = function(nodeName) {
      this.nodeName = nodeName;
      this._need_normalize = false;
      this._attrs = {};
      this.childNodes = [];
  },

  _TextNode = function(text) {
      this.nodeValue = text;
  },

  _DocumentFragment = function() {
      this.childNodes = [];
  },

  _document = {
      createTextNode: function(text) {
          return new _TextNode(text);
      },

      createElement: function(nodeName) {
          return new _Element(nodeName);
      },

      createDocumentFragment: function() {
          return new _DocumentFragment();
      }
  },
  
  CtxNode = function(name) {
      this.name = name;
  },

  CtxTextNode = function(name) {
      this.name = name;
  },

  CtxContent = function(name) {
      this.name = name;
  },

  CtxCommand = function(name) {
      this.name = name;
      this._args = [];
      this.childNodes = [];
  },

  Context = function(doc, superCtx, params) {
      this.doc = doc;
      this.attrs = params || {};
      this.superCtx = superCtx;

      if (doc === _document) {
          
          this.getCtxNode = function(name) {
              return new CtxNode(name);
          };

          this.getCtxTextNode = function(name) {
              return new CtxTextNode(name);
          };

          this.getCtxContent = function(name) {
              return new CtxContent(name);
          };

          this.createCtxCommand = function(name) {
              return new CtxCommand(name);
          };
      }
  },

  _build_context = function(doc, superCtx) {
      var i = 0, j = arguments.length, arg = arguments[0], attrs = {};

      if ( arg instanceof HTMLDocument || arg === _document ) {
          i++;
      } else {
          doc = _document;
      }

      arg = arguments[i];
      if ( arg instanceof Context ) {
          superCtx = arg;
          i++;
      } else {
          superCtx = undefined;
      }

      for (; i < j; i++) {
          arg = arguments[i];
          extend(attrs, arg);
      }

      return new Context(doc, superCtx, attrs);
  },
  
  _build_realize_ctx = function(args) {
      if (args[0] instanceof Context) {
          return args[0];
      }

      var doc = window.document, vargs = {}, i, len = args.length, e;

      if (args[len -1] instanceof HTMLDocument || args[len -1] === _document) {
          doc = args[len -1];
          len --;
      }
      for (i = len; i >= 0; i--) {
          e = args[i];
          vargs[i + 1] = e;
      }

      return new Context(doc, vargs);
  },
  
  _appendChild = function(node) {
      this.childNodes.push(node);
      node.parent = this;
  };

  extend(_Node.prototype, {});

  _Element.prototype = extend(new _Node(), {
      nodeType: 1,

      setAttribute: function(name, value) {
          this._attrs[name] = value;
      },

      appendChild: _appendChild,

      normalize: function() {
          this._need_normalize = true;
      },

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments),
              e, i, j, element = ctx.createElement(this.nodeName),
              children;

          for (e in this._attrs) {
              element.setAttribute(e, this._attrs[e]);
          }

          children = this.childNodes;
          for (i = 0, j = children.length; i < j; i++) {
              element.appendChild(children[i].realize(ctx));
          }

          this._need_normalize && element.normalize();
          
          return element;
      }
  });

  _TextNode.prototype = extend(new _Node(), {
      nodeType: 3,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.createTextNode(this.nodeValue);
      }
  });

  _DocumentFragment.prototype = extend(new _Node(), {
      nodeType: 11,

      appendChild: function(node) {
          if ( node instanceof _DocumentFragment ) {
              var i = 0, j = node.childNodes.length;
              for (; i < j; i++) {
                  this.childNodes.push(node.childNodes[i]);
              }
          } else {
              this.childNodes.push(node);
          }
      },

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments),
              e, i, j, element = ctx.createDocumentFragment(),
              elements;

          elements = this.childNodes;
          for (i = 0, j = elements.length; i < j; i++) {
              element.appendChild(elements[i].realize(ctx));
          }

          return element;
      }
  });

  CtxNode.prototype = extend(new _Node(), {
      nodeType: 81,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxNode(this.name);
      }
  });

  CtxTextNode.prototype = extend(new _Node(), {
      nodeType: 82,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxTextNode(this.name);
      }
  });

  CtxContent.prototype = extend(new _Node(), {
      nodeType: 83,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxContent(this.name);
      }
  });

  CtxCommand.prototype = extend(new _Node(), {
      nodeType: 84,

      appendChild: _appendChild,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments),
              cmdfn = _get_command_fn(this.name),
              vfn;

          vfn = cmdfn.call(this, this._args.slice(), ctx);
          return vfn;
      },

      appendArgument: function(arg) {
          this._args.push(arg);
      },

      setArguments: function(args) {
          this._args = args.slice();
      }
  });

  extend(Context.prototype, {
      createTextNode: function(text) {
          return this.doc.createTextNode(text);
      },

      createElement: function(nodeName) {
          return this.doc.createElement(nodeName);
      },

      createDocumentFragment: function() {
          return this.doc.createDocumentFragment();
      },

      getCtxTextNode: function(name) {
          var val = this.getAttr(name);
          if (val == null) { val = ''; }
          return this.createTextNode(val.toString());
      },

      getCtxNode: function(name) {
          var val = this.getAttr(name);;
          if (val == null) {
              return this.createTextNode('');
          }

          if (val.nodeType === 1 || val.nodeType === 3) {
              return val;
          }

          return this.createTextNode(val.toString());
      },

      getCtxContent: function(name) {
          return this.getAttr(name);
      },

      getAttribute: function(name) {
          return this.attrs[name];
      },

      setAttribute: function(name, value) {
          this.attrs[name] = value;
      },

      removeAttribute: function(name, value) {
          delete this.attrs[name];
      },

      getAttr: function(name) {
          var param = this.attrs[name];
          if (param === undefined && this.superCtx) {
              param = this.superCtx.getAttr(name);
          }
          return param;
      },

      getSymbol: function(name) {
          return new Symbol(name);
      },

      toString: function() {
          return "Context";
      }

  });

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

  _expression = (function() {

  var
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

    regx_cmdarg = /["'>]|\$?([\w\.-]+)/g,

    _command = function(str, ctx) {
        var group = regx_command.exec(str), i, ch, cmd, arg, grp;

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
            case '>':
                // sub expression
                return [ cmd, str.substring(i) ];

            case '$':
                arg = ctx.getCtxContent(group[1]);
                break;

            case '"':
            case "'":
                grp = _parse_string(str, i);
                arg = grp[0];
                regx_cmdarg.lastIndex = grp[1];
                break;

            default:
                // it's a symbol
                arg = ctx.getSymbol(group[1]);
            }

            i = regx_cmdarg.lastIndex;
            cmd.appendArgument(arg);
        }

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
                val = ctx.getCtxContent( group[2] );
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

    _expression = function(str, ctx) {
        str = str.replace(/^\s*/, '');
        var rt, fn = _fn_idx[str.charAt(0)] || _element, subs, node;
        rt = fn(str, ctx);
        node = rt[0];
        subs = rt[1];
        if (!! subs) {
            if (subs.charAt(0) === '>') {
                node.appendChild(_expression(subs.substring(1), ctx));
            } else {
                error('Unkown expression: '+ subs);
            }
        }
        return node;
    };

    return _expression;

  })(),

  _more_expression = (function(_expression) {

  var
    _addjust_stack = function(indent, es, is) {

        var pop_num = 0, last, got = false, i;

        if (indent === 0) {
            pop_num = is.length;

        } else if (is.length !== 0) {
            last = is[is.length -1];

            if (last === indent ) {
                pop_num = 1;

            } else if (last.length < indent.length) { // 
                if (indent.indexOf(last) !== 0) { // incorrent indention
                    error('Incorret indention of line: '+ s);
                }
                pop_num = 0;

            } else { //last.length > indent.length
                if (last.indexOf(indent) !== 0) { // incorrent indention
                    error('Incorret indention of line: '+ s);
                }
                for (i = is.length -1; i >= 0; i--) {
                    if (indent === is[i]) {
                        pop_num = is.length - i;
                        got = true;
                        break;
                    }
                }
                if (! got) {
                    error('Incorret indention of line: '+ s);
                }
            }
        }

        while (pop_num -- > 0) {
            is.pop();
            es.pop();
        }
    },

    _line_mode_0 = function(s, ctx, es, is, mode) {
        var indent = s.substring(0, s.search(/[^ \t]/)),
            element = _expression(s, ctx);

        _addjust_stack(indent, es, is);
        es[es.length -1].appendChild(element);

        es.push(element);
        is.push(indent);

        return mode;
    },

    _line_mode_1 = function(s, ctx, es, is, mode) {
        var text_node = ctx.createTextNode(s.replace(/\\"""/, '"""') + '\n');
        es[es.length -1].appendChild(text_node);
        return mode;
    },

    r_line_comment = /^\s*(#[^\n]*)?$/,

    r_leading_block_quote_line = /^(\s*)"""([^\n]*)$/,

    _line_fn_0 = function(s, ctx, es, is, mode) {
        var group;
        if (r_line_comment.exec(s)) return mode;

        if (group = r_leading_block_quote_line.exec(s)) {
            var str = group[2],
                indent = group[1],
                i = str.indexOf('"""');
            while(str.charAt(i -1) === '\\') { i = str.indexOf('"""', i +3); }
            
            if (i < 0) { // switch to mode 1
                _addjust_stack(indent, es, is);
                return _line_mode_1(str, ctx, es, is, 1);

            } else if (trim_fn.call(str.substring(i + 3)).length > 0) {
                error('Unexpected content: '+ str.substring(3));
            }

            return _line_mode_1(str.substring(0, i), ctx, es, is, 0);
        } else
            return _line_mode_0(s, ctx, es, is, mode);
    },

    _line_fn_1 = function(s, ctx, es, is, mode) {
        var i = s.indexOf('"""');
        while(s.charAt(i -1) === '\\') { i = s.indexOf('"""', i +3); }

        if (i > -1) { // switch back to mode 0
            if (trim_fn.call(s.substring(i + 3)).length > 0) {
                error('Unexpected content: '+ s.substring(3));
            }
            _line_mode_1(s.substring(0, i), ctx, es, is, 0);
            es[es.length -1].normalize();
            return 0;
        }
        return _line_mode_1(s, ctx, es, is, mode);
    },

    _line_fn_idx = [ _line_fn_0, _line_fn_1 ],

    _more_expression = function(str, ctx) {
        var lines = str.split('\n'),
            element_stack = [ fragment = ctx.createDocumentFragment() ],
            indention_stack = [],
            i, j, mode = 0;
        /* OK, What is mode?
         * While _line is dealing with signle line, it cannot sperates expression from text.
         * So, for mode = 0, it's expression mode; mode = 1, text mode.
         * When _line meets a line with leading block string quote (""") in expression mode,
         * it switches to text mode(1);
         * when _line_expr meet a line with tailing block string quote (""") in text mode,
         * it switches back to expression mode(0).
         */
        for (i = 0, j = lines.length; i<j; i++ ) {
            mode = _line_fn_idx[mode](lines[i], ctx, element_stack, indention_stack, mode);
        }

        return element_stack[0].childNodes.length === 1 ?
            element_stack[0].childNodes[0] : element_stack[0];
    };

    return _more_expression;
  })(_expression),

  _build_ctx = function(args) {
      if (args[1] instanceof Context) {
          return args[1];
      }

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
      return new Context(doc, vargs);
  },

  _markless = function(str, ctx) {
      ctx = _build_ctx(arguments);
      return (str.indexOf("\n") > -1 ? _more_expression : _expression)(str, ctx);
  },

  _markmore = function(str, ctx) {
      ctx = ctx || _build_context(_document);
      return (str.indexOf("\n") > -1 ? _more_expression : _expression)(str, ctx);
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
  _markless.extendPesudo = _extend_pesudo;
  _markless.buildContext = _build_context;

  _markless.debug = function() {
      _markless._pesudo_map = _pesudo_map;
      _markless._document = _document;
      _markless._Context = Context;
  };

  window.markless = _markless;

})(window);

