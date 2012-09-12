var
  _addjust_stack = function(indent, es, is) {

      var pop_num = 0, last, got = false, i;

      if (is.length !== 0) {
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

  _markmore = function(str) {
      var ctx = _build_ctx(arguments),
          lines = str.split('\n'),
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
      return element_stack[0];
  };

