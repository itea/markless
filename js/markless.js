/* Markless
 * itea 2012
 * https://github.com/itea/markless
 * MIT-LICENSE
 */
var markless = (function() {

var
  _trim = String.prototype.trim || function() { return this.replace(/^\s*|\s*$/, ''); },

  trim = function(s) { return _trim.call(s); },

  _element_regexp = /^\s*(\w+)(#[\d\w-]+)?((?:\.[\d\w-]+)*)?((?:\:[\w-]+)*)?(&[\d\w\.-]+)?(?:\s+([^\s]+[^\0]*)?)?$/,

  _transfor = function(s) {
      return (new Function('return '+ s))();
  },

  _pesudo_map = {
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
  },

  _ctx_node = function(s, ctx) {
      if (s[0] !== '$') { throw new Error('Not a context Node variable format'); }
      var i = 0, j, str = s, quote = s[0], name, v;
      j = str.search(/\s|$/);
      name = str.substring(1, j);
      v = ctx[name];
      if (v == null) return [document.createTextNode(''), trim(str.substring(j))];
      else if (v instanceof HTMLElement) return [v, trim(str.substring(j))];
      else return [document.createTextNode(v.toString()), trim(str.substring(j))];
  },

  _find_end_quote = function(str, quote, start) {
      var j = start || 0, l = quote.length;
      do {
          j = str.indexOf(quote, j + l);
          if (j === -1) { throw new Error('Missing end quote: ' + str); }
      } while (str[j -1] === '\\');
      return j;
  },

  _parse_string = function(str, start) {

      /** Borrowed some code from json_parse.js by crokford. */
      start = start || 0;
      str = str.substring(start);

      var ch = str[0], at = 1, quote = ch, at_quote = str.indexOf(quote, at),
          hex, i, uffff, strings = [],

          next = function() {
              return ch = str.charAt(at ++);
          },

          find = function() {

              if (at_quote < at) {
                  at_quote = str.indexOf(quote, at);
                  if (at_quote === -1) {
                      throw new Exception('expecting end quote: ' + str);
                  }
              }
              var at0 = at, m;
              at = str.indexOf('\\', at);
              if (at === -1) {
                  at = at_quote;
              } else if ( at > at_quote) {
                  m = at_quote;
                  at_quote = str.indexOf(quote, at);
                  at = m;

                  if (at_quote === -1) {
                      throw new Exception('expecting end quote: ' + str);
                  }
              }
              if (at0 !== at) {
                  strings.push(str.substring(at0, at));
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
              return [ strings.join(''), start + at ];
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
                  strings.push(String.fromCharCode(uffff));
              } else if (typeof escapee[ch] === 'string') {
                  strings.push(escapee[ch]);
              } else {
                  break;
              }
          }
      }
      throw new Error('Bad string: ' + str);
  },

  _text = function(s, ctx) {
      var j = 0, str = s, quote = s[0], group, val;

      if (str.substring(0, 3) === '"""') {
          j = _find_end_quote(str, '"""', 0);
          val = str.substring(3, j);
          j += 3;
      } else {
          group = _parse_string(str);
          val = group[0];
          j = group[1];
          //j = _find_end_quote(str, quote, 0);
          //val = _transfor(str.substring(0, j+1));
          //j++;
      }
      return [ document.createTextNode(val), trim(str.substring(j)) ];
  },

  _element = function(s, ctx) {
      var group = _element_regexp.exec(s),
          element, ls, i, j, sub_expr;

      if (!group) { throw new Error('Incorrect element expression: '+ s); }

      element = document.createElement(group[1]);

      group[2] && (element.id = group[2].substring(1));
      group[3] && (element.className = group[3].substring(1).replace(/\./, ' '));
      group[5] && (element.name = group[5].substring(1));
      if (group[4]) {
          ls = group[4].substring(1).split(/:/);
          for (i = 0,j = ls.length; i<j; i++) {
              element.setAttribute.apply(element, _pesudo_map[ls[i]]);
          }
      }
      if (group[6]) {
          sub_expr = trim(group[6]);
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
  },

  _set_attrs = function(s, element, ctx) {
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

          if (/^\S$/.test(str[j +1])) { throw new Error('Attributes should be separated by blankspace.'); }
          str = trim(str.substring(j +2));
      }
      return "";
  },

  _set_text = function(str, element, ctx) {
      var j = 0, quote = str[0], val, group;
      if (str.substring(0, 3) === '"""') {
          j = _find_end_quote(str, '"""', 0);
          val = str.substring(3, j);
          j += 3;
      } else {
          group = _parse_string(str);
          val = group[0];
          j = group[1];
          //j = _find_end_quote(str, quote, 0);
          //val = _transfor(str.substring(0, j+1));
          //j++;
      }
      if ('input' === element.nodeName.toLowerCase()) {
          element.setAttribute('value', val);
      } else {
          element.appendChild(document.createTextNode(val));
      }
      return str.substring(j);
  },

  _set_ctx_text = function(str, element, ctx) {

      var quote = s[0],
          j = str.search(/\s|$/),
          name = str.substring(1, j),
          val = ctx[name];

      if (val == null) { val = ''; }

      if ('input' === element.nodeName.toLowerCase()) {
          element.setAttribute('value', val.toString());
      } else {
          element.appendChild(document.createTextNode(val.toString()));
      }
      return str.substring(j);
  },

  _fn_idx = {
      '$': _ctx_node,
      '"': _text,
      "'": _text
  },

  _expression = function(s, ctx) {
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
  },

  // functions below are for markmore
  _addjust_stack = function(indent, es, is) {
      var pop_num = 0, first, last, got = false, i;
      if (is.length !== 0) {
          last = is[is.length -1];
          if (last === indent ) {
              pop_num = 1;

          } else if (last.length < indent.length) { // 
              if (indent.indexOf(last) !== 0) { // incorrent indention
                  throw new Error('Incorret indention of line: '+ s);
              }
              pop_num = 0;

          } else { //last.length > indent.length
              if (last.indexOf(indent) !== 0) { // incorrent indention
                  throw new Error('Incorret indention of line: '+ s);
              }
              first = is[0];
              if (indent.indexOf(first) !== 0) {
                  throw new Error('Incorret indention of line: '+ s);
              }
              for (i = is.length -1; i >= 0; i--) {
                  if (indent === is[i]) {
                      pop_num = is.length - i;
                      got = true;
                      break;
                  }
              }
              if (! got) {
                  throw new Error('Incorret indention of line: '+ s);
              }
          }
      }
      while (pop_num -- > 0) {
          is.pop();
          es.pop();
      }
  },

  _line_mode_1 = function(s, ctx, es, is, mode) {
      var text_node = document.createTextNode(s + '\n');
      es[es.length -1].appendChild(text_node);
      return mode;
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

  _line = function(s, ctx, es, is, mode) {
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
                  _addjust_stack(indent, es, is);
                  return _line_mode_1(str, ctx, es, is, 1);
              } else if (trim(str.substring(i + 3)).length > 0) {
                  throw new Error('Unexpected content: '+ str.substring(3));
              }
              return _line_mode_1(str.substring(0, i), ctx, es, is, 0);
          } else
              return _line_mode_0(s, ctx, es, is, mode);
      case 1: // text mode
          var i = s.indexOf('"""');
          while(s[i -1] === '\\') { i = s.indexOf('"""', i +3); }
          if (i > -1) { // switch back to mode 0
              if (trim(s.substring(i + 3)).length > 0) {
                  throw new Error('Unexpected content: '+ s.substring(3));
              }
              _line_mode_1(s.substring(0, i), ctx, es, is, 0);
              es[es.length -1].normalize();
              return 0;
          }
          return _line_mode_1(s, ctx, es, is, mode);
      }
  },

  _markmore = function(str, ctx) {
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
  _expression.get_string = _parse_string;
  return _expression;
})()
