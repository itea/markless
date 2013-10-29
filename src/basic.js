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

