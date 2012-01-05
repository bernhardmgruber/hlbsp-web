/*
 * texutils.js
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

function isPowerOfTwo(x)
{
    return (x & (x - 1)) == 0;
}
 
function nextHighestPowerOfTwo(x)
{
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}

var conversionCanvas = document.createElement("canvas");
var conversionCtx = conversionCanvas.getContext("2d");

/**
 * Converts a raw pixel array into an Image object whose dimensions are powers of two.
 *
 * @param pixelArray An array (or equivalent, must support operator[]) of bytes (e.g. RGBRGBRGB ...)
 * @param width The with of the image.
 * @param height The height of the image.
 * @param channels The number of channels. Must be 3 (RGB) or 4 (RGBA).
 * @return Returns a new Image object containing the given data.
 */
function pixelsToImage(pixelArray, width, height, channels)
{
	conversionCanvas.width = width;
	conversionCanvas.height = height;
	//var ctx = conversionCanvas.getContext("2d");
	
	//
	// Convert
	//
	
	var imgData = conversionCtx.createImageData(width, height);
	for (var x = 0; x < width; x++)
	{
		for (var y = 0; y < height; y++)
		{
			var dataIndex = (x + y * width) * 4;
			var pixelIndex = (x + y * width) * channels;
			imgData.data[dataIndex + 0] = pixelArray[pixelIndex + 0];
			imgData.data[dataIndex + 1] = pixelArray[pixelIndex + 1];
			imgData.data[dataIndex + 2] = pixelArray[pixelIndex + 2];
			if(channels == 4)
				imgData.data[dataIndex + 3] = pixelArray[pixelIndex + 3];
			else
				imgData.data[dataIndex + 3] = 255;
		}
	}
	conversionCtx.putImageData(imgData, 0, 0);
	
	var img = new Image(); 
	img.width = width;
	img.height = height;  
	img.src = conversionCanvas.toDataURL();
	//$('body').append('<span>Texture (' + img.width + 'x' + img.height + ')</span>').append(img);
	
	//
	// Scale
	//
	
	if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height))
	{
		// Scale up the texture to the next highest power of two dimensions.
		conversionCanvas.width = nextHighestPowerOfTwo(img.width);
		conversionCanvas.height = nextHighestPowerOfTwo(img.height);
		//var ctx = conversionCanvas.getContext("2d");
		conversionCtx.drawImage(img, 0, 0, conversionCanvas.width, conversionCanvas.height);
		
		img = new Image();
		img.width = conversionCanvas.width;
		img.height = conversionCanvas.height;  
		img.src = conversionCanvas.toDataURL(); 
	}
	//$('body').append('<span>Texture (' + img.width + 'x' + img.height + ')</span>').append(img);
	
	return img;
}