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
    var vertices;
    var edges;
    var faces;
    var surfEdges;
    var textureHeader;
    var mipTextures;
    var textureInfos;
    var models;
    var clipNodes;
};

Bsp.prototype.loadBSP = function(arrayBuffer)
{
    console.log('Begin loading BSP');
    
    var src = new BinaryFile(arrayBuffer);
    
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
    
    console.log('Finished loading BSP');
    
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
        
        leaf.visOffset = src.readShort();
        
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
        
        face.firstEdge = src.readLong();
        
        face.edges = src.readUShort();
        
        face.textureInfo = src.readUShort();
        
		face.styles = new Array();
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        
        face.lightmapOffset = src.readUShort();
        
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

var bsp = new Bsp();