"use strict";

/**
 * Provides basic mathematical routines for vector processing.
 */
 
function Vector3D()
{
	var x;
	var y;
	var z;
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

function dotProduct(a, b)
{
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}