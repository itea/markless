/* Markless
 * version 1.1
 * itea 2012 - 2013
 * https://github.com/itea/markless
 * MIT-LICENSE
 */
(function(window) {

var
  error = function(s) {
      throw new Error(s);
  },

  extend = function(target) {
      var e, i = 1, j = arguments.length, src;
      for (; i < j; i++) {
          src = arguments[i];
          for (e in src) target[e] = src[e];
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
      }
  },

  _build_context = function() {
      var doc, superCtx, i = 0, j = arguments.length, arg = arguments[0], attrs = {};

      if ( arg == window.document || arg instanceof HTMLDocument || arg === _document ) {
          i++;
          doc = arg;
      } else {
          doc = _document;
      }

      arg = arguments[i];
      if ( arg instanceof Context ) {
          superCtx = arg;
          i++;
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

      if ( args[len -1] == window.document
          || args[len -1] instanceof HTMLDocument
          || args[len -1] === _document ) {
          doc = args[len -1];
          len --;
      }
      for (i = len; i >= 0; i--) {
          e = args[i];
          vargs[i + 1] = e;
      }

      return new Context(doc, undefined, vargs);
  },
  
  _appendChild = function(node) {
      this.childNodes.push(node);
      node.parentNode = this;
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

  _extend_pesudo = function (k, v1, v2) {
      if (typeof k === 'string') {
          _pesudo_map[k] = [ v1, v2 ];

      } else if (typeof k === 'object') {
          for (v1 in k) {
              _pesudo_map[v1] = k[v1];
          }
      }
  },

  _find_end_quote = function (str, quote, start) {
      var j = start || 0, l = quote.length;
      do {
          j = str.indexOf(quote, j + l);
          if (j === -1) { error('Missing end quote: ' + str); }
      } while (str.charAt(j -1) === '\\');
      return j;
  },

  _parse_string = function (str, start) {

      /** Borrowed some code from json_parse.js by crokford. */
      start = start || 0;

      var ch = str.charAt(start), at = start + 1, quote = ch,
          hex, i, uffff, string = '', regx_find = /(?=[\\\n"']|$)/g,

          next = function () {
              return ch = str.charAt(at ++);
          },

          find = function () {
              var at0 = at;

              regx_find.lastIndex = at;
              regx_find.exec(str);
              at = regx_find.lastIndex;

              if (at === str.length || str.charAt(at) === '\n') {
                  error('Unexpected end of line: ' + str.substring(start) );
              }

              if (at0 !== at) {
                  string += str.substring(at0, at);
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

  _adjust_stack = function (indent, es, is) {

      var pop_num = 0, last, got = false, i, e;

      if (indent === 0) {
          pop_num = is.length;

      } else if (is.length !== 0) {
          last = is[is.length -1];

          if (last === indent ) {
              pop_num = 1;

          } else if (last.length < indent.length) { // 
              if (indent.indexOf(last) !== 0) { // incorrent indention
                  error('Incorrect indention of line');
              }
              pop_num = 0;

          } else { //last.length > indent.length
              if (last.indexOf(indent) !== 0) { // incorrent indention
                  error('Incorrect indention of line');
              }
              for (i = is.length -1; i >= 0; i--) {
                  if (indent === is[i]) {
                      pop_num = is.length - i;
                      got = true;
                      break;
                  }
              }
              if (! got) {
                  error('Incorrect indention of line');
              }
          }
      }

      while (pop_num -- > 0) {
          is.pop();
          e = es.pop();
          
          if ( ! e.parentNode ) {
              es[ es.length -1 ].appendChild( e );
          }
      }
  },

  _parse = function (input, ctx) {
  var
    status = 'line', // current status

    position = 0, // position of reading input

    position_token = 0, // position of next token

    regx_element = /^[\x20\t]*([A-Za-z]\w*)(?:#([\w-]+))?((?:\.[\w-]+)*)?((?:\:[A-Za-z_-]+)*)?(?:&([\w\.-]+))?(?=\s|$)/,

    regx_attr = /^([\w-]+)[\x20\t]*=[\x20\t]*(?:["']|(?:\$([\.\w]+(?=\s|$))))/,

    node,

    // nodes in a single line will be collected in nodeStack, until EOL
    nodeStack = [],

    lineStack = [ ctx.createDocumentFragment() ],

    indention,

    indentionStack = [],

    token,

    fn,

    _sub_expression_mark = function () {
        position = position_token +1;
        nodeStack.push(node);
        node = undefined;
        status = 'expression';
    },

    // end of file(input)
    _eof = function () {

        _adjust_stack( 0, lineStack, indentionStack );
        node = lineStack[0];
        status = 'end';
    },

    // end of line
    _eol = function () {
        var e;
        nodeStack.push(node);

        while( nodeStack.length > 1 ) {
            e = nodeStack.pop();
            nodeStack[nodeStack.length -1].appendChild(e);
        }

        lineStack.push( nodeStack.pop() );
        indentionStack.push( indention );

        if ( input.charAt(position_token) === '\n' ) position = position_token +1;
        status = 'line';
    },

    _save_indention = function () {
        indention = input.substring( position, position_token );
        _adjust_stack( indention, lineStack, indentionStack );

        position = position_token;
        status = 'expression';
    },

    actionMapping = {

    line: {
        eof: _eof,

        eol: function () {
            if ( input.charAt(position_token) === '\n' )
                position = position_token +1;
        },

        letter: _save_indention,
        quote: _save_indention,
        '$': _save_indention,

        '#': function () {
            // ignore the rest part after the comment mark
            position = input.indexOf('\n', position) + 1;
            position = position || input.length;
        }
    },

    expression: {

        eol: function () {
            var e, node = nodeStack[ nodeStack.length -1 ];

            while( nodeStack.length > 1 ) {
                e = nodeStack.pop();
                nodeStack[nodeStack.length -1].appendChild(e);
            }

            lineStack.push( nodeStack.pop() );
            indentionStack.push( indention );

            _adjust_stack( indention, lineStack, indentionStack );
            lineStack.push( node );
            indentionStack.push ( indention );

            if ( input.charAt(position_token) === '\n' ) position = position_token +1;
            status = 'line';
        },

        letter: function () {
          var str = input.substring(position_token),
              group = regx_element.exec(str),
              element;

          if ( ! group ) { error('Incorrect element expression: ' + str.substring(0, str.search(/\n|$/) ) ); }

          node = element = ctx.createElement( group[1] );

          if (group[2]) {
              element.setAttribute('id', group[2]);
          }
          if (group[3]) {
              element.setAttribute('class', group[3].substring(1).replace(/\./, ' '));
          }
          if (group[4]) {
              ls = group[4].split(/:/);
              for (i = 1,j = ls.length; i<j; i++) {
                  element.setAttribute.apply(element, _pesudo_map[ls[i]]);
              }
          }
          if (group[5]) {
              element.setAttribute('name', group[5]);
          }

          position = position_token + group[0].length;
          status = 'element';
        },

        quote: function () {
          var str = input.substring(position_token),
              j = 0, quote = str.charAt(0), group, val;

          if (str.substring(0, 3) === '"""') {
              j = _find_end_quote(str, '"""', 0);
              val = str.substring(3, j).replace(/\\"""/, '"""');
              j += 3;
          } else {
              group = _parse_string(str);
              val = group[0];
              j = group[1];
          }
          node = ctx.createTextNode(val);

          position = position_token + j;
          status = 'text';
        },

        '$': function () {
          var str = input.substring(position_token),
              i = 0, j, name, val;
          j = str.search(/\s|$/);
          name = str.substring(1, j);
          node = ctx.getCtxNode(name);

          position = position_token + j;
          status = 'context-content';
        }

    },

    element: {
        letter: function () {
          if (position === position_token)
              error('Need blankspace between 2 attributes: ' + input.substring(position) );

          var str = input.substring(position_token),
              group = regx_attr.exec(str),
              name, j;

          if ( ! group ) { error('Inproper attribute: ' + str.substring(0, str.search(/\n|$/) ) ); }

          name = group[1];

          if (group[2]) {
              val = ctx.getCtxContent( group[2] );
              j = group[0].length;
          } else {
              group = _parse_string(str, group[0].length -1);
              val = group[0];
              j = group[1];
          }

          node.setAttribute(name, val);

          position = position_token + j;
          status = 'element-attr';
        },

        '>': _sub_expression_mark,
        eof: _eol,
        eol: _eol
    },

    'element-attr': {
        quote: function () {
          var str = input.substring(position_token),
              j = 0, quote = str.charAt(0), val, group;

          if (str.substring(0, 3) === '"""') {
              j = _find_end_quote(str, '"""', 0);
              val = str.substring(3, j).replace('\\"""', '"""');
              j += 3;
          } else {
              group = _parse_string(str);
              val = group[0];
              j = group[1];
          }

          node.appendChild(ctx.createTextNode(val));

          position = position_token + j;
          status = 'element-text';
        },

        '>': _sub_expression_mark,
        eof: _eol,
        eol: _eol
    },

    'text': {
        '>': _sub_expression_mark,
        eof: _eol,
        eol: _eol
    },

    'context-content': {
        '>': _sub_expression_mark,
        eof: _eol,
        eol: _eol
    },

    'element-text': {
        '>': _sub_expression_mark,
        eof: _eol,
        eol: _eol
    }

    },
    
    regx_recotoken = /(?=[\S\n]|$)/g,

    reco_token = function () {
        regx_recotoken.lastIndex = position;
        regx_recotoken.exec(input);

        if ( regx_recotoken.lastIndex === input.length ) return 'eof';

        position_token = regx_recotoken.lastIndex;
        var ch = input.charAt(position_token);

        switch (ch) {
        case '\n': return 'eol';

        case '>':
        case '#':
        case '$':
            return ch;

        case '"':
        case "'":
            return 'quote';

        default:
            return 'letter';
        }
    };

    actionMapping.element.quote = actionMapping['element-attr'].quote;
    actionMapping['element-attr'].letter = actionMapping['element'].letter;

    while (status !== 'end') {
        token = reco_token();
        fn = actionMapping[status][token];

        if ( ! fn ) { error('Unexpected input: ' + input.substring(position_token)); }
        fn();
    }

    return node.childNodes.length === 1 ?  node.childNodes[0] : node;
  },

  _build_ctx = function (args) {
      if (args[1] instanceof Context) {
          return args[1];
      }

      var doc, vargs = {}, i, len = args.length, e;

      doc = window.document;

      if ( args[len -1] == window.document
          || args[len -1] instanceof HTMLDocument
          || args[len -1] === _document ) {
          doc = args[len -1];
          len --;
      }
      for (i = len; i >= 0; i--) {
          e = args[i];
          vargs[i] = e;
      }
      return _build_context(doc, vargs);
  },

  markless = function (str, ctx) {
      ctx = _build_ctx(arguments);
      return _parse(str, ctx);
  },

  markmore = function (str, ctx) {
      ctx = ctx || _build_context(_document);
      return _parse(str, ctx);
  };

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
  markless.mix = mix;
  markless.extendPesudo = _extend_pesudo;
  markless.buildContext = _build_context;
  markless.Context = Context;

  markless.debug = function() {
      markless._pesudo_map = _pesudo_map;
      markless._document = _document;
  };

  window.markless = markless;

})(window);

