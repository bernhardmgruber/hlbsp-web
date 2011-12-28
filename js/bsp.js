'use strict';

/**
 * BSP singleton.
 * Responsible for loading, storing and rendering the bsp tree.
 */
function Bsp()
{
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
	
	/** If set to true, all resources are ready to render */
	var loaded = false;
	
	var vertexBuffer;
	var indexBuffer;
	
	var texCoordBuffer;
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
	// Get the leaf where the camera is in
	var cameraLeaf = this.traverseTree(cameraPos);
	console.log("Camera in leaf " + cameraLeaf);
	
	// Bind the vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);  
	gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
	
	// Bind the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	
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
	
	// Prepare the index buffer for the next pass
	var indexes = new Array();

	//console.log("Rendering face " + faceIndex);
	
	//if(faceIndex == 76)
	//	console.log("LOL");
	
    /*if (lightmapAvailable)
    {
        // We need both texture units for textures and lightmaps

        // base texture
        glActiveTexture(GL_TEXTURE0_ARB);
        glBindTexture(GL_TEXTURE_2D, pnTextureLookUp[texInfo.iMiptex]);

        // light map
        glActiveTexture(GL_TEXTURE1_ARB);
        glBindTexture(GL_TEXTURE_2D, pnLightmapLookUp[iFace]);

        glBegin(GL_TRIANGLE_FAN);
        for (int i=0; i<pFaces[iFace].nEdges; i++)
        {
            glMultiTexCoord2f(GL_TEXTURE0_ARB, pFaceTexCoords[iFace].pTexCoords[i].fS, pFaceTexCoords[iFace].pTexCoords[i].fT);
            glMultiTexCoord2f(GL_TEXTURE1_ARB, pFaceTexCoords[iFace].pLightmapCoords[i].fS, pFaceTexCoords[iFace].pLightmapCoords[i].fT);

            // normal
            VECTOR3D vNormal = pPlanes[pFaces[iFace].iPlane].vNormal;
            if (pFaces[iFace].nPlaneSide)
                vNormal = vNormal * -1;
            glNormal3f(vNormal.x, vNormal.y, vNormal.z);

            int iEdge = pSurfEdges[pFaces[iFace].iFirstEdge + i]; // This gives the index into the edge lump

            if (iEdge > 0)
            {
                glVertex3f(pVertices[pEdges[iEdge].iVertex[0]].x, pVertices[pEdges[iEdge].iVertex[0]].y, pVertices[pEdges[iEdge].iVertex[0]].z);
            }
            else
            {
                iEdge *= -1;
                glVertex3f(pVertices[pEdges[iEdge].iVertex[1]].x, pVertices[pEdges[iEdge].iVertex[1]].y, pVertices[pEdges[iEdge].iVertex[1]].z);
            }
        }
        glEnd();
    }
    else
    {*/
	
	// We need one texture unit for either textures or lightmaps
	/*glActiveTexture(GL_TEXTURE0_ARB);

	if(g_bLightmaps)
		glBindTexture(GL_TEXTURE_2D, pnLightmapLookUp[iFace]);
	else
		glBindTexture(GL_TEXTURE_2D, pnTextureLookUp[pTextureInfos[pFaces[iFace].iTextureInfo].iMiptex]);

	glBegin(GL_TRIANGLE_FAN);*/
	for (var i = 0; i < face.edges; i++)
	{
		/*if(g_bLightmaps)
			glTexCoord2f(pFaceTexCoords[iFace].pLightmapCoords[i].fS, pFaceTexCoords[iFace].pLightmapCoords[i].fT);
		else
			glTexCoord2f(pFaceTexCoords[iFace].pTexCoords[i].fS, pFaceTexCoords[iFace].pTexCoords[i].fT);

		// normal
		VECTOR3D vNormal = pPlanes[pFaces[iFace].iPlane].vNormal;
		if (pFaces[iFace].nPlaneSide)
			vNormal = vNormal * -1;
		glNormal3f(vNormal.x, vNormal.y, vNormal.z);*/

		var edgeIndex = this.surfEdges[face.firstEdge + i]; // This gives the index into the edge lump

		if (edgeIndex > 0)
		{
			var edge = this.edges[edgeIndex];
			var vertexIndex = edge.vertices[0];
			indexes.push(vertexIndex);
			//glVertex3f(pVertices[vertexIndex].x, pVertices[vertexIndex].y, pVertices[vertexIndex].z);
		}
		else
		{
			edgeIndex *= -1;
			var edge = this.edges[edgeIndex];
			var vertexIndex = edge.vertices[1];
			indexes.push(vertexIndex);
			//glVertex3f(pVertices[vertexIndex].x, pVertices[vertexIndex].y, pVertices[vertexIndex].z);
		}
	}
	//glEnd();
	
	// Upload the collected vertex indexes to the index buffer and render them
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.DYNAMIC_DRAW);

	gl.drawElements(polygonMode ? gl.LINE_LOOP : gl.TRIANGLE_FAN, indexes.length, gl.UNSIGNED_SHORT, 0);
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
    this.readVertices(src); // also creates vertexBuffer here
    this.readEdges(src);
    this.readFaces(src);
    this.readSurfEdges(src);
    this.readMipTextures(src);
    this.readTextureInfos(src);
    this.readModels(src);
    this.readClipNodes(src);
	
	this.loadEntities(src);
	this.loadLightmaps(src);
	this.loadVIS(src);
	
	// ====================================================================================================
	// =                                          Process input                                           =
	// ====================================================================================================
	
	this.generateTextureCoordinates();
	//this.loadDecals();
	//this.loadSky();
	
	// MISC
	this.indexBuffer = gl.createBuffer();
    
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
	
	this.vertexBuffer = gl.createBuffer();  
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);  
		
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(src.buffer, this.header.lumps[LUMP_VERTICES].offset, this.vertices.length * 3), gl.STATIC_DRAW); 
    
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
        
        this.textureInfos.push(src.readLong());
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

Bsp.prototype.loadLightmaps = function(src)
{

}

Bsp.prototype.loadVIS = function(src)
{

}

Bsp.prototype.generateTextureCoordinates = function()
{
    for (var i = 0; i < this.faces.length; i++)
    {
		var face = this.faces[i];
		var texInfo = this.textureInfos[face.textureInfo];

        for (var j = 0; j < face.edges; j++)
        {
            var edgeIndex = this.surfEdges[face.firstEdge + j];

            if (edgeIndex > 0)
            {
				var edge = this.edges[edgeIndex];
                pFaceTexCoords[i].pTexCoords[j].fS = (DotProduct(pVertices[edge.iVertex[0]], curTexInfo.vS) + curTexInfo.fSShift) / pMipTextures[curTexInfo.iMiptex].nWidth;
                pFaceTexCoords[i].pTexCoords[j].fT = (DotProduct(pVertices[edge.iVertex[0]], curTexInfo.vT) + curTexInfo.fTShift) / pMipTextures[curTexInfo.iMiptex].nHeight;
            }
            else
            {
                edgeIndex *= -1;
				var edge = this.edges[edgeIndex];
                pFaceTexCoords[i].pTexCoords[j].fS = (DotProduct(pVertices[edge.iVertex[1]], curTexInfo.vS) + curTexInfo.fSShift) / pMipTextures[curTexInfo.iMiptex].nWidth;
                pFaceTexCoords[i].pTexCoords[j].fT = (DotProduct(pVertices[edge.iVertex[1]], curTexInfo.vT) + curTexInfo.fTShift) / pMipTextures[curTexInfo.iMiptex].nHeight;
            }
        }
    }
}

var bsp = new Bsp();