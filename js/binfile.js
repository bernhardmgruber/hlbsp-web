/*
 * binfile.js
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
 * Class for reading c-style datatypes from a raw ArrayBuffer obtained by reading a binary file.
 * The following code has been inspirated by Brandon Jones's High performance Binary Reader
 * http://media.tojicode.com/q3bsp/js/common/binFile_man.js
 * but has been rewritten using the DataView class.
 */
function BinaryFile(arrayBuffer)
{
	this.buffer = arrayBuffer;
	this.view = new jDataView(this.buffer); // we use the jDataView wrapper class here to provide backward compability
	this.offset = 0;
};

BinaryFile.prototype.seek = function(offest)
{
	this.offset = offest;
};

BinaryFile.prototype.readByte = function()
{
	var b = this.view.getInt8(this.offset);
	this.offset += 1;
	return b;
};

BinaryFile.prototype.readUByte = function()
{
	var b = this.view.getUint8(this.offset);
	this.offset += 1;
	return b;
};

BinaryFile.prototype.readShort = function()
{
	var s = this.view.getInt16(this.offset, true);
	this.offset += 2;
	return s;
};

BinaryFile.prototype.readUShort = function()
{
	var s = this.view.getUint16(this.offset, true);
	this.offset += 2;
	return s;
};

BinaryFile.prototype.readLong = function()
{
	var l = this.view.getInt32(this.offset, true);
	this.offset += 4;
	return l;
};

BinaryFile.prototype.readULong = function()
{
	var l = this.view.getUint32(this.offset, true);
	this.offset += 4;
	return l;
};

BinaryFile.prototype.readFloat = function()
{
	var f = this.view.getFloat32(this.offset, true);
	this.offset += 4;
	return f;
};

BinaryFile.prototype.readString = function(length)
{
	var offset = this.offset; // keep an independent copy
	var str = '';
	for(var i = 0; i < length; i++)
	{
		var ascii = this.view.getUint8(offset);
		if(ascii == 0)
			break;
		str += String.fromCharCode(ascii);
		offset += 1;
	}
	
	this.offset += length;

	return str;
};