/*
 * camera.js
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

/**
 * Camera class.
 * Responsible for maintaining the current camera position and view as well as setting the appropriate matrixes.
 */
function Camera()
{
	/** view  */
	this.pitch = 0;
	this.yaw = 0;
	
	/** position */
	this.pos = new Vector3D();
	this.pos.x = 0;
	this.pos.y = 0;
	this.pos.z = 0;
	
	/** Look sensitivity. Applies to mouse movement */
	this.lookSens = 0.25;
	
	/** Move sensitivity. Applies to keyboard movement */
	this.moveSens = 500;
	
	/** The x position of the mouse of the last frame */
	this.lastX;
	
	/** The x position of the mouse of the last frame */
	this.lastY;
	
	/** When set to true, the mouse is tracked by the camera */
	this.captureMouse = false;
}

/**
 * Call this method to begin capturing mouse movements.
 */
Camera.prototype.beginCapture = function()
{
	this.captureMouse = true;
	this.lastX = mouse.x;
	this.lastY = mouse.y;
	console.log('begin capture');
}
	
/**
 * Call this method to end capturing mouse movements.
 */
Camera.prototype.endCapture = function()
{
	this.captureMouse = false;
	console.log('end capture');
}
	
/**
 * Updates the modelview matrix according to user input and time.
 *
 * @param interval The time passed since the last frame in seconds.
 */
Camera.prototype.update = function(interval)
{
	if(this.captureMouse)
	{
		var x = mouse.x;
		var y = mouse.y;

		// Update rotation based on mouse input
		this.yaw += this.lookSens * (this.lastX - x);

		// Correct z angle to interval [0;360]
		if(this.yaw >= 360.0)
			this.yaw -= 360.0;

		if(this.yaw < 0.0)
			this.yaw += 360.0;

		// Update up down view
		this.pitch += this.lookSens * (this.lastY - y);

		// Correct x angle to interval [-90;90]
		if (this.pitch < -90.0)
			this.pitch = -90.0;

		if (this.pitch > 90.0)
			this.pitch = 90.0;

		// Reset track point
		this.lastX = x;
		this.lastY = y;
	}

	var moveFactor = this.moveSens * interval;

	if (keys[16] || keys[32]) // SHIFT or SPACE - UP
	{
		this.pos.z += moveFactor;
	}

	if (keys[17]) // CRTL - DOWN
	{
		this.pos.z -= moveFactor;
	}

	// If strafing and moving reduce speed to keep total move per frame constant
	var strafing = (keys[87] || keys[83]) && (keys[65] || keys[68]);
		
	if(strafing)
		moveFactor = Math.sqrt((moveFactor * moveFactor) / 2.0);
	
	if (keys[87]) // W - FORWARD
	{
		this.pos.x += Math.cos(degToRad(this.yaw)) * moveFactor;
		this.pos.y += Math.sin(degToRad(this.yaw)) * moveFactor;
	}

	if (keys[83]) // S - BACKWARD
	{
		this.pos.x -= Math.cos(degToRad(this.yaw)) * moveFactor;
		this.pos.y -= Math.sin(degToRad(this.yaw)) * moveFactor;
	}

	if (keys[65]) // A - LEFT
	{
		this.pos.x += Math.cos(degToRad(this.yaw + 90.0)) * moveFactor;
		this.pos.y += Math.sin(degToRad(this.yaw + 90.0)) * moveFactor;
	}

	if (keys[68]) // D - RIGHT
	{
		this.pos.x += Math.cos(degToRad(this.yaw - 90.0)) * moveFactor;
		this.pos.y += Math.sin(degToRad(this.yaw - 90.0)) * moveFactor;
	}
	
	//console.log('camera.update() pos: ' + this.pos.x + 'x ' + this.pos.y + 'y ' + this.pos.z + 'z pitch: ' + this.pitch + ' yaw: ' + this.yaw);
}
	
/**
 * Applies the current camera states to OpenGL (modelview matrix).
 */
Camera.prototype.look = function()
{
	// In BSP v30 the z axis points up and we start looking parallel to x axis.
	
	// Look Up/Down
	modelviewMatrix.rotate(-this.pitch - 90.0, 1, 0, 0);
	
	// Look Left/Right
	modelviewMatrix.rotate(-this.yaw + 90.0, 0, 0, 1);
	
	// Move
	modelviewMatrix.translate(-this.pos.x, -this.pos.y, -this.pos.z);
	
	// Upload to shader
	modelviewMatrix.setUniform(gl, modelviewMatrixLocation, false);
}

/** Create a global instance of Camera */
var camera = new Camera();