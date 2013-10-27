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
      this.setUsers = __bind(this.setUsers, this);
      this.setUsername = __bind(this.setUsername, this);
      this.setTheme = __bind(this.setTheme, this);
      this.setSyntax = __bind(this.setSyntax, this);
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
      this.username = {
        dom: document.querySelector('#username'),
        btn: document.querySelector('#change_name'),
        raw: ""
      };
      this.users = {
        dom: document.querySelector('#user_list'),
        raw: []
      };
      this.setContent(editor.content);
      this.setTheme(editor.theme);
      this.setSyntax(editor.syntax);
      this.setUsername('');
      this.content.dom.onkeydown = function(e) {
        var end, keyCode, start, target, value;
        keyCode = e.keyCode || e.which;
        if (keyCode === 9 && !e.shiftKey) {
          e.preventDefault();
          start = this.selectionStart;
          end = this.selectionEnd;
          console.log(start, end);
          this.focus();
          target = e.target;
          value = target.innerHTML;
          target.innerHTML = "	" + value;
          this.selectionStart = this.selectionEnd = start + 1;
          return false;
        } else if (keyCode === 9 && e.shiftKey) {
          return e.preventDefault();
        }
      };
      if (document.querySelector('#disconnected .loading').firstChild.innerHTML === '<p>C</p>') {
        document.querySelector('#disconnected .loading').innerHTML = '<div class="letter">R</div><div class="letter">E</div>' + document.querySelector('#disconnected .loading').innerHTML;
      }
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
          document.body.style.background = document.styleSheets[4].cssRules[0].style['background-color'];
          return document.querySelector('html').style.background = document.styleSheets[4].cssRules[0].style['background-color'];
        }
      };
      return r.send();
    };

    Editor.prototype.setUsername = function(name) {
      this.username.dom.value = name;
      this.username.raw = name;
      return this.users[socket.socket.sessionid] = name;
    };

    Editor.prototype.setUsers = function(users) {
      var id, input, name, user_list;
      console.log(users);
      this.users.raw = users;
      input = this.users.dom.firstChild;
      this.users.dom.innerHTML = user_list = "";
      for (id in users) {
        name = users[id];
        if (id !== socket.socket.sessionid) {
          user_list += "<li>" + name + "</li>";
        }
      }
      this.users.dom.appendChild(input);
      return this.users.dom.firstChild.insertAdjacentHTML('afterend', user_list);
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
    var _this = this;
    myEditor = new Editor(data.editor);
    myEditor.setUsers(data.user_list);
    myEditor.syntax.dom.onchange = function(e) {
      myEditor.setSyntax(e.target.value);
      return socket.emit('changedSyntax', {
        new_syntax: myEditor.syntax.raw,
        new_content: HTMLEntities.decode(myEditor.content.raw)
      });
    };
    myEditor.theme.dom.onchange = function(e) {
      myEditor.setTheme(e.target.value);
      return socket.emit('changedTheme', {
        new_theme: myEditor.theme.raw
      });
    };
    return myEditor.username.btn.onclick = function(e) {
      console.log(myEditor.username.dom.value);
      myEditor.setUsername(myEditor.username.dom.value);
      return socket.emit('changedName', {
        new_name: myEditor.username.dom.value
      });
    };
  });

  socket.on('disconnect', function() {
    document.querySelector('#disconnected').style.position = 'fixed';
    return document.querySelector('#disconnected').style.display = 'block';
  });

  socket.on('connect', function() {
    document.querySelector('#disconnected').style.position = 'relative';
    return document.querySelector('#disconnected').style.display = 'none';
  });

  socket.on('changedContent', function(data) {
    return myEditor.setContent(data.new_content);
  });

  socket.on('changedSyntax', function(data) {
    myEditor.setSyntax(data.new_syntax);
    return myEditor.setContent(data.new_content);
  });

  socket.on('changedTheme', function(data) {
    return myEditor.setTheme(data.new_theme);
  });

  socket.on('updateUsers', function(data) {
    return myEditor.setUsers(data.user_list);
  });

}).call(this);
