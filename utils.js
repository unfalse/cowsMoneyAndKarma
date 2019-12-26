Utils = {
    KEY_CODE: {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      a_KEY: 65
    },
  
    getChar: function(event) {
      if (event.which == null) {  // IE
        if (event.keyCode < 32)
          return null;
        return String.fromCharCode(event.keyCode) 
      }
  
      if (event.which!=0 && event.charCode!=0) {
        if (event.which < 32) return null;
          return String.fromCharCode(event.which);
      }
  
      return null;
    },
    
    getRandomInt: function(min, max)
    {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }