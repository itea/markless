var
  _Node = function() {},

  _Element = function(nodeName) {
      this.nodeName = nodeName;
      this._need_normalize = false;
      this._attrs = {};
      this._children = [];
  },

  _TextNode = function(text) { this.nodeValue = text; },

  _DocumentFragment = function() {
      this._elements = [];
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
  
  _CtxNode = function(vname) {
      this.vname = vname;
  },

  _CtxTextNode = function(vname) {
      this.vname = vname;
  },

  _CtxText = function(vname) {
      this.vname = vname;
  },

  _CtxCommand = function(name) {
      this.name = name;
      this._args = [];
      this._children = [];
  },

  _Context = function(doc, args) {
      this._doc = doc;
      this._args = args;

      if (doc === _document) {
          
          this.getCtxNode = function(name) {
              return new _CtxNode(name);
          };

          this.getCtxTextNode = function(name) {
              return new _CtxTextNode(name);
          };

          this.getCtxText = function(name) {
              return new _CtxText(name);
          };

          this.createCtxCommand = function(name) {
              return new _Command(name);
          };
      }
  },
  
  _build_realize_ctx = function(args) {
      if (args[0] instanceof _Context) {
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
      return new _Context(doc, vargs);
  };

  extend(_Node.prototype, {});

  _Element.prototype = extend(new _Node(), {
      nodeType: 1,

      setAttribute: function(name, value) {
          this._attrs[name] = value;
      },

      appendChild: function(node) {
          this._children.push(node);
      },

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

          children = this._children;
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
          this._elements.push(node);
      },

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments),
              e, i, j, element = ctx.createDocumentFragment(),
              elements;

          elements = this._elements;
          for (i = 0, j = elements.length; i < j; i++) {
              element.appendChild(elements[i].realize(ctx));
          }

          return element;
      }
  });

  _CtxNode.prototype = extend(new _Node(), {
      nodeType: 81,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxNode(this.vname);
      }
  });

  _CtxTextNode.prototype = extend(new _Node(), {
      nodeType: 82,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxTextNode(this.vname);
      }
  });

  _CtxText.prototype = extend(new _Node(), {
      nodeType: 83,

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxText(this.vname);
      }
  });

  _CtxCommand.prototype = extend(new _Node(), {
      nodeType: 84,

      appendChild: function(node) {
          this._children.push(node);
      },

      realize: function(ctx) {
          var ctx = _build_realize_ctx(arguments);
          return ctx.getCtxText(this.vname);
      },

      setArguments: function(args) {
          this._args = args.slice();
      }
  });

  extend(_Context.prototype, {
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
          var val = this._args[name];
          if (val == null) { val = ''; }
          return this.createTextNode(val.toString());
      },

      getCtxNode: function(name) {
          var val = this._args[name];
          if (val == null) {
              return this.createTextNode('');
          }

          if (val.nodeType === 1 || val.nodeType === 3) {
              return val;
          }

          return this.createTextNode(val.toString());
      },

      getCtxText: function(name) {
          return this._args[name];
      }
  });

