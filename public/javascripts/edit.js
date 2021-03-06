$.ajaxSetup ({ cache: false }); 
//var ajax_load = "<img src='/images/spinner-small.gif' alt='loading...' />";

$P = {
	pointer_x: 0,
	pointer_y: 0,
	v_offset: 60, // height of the canvas below top of page, used only for touch events

	/**
	 * Startup environment, accepts data_url or just URL of starting image
	**/
	initialize: function(args) {
		$P.element = $('#canvas')
		$P.element = $('#canvas')[0]
		$P.canvas = $P.element.getContext('2d');
		$C = $P.canvas
		if ($(window).width() < $(window).height()) $P.width = args['displaySize'] || $(window).width()-30 //256
		else $P.width = args['displaySize'] || ($(window).width()-100)
		$P.element.width = $P.width
		$P.iconSizeX = 60 // 60 boxes across
		$P.iconSizeY = 24 // 24 boxes high
		$P.pixelSize = $P.width/$P.iconSizeX

		$P.height = $P.pixelSize * $P.iconSizeY 
		$P.element.height = $P.height

		$P.intPixelSize = Math.floor($P.width/$P.iconSizeX)
		$P.grid = args['grid'] || true
		$('body').mouseup($P.on_mouseup)
		$('body').mousedown($P.on_mousedown)
		$('body').mousemove($P.on_mousemove)
		window.addEventListener('touchend',$P.on_mouseup)
		window.addEventListener('touchstart',$P.on_mousedown)
		window.addEventListener('touchmove',$P.on_mousemove)
		//setInterval($P.draw,1500)
		$C.fillStyle = "white"
		$C.fillRect(0,0,$P.width,$P.height)
		if (args['image_data'] != "") $P.displayIcon(args['image_data'])
		if (args['icon_id'] != "" || args['icon_id'] == 0) $P.icon_id = args['icon_id']
		console.log(args['icon_id'])
		if (args['type'] != "") $P.type = args['type']
		if (args['hash'] != "") {
			$P.hash = args['hash']
			$P.decodeIconString($P.hash)
			$P.generatePermalink()
		}
		if ($P.grid) $P.drawGrid() 
	},
	on_mousedown: function(e) {
		e.preventDefault()
		$P.dragging = true
		$P.getPointer(e)
		if ($P.isBlack($P.pointer_x,$P.pointer_y)) {
			$C.fillStyle = "white"
		} else {
			$C.fillStyle = "black"
		}
		$P.drawPixel()
	},
	on_mouseup: function(e) {
		e.preventDefault()
		$P.dragging = false
		if ($P.grid) $P.drawGrid() 
		$P.generatePermalink()
	},
	on_mousemove: function(e) {
		if ($P.dragging) {
			$P.getPointer(e)
			$P.drawPixel()
		}
	},

	/**
	 * Draws a pixel of black or white at the pointer location
	**/
	drawPixel: function() {
		x = parseInt($P.pointer_x/$P.width*$P.iconSizeX)
		y = parseInt($P.pointer_y/$P.height*$P.iconSizeY)
        console.log("x: " + x + ", y: " + y)
        console.log("onCanvas in drawPixel" + $P.onCanvas)
		if ($P.onCanvas) {
			$C.fillRect(x*$P.pixelSize,y*$P.pixelSize,$P.intPixelSize,$P.intPixelSize)
		}
	},

	/**
	 * Refetches the pointer position and stores it in $P.pointer_x, $P.pointer_y
	 * and handles touch events too.
	**/
	getPointer: function(e) {
		offsetX = ($(window).width()-$P.width)/2;
		offsetY = $P.v_offset;//($(window).height()-$P.height)/2;
		if (e.touches && (e.touches[0] || e.changedTouches[0])) {
			var touch = e.touches[0] || e.changedTouches[0];
			$P.pointer_x = touch.pageX - offsetX;
			$P.pointer_y = touch.pageY - offsetY;
			$P.onCanvas = (touch.pageX >= offsetX && touch.pageX < offsetX+$P.width && touch.pageY >= offsetY && touch.pageY < offsetY+$P.height)
		} else {

		// Firefox shim for offsetX/Y:
		// from https://bug69787.bugzilla.mozilla.org/attachment.cgi?id=248546, https://bugzilla.mozilla.org/show_bug.cgi?id=69787
		var x=0, y=0, fatalerror=0, mozilla=false;

		if (typeof e.offsetX != 'undefined' && typeof e.offsetY != 'undefined') {	// Browser provides the co-ords for us easily (zero-indexed)
			x = e.offsetX;
			y = e.offsetY;
		}
		else if (e.target) {		// If we have the 'target' of the (click) event - in this case, the image
			mozilla = true
			var elem = e.target;
			do {						// Calc x and y of 'target' element (ie. the image)
				x += elem.offsetLeft;
				y += elem.offsetTop;
			} while (elem = elem.offsetParent);
			x = (window.pageXOffset + e.clientX) - x;
			y = (window.pageYOffset + e.clientY) - y;
		}
		else {	// Fatal error trying to determine click co-ords!
			fatalerror = 1;
		}

// x and y are still zero-indexed...
		if (!fatalerror) {x++; y++;}

			$P.pointer_x = x
			$P.pointer_y = y
			$P.onCanvas = (e.pageX >= offsetX && e.pageX < offsetX+$P.width && e.pageY >= offsetY && e.pageY < offsetY+$P.height)
            console.log("onCanvas: " + $P.onCanvas)
		}
	},
	isBlack: function(x,y) {
		px = $C.getImageData(x+2,y+2,1,1).data
		return px[0] == 0 && px[1] == 0 && px[2] == 0 && px[3] != 0
	},


	/**
	 * Draws a pixel grid 
	**/
	drawGrid: function(color) {
		color = color || "#cccccc"
		$C.strokeStyle = color
		$C.lineWidth = 1
		for (i=1;i<$P.iconSizeX;i++) {
            (i % 10 == 0) ? $C.strokeStyle = "#ff0000" : $C.strokeStyle = color 
			$C.beginPath()
			$C.moveTo(Math.floor(i*$P.pixelSize),0)
			$C.lineTo(Math.floor(i*$P.pixelSize),$P.height)
			$C.stroke()
		}
		for (i=1;i<$P.iconSizeY;i++) {
            (i % 12 == 0) ? $C.strokeStyle = "#ff0000" : $C.strokeStyle = color 
			$C.beginPath()
			$C.moveTo(0,Math.floor(i*$P.pixelSize))
			$C.lineTo($P.width,Math.floor(i*$P.pixelSize))
			$C.stroke()
		}
	},

	/**
	 * Given a data_url or URL (src), displays it, scaled up without aliasing
	**/
	displayIcon: function(src) {
		$P.displayImage = new Image()
		$P.displayImage.onload = function() {
			$('body').append("<canvas style='' id='displayCanvas'></canvas>")
			var element = $('#displayCanvas')[0]
			element.width = $P.iconSizeX
			element.height = $P.iconSizeY
			var displayCanvasContext = element.getContext('2d')
			displayCanvasContext.drawImage($P.displayImage,0,0,$P.iconSizeX,$P.iconSizeY)
			var img = displayCanvasContext.getImageData(0,0,$P.iconSizeX,$P.iconSizeY).data
			for (i=0;i<img.length/4;i+=1) {
				x = i-(Math.floor(i/$P.iconSizeX)*$P.iconSizeX)
				y = Math.floor(i/$P.iconSizeX)
				j = i*4
				$C.fillStyle = "rgba("+img[j]+","+img[j+1]+","+img[j+2]+","+img[j+3]+")"
				$C.fillRect(x*$P.pixelSize,y*$P.pixelSize,$P.pixelSize,$P.pixelSize)
			}
			$P.generatePermalink()
			if ($P.grid) $P.drawGrid() 
		}
		$P.displayImage.src = src
	},

	/**
	 * Generates a b64 permalink and displays it
	**/
	generatePermalink: function() {
//		s = $P.encodeIconString()
//		$('#permalink').html("/bw8/"+s)
//		$('#permalink')[0].href = "/bw8/"+s
	},

	/**
	 * Converts the icon into a URL string for permalinks, default black & white or "bw"
	**/
	encodeIconString: function(type) {
		if (type == "gs") {
			//greyscale
		} else {
			binary = ""
			for (y=0;y<$P.iconSizeY;y++) {
				for (x=0;x<$P.iconSizeX;x++) {
					data = $C.getImageData(parseInt(x*$P.pixelSize+$P.pixelSize/2),parseInt(y*$P.pixelSize+$P.pixelSize/2),1,1).data
					if (data[0] > 128 || data[3] == 0) binary += "0"
					else binary += "1"
				}
			}
			//console.log(binary + "length: " + binary.length)
			//console.log(parseInt(binary,2))
			return Base64.encode(parseInt(binary,2))
		}
	},

	decodeIconString: function(string,type) {
		string = Base64.decode(string)
		if (type == "gs") {
			//greyscale
		} else {
			binary = parseInt(string).toString(2)
			for (p = 0;p < binary.length;p++) {
				y = Math.floor(p/$P.iconSizeY)
				x = p-(y*$P.iconSizeX)
				if (binary[p] == 1) $C.fillStyle = "black"
				else $C.fillStyle = "white"
				$C.fillRect(x*$P.pixelSize,y*$P.pixelSize,$P.intPixelSize,$P.intPixelSize)
			}
		}
	},

	saveClose: "(<a href='javascript:void()' onClick='$(\"#notice\").hide()'>close</a>)",
	/**
	 * Duh
	**/
	save: function() {
		if ($P.icon_id == 0) url = "/create"
		else url = "/save/"+$P.icon_id
		$('#notice').html("<p>Sending... "+$P.saveClose+"</p>")
		$P.getScaledIcon(function() {
			$.ajax({
				url:url,
				type: "POST",
				data: { image_data: $P.scaled_icon },
				success: function(data) {
					if (data == "Saved!") {
						$('#notice').html("<p>"+data+" "+$P.saveClose+"</p>")
						setTimeout(function(){ $('#notice').html("") },1500)
					} else {
						window.location = "/icon/"+data
					}
				}, 
				failure: function(data) {
					$('#error').html("<p>There was an error"+$P.saveClose+"</p>")
					setTimeout(function(){ $('#error').html("") },1500)
				} 
			})
		})
	},

	/**
	 * Returns a dataURL string of the canvas, resized to $P.iconSize x $P.iconSize
	 */
	getScaledIcon: function(callback) {
		$('body').append("<canvas style='' id='excerptCanvas'></canvas>")
		var element = $('#excerptCanvas')[0]
		element.width = $P.iconSizeX
		element.height = $P.iconSizeY
		var excerptCanvasContext = element.getContext('2d')
		for (var x=0;x<$P.iconSizeX;x++) {
			for (var y=0;y<$P.iconSizeY;y++) {
			var sourcedata = $C.getImageData(x*$P.pixelSize+parseInt($P.pixelSize/2),y*$P.pixelSize+parseInt($P.pixelSize/2),1,1)
			excerptCanvasContext.putImageData(sourcedata,x,y)
			}
		}
		$P.scaled_icon = excerptCanvasContext.canvas.toDataURL()
		callback()
	},
	/**
	 * Returns a dataURL string of any rect from the offered canvas
	 */
	excerptCanvas: function(x1,y1,x2,y2,source) {
		source = source || $C
		var width = x2-x1, height = y2-y1
		$('body').append("<canvas style='' id='excerptCanvas'></canvas>")
		var element = $('#excerptCanvas')[0]
		element.width = width
		element.height = height
		var excerptCanvasContext = element.getContext('2d')
		var sourcedata = source.getImageData(x1,y1,width,height)
		excerptCanvasContext.putImageData(sourcedata,0,0)
		return excerptCanvasContext.canvas.toDataURL()
	}

}
