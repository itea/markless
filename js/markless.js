/* Markless
 * itea 2012-07-30
 * https://github.com/itea/markless
 * MIT-LICENSE
 */
var markless = (function() {
  var _trim = String.prototype.trim || function() { return this.replace(/^\s*|\s*$/, ''); };
  var trim = function(s) { return _trim.call(s); };
  var _transfor = function(s) {
      return (new Function('return '+ s))();
  };
  var _pesudo_map = {
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
      if (s[0] !== '$') { throw new Error('Not a context Node variable format'); }
      var i = 0, j, str = s, quote = s[0], name, v;
      j = str.search(/\s|$/);
      name = str.substring(1, j);
      v = ctx[name];
      if (v == null) return [document.createTextNode(''), trim(str.substring(j))];
      else if (v instanceof HTMLElement) return [v, trim(str.substring(j))];
      else return [document.createTextNode(v.toString()), trim(str.substring(j))];
  };
  var _find_end_quote = function(str, quote, start) {
      var j = start || 0, l = quote.length;
      do {
          j = str.indexOf(quote, j + l);
          if (j === -1) { throw new Error('Missing end quote: ' + str); }
      } while (str[j -1] === '\\');
      return j;
  };
  var _text = function(s, ctx) {
      var j = 0, str = s, quote = s[0], group, val;
      if (str.substring(0, 3) === '"""') {
          j = _find_end_quote(str, '"""', 0);
          val = str.substring(3, j);
          j += 3;
      } else {
          j = _find_end_quote(str, quote, 0);
          val = _transfor(str.substring(0, j+1));
          j++;
      }
      return [document.createTextNode(val), trim(str.substring(j))];
  };
  var _element = function(s, ctx) {
      var group = (/^\s*(\w+)(#[\d\w-]+)?((?:\.[\d\w-]+)*)?((?:\:[\w-]+)*)?(&[\d\w\.-]+)?(?:\s+([^\s]+[^\0]*)?)?$/).exec(s);
      //console.log(group);
      if (!group) { throw new Error('Incorrect element expression: '+ s); }

      var element = document.createElement(group[1]);
      group[2] && (element.id = group[2].substring(1));
      group[3] && (element.className = group[3].substring(1).replace(/\./, ' '));
      group[5] && (element.name = group[5].substring(1));
      if (group[4]) {
          var ls = group[4].substring(1).split(/:/);
          for (var i = 0; i < ls.length; i++) {
              element.setAttribute.apply(element, _pesudo_map[ls[i]]);
          }
      }
      if (group[6]) {
          var sub_expr = trim(group[6]);
          if (sub_expr[0] === '>') {
              return [element, sub_expr];
          }
          if (sub_expr[0] !== '"' && sub_expr[0] !== "'") { // attributes
              sub_expr = trim(_set_attrs(sub_expr, element, ctx));
          } 
          if (sub_expr[0] === '"' || sub_expr[0] === "'") { // text
              sub_expr = trim(_set_text(sub_expr, element, ctx));
          } else if (sub_expr[0] === '$') { // or ctx_text
              sub_expr = trim(_set_ctx_text(sub_expr, element, ctx));
          }
          if (sub_expr.length > 0) {
              if (sub_expr[0] === '>') {
                  return [element, sub_expr];
              } else {
                  throw new Error('Unkown expression: '+ sub_expr);
              }
           }
      }
      return [element, null];
  };
  var _set_attrs = function(s, element, ctx) {
      var i = 0, j, str = s, quote, name, val;
      while (str.length > 0) {
          if (str[0] === '>' || str[0] === '"' || str[0] === "'" || str[0] === '$') { return str; }

          i = str.indexOf('=');
          if (i < 0) { throw new Error('Incorrect format of attribute: '+ str); }
          name = trim(str.substring(0, i));
          if (! /^[\w-]+$/.test(name)) { throw new Error('Incorrect name of attribute: '+ name); }

          while ( (quote = str[ ++i ]) === ' ');

          if (! /^['"]$/.test(quote)) { throw new Error('Invalid quote of string: '+ quote); }

          j = _find_end_quote(str, quote, i);
          val = _transfor(str.substring(i, j+1));

          element.setAttribute(name, val);

          str = trim(str.substring(j +1));
      }
      return "";
  };
  var _set_text = function(str, element, ctx) {
      var j = 0, quote = str[0], val;
      if (str.substring(0, 3) === '"""') {
          j = _find_end_quote(str, '"""', 0);
          val = str.substring(3, j);
          j += 3;
      } else {
          j = _find_end_quote(str, quote, 0);
          val = _transfor(str.substring(0, j+1));
          j++;
      }
      if ('input' === element.nodeName.toLowerCase()) {
          element.setAttribute('value', val);
      } else {
          element.appendChild(document.createTextNode(val));
      }
      return str.substring(j);
  };
  var _set_ctx_text = function(s, element, ctx) {
      if (s[0] !== '$') { throw new Error('Not a context variable format'); }
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
          if (rt[1][0] === '>') {
              rt[0].appendChild(_expression(rt[1].substring(1), ctx));
          } else {
              throw new Error('Unkown expression: '+ rt[1]);
          }
      }
      return rt[0];
  };

// functions below are for markmore
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
      var text_node = document.createTextNode(s + '\n');
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
                  i = str.indexOf('"""');
              while(str[i -1] === '\\') { i = str.indexOf('"""', i +3); }
              
              if (i < 0) { // switch to mode 1
                  _addjust_stack(indent, element_stack, indention_stack);
                  return _line_mode_1(str, ctx, element_stack, indention_stack, 1);
              } else if (trim(str.substring(i + 3)).length > 0) {
                  throw new Error('Unexpected content: '+ str.substring(3));
              }
              return _line_mode_1(str.substring(0, i), ctx, element_stack, indention_stack, 0);
          } else
              return _line_mode_0(s, ctx, element_stack, indention_stack, mode);
      case 1: // text mode
          var i = s.indexOf('"""');
          while(s[i -1] === '\\') { i = s.indexOf('"""', i +3); }
          if (i > -1) { // switch back to mode 0
              if (trim(s.substring(i + 3)).length > 0) {
                  throw new Error('Unexpected content: '+ s.substring(3));
              }
              _line_mode_1(s.substring(0, i), ctx, element_stack, indention_stack, 0);
              element_stack[element_stack.length -1].normalize();
              return 0;
          }
          return _line_mode_1(s, ctx, element_stack, indention_stack, mode);
      }
  };

  var _markmore = function(str, ctx) {
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
       * it switches back to expression mode(0).
       */
      for (i = 0, j = lines.length; i<j; i++ ) {
          mode = _line(lines[i], ctx, element_stack, indention_stack, mode);
      }
      return element_stack[0];
  };

  if (true) {
      String.prototype.markless = function(ctx) {
          return _expression(this, ctx);
      };
      String.prototype.markmore = function(ctx) {
          return _markmore(this, ctx);
      };
  }

  _expression.markmore = _markmore;
  return _expression;
})()
