decodeHTMLEntities = (text) ->
	entities = [
		['apos', '\'']
		['amp', '&']
		['lt', '<']
		['gt', '>']
		['nbsp', '	']
	]
	for entity in entities
		text = text.replace(new RegExp('&'+entity[0]+';', 'g'), entity[1])
	return text

class Editor
	constructor: (editor) ->
		@content = {
			dom: document.querySelector('#editor')
			raw: ""
		}
		@syntax = {
			dom: document.querySelector('#syntax')
			raw: ""
		}
		@theme = {
			dom: document.querySelector('#theme')
			raw: ""
		}
		@setContent(editor.content)

		@syntax.dom.onchange = (e) =>
			@setSyntax(e.target.value)
			socket.emit('changedSyntax', { new_syntax: @syntax.raw })

		@theme.dom.onchange = (e) =>
			@setTheme(e.target.value)
			socket.emit('changedTheme', { new_theme: @theme.raw })
		@listen()

	setContent: (content) =>
		@content.raw = content
		@content.dom.innerHTML = content

	setSyntax: (syntax) =>
		@syntax.raw = syntax
		@syntax.dom.value = syntax
		@content.dom.setAttribute('class', syntax)

	setTheme: (theme) =>
		@theme.raw = theme
		@theme.dom.value = theme
		document.querySelector('#color-theme').href = "vendor/hightlight.js/styles/#{@theme.raw}.css"

	listen: () =>
		setInterval () =>
			if @content.dom.innerHTML != @content.raw
				@content.raw = @content.dom.innerHTML.replace('<div>','\n').replace('</div>', '')
				socket.emit('changedContent', { new_content: decodeHTMLEntities(@content.raw) })
		, 2000

myEditor = undefined

socket = io.connect('http://localhost')

socket.on('init', (data) ->
	myEditor = new Editor( data.editor )
)
socket.on('changedContent', (data) ->
	myEditor.setContent(data.new_content)
)
socket.on('changedSyntax', (data) ->
	myEditor.setSyntax(data.new_syntax)
	socket.emit('updateContent', { new_content: decodeHTMLEntities(@content.dom.innerHTML) })
)
socket.on('changedTheme', (data) ->
	myEditor.setTheme(data.new_theme)
)