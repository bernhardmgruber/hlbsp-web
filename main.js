// ================================================================================================
// =                                           Globals                                            =
// ================================================================================================

"use strict";

// save the time of beginning execution
var startTime = new Date();

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

function log(message, type)
{
	if(type == undefined)
		type = LogType.NORMAL;

	logcount++;
	
	var currentTime = new Date()

	var html = '<tr class=' + type + '><td>' + logcount + '</td><td>' + (currentTime.getTime() - startTime.getTime()) + 'ms' + '</td><td>' + type + '</td><td>' + message + '</td></tr>';
	
	$('#log > tbody').append(html);
}

/**
 * Actives the WebGL context on the canvas. Sets var gl to the context handle.
 */
function initWebGL()
{
	var context;

	canvas = $('#canvas')[0];

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

var vertexPositionAttribute;

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
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");  
	gl.enableVertexAttribArray(vertexPositionAttribute);  
	
	projectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'pMatrix');
	modelviewMatrixLocation = gl.getUniformLocation(shaderProgram, 'mvMatrix');
	
	return true;
}  

var squareVerticesBuffer;

function initBuffers()
{  
	squareVerticesBuffer = gl.createBuffer();  
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);  
		
	var vertices = [  
		 1.0,  1.0, 0.0,  
		-1.0,  1.0, 0.0,  
		 1.0, -1.0, 0.0,  
		-1.0, -1.0, 0.0  
	];  
		
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 
	
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

	projectionMatrix.perspective(45, width / height, 0.1, 100.0);
	gl.viewport(0, 0, width, height);
	
	projectionMatrix.setUniform(gl, projectionMatrixLocation, false);
}

function render()
{  
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    
	modelviewMatrix.makeIdentity();
	modelviewMatrix.translate(0,0,-10);
	modelviewMatrix.setUniform(gl, modelviewMatrixLocation, false);

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);  
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);  

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	
	setTimeout('render();', 500);
}

function main()
{
	if(!initWebGL())
		return;
	if(!initShaders())
		return;
	if(!initBuffers())
		return;
	
	setStates();
		
	resize();
	
	log('Start rendering');
	render();
}

window.onload = main;