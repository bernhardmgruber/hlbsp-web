/*
 * entity.js
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
 * Represents an entity in the bsp file.
 */
function Entity(entityString)
{
	var properties;

	this.parseProperties(entityString);
}

Entity.prototype.parseProperties = function(entityString)
{
	this.properties = [];

	var end = -1;
	while(true)
	{
		var begin = entityString.indexOf('"', end + 1);
		if(begin == -1)
			break;
		end = entityString.indexOf('"', begin + 1);
		
		var key = entityString.substring(begin + 1, end);
		
		begin = entityString.indexOf('"', end + 1);
		end = entityString.indexOf('"', begin + 1);
		
		var value = entityString.substring(begin + 1, end);
		
		this.properties[key] = value;
	}
}