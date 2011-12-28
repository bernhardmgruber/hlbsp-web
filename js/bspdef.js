'use strict';

/**
 * Contains the standard BSP v30 file definitions.
 * For closer information visit my hlbsp project:
 * http://hlbsp.sourceforge.net/index.php?content=bspdef
 */

var MAX_MAP_HULLS        = 4;

var MAX_MAP_MODELS       = 400;
var MAX_MAP_BRUSHES      = 4096;
var MAX_MAP_ENTITIES     = 1024;
var MAX_MAP_ENTSTRING    = (128*1024);

var MAX_MAP_PLANES       = 32767;
var MAX_MAP_NODES        = 32767; // because negative shorts are leaves
var MAX_MAP_CLIPNODES    = 32767; //
var MAX_MAP_LEAFS        = 8192;
var MAX_MAP_VERTS        = 65535;
var MAX_MAP_FACES        = 65535;
var MAX_MAP_MARKSURFACES = 65535;
var MAX_MAP_TEXINFO      = 8192;
var MAX_MAP_EDGES        = 256000;
var MAX_MAP_SURFEDGES    = 512000;
var MAX_MAP_TEXTURES     = 512;
var MAX_MAP_MIPTEX       = 0x200000;
var MAX_MAP_LIGHTING     = 0x200000;
var MAX_MAP_VISIBILITY   = 0x200000;

var MAX_MAP_PORTALS      = 65536;

var MAX_KEY              = 32;
var MAX_VALUE            = 1024;

// BSP-30 files contain these lumps
var LUMP_ENTITIES     = 0;
var LUMP_PLANES       = 1;
var LUMP_TEXTURES     = 2;
var LUMP_VERTICES     = 3;
var LUMP_VISIBILITY   = 4;
var LUMP_NODES        = 5;
var LUMP_TEXINFO      = 6;
var LUMP_FACES        = 7;
var LUMP_LIGHTING     = 8;
var LUMP_CLIPNODES    = 9;
var LUMP_LEAVES       = 10;
var LUMP_MARKSURFACES = 11;
var LUMP_EDGES        = 12;
var LUMP_SURFEDGES    = 13;
var LUMP_MODELS       = 14;
var HEADER_LUMPS      = 15;

// Leaf content values
var CONTENTS_EMPTY        = -1;
var CONTENTS_SOLID        = -2;
var CONTENTS_WATER        = -3;
var CONTENTS_SLIME        = -4;
var CONTENTS_LAVA         = -5;
var CONTENTS_SKY          = -6;
var CONTENTS_ORIGIN       = -7;
var CONTENTS_CLIP         = -8;
var CONTENTS_CURRENT_0    = -9;
var CONTENTS_CURRENT_90   = -10;
var CONTENTS_CURRENT_180  = -11;
var CONTENTS_CURRENT_270  = -12;
var CONTENTS_CURRENT_UP   = -13;
var CONTENTS_CURRENT_DOWN = -14;
var CONTENTS_TRANSLUCENT  = -15;

//Plane types
var PLANE_X    = 0; // Plane is perpendicular to given axis
var PLANE_Y    = 1;
var PLANE_Z    = 2;
var PLANE_ANYX = 3; // Non-axial plane is snapped to the nearest
var PLANE_ANYY = 4;
var PLANE_ANYZ = 5;

// Render modes
var RENDER_MODE_NORMAL   = 0;
var RENDER_MODE_COLOR    = 1;
var RENDER_MODE_TEXTURE  = 2;
var RENDER_MODE_GLOW     = 3;
var RENDER_MODE_SOLID    = 4;
var RENDER_MODE_ADDITIVE = 5;

/*
typedef struct _VECTOR3D
{
	float x, y, z;
} VECTOR3D;
*/
// @see mathlib.js Vector3D

// Describes a lump in the BSP file
/*
typedef struct _BSPLUMP
{
	int32_t nOffset;
	int32_t nLength;
} BSPLUMP;
*/
function BspLump()
{
    var offset; // File offset to data
    var length; // Length of data
};

// The BSP file header
/*
typedef struct _BSPHEADER
{
	int32_t nVersion;		
	BSPLUMP lump[HEADER_LUMPS];
} BSPHEADER;
*/
function BspHeader()
{
    var version; // Version number, must be 30 for a valid HL BSP file
    var lumps;   // Stores the directory of lumps as array of BspLump (HEADER_LUMPS elements)
};

// Describes a node of the BSP Tree
/*
typedef struct _BSPNODE
{
	uint32_t iPlane;			 
	int16_t  iChildren[2];		 
	int16_t  nMins[3], nMaxs[3]; 
	uint16_t iFirstFace, nFaces;  
} BSPNODE;
*/
function BspNode()
{
    var plane;     // Index into pPlanes lump
    var children;  // If > 0, then indices into Nodes otherwise bitwise inverse indices into Leafs
	var mins;      // Bounding box
	var maxs;
	var firstFace; // Index and count into BSPFACES array
	var faces;
};
var SIZE_OF_BSPNODE = 24;

// Leafs lump contains leaf structures
/*
typedef struct _BSPLEAF
{
	int32_t  nContents;			              
	int32_t  nVisOffset;		              
	int16_t  nMins[3], nMaxs[3];             
	uint16_t iFirstMarkSurface, nMarkSurfaces;
	uint8_t  nAmbientLevels[4];	        
} BSPLEAF;
*/
function BspLeaf()
{
    var content;          // Contents enumeration, see vars
    var visOffset;        // Offset into the compressed visibility lump
	var mins;             // Bounding box
	var maxs;
	var firstMarkSurface; // Index and count into BSPMARKSURFACE array
	var markSurfaces
	var ambientLevels;    // Ambient sound levels              
};
var SIZE_OF_BSPLEAF = 28;

// Leaves index into marksurfaces, which index into pFaces
/*
typedef uint16_t BSPMARKSURFACE;
*/
var SIZE_OF_BSPMARKSURFACE  = 2;

// Planes lump contains plane structures
/*
typedef struct _BSPPLANE
{
	VECTOR3D vNormal; 
	float    fDist;  
	int32_t  nType; 
} BSPPLANE;
*/
function BspPlane()
{
    var normal; // The planes normal vector
    var dist;   // Plane equation is: vNormal * X = fDist
    var type;   // Plane type, see vars
};
var SIZE_OF_BSPPLANE = 20;

// Vertex lump is an array of float triples (VECTOR3D)
/*
typedef VECTOR3D BSPVERTEX;
*/
var SIZE_OF_BSPVERTEX = 12;

// Edge struct contains the begining and end vertex for each edge
/*
typedef struct _BSPEDGE
{
    uint16_t iVertex[2];        
};
*/
function BspEdge()
{
	var vertices; // Indices into vertex array
}
var SIZE_OF_BSPEDGE = 4;

// Faces are equal to the polygons that make up the world
/*
typedef struct _BSPFACE
{
    uint16_t iPlane;                // Index of the plane the face is parallel to
    uint16_t nPlaneSide;            // Set if different normals orientation
    uint32_t iFirstEdge;            // Index of the first edge (in the surfedge array)
    uint16_t nEdges;                // Number of consecutive surfedges
    uint16_t iTextureInfo;          // Index of the texture info structure
    uint8_t  nStyles[4];            // Specify lighting styles
    //       nStyles[0]             // type of lighting, for the face
    //       nStyles[1]             // from 0xFF (dark) to 0 (bright)
    //       nStyles[2], nStyles[3] // two additional light models
    uint32_t nLightmapOffset;    // Offsets into the raw lightmap data
};
*/
function BspFace()
{
    var plane;               // Index of the plane the face is parallel to
    var planeSide;           // Set if different normals orientation
    var firstEdge;           // Index of the first edge (in the surfedge array)
    var edges;               // Number of consecutive surfedges
    var textureInfo;         // Index of the texture info structure
    var styles;           // Specify lighting styles
    //  styles[0]            // type of lighting, for the face
    //  styles[1]            // from 0xFF (dark) to 0 (bright)
    //  styles[2], styles[3] // two additional light models
    var lightmapOffset;      // Offsets into the raw lightmap data
}
var SIZE_OF_BSPFACE = 20;


// Surfedges lump is an array of signed int indices into the edge lump, where a negative index indicates
// using the referenced edge in the opposite direction. Faces index into surfEdges, which index
// into edges, which finally index into vertices.
/*
typedef int32_t BSPSURFEDGE;
*/
var SIZE_OF_BSPSURFEDGE = 4;

// Textures lump begins with a header, followed by offsets to BSPMIPTEX structures, then BSPMIPTEX structures
/*
typedef struct _BSPTEXTUREHEADER
{
    uint32_t nMipTextures;
};
*/
// 32-bit offsets (within texture lump) to (nMipTextures) BSPMIPTEX structures
/*
typedef int32_t BSPMIPTEXOFFSET;
*/
var SIZE_OF_BSPMIPTEXOFFSET = 4;
function BspTextureHeader()
{
	var textures; // Number of BSPMIPTEX structures
	var offsets;  // Array of offsets to the textures
}

// BSPMIPTEX structures which defines a texture
var MAXTEXTURENAME = 16
var MIPLEVELS = 4
/*
typedef struct _BSPMIPTEX
{
    char     szName[MAXTEXTURENAME]; 
    uint32_t nWidth, nHeight;        
    uint32_t nOffsets[MIPLEVELS];
};
*/
function BspMipTexture()
{
	var name;    // Name of texture, for reference from external WAD file
	var width;   // Extends of the texture
	var height; 
	var offsets; // Offsets to MIPLEVELS texture mipmaps, if 0 texture data is stored in an external WAD file
}

// Texinfo lump contains information about how textures are applied to surfaces
/*
typedef struct _BSPTEXTUREINFO
{
    VECTOR3D vS;      
    float    fSShift; 
    VECTOR3D vT;      
    float    fTShift; 
    uint32_t iMiptex; 
    uint32_t nFlags; 
};
*/
function BspTextureInfo()
{
	var s;          // 1st row of texture matrix
	var sShift;     // Texture shift in s direction
	var t;          // 2nd row of texture matrix - multiply 1st and 2nd by vertex to get texture coordinates
	var tShift;     // Texture shift in t direction
	var mipTexture; // Index into mipTextures array
	var flags;      // Texture flags, seems to always be 0
}
var SIZE_OF_BSPTEXTUREINFO = 40;

// Smaller bsp models inside the world. Mostly brush entities.
/*
typedef struct _BSPMODEL
{
    float    nMins[3], nMaxs[3];    
    VECTOR3D vOrigin;                  
    int32_t  iHeadNodes[MAX_MAP_HULLS];
    int32_t  nVisLeafs;                 
    int32_t  iFirstFace, nFaces;        
};
*/
function BspModel()
{
	var mins;          // Defines bounding box
	var maxs; 
	var origin;        // Coordinates to move the coordinate system before drawing the model
	var headClipNodes; // Index into clipnodes
	var visLeafs;      // No idea
	var firstFace;     // Index and count into face array
	var faces;
}
var SIZE_OF_BSPMODEL = 64;

// Clip nodes are used for collision detection and make up the clipping hull.
/*
typedef struct _BSPCLIPNODE
{
    int32_t iPlane;
    int16_t iChildren[2]; 
};
*/
function BspClipNode()
{
	var plane;    // Index into planes
	var children; // negative numbers are contents behind and in front of the plane
}
var SIZE_OF_BSPCLIPNODE = 8;