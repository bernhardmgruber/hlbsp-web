function handleBSPFileSelection(event)
{
	var file = event.target.files[0];

	var reader = new FileReader();

	reader.onloadstart = function()
	{
		$('#bsploading p:first-child').text('Loading ' + file.name + ' ...');
		$('#bsploading').show();
	}
	
	reader.onprogress = function(event)
	{
		if(event.lengthComputable)
		{
			var value = Math.round(event.loaded / event.total * 100);
			$('#bsploading progress')[0].value = value;
			$('#bsploading p:last-child').text('Loading ... (' + value + '%)');
		}
	}
	
	reader.onload = function(event)
	{
		$('#bsploading progress')[0].value = 100;
		$('#bsploading p:last-child').html('Parsing bsp file ...');
		if(bsp.loadBSP(event.target.result))
			$('#bsploading p:last-child').html('Successfully loaded bsp file');
		else
			$('#bsploading p:last-child').html('Error loading bsp file');
	};

	reader.readAsArrayBuffer(file);
}

// SOME GLOBAL EVENT VARS
var polygonMode = false;
var coordSystem = false;

/**
 * This function is called when the document has finished loading and binds all event handlers to their corresponding objects.
 */
function setEventHandlers()
{
	// Event handler for updating the current key states on key press.
	document.onkeydown = function(event)
	{
		keys[event.keyCode] = true;
		
		switch(event.keyCode)
		{
			case 80: // P
				polygonMode = !polygonMode;
				console.log('Polygonmode: ' + (polygonMode ? 'Wireframe' : 'Fill'));
				break;
			case 67: // C
				coordSystem = !coordSysteM;
				console.log('Coordsystem ' + (coordSystem ? 'enabled' : 'disabled'));
				break;
		}
	};

	// Event handler for updating the current key states on key release.
	document.onkeyup = function(event)
	{
		keys[event.keyCode] = false;
	};

	// Event handler for updating the current mouse position in camera.
	canvas.onmousemove = function(event)
	{
		mouse.x = event.pageX;
		mouse.y = event.pageY;
	};

	// Event handler for mouse down to enable mouse tracking.
	document.onmousedown = function()
	{
		camera.beginCapture();
	}

	// Event handler for mouse up to stop mouse tracking.
	document.onmouseup = function(event)
	{
		camera.endCapture();
	}
	
	document.getElementById('bspfile').addEventListener('change', handleBSPFileSelection, false);
}
				
// register events when the document has finished loading
window.addEventListener('load', setEventHandlers, false);