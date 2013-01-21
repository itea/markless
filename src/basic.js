var
  error = function(s) {
      throw new Error(s);
  },

  extend = function(target, src) {
      var e;
      for (e in src) {
          target[e] = src[e];
      }
      return target;
  };

