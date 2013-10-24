(function() {
  var Editor, HTMLEntities, myEditor, socket,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  HTMLEntities = (function() {
    function HTMLEntities() {}

    HTMLEntities.entities = [['apos', '\''], ['amp', '&'], ['lt', '<'], ['gt', '>'], ['nbsp', '	']];

    HTMLEntities.decode = function(html) {
      var entity, _i, _len, _ref;
      _ref = HTMLEntities.entities;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        html = html.replace(new RegExp("&" + entity[0] + ";", 'g'), entity[1]);
      }
      return html;
    };

    HTMLEntities.encode = function(text) {
      var entity, _i, _len, _ref;
      _ref = HTMLEntities.entities;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        text = text.replace(new RegExp(entity[1], 'g'), "&" + entity[0] + ";");
      }
      return text;
    };

    return HTMLEntities;

  }).call(this);

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
      this.setTheme(editor.theme);
      this.setSyntax(editor.syntax);
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
      var r,
        _this = this;
      this.theme.raw = theme;
      this.theme.dom.value = theme;
      r = new XMLHttpRequest();
      r.open("GET", "vendor/highlight.js/styles/" + this.theme.raw + ".css", true);
      r.onreadystatechange = function() {
        if (r.readyState === 4 && r.status === 200) {
          document.querySelector('#color-theme').innerHTML = r.response;
          return document.body.style.background = document.styleSheets[3].cssRules[0].style['background-color'];
        }
      };
      return r.send();
    };

    Editor.prototype.listen = function() {
      var _this = this;
      return setInterval(function() {
        if (HTMLEntities.decode(_this.content.dom.innerHTML) !== _this.content.raw) {
          _this.content.raw = _this.content.dom.innerHTML.replace('<div>', '\n').replace('</div>', '');
          return socket.emit('changedContent', {
            new_content: HTMLEntities.decode(_this.content.raw)
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
      new_content: HTMLEntities.decode(this.content.dom.innerHTML)
    });
  });

  socket.on('changedTheme', function(data) {
    return myEditor.setTheme(data.new_theme);
  });

}).call(this);
