/*
 * main.js
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

// ================================================================================================
// =                                           Globals                                            =
// ================================================================================================

/** stores the time of the beginning of execution */
var startTime;

/** Global handle to the gl context of the canvas */
var gl = null; 
    
/** Number of log messages posted in the log control */
var logcount = 0;

/**
 * Enumeration type for the different types of log messages.
 */
var LogType =
{
	'NORMAL' : 'normal',
	'SUCCESS' : 'success',
	'WARNING' : 'warning',
	'ERROR' : 'error'
};

/** The projection matrix */
var projectionMatrix = new J3DIMatrix4();

/** The modelview matrix */
var modelviewMatrix = new J3DIMatrix4();

/** Handle to the canvas element where the scene is draw */
var canvas;

/** Stores the global key states */
var keys = new Array(256);

for(var i = 0; i < 256; i++)
	keys[i] = false;

/** Current mouse position */
var mouse =
{
	x : 0,
	y : 0
}

// ================================================================================================
// =                                          Functions                                           =
// ================================================================================================

/**
 * Logs a message in the log window.
 *
 * @param message The message to show in the log window.
 * @param type The type of message to log. @see LogType.
 */
function log(message, type)
{
	if(type == undefined)
		type = LogType.NORMAL;

	logcount++;
	
	var currentTime = new Date()

	var html = '<tr class=' + type + '><td>' + logcount + '</td><td>' + (currentTime.getTime() - startTime.getTime()) + 'ms' + '</td><td>' + message + '</td></tr>';
	
	$('#log tbody').append(html);
	
	console.log("LOG: " + message);
}

/**
 * Checks the support of necessary APIs.
 */
function checkRequiredAPI()
{
	if (window.File && window.FileReader && window.FileList)
		log('FileReader API is supported', LogType.SUCCESS);
	else
	{
		log('Sorry: Your browser does not support the FileReader API. No BSP files can be loaded!', LogType.ERROR);
		return false;
	}
	
	if (window.ArrayBuffer)
		log('ArrayBuffer API is supported', LogType.SUCCESS);
	else
	{
		log('Sorry: Your browser does not support the ArrayBuffer API. No BSP files can be loaded!', LogType.ERROR);
		return false;
	}
	
	// This is VERY new
	// Khronos Editor's Draft 08 December 2011
	// http://www.khronos.org/registry/typedarray/specs/latest/#8
	if (window.DataView)
		log('DataView API is supported', LogType.SUCCESS);
	else
	{
		log('Sorry: Your browser does not support the DataView API. No BSP files can be loaded!', LogType.ERROR);
		return false;
	}
	
	return true;
}

/**
 * Actives the WebGL context on the canvas. Sets var gl to the context handle.
 */
function initWebGL()
{
	var context;

	canvas = $('canvas')[0];

	try
	{  
		// Try to grab the standard context
		log('Trying to get webgl context');
		context = 'webgl';
		gl = canvas.getContext(context);
	}  
	catch(e)
	{
		log('Failed to grab webgl context: ' + e, LogType.ERROR);
	}  
	
	if(!gl)
	{
		try
		{  
			// Try to grab the experimental context
			log('Trying to get experimental-webgl context');
			context = 'experimental-webgl';
			gl = canvas.getContext(context);  
		}  
		catch(e)
		{
			log('Failed to grab experimental-webgl context: ' + e, LogType.ERROR);
		}  
	}
			
	  // If we don't have a GL context, give up now  
	if (gl)
	{
		log('Initialized ' + context + ' context', LogType.SUCCESS);
		return true;
	}
	else
	{
		log('Sorry: Your browser does not support WebGL!', LogType.ERROR);
		return false;
	}
}

/**
 * Reads a shader from the given DOM element's id.
 *
 * @param gl Handle to the OpenGL context.
 * @param id DOM id of element where the shader's source is stored.
 * @return Returns the OpenGL identifier of the shader obtained by calling createShader().
 */
function getShader(gl, id)
{  
    var shaderScript, theSource, currentChild, shader;  
      
    var shaderScript = document.getElementById(id);  
      
    if (!shaderScript) {  
        return null;  
    }  
      
    theSource = "";  
    currentChild = shaderScript.firstChild;  
      
    while(currentChild) {  
        if (currentChild.nodeType == currentChild.TEXT_NODE) {  
            theSource += currentChild.textContent;  
        }  
          
        currentChild = currentChild.nextSibling;  
    }  
	if (shaderScript.type == "x-shader/x-fragment") 
		shader = gl.createShader(gl.FRAGMENT_SHADER);  
	else if (shaderScript.type == "x-shader/x-vertex") 
		shader = gl.createShader(gl.VERTEX_SHADER);  
	else   
		return null;  
		
	gl.shaderSource(shader, theSource);  
      
	gl.compileShader(shader);    
      
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{    
		log('Error compiling shader ' + id + ': ' + gl.getShaderInfoLog(shader), LogType.ERROR);    
		return null;    
	} 
	else
	{
		log('Successfully compiled shader ' + id, LogType.SUCCESS);    
		return shader; 
	} 
}

var projectionMatrixLocation;
var modelviewMatrixLocation;

var positionLocation;
var texCoordLocation;
var lightmapCoordLocation;
var normalLocation;
var colorLocation;

var samplerTextureLocation;
var samplerLightmapLocation;

var texturesEnabledLocation;
var lightmapsEnabledLocation;

var useColorLocation;

var alphaTestLocation;

var alphaLocation;

function initShaders()
{  
	var vertexShader = getShader(gl, "shader-vs");  
	var fragmentShader = getShader(gl, "shader-fs");  
    
	// Create the shader program  
    
	var shaderProgram = gl.createProgram();  
	gl.attachShader(shaderProgram, vertexShader);  
	gl.attachShader(shaderProgram, fragmentShader);  
	gl.linkProgram(shaderProgram);  
    
	// If creating the shader program failed, alert  
    
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{  
		log('Linking the shader program failed', LogType.ERROR);  
		return false;
	}  
    
	gl.useProgram(shaderProgram);  
	log('Successfully linked shader program', LogType.SUCCESS);
    
	// Get variable locations
	projectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'pMatrix');
	modelviewMatrixLocation = gl.getUniformLocation(shaderProgram, 'mvMatrix');

	
	positionLocation = gl.getAttribLocation(shaderProgram, "attribPosition"); 
	texCoordLocation = gl.getAttribLocation(shaderProgram, "attribTexCoord");  
	lightmapCoordLocation = gl.getAttribLocation(shaderProgram, "attribLightmapCoord"); 
	normalLocation = gl.getAttribLocation(shaderProgram, "attribNormal");  
	colorLocation = gl.getAttribLocation(shaderProgram, "attribColor");  

	samplerTextureLocation = gl.getUniformLocation(shaderProgram, "uniSamplerTexture");
	gl.uniform1i(samplerTextureLocation, 0);
	samplerLightmapLocation = gl.getUniformLocation(shaderProgram, "uniSamplerLightmap");
	gl.uniform1i(samplerLightmapLocation, 1);
	
	texturesEnabledLocation = gl.getUniformLocation(shaderProgram, "texturesEnabled");
	gl.uniform1i(texturesEnabledLocation, 1);
	lightmapsEnabledLocation = gl.getUniformLocation(shaderProgram, "lightmapsEnabled");
	gl.uniform1i(lightmapsEnabledLocation, 1);
	
	useColorLocation = gl.getUniformLocation(shaderProgram, "useColor");
	
	alphaTestLocation = gl.getUniformLocation(shaderProgram, "alphaTest");
	
	alphaLocation = gl.getUniformLocation(shaderProgram, "alpha");
	
	//
	// Init some of them
	//
	
	gl.enableVertexAttribArray(positionLocation); // We will always need vertices
	
	gl.uniform1f(alphaLocation, 1.0);
	
	return true;
}  

var coordSystem = 
{
	vertexBuffer : undefined,
	colorBuffer : undefined
};

function initBuffers()
{  
	/**
	 * Coord system
	 */
	coordSystem.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.vertexBuffer);
	
	var coordVertices =
	[  
		0.0, 0.0, 0.0,
		4000.0, 0.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, 4000.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, 0.0, 4000.0,

		0.0, 0.0, 0.0,
		-4000.0, 0.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, -4000.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, 0.0, -4000.0,
	];
		
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordVertices), gl.STATIC_DRAW);
	
	coordSystem.colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.colorBuffer);
	
	var coordColors = 
	[
		1.0, 0.0, 0.0, 1.0,
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		
		0.3, 0.0, 0.0, 1.0,
		0.3, 0.0, 0.0, 1.0,
		0.0, 0.3, 0.0, 1.0,
		0.0, 0.3, 0.0, 1.0,
		0.0, 0.0, 0.3, 1.0,
		0.0, 0.0, 0.3, 1.0,
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordColors), gl.STATIC_DRAW);
	
	return true;
}  

function setStates()
{
	log('Setting states ...');
	
	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	
	gl.cullFace(gl.FRONT);
	gl.enable(gl.CULL_FACE);
}

function resize()
{
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	
	log('Resizing to ' + width + ' x ' + height);

	projectionMatrix.perspective(60.0, width / height, 8.0, 6000.0);
	gl.viewport(0, 0, width, height);
	
	projectionMatrix.setUniform(gl, projectionMatrixLocation, false);
}

/**
 * Updates the scene.
 *
 * @param interval Number seconds passed since the last frame.
 */
function update(interval)
{
	camera.update(interval);
}

function render()
{  
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    
	modelviewMatrix.makeIdentity();
	camera.look();
	//modelviewMatrix.translate(0,0,-10);
	//modelviewMatrix.setUniform(gl, modelviewMatrixLocation, false);
	
	if(bsp.loaded)
		bsp.render(camera.pos);
		
	gl.uniform1i(useColorLocation, 1); // use colors for rendering
	
	// enable/disable the required attribute arrays
	gl.disableVertexAttribArray(texCoordLocation);  	
	gl.disableVertexAttribArray(lightmapCoordLocation);  
	gl.disableVertexAttribArray(normalLocation); 
	gl.enableVertexAttribArray(colorLocation);
	
	if(showCoordSystem)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.vertexBuffer);  
		gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.colorBuffer);  
		gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);  
		
		gl.drawArrays(gl.LINES, 0, 12);
	}
	
	gl.uniform1i(useColorLocation, 0);
}

var lastTime = new Date().getTime();
var fps;
var fpsCounter = 0;
var lastFpsUpdate = 0;

function mainloop()
{
	// Calculate time since the last frame
	var time = new Date().getTime();
	var interval = time - lastTime;
	
	// Update FPS
	fpsCounter++;
	if(time - lastFpsUpdate >= 1000)
	{
		// Update of fps is longer than a second ago
		fps = fpsCounter;
		fpsCounter = 0;
		lastFpsUpdate = time;
		$('#info p:first-child').html('Rendering at <b>' + fps + ' FPS</b>');
	}
	
	lastTime = time;
	
	// Update the scene based on the passed time
	update(interval / 1000.0);
	
	// Send all geometry to the renderer
	render();
	
	// Start next frame
	setTimeout(mainloop, 0);
}

function main()
{
	startTime = new Date();
	log('<< STARTUP >>');

	if(!initWebGL())
		return;
		
	// Show WebGL information
	$('#info img')
	.after('<p>Vendor: <b>' + gl.getParameter(gl.VENDOR) + '</b></p>')
	.after('<p>Renderer: <b>' + gl.getParameter(gl.RENDERER) + '</b></p>')
	.after('<p>Version: <b>' + gl.getParameter(gl.VERSION) + '</b></p>');
	
	if(!checkRequiredAPI())
		return;
	if(!initShaders())
		return;
	if(!initBuffers())
		return;
	
	setStates();
		
	resize();
	
	camera.z = 0;
	
	log('Starting mainloop');
	mainloop();
}

// GET THE BALL ROLLING
window.addEventListener('load', main, false);
