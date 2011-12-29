'use strict';

/**
 * BSP singleton.
 * Responsible for loading, storing and rendering the bsp tree.
 */
function Bsp()
{
	//
	// Data loaded form the bsp file
	//
    var header;          

    var nodes;
    var leaves;
    var markSurfaces;
    var planes;
    var vertices; // actually not needed for rendering, vertices are stored in vertexBuffer. But just in case someone needs them for e.g. picking etc.
    var edges;
    var faces;
    var surfEdges;
    var textureHeader;
    var mipTextures;
    var textureInfos;
    var models;
    var clipNodes;
	
	//
	// Calculated
	//

	/** Array (for each face) of arrays (for each vertex of a face) of JSONs holding s and t coordinate. */
	var textureCoordinates;
	var lightmapCoordinates;
	
	/** Stores the texture IDs of the lightmaps for each face */
	var lightmapLookup;
	
	//
	// Buffers
	//
	var vertexBuffer;
	var texCoordBuffer;
	var lightmapCoordBuffer;
	var normalBuffer;
	
	/** Holds start index and count of indexes into the buffers for each face. Array of JSONs { start, count } */
	var faceBufferRegions;
	
	/** If set to true, all resources are ready to render */
	var loaded = false;
};

/**
 * Returns the leaf that contains the given position
 *
 * @param pos A Vector3D describing the position to search for.
 * @return Returns the leaf index where the position is found or -1 otherwise.
 */
Bsp.prototype.traverseTree = function(pos, nodeIndex)
{
	if(nodeIndex == undefined)
		nodeIndex = 0;
		
	var node = this.nodes[nodeIndex];
		
    // Run once for each child
    for (var i = 0; i < 2; i++)
    {
        // If the index is positive  it is an index into the nodes array
        if ((node.children[i]) >= 0)
        {
            if(pointInBox(pos, this.nodes[node.children[i]].mins, this.nodes[node.children[i]].maxs))
                return this.traverseTree(pos, node.children[i]);
        }
        // Else, bitwise inversed, it is an index into the leaf array
        // Do not test solid leaf 0
        else if (~this.nodes[nodeIndex].children[i] != 0)
        {
            if(pointInBox(pos, this.leaves[~(node.children[i])].mins, this.leaves[~(node.children[i])].maxs))
                return ~(node.children[i]);
        }
    }

    return -1;
}

/**
 * Renders the complete level
 */
Bsp.prototype.render = function(cameraPos)
{
	gl.uniform1i(texUnitsInUseLocation, 2); // use textures here (tex + lightmap)
	
	// enable/disable the required attribute arrays
	gl.enableVertexAttribArray(texCoordLocation);  	
	gl.enableVertexAttribArray(lightmapCoordLocation);  
	gl.enableVertexAttribArray(normalLocation); 
	gl.disableVertexAttribArray(colorLocation);
	
	// Bind the vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);  
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
	
	// Bind texture coordinate buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
	
	// Bind lightmap coordinate buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.lightmapCoordBuffer);
	gl.vertexAttribPointer(lightmapCoordLocation, 2, gl.FLOAT, false, 0, 0);
	
	// Bind normal coordinate buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
	
	// Get the leaf where the camera is in
	var cameraLeaf = this.traverseTree(cameraPos);
	//console.log("Camera in leaf " + cameraLeaf);
	
	// Start the render traversal
	this.renderNode(0, cameraLeaf, cameraPos);
}

Bsp.prototype.renderNode = function(nodeIndex, cameraLeaf, cameraPos)
{
    if (nodeIndex < 0)
    {
        if (nodeIndex == -1) // Solid leaf 0
            return;

        //if (cameraLeaf > 0)
        //    if (header.lump[LUMP_VISIBILITY].nLength != 0 && ppbVisLists != NULL && ppbVisLists[cameraLeaf - 1] != NULL && !ppbVisLists[cameraLeaf - 1][~nodeIndex - 1])
        //        return;

        this.renderLeaf(~nodeIndex);

        return;
    }

    var distance;
	
	var node = this.nodes[nodeIndex];
	var plane = this.planes[node.plane];

    switch (plane.type)
    {
    case PLANE_X:
        distance = cameraPos.x - plane.dist;
	    break;
    case PLANE_Y:
        distance = cameraPos.y - plane.dist;
		break;
    case PLANE_Z:
        distance = cameraPos.z - plane.dist;
		break;
    default:
        distance = dotProduct(plane.normal, cameraPos) - plane.dist;
    }

    if (distance > 0.0)
    {
        this.renderNode(node.children[1], cameraLeaf, cameraPos);
        this.renderNode(node.children[0], cameraLeaf, cameraPos);
    }
    else
    {
        this.renderNode(node.children[0], cameraLeaf, cameraPos);
        this.renderNode(node.children[1], cameraLeaf, cameraPos);
    }
}

Bsp.prototype.renderLeaf = function(leafIndex)
{
	var leaf = this.leaves[leafIndex];
	
    // Loop through each face in this leaf
    for (var i = 0; i < leaf.markSurfaces; i++)
        this.renderFace(this.markSurfaces[leaf.firstMarkSurface + i]);
}

Bsp.prototype.renderFace = function(faceIndex)
{
	var face = this.faces[faceIndex];
	var texInfo = this.textureInfos[face.textureInfo];
	
    if (face.styles[0] == 0xFF)
        return; // Skip sky faces

	// if the light map offset is not -1 and the lightmap lump is not empty, there are lightmaps
    var lightmapAvailable = face.lightmapOffset != -1 && this.header.lumps[LUMP_LIGHTING].length > 0;
	
	//console.log("Rendering face " + faceIndex);
	
	//gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.lightmapLookup[faceIndex]);

	gl.drawArrays(polygonMode ? gl.LINE_LOOP : gl.TRIANGLE_FAN, this.faceBufferRegions[faceIndex].start, this.faceBufferRegions[faceIndex].count);
}

Bsp.prototype.preRender = function()
{
	var vertices = new Array();
	var texCoords = new Array();
	var lightmapCoords = new Array();
	var normals = new Array();
	
	this.faceBufferRegions = new Array(this.faces.length);
	var elements = 0;

	// for each face
	for(var i = 0; i < this.faces.length; i++)
	{
		var face = this.faces[i];
	
		this.faceBufferRegions[i] = {
			start : elements,
			count : face.edges
		};
		
		var texInfo = this.textureInfos[face.textureInfo];
		var plane = this.planes[face.plane];
		
		var normal = plane.normal;
		
		var faceTexCoords = this.textureCoordinates[i];
		var faceLightmapCoords = this.lightmapCoordinates[i];
		
		for (var j = 0; j < face.edges; j++)
		{
			var edgeIndex = this.surfEdges[face.firstEdge + j]; // This gives the index into the edge lump

			var vertexIndex;
			if (edgeIndex > 0)
			{
				var edge = this.edges[edgeIndex];
				vertexIndex = edge.vertices[0];
			}
			else
			{
				edgeIndex *= -1;
				var edge = this.edges[edgeIndex];
				vertexIndex = edge.vertices[1];
			}
			
			var vertex = this.vertices[vertexIndex];
			
			var texCoord = faceTexCoords[j];
			var lightmapCoord = faceLightmapCoords[j];
			
			// Write to buffers
			vertices.push(vertex.x);
			vertices.push(vertex.y);
			vertices.push(vertex.z);
			
			texCoords.push(texCoord.s);
			texCoords.push(texCoord.t);
			
			lightmapCoords.push(lightmapCoord.s);
			lightmapCoords.push(lightmapCoord.t);
			
			normals.push(normal.x);
			normals.push(normal.y);
			normals.push(normal.z);
			
			elements += 1;
		}
	}

	// Create ALL the buffers !!!
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 
	
	this.texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW); 
	
	this.lightmapCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.lightmapCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lightmapCoords), gl.STATIC_DRAW); 
	
	this.normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW); 
}

/**
 * Loades the complete level and prepares it for rendering
 */
Bsp.prototype.loadBSP = function(arrayBuffer)
{
    console.log('Begin loading BSP');
	this.loaded = false;
    
    var src = new BinaryFile(arrayBuffer);
    
	// ====================================================================================================
	// =                                        Load file content                                         =
	// ====================================================================================================
    if(!this.readHeader(src))
		return false;
		
    this.readNodes(src);
    this.readLeaves(src);
    this.readMarkSurfaces(src);
    this.readPlanes(src);
    this.readVertices(src);
    this.readEdges(src);
    this.readFaces(src);
    this.readSurfEdges(src);
    this.readMipTextures(src);
    this.readTextureInfos(src);
    this.readModels(src);
    this.readClipNodes(src);
	
	this.loadEntities(src);
	this.loadTextures(src); // plus coordinates
	this.loadLightmaps(src);  // plus coordinates
	this.loadVIS(src);
	

	//this.loadDecals();
	//this.loadSky();

	
	// FINALLY create buffers for rendering
	this.preRender();
    
    console.log('Finished loading BSP');
	this.loaded = true;
    
    return true;
}

Bsp.prototype.readHeader = function(src)
{
    this.header = new BspHeader();
    
    this.header.version = src.readLong();
	
	if(this.header.version != 30)
	{
		console.log('Invalid bsp version: ' + this.header.version + ' Only bsp v30 is supported');
		return false;
	}
	
	this.header.lumps = new Array();
    for(var i = 0; i < HEADER_LUMPS; i++)
    {
        var lump = new BspLump();
        
        lump.offset = src.readLong();
        lump.length = src.readLong();
        
        this.header.lumps.push(lump);
    }
    
    console.log('Read ' + this.header.lumps.length + ' lumps');
	
	return true;
}

Bsp.prototype.readNodes = function(src)
{
    src.seek(this.header.lumps[LUMP_NODES].offset);
	
	this.nodes = new Array();

    for(var i = 0; i < this.header.lumps[LUMP_NODES].length / SIZE_OF_BSPNODE; i++)
    {
        var node = new BspNode();
        
        node.plane = src.readULong();
        
		node.children = new Array();
        node.children.push(src.readShort());
        node.children.push(src.readShort());
        
		node.mins = new Array();
        node.mins.push(src.readShort());
        node.mins.push(src.readShort());
        node.mins.push(src.readShort());
        
		node.maxs = new Array();
        node.maxs.push(src.readShort());
        node.maxs.push(src.readShort());
        node.maxs.push(src.readShort());
        
        node.firstFace = src.readUShort();
        node.faces = src.readUShort();
        
        this.nodes.push(node);
    }
    
    console.log('Read ' + this.nodes.length + ' Nodes');
}

Bsp.prototype.readLeaves = function(src)
{
    src.seek(this.header.lumps[LUMP_LEAVES].offset);
	
	this.leaves = new Array();

    for(var i = 0; i < this.header.lumps[LUMP_LEAVES].length / SIZE_OF_BSPLEAF; i++)
    {
        var leaf = new BspNode();
        
        leaf.content = src.readLong();
        
        leaf.visOffset = src.readLong();
        
		leaf.mins = new Array();
        leaf.mins.push(src.readShort());
        leaf.mins.push(src.readShort());
        leaf.mins.push(src.readShort());
        
		leaf.maxs = new Array();
        leaf.maxs.push(src.readShort());
        leaf.maxs.push(src.readShort());
        leaf.maxs.push(src.readShort());
        
        leaf.firstMarkSurface = src.readUShort();
        
        leaf.markSurfaces = src.readUShort();
        
		leaf.ambientLevels = new Array();
        leaf.ambientLevels.push(src.readUByte());
        leaf.ambientLevels.push(src.readUByte());
        leaf.ambientLevels.push(src.readUByte());
        leaf.ambientLevels.push(src.readUByte());
        
        this.leaves.push(leaf);
    }
    
    console.log('Read ' + this.leaves.length + ' Leaves');
}

Bsp.prototype.readMarkSurfaces = function(src)
{
    src.seek(this.header.lumps[LUMP_MARKSURFACES].offset);
	
	this.markSurfaces = new Array();

    for(var i = 0; i < this.header.lumps[LUMP_MARKSURFACES].length / SIZE_OF_BSPMARKSURFACE; i++)
        this.markSurfaces.push(src.readUShort());
    
    console.log('Read ' + this.markSurfaces.length + ' MarkSurfaces');
}

Bsp.prototype.readPlanes = function(src)
{
    src.seek(this.header.lumps[LUMP_PLANES].offset);
	
	this.planes = new Array();
    
    for(var i = 0; i < this.header.lumps[LUMP_PLANES].length / SIZE_OF_BSPPLANE; i++)
    {
        var plane = new BspPlane();
        
        plane.normal = new Vector3D();
        plane.normal.x = src.readFloat();
        plane.normal.y = src.readFloat();
        plane.normal.z = src.readFloat();
        
        plane.dist = src.readFloat();
        
        plane.type = src.readLong();
        
        this.planes.push(plane);
    }
    
    console.log('Read ' + this.planes.length + ' Planes');
}

Bsp.prototype.readVertices = function(src)
{
    src.seek(this.header.lumps[LUMP_VERTICES].offset);
	
	this.vertices = new Array();
    
    for(var i = 0; i < this.header.lumps[LUMP_VERTICES].length / SIZE_OF_BSPVERTEX; i++)
    {
        var vertex = new Vector3D();
        
        vertex.x = src.readFloat();
        vertex.y = src.readFloat();
        vertex.z = src.readFloat();
		
        this.vertices.push(vertex);
    }
    
    console.log('Read ' + this.vertices.length + ' Vertices');
}

Bsp.prototype.readEdges = function(src)
{
    src.seek(this.header.lumps[LUMP_EDGES].offset);
	
	this.edges = new Array();
    
    for(var i = 0; i < this.header.lumps[LUMP_EDGES].length / SIZE_OF_BSPEDGE; i++)
    {
        var edge = new BspEdge();
        
		edge.vertices = new Array();
        edge.vertices.push(src.readUShort());
        edge.vertices.push(src.readUShort());
        
        this.edges.push(edge);
    }
    
    console.log('Read ' + this.edges.length + ' Edges');
}

Bsp.prototype.readFaces = function(src)
{
    src.seek(this.header.lumps[LUMP_FACES].offset);
	
	this.faces = new Array();
    
    for(var i = 0; i < this.header.lumps[LUMP_FACES].length / SIZE_OF_BSPFACE; i++)
    {
        var face = new BspEdge();
        
        face.plane = src.readUShort();
        
        face.planeSide = src.readUShort();
        
        face.firstEdge = src.readULong();
        
        face.edges = src.readUShort();
        
        face.textureInfo = src.readUShort();
        
		face.styles = new Array();
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        
        face.lightmapOffset = src.readULong();
        
        this.faces.push(face);
    }

    console.log('Read ' + this.faces.length + ' Faces');    
}

Bsp.prototype.readSurfEdges = function(src)
{
    src.seek(this.header.lumps[LUMP_SURFEDGES].offset);
	
	this.surfEdges = new Array();

    for(var i = 0; i < this.header.lumps[LUMP_SURFEDGES].length / SIZE_OF_BSPSURFEDGE; i++)
    {
        this.surfEdges.push(src.readLong());
    }
    
    console.log('Read ' + this.surfEdges.length + ' SurfEdges');
}

Bsp.prototype.readTextureHeader = function(src)
{
    src.seek(this.header.lumps[LUMP_TEXTURES].offset);
    
    this.textureHeader = new BspTextureHeader();
    
    this.textureHeader.textures = src.readULong();
    
	this.textureHeader.offsets = new Array();
    for(var i = 0; i < this.textureHeader.textures; i++)
        this.textureHeader.offsets.push(src.readLong());
    
    console.log('Read TextureHeader. Bsp files references/contains ' + this.textureHeader.textures + ' textures');
}

Bsp.prototype.readMipTextures = function(src)
{
    this.readTextureHeader(src);
	
	this.mipTextures = new Array();
    
    for(var i = 0; i < this.textureHeader.textures; i++)
    {
        src.seek(this.header.lumps[LUMP_TEXTURES].offset + this.textureHeader.offsets[i]);
        
        var miptex = new BspMipTexture();
        
        miptex.name = src.readString(MAXTEXTURENAME);
        
        miptex.widht = src.readULong();
        
        miptex.height = src.readULong();
        
		miptex.offsets = new Array();
        for(var j = 0; j < MIPLEVELS; j++)
            miptex.offsets.push(src.readULong());
        
        this.mipTextures.push(miptex);
    }
}

Bsp.prototype.readTextureInfos = function(src)
{
    src.seek(this.header.lumps[LUMP_TEXINFO].offset);
	
	this.textureInfos = new Array();
    
    for(var i = 0; i < this.header.lumps[LUMP_TEXINFO].length / SIZE_OF_BSPTEXTUREINFO; i++)
    {
        var texInfo = new BspTextureInfo();
        
        texInfo.s = new Vector3D();
        texInfo.s.x = src.readFloat();
        texInfo.s.y = src.readFloat();
        texInfo.s.z = src.readFloat();
        
        texInfo.sShift = src.readFloat();
        
        texInfo.t = new Vector3D();
        texInfo.t.x = src.readFloat();
        texInfo.t.y = src.readFloat();
        texInfo.t.z = src.readFloat();
        
        texInfo.tShift = src.readFloat();
        
        texInfo.mipTexture = src.readULong();
        
        texInfo.flags = src.readULong();
        
        this.textureInfos.push(texInfo);
    }
    
    console.log('Read ' + this.textureInfos.length + ' TextureInfos');
}

Bsp.prototype.readModels = function(src)
{
    src.seek(this.header.lumps[LUMP_MODELS].offset);
	
	this.models = new Array();

    for(var i = 0; i < this.header.lumps[LUMP_MODELS].length / SIZE_OF_BSPMODEL; i++)
    {
        var model = new BspModel();
        
		model.mins = new Array();
        model.mins.push(src.readShort());
        model.mins.push(src.readShort());
        model.mins.push(src.readShort());
        
		model.maxs = new Array();
        model.maxs.push(src.readShort());
        model.maxs.push(src.readShort());
        model.maxs.push(src.readShort());
        
        model.origin = new Vector3D();
        model.origin.x = src.readFloat();
        model.origin.y = src.readFloat();
        model.origin.z = src.readFloat();
        
		model.headClipNodes = new Array();
        for(var j = 0; j < MAX_MAP_HULLS; j++)
            model.headClipNodes.push(src.readLong());
            
        model.visLeafs = src.readLong();
        
        model.firstFace = src.readLong();
        
        model.faces = src.readLong();
        
        this.models.push(model);
    }
    
    console.log('Read ' + this.models.length + ' Models');
}

Bsp.prototype.readClipNodes = function(src)
{
    src.seek(this.header.lumps[LUMP_CLIPNODES].offset);
	
	this.clipNodes = new Array();

    for(var i = 0; i < this.header.lumps[LUMP_CLIPNODES].length / SIZE_OF_BSPCLIPNODE; i++)
    {
        var clipNode = new BspClipNode();
        
        clipNode.plane = src.readLong();
        
		clipNode.children = new Array();
        clipNode.children.push(src.readShort());
        clipNode.children.push(src.readShort());
        
        this.clipNodes.push(clipNode);
    }
    
    console.log('Read ' + this.clipNodes.length + ' ClipNodes');
}

Bsp.prototype.loadEntities = function(src)
{

}

Bsp.prototype.loadVIS = function(src)
{

}

Bsp.prototype.loadTextures = function()
{
	this.textureCoordinates = new Array();

    for (var i = 0; i < this.faces.length; i++)
    {
		var face = this.faces[i];
		var texInfo = this.textureInfos[face.textureInfo];
		
		var faceCoords = new Array();

        for (var j = 0; j < face.edges; j++)
        {
            var edgeIndex = this.surfEdges[face.firstEdge + j];

			var vertexIndex;
            if (edgeIndex > 0)
            {
				var edge = this.edges[edgeIndex];
				vertexIndex = edge.vertices[0];
            }
            else
            {
                edgeIndex *= -1;
				var edge = this.edges[edgeIndex];
				vertexIndex = edge.vertices[1];
            }
			
			var vertex = this.vertices[vertexIndex];
			var mipTexture = this.mipTextures[texInfo.mipTexture];
			
			var coord = {
				s : (dotProduct(vertex, texInfo.s) + texInfo.sShift) / mipTexture.width,
                t : (dotProduct(vertex, texInfo.t) + texInfo.tShift) / mipTexture.height
			};
			
			faceCoords.push(coord);
        }
		
		this.textureCoordinates.push(faceCoords);
    }
}

function createTextureFromImage(image)
{
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height))
	{
        // Scale up the texture to the next highest power of two dimensions.
        var canvas = document.createElement("canvas");
        canvas.width = nextHighestPowerOfTwo(image.width);
        canvas.height = nextHighestPowerOfTwo(image.height);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height);
		
		image.width = canvas.width;
		image.height = canvas.height;  
		image.src = canvas.toDataURL(); 
    }
	
	$('body').append('<span>Lightmap (' + image.width + 'x' + image.height + ')</span>').append(image);
	
	//gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    //gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
}
 
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

Bsp.prototype.loadLightmaps = function(src)
{
	this.lightmapCoordinates = new Array();
	this.lightmapLookup = new Array(this.faces.length);
	
	var loadedData = 0;
    var loadedLightmaps = 0;

    for (var i = 0; i < this.faces.length; i++)
    {
		var face = this.faces[i];
		
		var faceCoords = new Array();
	
        if (face.styles[0] != 0 || face.lightmapOffset == -1)
		{
			this.lightmapLookup[i] = 0;
			
			// create dummy lightmap coords
			for (var j = 0; j < face.edges; j++)
				faceCoords.push({ s: 0, t : 0});
			this.lightmapCoordinates.push(faceCoords);
			
			continue;
		}

		/* *********** QRAD ********** */

		var minU = 999999.0;
		var minV = 999999.0;
		var maxU = -99999.0;
		var maxV = -99999.0;

		var texInfo = this.textureInfos[face.textureInfo];
		
		for (var j = 0; j < face.edges; j++)
		{
			var edgeIndex = this.surfEdges[face.firstEdge + j];
			var vertex;
			if (edgeIndex >= 0)
				vertex = this.vertices[this.edges[edgeIndex].vertices[0]];
			else
				vertex = this.vertices[this.edges[-edgeIndex].vertices[1]];

			var u = dotProduct(texInfo.s, vertex) + texInfo.sShift;
			if (u < minU)
				minU = u;
			if (u > maxU)
				maxU = u;

			var v = dotProduct(texInfo.t, vertex) + texInfo.tShift;
			if (v < minV)
				minV = v;
			if (v > maxV)
				maxV = v;
		}

		var texMinU = Math.floor(minU / 16.0);
		var texMinV = Math.floor(minV / 16.0);
		var texMaxU = Math.ceil(maxU / 16.0);
		var texMaxV = Math.ceil(maxV / 16.0);

		var width = Math.floor((texMaxU - texMinU) + 1);
		var height = Math.floor((texMaxV - texMinV) + 1);

		/* *********** end QRAD ********* */

		/* ********** http://www.gamedev.net/community/forums/topic.asp?topic_id=538713 (last refresh: 20.02.2010) ********** */

		var midPolyU = (minU + maxU) / 2.0;
		var midPolyV = (minV + maxV) / 2.0;
		var midTexU = width / 2.0;
		var midTexV = height / 2.0;
		
		var coord;

		for (var j = 0; j < face.edges; ++j)
		{
			var edgeIndex = this.surfEdges[face.firstEdge + j];
			var vertex;
			if (edgeIndex >= 0)
				vertex = this.vertices[this.edges[edgeIndex].vertices[0]];
			else
				vertex = this.vertices[this.edges[-edgeIndex].vertices[1]];

			var u = dotProduct(texInfo.s, vertex) + texInfo.sShift;
			var v = dotProduct(texInfo.t, vertex) + texInfo.tShift;

			var lightMapU = midTexU + (u - midPolyU) / 16.0;
			var lightMapV = midTexV + (v - midPolyV) / 16.0;

			coord = {
				s : lightMapU / width,
				t : lightMapV / height
			}
			
			faceCoords.push(coord);
		}

		/* ********** end http://www.gamedev.net/community/forums/topic.asp?topic_id=538713 ********** */

		var canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext("2d");
		
		var pixels = new Uint8Array(src.buffer, this.header.lumps[LUMP_LIGHTING].offset + face.lightmapOffset, width * height * 3)
		
		var imgData = ctx.createImageData(width, height);
		for (var x = 0; x < width; x++)
		{
			for (var y = 0; y < height; y++)
			{
				var index = (x + y * width) * 4;
				var lmIndex = (x + y * width) * 3;
				imgData.data[index + 0] = pixels[lmIndex + 0];
				imgData.data[index + 1] = pixels[lmIndex + 1];
				imgData.data[index + 2] = pixels[lmIndex + 2];
				imgData.data[index + 3] = 255;
			}
		}
		ctx.putImageData(imgData, 0, 0);
		
		var img = new Image(); 
		img.width = width;
		img.height = height;  
		img.src = canvas.toDataURL();
		
		var texture = createTextureFromImage(img);

		//gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);

		this.lightmapLookup[i] = texture;
		this.lightmapCoordinates.push(faceCoords);
		
		loadedLightmaps++;
		loadedData += width * height * 3;
    }
	
    console.log('Loaded ' + loadedLightmaps + ' lightmaps, lightmapdatadiff: ' + (loadedData - this.header.lumps[LUMP_LIGHTING].length) + ' Bytes ');
}

var bsp = new Bsp();