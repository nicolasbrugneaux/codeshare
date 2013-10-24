/*
 * codeshare
 * https://github.com/nicolasbrugneaux/codeshare
 *
 * Copyright (c) 2013 Nicolas Brugneaux
 * Licensed under the MIT license.
*/


/*
	Modules dependencies
*/


(function() {
  var Editor, codeshare, decodeHTMLEntities, express, fs, hljs, http, io, myEditor, path, server;

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
    entities = [['apos', '\''], ['amp', '&'], ['lt', '<'], ['gt', '>'], ['nbsp', '	']];
    for (_i = 0, _len = entities.length; _i < _len; _i++) {
      entity = entities[_i];
      text = text.replace(new RegExp("&" + entity[0] + ";", 'g'), entity[1]);
    }
    return text;
  };

  Editor = (function() {
    function Editor() {
      this.content = "class Editor\n	constructor: ->\n	@content = 'some code'\n	@syntax	 = 'coffeescript'\n	@theme   = 'github'\n	@syntaxes = fs.readFileSync(path.join(__dirname, 'static/syntaxes')).toString().split('\\n')\n	@themes = fs.readFileSync(path.join(__dirname, 'static/themes')).toString().split('\\n')";
      this.syntax = 'coffeescript';
      this.theme = 'idea';
      this.syntaxes = fs.readFileSync(path.join(__dirname, 'static/syntaxes')).toString().split('\n');
      this.themes = fs.readFileSync(path.join(__dirname, 'static/themes')).toString().split('\n');
    }

    return Editor;

  })();

  myEditor = new Editor;

  io.sockets.on('connection', function(socket) {
    myEditor.content = decodeHTMLEntities(hljs.highlight(myEditor.syntax, myEditor.content.replace(/<(?!br\s*\/?)[^>]+>/g, ''.replace(/<br>/g, '\n'))).value);
    socket.emit('init', {
      editor: myEditor
    });
    socket.on('changedContent', function(data) {
      myEditor.content = hljs.highlight(myEditor.syntax, data.new_content.replace(/<(?!br\s*\/?)[^>]+>/g, ''.replace(/<br>/g, '\n'))).value;
      return socket.broadcast.emit('changedContent', {
        new_content: decodeHTMLEntities(myEditor.content)
      });
    });
    socket.on('updateContent', function(data) {
      myEditor.content = hljs.highlight(myEditor.syntax, data.new_content.replace(/<(?!br\s*\/?)[^>]+>/g, ''.replace(/<br>/g, '\n'))).value;
      socket.emit('changedContent', {
        new_content: decodeHTMLEntities(myEditor.content)
      });
      return socket.broadcast.emit('changedContent', {
        new_content: decodeHTMLEntities(myEditor.content)
      });
    });
    socket.on('changedSyntax', function(data) {
      myEditor.syntax = data.new_syntax;
      return socket.broadcast.emit('changedSyntax', {
        new_syntax: myEditor.syntax
      });
    });
    return socket.on('changedTheme', function(data) {
      myEditor.theme = data.new_theme;
      return socket.broadcast.emit('changedSyntax', {
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
