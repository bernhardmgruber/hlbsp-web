'use strict';

/*
typedef struct
{
    char    szMagic[4]; 
    int32_t nDir;       
    int32_t nDirOffset;
} WADHEADER;
*/
function WadHeader()
{
    var magic;     // should be WAD2/WAD3
    var dirs;      // number of directory entries
    var dirOffset; // offset into directory
}
var SIZE_OF_WADHEADER = 12;

// Directory entry structure
/*
typedef struct _WADDIRENTRY
{
    int32_t nFilePos;            
    int32_t nDiskSize;             
    int32_t nSize;                 
    int8_t  nType;                 
    bool    bCompression;  
    int16_t nDummy;             
    char    szName[MAXTEXTURENAME];
} WADDIRENTRY;
*/

function WadDirEntry()
{
    var offset;           // offset in WAD
    var compressedSize;   // size in file
    var size;             // uncompressed size
    var type;             // type of entry
    var compressed;       // 0 if none
    var name;             // must be null terminated
}

/**
 * Wad class.
 * Represents a wad archiev and offers methods for extracting textures from it.
 */
function Wad()
{
	/** Identifies the wad */
	var name;

	var src;
	
	/** Wad file header */
	var header;
	
	/** Array of directory entries */
	var entries;
};

/**
 * Opens the wad file and loads it's directory for texture searching.
 */
Wad.prototype.open = function(buffer)
{
	console.log('Begin loading wad');

	this.src = new BinaryFile(buffer);

	var src = this.src;
	
	var header = new WadHeader();
	header.magic = src.readString(4);
	header.dirs = src.readLong();
	header.dirOffset = src.readLong();
	
	console.log('Header: ' + header.magic + ' (' + header.dirs + ' contained objects)');
	
	if(header.magic != 'WAD2' && header.magic != 'WAD3')
		return false;
	
	this.header = header;
	this.entries = new Array();
	
	src.seek(header.dirOffset);
	
	for(var i = 0; i < header.dirs; i++)
	{
		var entry = new WadDirEntry();
		
		entry.offset = src.readLong();
		entry.compressedSize = src.readLong();
		entry.size = src.readLong();
		entry.type = src.readByte();
		entry.compressed = (src.readUByte() ? true : false);
		src.readUShort();
		entry.name = src.readString(MAXTEXTURENAME);
		
		console.log('Texture #' + i + ' name: ' + entry.name);
		
		this.entries.push(entry);
	}
	
	console.log('Finished loading wad');
	
	return true;
}

/**
 * Finds and loads a texture from the wad file.
 *
 * @param texName The name of the texture to find.
 * @return Returns the OpenGL identifier for the loaded textrue obtained by calling gl.createTexture()
 *         or null if the texture could not be found.
 */
Wad.prototype.loadTexture = function(texName)
{
	// Find cooresponding directory entry
	for(var i = 0; i < this.entries.length; i++)
	{
		var entry = this.entries[i];
		if(entry.name == texName)
			return this.fetchTextureAtOffset(this.src, entry.offset);
	}
	
	return null;
}

/**
 * Static method
 */
Wad.prototype.fetchTextureAtOffset = function(src, offset)
{
	// Seek to the texture beginning
	src.seek(offset);
	
	// Load texture header
	var mipTex = new BspMipTexture();
	mipTex.name = src.readString(MAXTEXTURENAME);
	mipTex.width = src.readULong();
	mipTex.height = src.readULong();
	mipTex.offsets = new Array();
	for(var i = 0; i < MIPLEVELS; i++)
		mipTex.offsets.push(src.readULong());

	// Fetch color palette
	var paletteOffset = mipTex.offsets[MIPLEVELS - 1] + ((mipTex.width / 8) * (mipTex.height / 8)) + 2;
	
	var palette = new Uint8Array(src.buffer, offset + paletteOffset, 256 * 3);

	// Generate texture
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

    //for (var i = 0; i < MIPLEVELS; i++) // ONLY LOAD FIRST MIPLEVEL !!!
    {   
		// Width and height shrink to half for every level
		var width = mipTex.width; //>> i;
		var height = mipTex.height; // >> i;
		
		// Fetch the indexed texture
		var textureIndexes = new Uint8Array(src.buffer, offset + mipTex.offsets[0 /*i*/], width * height);
		
		// Allocate storage for the rgba texture
		var textureData = new Array(width * height * 4);

		// Translate the texture from indexes to rgba
        for (var j = 0; j < width * height; j++)
        {
                var paletteIndex = textureIndexes[j] * 3;

                textureData[j * 4]     = palette[paletteIndex];
                textureData[j * 4 + 1] = palette[paletteIndex + 1];
                textureData[j * 4 + 2] = palette[paletteIndex + 2];
                textureData[j * 4 + 3] = 255; //every pixel is totally opaque
        }

		// Upload the data to OpenGL
		var img = pixelsToImage(textureData, width, height, 4);
		
		gl.texImage2D(gl.TEXTURE_2D, 0 /*i*/, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    }
	
	//$('body').append('<span>Texture (' + img.width + 'x' + img.height + ')</span>').append(img);
	
	// Configure texture
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.generateMipmap(gl.TEXTURE_2D);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, MIPLEVELS - 1);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	return texture;
}

/** Stores all loaded wads */
var loadedWads = new Array();