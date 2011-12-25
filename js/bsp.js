"use strict";

/**
 * BSP singleton.
 * Responsible for loading, storing and rendering the bsp tree.
 */
var bsp = new function()
{
    var nNodes;           // Number of nodes
    var nLeafs;           // Number of leafs
    var nMarkSurfaces;    // Number of marksurfaces
    var nPlanes;          // Number of planes
    var nVertices;        // Number of vertices
    var nEdges;           // Number of edges
    var nFaces;           // Number of faces
    var nClipNodes;       // Number of clipnodes (not needed)
    var nSurfEdges;       // Number of surface edges
    var nModels;          // Number of models
    var nTextureInfos;    // Number of texture infos
    var nEntities;        // Number of entities
    var nBrushEntities;   // Number of brush entities
    var nSpecialEntities; // Number of special entities
    var nWadFiles;        // Number of wad files
    var nDecals;          // Number of decals


	this.loadBSPFromMemory = function(arrayBuffer)
	{
		alert("Begin loading BSP");
		
		return true;
	}

};