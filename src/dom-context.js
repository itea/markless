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

  Context = function(doc, params, super_ctx) {
      this._doc = doc;
      this._params = params || {};
      this._super_ctx = super_ctx;

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

  _bulid_context = function(doc, superCtx) {
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

      appendChild: _appendChild,

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
              cmd = _get_command_fn(this.name),
              vfn;

          vfn = cmd.call(this, this._args.slice(), ctx);
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
          return this._doc.createTextNode(text);
      },

      createElement: function(nodeName) {
          return this._doc.createElement(nodeName);
      },

      createDocumentFragment: function() {
          return this._doc.createDocumentFragment();
      },

      getCtxTextNode: function(name) {
          var val = this._getParam(name);
          if (val == null) { val = ''; }
          return this.createTextNode(val.toString());
      },

      getCtxNode: function(name) {
          var val = this._getParam(name);;
          if (val == null) {
              return this.createTextNode('');
          }

          if (val.nodeType === 1 || val.nodeType === 3) {
              return val;
          }

          return this.createTextNode(val.toString());
      },

      getCtxContent: function(name) {
          return this._getParam(name);
      },

      _getParam: function(name) {
          var param = this._params[name];
          if (param === undefined && this._super_ctx) {
              param = this._super_ctx._getParam(name);
          }
          return param;
      },

      getSymbol: function(name) {
          return new Symbol(name);
      },

      newSubContext: function(params) {
          return new Context(this._doc, params, this);
      },

      toString: function() {
          return "Context";
      }

  });

