#
# insertAtCursor = (editor,text) ->
# 	strPos = 0
# 	console.log editor.selectionStart
# 	br = if editor.selectionStart or editor.selectionStart is '0' then "ff" else ( if document.selection then "ie" else false )
# 	console.log br
# 	if br is "ie"
# 		console.log 'test1'
# 		editor.focus()
# 		range = document.selection.createRange()
# 		range.moveStart('character', -editor.innerHTML.length)
# 		strPos = range.text.length

# 	else if br is "ff"
# 		console.log 'test2'
# 		strPos = editor.selectionStart
# 		front = (editor.innerHTML).substring(0,strPos)
# 		back = (editor.innerHTML).substring(strPos,editor.innerHTML.length)
# 		editor.innerHTML=front+text+back;strPos = strPos + text.length
# 		if br is "ie"
# 			console.log 'test3'
# 			editor.focus();
# 			range = document.selection.createRange()
# 			range.moveStart('character', -editor.innerHTML.length)
# 			range.moveStart('character', strPos)
# 			range.moveEnd('character', 0)
# 			range.select()
# 		else if br is "ff"
# 			console.log 'test4'
# 			editor.selectionStart = strPos
# 			editor.selectionEnd = strPos
# 			editor.focus()
#

class HTMLEntities
	@entities: [
		['apos', '\'']
		['amp', '&']
		['lt', '<']
		['gt', '>']
		['nbsp', '	']
	]
	@decode: (html) =>
		for entity in @entities
			html = html.replace new RegExp("&#{entity[0]};", 'g'), entity[1]
		html

	@encode: (text) =>
		for entity in @entities
			text = text.replace new RegExp(entity[1], 'g'), "&#{entity[0]};"
		text

class Editor
	constructor: (editor) ->
		@content =
			dom: document.querySelector('#editor')
			raw: ""
		@syntax =
			dom: document.querySelector('#syntax')
			raw: ""
		@theme =
			dom: document.querySelector('#theme')
			raw: ""
			
		@setContent(editor.content)
		@setTheme(editor.theme)
		@setSyntax(editor.syntax)

		@syntax.dom.onchange = (e) =>
			@setSyntax(e.target.value)
			socket.emit('changedSyntax', { new_syntax: @syntax.raw, new_content: HTMLEntities.decode(@content.raw) })

		@theme.dom.onchange = (e) =>
			@setTheme(e.target.value)
			socket.emit('changedTheme', { new_theme: @theme.raw })

		# not working quite yet ^^
		@content.dom.onkeydown = (e) ->
			keyCode = e.keyCode || e.which
			if keyCode is 9 and not e.shiftKey
				e.preventDefault()

				start = @selectionStart
				end = @selectionEnd
				console.log start, end
				@focus()

				target = e.target
				value = target.innerHTML

				target.innerHTML = "	#{value}"
				@selectionStart = @selectionEnd = start + 1
				return false

			else if keyCode is 9 and e.shiftKey
				e.preventDefault()
				#ToDO
		if document.querySelector('#disconnected .loading').firstChild.innerHTML is '<p>C</p>'
			document.querySelector('#disconnected .loading').innerHTML = '<div class="letter">R</div><div class="letter">E</div>' + document.querySelector('#disconnected .loading').innerHTML
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
		r = new XMLHttpRequest()
		r.open("GET", "vendor/highlight.js/styles/#{@theme.raw}.css", true)
		r.onreadystatechange = =>
			if r.readyState is 4 and r.status is 200
				document.querySelector('#color-theme').innerHTML = r.response
				document.body.style.background = document.styleSheets[4].cssRules[0].style['background-color']
				document.querySelector('html').style.background = document.styleSheets[4].cssRules[0].style['background-color']
		r.send()
		

	listen: =>
		setInterval =>
			if HTMLEntities.decode(@content.dom.innerHTML) != @content.raw
				@content.raw = @content.dom.innerHTML.replace('<div>','\n').replace('</div>', '')
				socket.emit('changedContent', { new_content: HTMLEntities.decode(@content.raw) })
		, 2000

myEditor = undefined

socket = io.connect('http://localhost')

socket.on 'init', (data) ->
	myEditor = new Editor( data.editor )

socket.on 'disconnect', () ->
	document.querySelector('#disconnected').style.position = 'fixed'
	document.querySelector('#disconnected').style.display = 'block'


socket.on 'connect', () ->
	document.querySelector('#disconnected').style.position = 'relative'
	document.querySelector('#disconnected').style.display = 'none'

socket.on 'changedContent', (data) ->
	myEditor.setContent(data.new_content)

socket.on 'changedSyntax', (data) ->
	myEditor.setSyntax(data.new_syntax)
	myEditor.setContent(data.new_content)

socket.on 'changedTheme', (data) ->
	myEditor.setTheme(data.new_theme)