(function() {
  var Editor, myEditor, socket,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Editor = (function() {
    function Editor(editor) {
      this.listen = __bind(this.listen, this);
      this.setSyntax = __bind(this.setSyntax, this);
      this.setTheme = __bind(this.setTheme, this);
      this.setContent = __bind(this.setContent, this);
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
      this.listen();
    }

    Editor.prototype.setContent = function(content) {
      this.content.raw = content;
      return this.content.dom.innerHTML = content;
    };

    Editor.prototype.setTheme = function(theme) {
      this.theme.raw = theme;
      return this.theme.dom.innerHTML = theme;
    };

    Editor.prototype.setSyntax = function(syntax) {
      this.syntax.raw = syntax;
      return this.syntax.dom.innerHTML = syntax;
    };

    Editor.prototype.listen = function() {
      var _this = this;
      return setInterval(function() {
        if (_this.content.dom.innerHTML !== _this.content.raw) {
          _this.content.raw = _this.content.dom.innerHTML;
          return socket.emit('changedContent', {
            new_content: _this.content.raw
          });
        }
      }, 2000);
    };

    return Editor;

  })();

  myEditor = void 0;

  socket = io.connect('http://localhost');

  socket.on('init', function(data) {
    myEditor = new Editor(data.editor);
    console.log(myEditor.content);
    return console.log(myEditor);
  });

  socket.on('changedContent', function(data) {
    console.log(data);
    return myEditor.setContent(data.new_content);
  });

  socket.on('changedSyntax', function(data) {
    return myEditor.setTheme(data.new_theme);
  });

  socket.on('changedTheme', function(data) {
    return myEditor.setSyntax(data.new_syntax);
  });

}).call(this);
