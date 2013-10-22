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
  var Editor, codeshare, decodeHTMLEntities, express, hljs, http, io, myEditor, path, routes, server;

  express = require('express');

  routes = require('./routes');

  http = require('http');

  path = require('path');

  io = require('socket.io');

  hljs = require('highlight.js');

  codeshare = module.exports = express();

  /*
  	Configuration
  */


  codeshare.configure(function() {
    var MemStore;
    codeshare.set('port', process.env.PORT || 8888);
    codeshare.set('views', __dirname + '/views');
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
      text = text.replace(new RegExp('&' + entity[0] + ';', 'g'), entity[1]);
    }
    return text;
  };

  Editor = (function() {
    function Editor() {
      this.content = "socket.on('changedSyntax', (data) ->\n    myEditor.syntax = data.new_syntax";
      this.syntax = "coffeescript";
      this.theme = "github";
      this.syntaxes = ["python", "profile", "ruby", "perl", "php", "scala", "go", "xml", "css", "markdown", "django", "json", "javascript", "coffeescript", "actionscript", "vbscript", "http", "lua", "delphi", "java", "cpp", "objectivec", "vala", "cs", "d", "rsl", "rib", "mel", "sql", "smalltalk", "lisp", "clojure", "ini", "apache", "nginx", "diff", "dos", "con", "prn", "bash", "cmake", "axapta", "1c", "avrasm", "vhdl", "parser3", "tex", "haskell", "erlang", "rust", "matlab", "r", "glsl", "applescript", "brainfuck"];
      this.themes = ["arta", "ascetoc", "brown_paper", "dark", "default", "far", "github", "googlecode", "idea", "ir_black", "magula", "monokai", "pojoaque", "rainbow", "school_book", "solarized_dark", "solarized_light", "sunburst", "tomorrow-night-blue", "tomorrow-night-bright", "tomorrow-night-eighties", "tomorrow-night-night", "tomorrow", "vs", "xcode", "zenburn"];
    }

    return Editor;

  })();

  myEditor = new Editor;

  io.sockets.on('connection', function(socket) {
    myEditor.content = decodeHTMLEntities(hljs.highlight(myEditor.syntax, myEditor.content.replace(/<(?!br\s*\/?)[^>]+>/g, "").replace(/<br>/g, "\n")).value);
    socket.emit('init', {
      editor: myEditor
    });
    socket.on('changedContent', function(data) {
      myEditor.content = hljs.highlight(myEditor.syntax, data.new_content.replace(/<(?!br\s*\/?)[^>]+>/g, "").replace(/<br>/g, "\n")).value;
      return socket.broadcast.emit('changedContent', {
        new_content: decodeHTMLEntities(myEditor.content)
      });
    });
    socket.on('updateContent', function(data) {
      myEditor.content = hljs.highlight(myEditor.syntax, data.new_content.replace(/<(?!br\s*\/?)[^>]+>/g, "").replace(/<br>/g, "\n")).value;
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
    return console.log('Express server listening on port ' + codeshare.get('port'));
  });

}).call(this);
