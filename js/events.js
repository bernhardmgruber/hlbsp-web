/*
 * events.js
 * 
 * Copyright (c) 2012, Bernhard Manfred Gruber. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301  USA
 */

'use strict';

//
// bsp file
//

/**
 * Handles the loading of a bsp file.
 * Displays a loading bar and starts the parsing process by calling Bsp.loadBSP().
 * 
 * @param file A file obtained by a drag/drop event or file selection event.
 */
function handleBspFileLoading(file)
{
	// Remove previously loaded date and elements
	$('#wadmissing').slideUp(300);
	$('#wadmissing > ul > li').remove();
	if(bsp.loaded)
		bsp.unload();
	
	var reader = new FileReader();

	reader.onloadstart = function()
	{
		$('#bsploading p:first-child').html('Loading ' + file.name + ' ...');
		$('#bsploading').slideDown(300);
	}
	
	reader.onprogress = function(event)
	{
		if(event.lengthComputable)
		{
			var value = Math.round(event.loaded / event.total * 100);
			$('#bsploading progress')[0].value = value;
			$('#bsploading p:last-child').html('Reading ... (' + value + '%)');
		}
	}
	
	reader.onload = function(event)
	{
		$('#bsploading progress')[0].value = 100;
		$('#bsploading p:last-child').html('Parsing bsp file ...');
		log('Loading bsp file ' + file.name);
		if(bsp.loadBSP(event.target.result))
		{
			$('#bsploading p:last-child').html('Successfully loaded bsp file');
			setTimeout("$('#bsploading').slideUp(300)", 2000);
		}
		else
			$('#bsploading p:last-child').html('Error loading bsp file');
	};

	reader.readAsArrayBuffer(file);
}

/**
 * Handles the selection of a bsp file.
 * Calls handleBspFileLoading().
 */
function handleBspFileSelection(event)
{
	var file = event.target.files[0];
	handleBspFileLoading(file);
}

/**
 * Handles the drag&drop of a bsp file.
 * Calls handleBspFileLoading().
 */
function handleBspFileDrop(event)
{
    event.stopPropagation();
    event.preventDefault();

    var file = event.dataTransfer.files[0]; // FileList object.
	handleBspFileLoading(file);
}

/**
 * Displays a small information window when the user drags a bsp file over the control.
 */
function handleBspFileDragOver(event)
{
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'drop here to load'; 
}

//
// wad file
//

/**
 * Handles the loading of a wad file.
 * Displays a loading bar and starts the parsing process by calling Wad.open().
 * 
 * @param files A FileList object obtained by a drag/drop event or file selection event.
 */
function handleWadFileLoading(files)
{
	for (var i = 0, file; file = files[i]; i++)
	{
		var name = file.name;
	
		// Create a new control window for this loading process
		var control = $('<li class="wadloading" data-name="' + name + '">' +
							'<p></p>' +
					        '<progress max="100"></progress>' +
							'<p></p>' +
						'</li>').hide();
							
		$('#wads').after(control);
		

		
		
		var reader = new FileReader();

		reader.onloadstart = function()
		{	
			control.find('p:first-child').html('Loading ' + name + ' ...')
			control.slideDown(300);
			//$('.wadloading[name="' + name + '"] p:first-child').html('Loading ' + name + ' ...').slideDown(300);
		}
		
		reader.onprogress = function(event)
		{
			if(event.lengthComputable)
			{
				var value = Math.round(event.loaded / event.total * 100);
				
				control.find('progress')[0].value = value;
				//$('.wadloading[name="' + name + '"] progress')[0].value = value;
				control.find('p:last-child').html('Reading ... (' + value + '%)');
				//$('.wadloading[name="' + name + '"] p:last-child').html('Loading ... (' + value + '%)');
			}
		}
		
		reader.onload = function(event)
		{
			control.find('progress')[0].value = 100;
			//$('.wadloading[name="' + name + '"] progress')[0].value = 100;
			control.find('p:last-child').html('Parsing wad file ...');
			//$('.wadloading[name="' + name + '"] p:last-child').html('Parsing wad file ...');
			
			log('Loading wad file ' + name);
			var wad = new Wad();
			wad.name = name;
			if(wad.open(event.target.result))
			{
				loadedWads.push(wad);
			
				control.find('p:last-child').html('Successfully loaded wad file.');
				//$('.wadloading[name="' + name + ' p:last-child').html('Successfully loaded wad file');
				setTimeout("$('.wadloading').filter(function() { if($(this).attr('data-name') == '" + name + "') return true; else return false; }).slideUp(300)", 2000);
				
				// remove missing wad from bsp and from control panel
				if(bsp.loaded)
				{
					for(var j = 0; j < bsp.missingWads.length; j++)
					{
						if(bsp.missingWads[j] == name)
						{
							bsp.missingWads.splice(j, 1);
							break;
						}
					}
					
					$('#wadmissing > ul > li').filter(function() { if($(this).attr('data-name') == name) return true; else return false; }).remove();
				
					if($('#wadmissing > ul > li').size() == 0)
						setTimeout("$('#wadmissing').slideUp(300);", 2000);
				}
				
				// add this wad to the loaded ones in the control panel
				$('#wads > ul').append('<li data-name="' + name + '"><span class="success">' + name + '</span></li>');
				
				// try to load missing textures of the bsp file
				if(bsp.loaded)
					bsp.loadMissingTextures();
			}
			else
				control.find('p:last-child').html('Error loading wad file');
		};

		reader.readAsArrayBuffer(file);
	}
}

/**
 * Handles the selection of a wad file.
 * Calls handleWadFileLoading().
 */
function handleWadFileSelection(event)
{
	var files = event.target.files;
	handleWadFileLoading(files);
}

/**
 * Handles the drag&drop of a wad file.
 * Calls handleWadFileLoading().
 */
function handleWadFileDrop(event)
{
    event.stopPropagation();
    event.preventDefault();

    var files = event.dataTransfer.files; // FileList object.

	handleWadFileLoading(files);
}

/**
 * Displays a small information window when the user drags a bsp file over the control.
 */
function handleWadDragOver(event)
{
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'drop here to load'; 
}

//
// SOME GLOBAL EVENT VARS
//

/** If set to true, polyons will be rendered wireframe */
var polygonMode = false;

/** If set to true, the coordinate system is shown */
var showCoordSystem = false;

/** If set to true, textures (not lightmaps) will be rendered */
var renderTextures = true;

/** If set to true, lightmaps will be rendered */
var renderLightmaps = true;

/**
 * This function is called when the document has finished loading and
 * binds all event handlers to their corresponding objects.
 */
function setEventHandlers()
{
	// Event handler for updating the current key states on key press.
	document.onkeydown = function(event)
	{
		keys[event.keyCode] = true;
		
		switch(event.keyCode)
		{
			case 67: // C
				showCoordSystem = !showCoordSystem;
				console.log('Coordsystem ' + (showCoordSystem ? 'enabled' : 'disabled'));
				break;
			case 76: // L
				renderLightmaps = !renderLightmaps;
				gl.uniform1i(lightmapsEnabledLocation, renderLightmaps ? 1 : 0);
				console.log((renderLightmaps ? 'Enabled' : 'Disabled') + ' rendering lightmaps');
				break;
			case 80: // P
				polygonMode = !polygonMode;
				console.log('Polygonmode: ' + (polygonMode ? 'Wireframe' : 'Fill'));
				break;
			case 84: // T
				renderTextures = !renderTextures;
				gl.uniform1i(texturesEnabledLocation, renderTextures ? 1 : 0);
				console.log((renderTextures ? 'Enabled' : 'Disabled') + ' rendering textures');
				break;
		}
	};

	// Event handler for updating the current key states on key release.
	document.onkeyup = function(event)
	{
		keys[event.keyCode] = false;
	};

	// Event handler for updating the current mouse position in camera.
	document.onmousemove = function(event)
	{
		mouse.x = event.pageX;
		mouse.y = event.pageY;
	};

	// Event handler for mouse down to enable mouse tracking.
	canvas.onmousedown = function()
	{
		camera.beginCapture();
	}

	// Event handler for mouse up to stop mouse tracking.
	document.onmouseup = function(event)
	{
		camera.endCapture();
	}
	
	document.getElementById('bspfile').addEventListener('change', handleBspFileSelection, false);
	document.getElementById('bsploading').addEventListener('dragover', handleBspFileDragOver, false);
	document.getElementById('bsploading').addEventListener('drop', handleBspFileDrop, false);
	document.getElementById('wadfiles').addEventListener('change', handleWadFileSelection, false);
	document.getElementById('wads').addEventListener('dragover', handleWadDragOver, false);
	document.getElementById('wads').addEventListener('drop', handleWadFileDrop, false);
}
				
// register events when the document has finished loading
window.addEventListener('load', setEventHandlers, false);