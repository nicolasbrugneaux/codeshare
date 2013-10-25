/*
# codeshare
# https://github.com/nicolasbrugneaux/codeshare
#
# Copyright (c) 2013 Nicolas Brugneaux
# Licensed under the MIT license.
*/


/*
	Modules dependencies
*/


(function() {
  var Editor, codeshare, decodeHTMLEntities, express, fs, highlightCode, hljs, http, io, myEditor, path, server,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  express = require('express');

  http = require('http');

  path = require('path');

  io = require('socket.io');

  hljs = require('highlight.js');

  fs = require('fs');

  codeshare = module.exports = express();

  /*
  	Configuration
  */


  codeshare.configure(function() {
    var MemStore;
    codeshare.set('port', process.env.PORT || 8888);
    codeshare.set('views', "" + __dirname + "/views");
    codeshare.set('view engine', 'jade');
    codeshare.use(express.logger('dev'));
    codeshare.use(express.bodyParser());
    codeshare.use(express.methodOverride());
    codeshare.use(express.cookieParser('I Love Cookies <3'));
    MemStore = express.session.MemoryStore;
    codeshare.use(express.session({
      secret: 'I Love Cookies <3',
      store: MemStore({
        reapInterval: 60000 * 10
      })
    }));
    codeshare.use(express["static"](path.join(__dirname, 'static')));
    codeshare.use('/static/public', express["static"](path.join(__dirname, 'public')));
    codeshare.use(codeshare.router);
    if (codeshare.get('env') === 'development') {
      codeshare.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
      }));
    }
    if (codeshare.get('env') === 'production') {
      return codeshare.use(express.errorHandler());
    }
  });

  if (codeshare.get('env') === 'development') {
    codeshare.use(express.errorHandler());
  }

  server = http.createServer(codeshare);

  io = io.listen(server);

  decodeHTMLEntities = function(text) {
    var entities, entity, _i, _len;
    entities = [['apos', '\''], ['amp', '&'], ['lt', '<'], ['gt', '>'], ['nbsp', '\t']];
    for (_i = 0, _len = entities.length; _i < _len; _i++) {
      entity = entities[_i];
      text = text.replace(new RegExp("&" + entity[0] + ";", 'g'), entity[1]);
    }
    return text;
  };

  highlightCode = function(syntax, code) {
    return hljs.highlight(syntax, code.replace(/<(?!br\s*\/?)[^>]+>/g, ''.replace(/<br>/g, '\n'))).value;
  };

  Editor = (function() {
    function Editor(syntax, theme) {
      this.setContent = __bind(this.setContent, this);
      var highlightInfos;
      highlightInfos = JSON.parse(fs.readFileSync(path.join(__dirname, 'static/highlight.json')));
      this.syntax = syntax;
      this.content = decodeHTMLEntities(highlightCode(syntax, highlightInfos.examples[syntax]));
      this.theme = theme;
      this.syntaxes = highlightInfos.syntaxes;
      this.themes = highlightInfos.themes;
    }

    Editor.prototype.setContent = function(content) {
      return this.content = decodeHTMLEntities(highlightCode(this.syntax, content));
    };

    return Editor;

  })();

  myEditor = new Editor('coffeescript', 'github');

  io.sockets.on('connection', function(socket) {
    socket.emit('init', {
      'editor': myEditor
    });
    socket.on('changedContent', function(data) {
      return socket.broadcast.emit('changedContent', {
        'new_content': myEditor.setContent(data.new_content)
      });
    });
    socket.on('changedSyntax', function(data) {
      console.log(data.new_syntax);
      myEditor.syntax = data.new_syntax;
      socket.emit('changedSyntax', {
        'new_syntax': myEditor.syntax,
        'new_content': myEditor.setContent(data.new_content)
      });
      return socket.broadcast.emit('changedSyntax', {
        'new_syntax': myEditor.syntax,
        'new_content': myEditor.setContent(data.new_content)
      });
    });
    return socket.on('changedTheme', function(data) {
      myEditor.theme = data.new_theme;
      return socket.broadcast.emit('changedTheme', {
        new_theme: myEditor.theme
      });
    });
  });

  /*
  	Routes
  */


  codeshare.get('/', function(req, res) {
    return res.render('index', {
      title: 'Codeshare.js',
      editor: myEditor
    });
  });

  server.listen(codeshare.get('port'), function() {
    return console.log("Express server listening on port " + (codeshare.get('port')));
  });

}).call(this);
