/*
 * mathlib.js
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
// Provides basic mathematical routines for vector processing.
//
 
 /** Defines the epsilon used for collision detection */
var EPSILON = 0.03125 // 1/32
 
 /**
  * Structure for representing a point (or vector) in 3D space.
  *
  * @param v Optional. An instance of Vector3D to copy.
  */
function Vector3D(v)
{
	var x;
	var y;
	var z;
	
	if(v != undefined)
	{
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
	}
}

/**
 * Vector addition.
 */
function vectorAdd(a, b)
{
	var result = new Vector3D();
	result.x = a.x + b.x;
	result.y = a.y + b.y;
	result.z = a.z + b.z;
	return result;
}

/**
 * Vector subtraction.
 */
function vectorSub(a, b)
{
	var result = new Vector3D();
	result.x = a.x - b.x;
	result.y = a.y - b.y;
	result.z = a.z - b.z;
	return result;
}

/**
 * Multiplies a vector with a scalar.
 */
function vectorMul(v, s)
{
	var result = new Vector3D(v);
	result.x *= s;
	result.y *= s;
	result.z *= s;
	return result;
}

/**
 * Checks whether or not two vectors are equal.
 */
function vectorEquals(a, b)
{
	return (a.x == b.x) && (a.y == b.y) && (a.z == b.z);
}

/**
 * Returns the dot product of two vectors.
 */
function dotProduct(a, b)
{
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

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
 * Tests whether or not the given point is in the axis aligned bounding box spaned by mins and maxs.
 *
 * @return Returns true when the point is inside or directly on the box surface.
 */
function pointInBox(point, mins, maxs)
{
    if((mins[0] <= point.x && point.x <= maxs[0] &&
        mins[1] <= point.y && point.y <= maxs[1] &&
        mins[2] <= point.z && point.z <= maxs[2]) ||
       (mins[0] >= point.x && point.x >= maxs[0] &&
        mins[1] >= point.y && point.y >= maxs[1] &&
        mins[2] >= point.z && point.z >= maxs[2]))
        return true;
    else
        return false;
}
