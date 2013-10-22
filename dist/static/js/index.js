(function() {
  var Editor, decodeHTMLEntities, myEditor, socket,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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
    function Editor(editor) {
      this.listen = __bind(this.listen, this);
      this.setTheme = __bind(this.setTheme, this);
      this.setSyntax = __bind(this.setSyntax, this);
      this.setContent = __bind(this.setContent, this);
      var _this = this;
      this.content = {
        dom: document.querySelector('#editor'),
        raw: ""
      };
      this.syntax = {
        dom: document.querySelector('#syntax'),
        raw: ""
      };
      this.theme = {
        dom: document.querySelector('#theme'),
        raw: ""
      };
      this.setContent(editor.content);
      this.syntax.dom.onchange = function(e) {
        _this.setSyntax(e.target.value);
        return socket.emit('changedSyntax', {
          new_syntax: _this.syntax.raw
        });
      };
      this.theme.dom.onchange = function(e) {
        _this.setTheme(e.target.value);
        return socket.emit('changedTheme', {
          new_theme: _this.theme.raw
        });
      };
      this.listen();
    }

    Editor.prototype.setContent = function(content) {
      this.content.raw = content;
      return this.content.dom.innerHTML = content;
    };

    Editor.prototype.setSyntax = function(syntax) {
      this.syntax.raw = syntax;
      this.syntax.dom.value = syntax;
      return this.content.dom.setAttribute('class', syntax);
    };

    Editor.prototype.setTheme = function(theme) {
      this.theme.raw = theme;
      this.theme.dom.value = theme;
      return document.querySelector('#color-theme').href = "vendor/hightlight.js/styles/" + this.theme.raw + ".css";
    };

    Editor.prototype.listen = function() {
      var _this = this;
      return setInterval(function() {
        if (_this.content.dom.innerHTML !== _this.content.raw) {
          _this.content.raw = _this.content.dom.innerHTML.replace('<div>', '\n').replace('</div>', '');
          return socket.emit('changedContent', {
            new_content: decodeHTMLEntities(_this.content.raw)
          });
        }
      }, 2000);
    };

    return Editor;

  })();

  myEditor = void 0;

  socket = io.connect('http://localhost');

  socket.on('init', function(data) {
    return myEditor = new Editor(data.editor);
  });

  socket.on('changedContent', function(data) {
    return myEditor.setContent(data.new_content);
  });

  socket.on('changedSyntax', function(data) {
    myEditor.setSyntax(data.new_syntax);
    return socket.emit('updateContent', {
      new_content: decodeHTMLEntities(this.content.dom.innerHTML)
    });
  });

  socket.on('changedTheme', function(data) {
    return myEditor.setTheme(data.new_theme);
  });

}).call(this);
