/*
 GET home page.
*/


(function() {
  exports.index = function(req, res) {
    return res.render('index', {
      title: 'Codeshare.js'
    });
  };

}).call(this);
