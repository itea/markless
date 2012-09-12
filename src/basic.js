var
  trim_fn = String.prototype.trim || function() { return this.replace(/^\s*|\s*$/, ''); },

  error = function(s) {
      throw new Error(s);
  },

  extend = function(target, src) {
      for (var e in src) {
          target[e] = src[e];
      }
      return target;
  };

