"use strict";

/**
 * Converts an angle in degrees to radians.
 *
 * @param degree An angle in degrees.
 */
function degToRad(degree)
{
	return degree / 180.0 * Math.PI;
}

/**
 * Camera singleton.
 * Responsible for maintaining the current camera position and view as well as setting the appropriate matrixes.
 */
var camera = new function()
{
	/** view  */
	this.pitch = 0;
	this.yaw = 0;
	
	/** position */
	this.x = 0;
	this.y = 0;
	this.z = 0;
	
	/** Look sensitivity. Applies to mouse movement */
	this.lookSens = 0.15;
	
	/** Move sensitivity. Applies to keyboard movement */
	this.moveSens = 192;
	
	this.lastX;
	this.lastY;
	
	/** When set to true, the mouse is tracked by the camera */
	this.captureMouse = false;

	/**
	 * Call this method to begin capturing mouse movements.
	 */
	this.beginCapture = function()
	{
		this.captureMouse = true;
		this.lastX = mouse.x;
		this.lastY = mouse.y;
		console.log('begin capture');
	}
	
	/**
	 * Calls this method to end capturing mouse movements.
	 */
	this.endCapture = function()
	{
		this.captureMouse = false;
		console.log('end capture');
	}
	
	/**
     * Updates the position of the coord system according to user input and passed time since the last frame
	 */
	this.update = function(interval)
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

        if (keys[16]) // SHIFT - UP
        {
            this.z += moveFactor;
        }

        if (keys[17]) // CRTL - DOWN
        {
            this.z -= moveFactor;
        }

        // If strafing and moving reduce speed to keep total move per frame constant
		var strafing = (keys[87] || keys[83]) && (keys[65] || keys[68]);
		
		if(strafing)
			log("Strafing...");
			
		if(strafing)
			moveFactor = Math.sqrt((moveFactor * moveFactor) / 2.0);
		
        if (keys[87]) // W - FORWARD
        {
            this.x += Math.cos(degToRad(this.yaw)) * moveFactor;
            this.y += Math.sin(degToRad(this.yaw)) * moveFactor;
        }

        if (keys[83]) // S - BACKWARD
        {
            this.x -= Math.cos(degToRad(this.yaw)) * moveFactor;
            this.y -= Math.sin(degToRad(this.yaw)) * moveFactor;
        }

        if (keys[65]) // A - LEFT
        {
            this.x += Math.cos(degToRad(this.yaw + 90.0)) * moveFactor;
            this.y += Math.sin(degToRad(this.yaw + 90.0)) * moveFactor;
        }

        if (keys[68]) // D - RIGHT
        {
            this.x += Math.cos(degToRad(this.yaw - 90.0)) * moveFactor;
            this.y += Math.sin(degToRad(this.yaw - 90.0)) * moveFactor;
        }
		
		console.log('camera.update() pos: ' + this.x + 'x ' + this.y + 'y ' + this.z + 'z pitch: ' + this.pitch + ' yaw: ' + this.yaw);
	}
	
	/**
	 * Applies the current camera states to OpenGL
	 */
	this.look = function()
	{
		// In BSP v30 the z axis points up and we start looking parallel to x axis.
		
		// Look Up/Down
		modelviewMatrix.rotate(-this.pitch - 90.0, 1, 0, 0);
		
		// Look Left/Right
		modelviewMatrix.rotate(-this.yaw + 90.0, 0, 0, 1);
		
		// Move
		modelviewMatrix.translate(-this.x, -this.y, -this.z);
		
		// Upload to shader
		modelviewMatrix.setUniform(gl, modelviewMatrixLocation, false);
		
		console.log('camera.look()');
	}
}