// ================================================================================================
// =                                           Globals                                            =
// ================================================================================================

"use strict";

// stores the time of the beginning of execution
var startTime;

// global handle to the gl context
var gl = null;  
    
var logcount = 0;

var LogType =
{
	'NORMAL' : 'normal',
	'SUCCESS' : 'success',
	'WARNING' : 'warning',
	'ERROR' : 'error'
};

var projectionMatrix = new J3DIMatrix4();
var modelviewMatrix = new J3DIMatrix4();

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

function log(message, type)
{
	if(type == undefined)
		type = LogType.NORMAL;

	logcount++;
	
	var currentTime = new Date()

	var html = '<tr class=' + type + '><td>' + logcount + '</td><td>' + (currentTime.getTime() - startTime.getTime()) + 'ms' + '</td><td>' + message + '</td></tr>';
	
	$('#log tbody').append(html);
}

/**
 * Checks the support of necessary file reading APIs.
 */
function checkFileReaderAPI()
{
	if (window.File && window.FileReader && window.FileList && window.Blob)
	{
		log('FileReader API is supported', LogType.SUCCESS);
		return true;
	}
	else
	{
		log('Sorry: Your browser does not support the FileReader API. No BSP files can be loaded!', LogType.ERROR);
		return false;
	}
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

var vertexPositionLocation;
var vertexColorLocation;

var projectionMatrixLocation;
var modelviewMatrixLocation;

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
	
	vertexPositionLocation = gl.getAttribLocation(shaderProgram, "vertexPosition");  
	gl.enableVertexAttribArray(vertexPositionLocation);  
	
	vertexColorLocation = gl.getAttribLocation(shaderProgram, "vertexColor");  
	gl.enableVertexAttribArray(vertexColorLocation);  
	
	
	return true;
}  

var square = 
{
	vertexBuffer : undefined,
	colorBuffer : undefined
};


var coordSystem = 
{
	vertexBuffer : undefined,
	colorBuffer : undefined
};

function initBuffers()
{  
	/**
	 * Square
	 */
	square.vertexBuffer = gl.createBuffer();  
	gl.bindBuffer(gl.ARRAY_BUFFER, square.vertexBuffer);  
		
	var vertices = [  
		 1.0,  1.0, 0.0,  
		-1.0,  1.0, 0.0,  
		 1.0, -1.0, 0.0,  
		-1.0, -1.0, 0.0  
	];  
		
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 
	
	square.colorBuffer = gl.createBuffer();  
	gl.bindBuffer(gl.ARRAY_BUFFER, square.colorBuffer);  
	
	var colors = [  
		1.0,  1.0,  1.0,  1.0,    // white  
		1.0,  0.0,  0.0,  1.0,    // red  
		0.0,  1.0,  0.0,  1.0,    // green  
		0.0,  0.0,  1.0,  1.0     // blue  
	  ]; 
		
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW); 
	
	
	/**
	 * Coord system
	 */
	coordSystem.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.vertexBuffer);
	
	var coordVertices =
	[  
		0.0, 0.0, 0.0,
		100.0, 0.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, 100.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, 0.0, 100.0,

		0.0, 0.0, 0.0,
		-100.0, 0.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, -100.0, 0.0,
		0.0, 0.0, 0.0,
		0.0, 0.0, -100.0,
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
}

function resize()
{
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	
	log('Resizing to ' + width + ' x ' + height);

	projectionMatrix.perspective(45, width / height, 1.0, 1000.0);
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

	gl.bindBuffer(gl.ARRAY_BUFFER, square.vertexBuffer);  
	gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);  
	gl.bindBuffer(gl.ARRAY_BUFFER, square.colorBuffer);  
    gl.vertexAttribPointer(vertexColorLocation, 4, gl.FLOAT, false, 0, 0); 

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	
	
	gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.vertexBuffer);  
	gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, coordSystem.colorBuffer);  
	gl.vertexAttribPointer(vertexColorLocation, 4, gl.FLOAT, false, 0, 0);  
	
	gl.drawArrays(gl.LINES, 0, 12);
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
		$('#info p').text('Rendering at ' + fps + ' FPS');
	}
	
	lastTime = time;
	
	// Update the scene based on the passed time
	update(interval / 1000.0);
	
	// Send all geometry to the renderer
	render();
	
	// Start next frame
	setTimeout(mainloop, 100);
}

function main()
{
	startTime = new Date();
	log('<< STARTUP >>');

	if(!checkFileReaderAPI())
		return;
	if(!initWebGL())
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

	