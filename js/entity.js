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