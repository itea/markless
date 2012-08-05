// markless
// itea 2012-07-30
//
var markless = (function() {
  var _trim = String.prototype.trim || function() { return this.replace(/^\s*|\s*$/, ''); };
  var trim = function(s) { return _trim.call(s); };
  var transfor = function(s) {
      return (new Function('return "'+ s.replace(/\n/g, '\\n') + '"'))();
  };
  var smap = {
      'text': ['type', 'text'],
      'password': ['type', 'password'],
      'button': ['type', 'button'],
      'file': ['type', 'file'],
      'search': ['type', 'search'],
      'tel': ['type', 'tel'],
      'url': ['type', 'url'],
      'email': ['type', 'email'],
      'datetime': ['type', 'datetime'],
      'date': ['type', 'date'],
      'month': ['type', 'month'],
      'week': ['type', 'week'],
      'time': ['type', 'time'],
      'datetime-local': ['type', 'datetime-local'],
      'number': ['type', 'number'],
      'range': ['type', 'range'],
      'color': ['type', 'color'],
      'checkbox': ['type', 'checkbox'],
      'radio': ['type', 'radio'],
      'image': ['type', 'image'],
      'hidden': ['type', 'hidden'],
      'submit': ['type', 'submit'],
      'disabled': ['disabled', 'disabled'],
      'readonly': ['readonly', 'readonly'],
      'checked': ['checked', 'checked']
  };

  var _ctx_node = function(s, ctx) {
      if (s[0] !== '$') { throw new Error('not a context Node variable format'); }
      var i = 0, j, str = s, quote = s[0], name, v;
      j = str.search(/\s|$/);
      name = str.substring(1, j);
      v = ctx[name];
      if (v == null) return [document.createTextNode(''), trim(str.substring(j))];
      else if (v instanceof HTMLElement) return [v, trim(str.substring(j))];
      else return [document.createTextNode(v.toString()), trim(str.substring(j))];
  };
  var _text = function(s, ctx) {
      var i = 0, j, str = s, quote = s[0], group;
      if (group = /^\s*"""([^\0]+)"""\s*$/.exec(s)) {
          return [document.createTextNode(group[1]), ''];
      }
      j = str.indexOf(quote, i +1);
      if (j === -1) { throw new Error('expected end quote not found: '+ quote); }

      while (str[j -1] === '\\') { j = str.indexOf(quote, j+1); }
      val = transfor(str.substring(i+1, j));
      return [document.createTextNode(val), trim(str.substring(j+1))];
  };
  var _element = function(s, ctx) {
      var group = (/^\s*(\w+)(#[\d\w-]+)?((?:\.[\d\w-]+)*)?((?:\:[\w-]+)*)?(&[\d\w\.-]+)?(?:\s+([^\s]+[^\0]*)?)?$/).exec(s);
      //console.log(group);
      if (!group) { throw new Error('Incorrect expression: '+ s); }

      var dom = document.createElement(group[1]);
      group[2] && (dom.id = group[2].substring(1));
      group[3] && (dom.className = group[3].substring(1).replace(/\./, ' '));
      group[5] && (dom.name = group[5].substring(1));
      if (group[4]) {
          var ls = group[4].substring(1).split(/:/);
          for (var i = 0; i < ls.length; i++) {
              dom.setAttribute.apply(dom, smap[ls[i]]);
          }
      }
      if (group[6]) {
          var str = group[6], sub_expr = trim(str);
          if (sub_expr[0] === '>') {
              return [dom, sub_expr];
          }
          if (sub_expr[0] !== '"' && sub_expr[0] !== "'") { // attributes
              sub_expr = trim(_set_attrs(sub_expr, dom, ctx));
          } 
          if (sub_expr[0] === '"' || sub_expr[0] === "'") { // text
              sub_expr = trim(_set_text(sub_expr, dom, ctx));
          } else if (sub_expr[0] === '$') { // or ctx_text
              sub_expr = trim(_set_ctx_text(sub_expr, dom, ctx));
          }
          if (sub_expr.length > 0) {
              if (sub_expr[0] === '>') {
                  return [dom, sub_expr];
              } else {
                  throw new Error('unkown expression: '+ sub_expr);
              }
          }
      }
      return [dom, null];
  };
  var _set_attrs = function(s, element, ctx) {
      var i = 0, j, str = s, quote, name, val;
      while (str.length > 0) {
          if (str[0] === '>' || str[0] === '"' || str[0] === "'" || str[0] === '$') { return str; }

          i = str.indexOf('=');
          if (i < 0) { throw new Error('incorrect format of attribute: '+ str); }
          name = trim(str.substring(0, i));
          if (! /^\w[\w-]*$/.test(name)) { throw new Error('incorrect name of attribute: '+ name); }

          while ( (quote = str[ ++i ]) === ' ');

          if (! /^['"]$/.test(quote)) { throw new Error('invalid quote of string: '+ quote); }

          j = str.indexOf(quote, i +1);
          if (j === -1) { throw new Error('expected end quote not found: '+ quote); }

          while (str[j -1] === '\\') { j = str.indexOf(quote, j+1); }
          val = transfor(str.substring(i+1, j));

          element.setAttribute(name, val);

          while (str[++j] === ' ');
          str = str.substring(j);
      }
      return "";
  };
  var _set_text = function(str, element, ctx) {
      var j, quote = str[0], quote_length = 1;
      if (str.substring(0, 3) === '"""') {
          j = str.substring(3).search(/"""/);
          if (j === -1) { throw new Error('missing end of block text quote ("""): ' + str); }
          j += 3;
          val = str.substring(3, j);
          quote_length = 3;
      } else {
          j = str.indexOf(quote, 1);
          if (j === -1) { throw new Error('expected end quote not found: '+ quote); }

          while (str[j -1] === '\\') { j = str.indexOf(quote, j+1); }
          val = transfor(str.substring(1, j));
      }
      if ('input' === element.nodeName.toLowerCase()) {
          element.setAttribute('value', val);
      } else {
          element.appendChild(document.createTextNode(val));
      }
      return str.substring(j + quote_length);
  };
  var _set_ctx_text = function(s, element, ctx) {
      if (s[0] !== '$') { throw new Error('not a context variable format'); }
      var i = 0, j, str = s, quote = s[0], name, val;
      j = str.search(/\s|$/);
      name = str.substring(1, j);
      val = ctx[name];
      if (val == null) { val = ''; }
      if ('input' === element.nodeName.toLowerCase()) {
          element.setAttribute('value', val.toString());
      } else {
          element.appendChild(document.createTextNode(val.toString()));
      }
      return str.substring(j);
  };
  var _fn_idx = {
      '$': _ctx_node,
      '"': _text,
      "'": _text
      };
  var _expression = function(s, ctx) {
      s = s.replace(/^\s*/, '');
      ctx = ctx || {};
      var rt, fn = _fn_idx[s[0]] || _element;
      rt = fn(s, ctx);
      if (!! rt[1]) {
          rt[0].appendChild(_expression(rt[1].substring(1), rt[0], ctx));
      }
      return rt[0];
  };

  var _addjust_stack = function(indent, element_stack, indention_stack) {
      var pop_num = 0, first_indent, last_indent, got = false, i;
      if (indention_stack.length !== 0) {
          last_indent = indention_stack[indention_stack.length -1];
          if (last_indent === indent ) {
              pop_num = 1;

          } else if (last_indent.length < indent.length) { // 
              if (indent.indexOf(last_indent) !== 0) { // incorrent indention
                  throw new Error('Incorret indention of line: '+ s);
              }
              pop_num = 0;

          } else { //last_indent.length > indent.length
              if (last_indent.indexOf(indent) !== 0) { // incorrent indention
                  throw new Error('Incorret indention of line: '+ s);
              }
              first_indent = indention_stack[0];
              if (indent.indexOf(first_indent) !== 0) {
                  throw new Error('Incorret indention of line: '+ s);
              }
              for (i = indention_stack.length -1; i >= 0; i--) {
                  if (indent === indention_stack[i]) {
                      pop_num = indention_stack.length - i;
                      got = true;
                      break;
                  }
              }
              if (! got) {
                  throw new Error('Incorret indention of line: '+ s);
              }
          }
      }
      for (; pop_num > 0; pop_num--) {
          indention_stack.pop();
          element_stack.pop();
      }
  };
  var _line_mode_1 = function(s, ctx, element_stack, indention_stack, mode) {
      var text_node = document.createTextNode(s);
      element_stack[element_stack.length -1].appendChild(text_node);
      return mode;
  };
  var _line_mode_0 = function(s, ctx, element_stack, indention_stack, mode) {
      var indent = s.substring(0, s.search(/[^ \t]/)),
          element = _expression(s, ctx);
      _addjust_stack(indent, element_stack, indention_stack);
      element_stack[element_stack.length -1].appendChild(element);
      element_stack.push(element);
      indention_stack.push(indent);
      return mode;
  };
  var _line = function(s, ctx, element_stack, indention_stack, mode) {
      var group;
      switch (mode) {
      case 0: // expression mode
          if (/^\s*(#[^\n]*)?$/.exec(s)) return mode;
          if (group = /^(\s*)"""([^\n]*)$/.exec(s)) {
              var str = group[2],
                  indent = group[1],
                  i = str.search(/"""/);
              while(str[i -1] === '\\') { i = str.search(/"""/); }
              
              if (i < 0) { // switch to mode 1
                  _addjust_stack(indent, element_stack, indention_stack);
                  return _line_mode_1(str, ctx, element_stack, indention_stack, 1);
              } else if (trim(str.substring(i + 3)).length > 0) {
                  throw new Error('unexpected content: '+ str.substring(3));
              }
              return _line_mode_1(str.substring(0, i), ctx, element_stack, indention_stack, 0);
          } else
              return _line_mode_0(s, ctx, element_stack, indention_stack, mode);
      case 1: // text mode
          var i = s.search(/"""/);
          while(s[i -1] === '\\') { i = s.search(/"""/); }
          if (i > -1) { // switch back to mode 0
              if (trim(s.substring(i + 3)).length > 0) {
                  throw new Error('unexpected content: '+ s.substring(3));
              }
              _line_mode_1(s.substring(0, i), ctx, element_stack, indention_stack, 0);
              element_stack[element_stack.length -1].normalize();
              return 0;
          }
          return _line_mode_1(s, ctx, element_stack, indention_stack, mode);
      }
  };

  var _template = function(str, ctx) {
      var lines = str.split(/\n/),
          element_stack = [ fragment = document.createDocumentFragment() ],
          indention_stack = [],
          i, j, mode = 0;
      /* OK, What is mode?
       * While _line is dealing with signle line, it cannot sperates expression from text.
       * So, for mode = 0, it's expression mode; mode = 1, text mode.
       * When _line meets a line with leading block string quote (""") in expression mode,
       * it switches to text mode(1);
       * when _line_expr meet a line with tailing block string quote (""") in text mode,
       * it switches back to expressiong mode(0).
       */
      for (i = 0, j = lines.length; i<j; i++ ) {
          mode = _line(lines[i], ctx, element_stack, indention_stack, mode);
      }
      return element_stack[0];
  };
  _expression.template = _template;

  if (window.jQuery) { // jquery plugin
      var jQuery = window.jQuery;
      jQuery.markless = function(s, ctx) {
          return this(_expression(s, null, ctx));
      };
      jQuery.fn.markless = function(s, ctx) {
          var dom = _expression(s, null, ctx);
          if (this.length > 0) {
              var ls = [dom];
              this[0].appendChild(dom);
              for (i = 1; i< this.length; i++) {
                  ls.push(dom.cloneNode(true));
                  $(this[i]).append(ls[i]);
              }
          }
          return this;
      };
      /*jQuery.fn._append = jQuery.fn.append;
      jQuery.fn.append = function(expr, ctx) {
          if (typeof expr === 'string' && expr.substring(0,2).match(/^:\s$/)) {
          }
      };*/

      jQuery.fn._init = jQuery.fn.init;
      jQuery.fn.init = function(expr, ctx) {
          if (typeof expr === 'string' && expr.substring(0,2).match(/^:\s$/)) {
              return jQuery.merge(this, [_expression(expr.substring(2), ctx)]);
          } else return jQuery.fn._init.apply(this, arguments);
      };
      jQuery.fn.init.prototype = jQuery.fn;
  }
  return _expression;
})()
