'use strict';
 
 /**
 * Class for reading c-style datatypes from a raw ArrayBuffer obtained by reading a binary file.
 * The following code has been inspirated by Brandon Jones's High performance Binary Reader
 * http://media.tojicode.com/q3bsp/js/common/binFile_man.js
 */
function BinaryFile(arrayBuffer)
{
	this.buffer = arrayBuffer;
	this.view = new DataView(this.buffer);
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
	var str = '';
	for(var i = 0; i < length; i++)
	{
		str += String.fromCharCode(this.view.getUint8(this.offset));
		this.offset += 1;
	}
	console.log('Decoded string: [' + str + ']');
	return str;
};