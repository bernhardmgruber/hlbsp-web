"use strict";

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
    console.log("Begin loading BSP");
    
    var src = new BinaryFile(arrayBuffer);
    
    this.readHeader(src);
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
    
    console.log("Finished loading BSP");
    
    return true;
}

Bsp.prototype.readHeader = function(src)
{
    this.header = new BspHeader();
    
    this.header.version = src.readLong();
    
    for(var i = 0; i < HEADER_LUMPS; i++)
    {
        var lump = new BspLump();
        
        lump.offset = src.readLong();
        lump.length = src.readLong();
        
        this.header.lumps.push(lump);
    }
    
    console.log("read " + header.lumps.length + " lumps");
}

Bsp.prototype.readNodes = function(src)
{
    src.seek(header.lumps[LUMP_NODES].offset);

    for(var i = 0; i < header.lumps[LUMP_NODES].length / SIZE_OF_BSPNODE; i++)
    {
        var node = new BspNode();
        
        node.plane = src.readULong();
        
        node.children.push(src.readShort());
        node.children.push(src.readShort());
        
        node.mins.push(src.readShort());
        node.mins.push(src.readShort());
        node.mins.push(src.readShort());
        
        node.maxs.push(src.readShort());
        node.maxs.push(src.readShort());
        node.maxs.push(src.readShort());
        
        node.firstFace = src.readUShort();
        node.faces = src.readUShort();
        
        this.nodes.push(node);
    }
    
    console.log("Read " + nodes.length + " Nodes");
}

Bsp.prototype.readLeaves = function(src)
{
    src.seek(header.lumps[LUMP_LEAVES].offset);

    for(var i = 0; i < header.lumps[LUMP_LEAVES].length / SIZE_OF_BSPLEAF; i++)
    {
        var leaf = new BspNode();
        
        leaf.content = src.readLong();
        
        leaf.visOffset = src.readShort();
        
        leaf.mins.push(src.readShort());
        leaf.mins.push(src.readShort());
        leaf.mins.push(src.readShort());
        
        leaf.maxs.push(src.readShort());
        leaf.maxs.push(src.readShort());
        leaf.maxs.push(src.readShort());
        
        leaf.firstMarkSurface = src.readUShort();
        
        leaf.markSurfaces = src.readUShort();
        
        leaf.ambientLevels.push(src.readUByte());
        leaf.ambientLevels.push(src.readUByte());
        leaf.ambientLevels.push(src.readUByte());
        leaf.ambientLevels.push(src.readUByte());
        
        this.leaves.push(leaf);
    }
    
    console.log("Read " + leaves.length + " Leaves");
}

Bsp.prototype.readMarkSurfaces = function(src)
{
    src.seek(header.lumps[LUMP_MARKSURFACES].offset);

    for(var i = 0; i < header.lumps[LUMP_MARKSURFACES].length / SIZE_OF_BSPMARKSURFACE; i++)
    {
        marksurfaces.push(src.readUShort());
    }
    
    console.log("Read " + marksurfaces.length + " MarkSurfaces");
}

Bsp.prototype.readPlanes = function(src)
{
    src.seek(header.lumps[LUMP_PLANES].offset);
    
    for(var i = 0; i < header.lumps[LUMP_PLANES].length / SIZE_OF_BSPPLANE; i++)
    {
        var plane = new BspPlane();
        
        plane.normal = new Vector3D();
        plane.normal.x = src.readFloat();
        plane.normal.y = src.readFloat();
        plane.normal.z = src.readFloat();
        
        plane.dist = src.readFloat();
        
        plane.type = src.readLong();
        
        planes.push(plane);
    }
    
    console.log("Read " + planes.length + " Planes");
}

Bsp.prototype.readVertices = function(src)
{
    src.seek(header.lumps[LUMP_VERTICES].offset);
    
    for(var i = 0; i < header.lump[LUMP_VERTICES].length / SIZE_OF_BSPVERTEX; i++)
    {
        var vertex = new Vector3D();
        
        vertex.x = src.readFloat();
        vertex.y = src.readFloat();
        vertex.z = src.readFloat();
        
        vertices.push(vertex);
    }
    
    console.log("Read " + vertices.length + " Vertices");
}

Bsp.prototype.readEdges = function(src)
{
    src.seek(header.lump[LUMP_EDGES].offset);
    
    for(var i = 0; i < header.lump[LUMP_EDGES].length / SIZE_OF_BSPEDGE; i++)
    {
        var edge = new BspEdge();
        
        edge.vertices.push(src.readUShort());
        edge.vertices.push(src.readUShort());
        
        edges.push(edge);
    }
    
    console.log("Read " + edges.length + " Edges");
}

Bsp.prototype.readFaces = function(src)
{
    src.seek(header.lump[LUMP_FACES].offset);
    
    for(var i = 0; i < header.lump[LUMP_FACES].length / SIZE_OF_BSPFACE; i++)
    {
        var face = new BspEdge();
        
        face.plane = src.readUShort();
        
        face.planeSide = src.readUShort();
        
        face.firstEdge = src.readLong();
        
        face.edges = src.readUShort();
        
        face.textureInfo = src.readUShort();
        
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        face.styles.push(src.readUByte());
        
        face.lightmapOffset = src.readUShort();
        
        faces.push(face);
    }

    console.log("Read " + faces.length + " Faces");    
}

Bsp.prototype.readSurfEdges = function(src)
{
    src.seek(header.lumps[LUMP_SURFEDGES].offset);

    for(var i = 0; i < header.lumps[LUMP_SURFEDGES].length / SIZE_OF_BSPSURFEDGE; i++)
    {
        surfEdges.push(src.readLong());
    }
    
    console.log("Read " + surfEdges.length + " SurfEdges");
}

Bsp.prototype.readTextureHeader = function(src)
{
    src.seek(header.lumps[LUMP_TEXTURES].offset);
    
    this.textureHeader = new BspTextureHeader();
    
    this.textureHeader.textures = src.readULong();
    
    for(var i = 0; i < this.textureHeader.textures; i++)
        this.textureHeader.offsets.push(src.readLong());
    
    console.log("Read TextureHeader. Bsp files references/contains " + this.textureHeader.textures + " textures");
}

Bsp.prototype.readMipTextures = function(src)
{
    this.readTextureHeader();
    
    for(var i = 0; i < this.textureHeader.textures; i++)
    {
        src.seek(header.lumps[LUMP_TEXTURES].offset + this.textureHeader.offsets[i]);
        
        var miptex = new BspMipTexture();
        
        miptex.name = src.readString(MAXTEXTURENAME);
        
        miptex.widht = src.readULong();
        
        miptex.height = src.readULong();
        
        for(j = 0; j < MIPLEVELS; j++)
            miptex.offsets.push(src.readULong());
        
        this.mipTextures.push(miptex);
    }
}

Bsp.prototype.readTextureInfos = function(src)
{
    src.seek(header.lumps[LUMP_TEXINFOS].offset);
    
    for(var i = 0; i < header.lumps[LUMP_TEXINFOS].length / SIZE_OF_BSPTEXTUREINFO; i++)
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
        
        textureInfos.push(src.readLong());
    }
    
    console.log("Read " + textureInfos.length + " TextureInfos");
}

Bsp.prototype.readModels = function(src)
{
    src.seek(header.lumps[LUMP_MODELS].offset);

    for(var i = 0; i < header.lumps[LUMP_MODELS].length / SIZE_OF_BSPMODEL; i++)
    {
        var model = new BspModel();
        
        model.mins.push(src.readShort());
        model.mins.push(src.readShort());
        model.mins.push(src.readShort());
        
        model.maxs.push(src.readShort());
        model.maxs.push(src.readShort());
        model.maxs.push(src.readShort());
        
        model.origin = new Vector3D();
        model.origin.x = src.readFloat();
        model.origin.y = src.readFloat();
        model.origin.z = src.readFloat();
        
        for(var j = 0; j < MAX_MAP_HULLS; j++)
            model.headClipNodes.push(src.readLong());
            
        model.visLeafs = src.readLong();
        
        model.firstFace = src.readLong();
        
        model.faces = src.readLong();
        
        models.push(model);
    }
    
    console.log("Read " + models.length + " Models");
}

Bsp.prototype.readClipNodes = function(src)
{
    src.seek(header.lumps[LUMP_CLIPNODES].offset);

    for(var i = 0; i < header.lumps[LUMP_CLIPNODES].length / SIZE_OF_BSPCLIPNODE; i++)
    {
        var clipNode = new BspClipNode();
        
        clipNode.plane = src.readLong();
        
        clipNode.children.push(src.readShort());
        clipNode.children.push(src.readShort());
        
        clipNodes.push(clipNode);
    }
    
    console.log("Read " + clipNodes.length + " ClipNodes");
}

var bsp = new Bsp();