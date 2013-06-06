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

      if ( arg instanceof HTMLDocument || arg === _document ) {
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

      if (args[len -1] instanceof HTMLDocument || args[len -1] === _document) {
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

