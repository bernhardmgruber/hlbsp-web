"use strict";

/**
 * Contains the standard BSP v30 file definitions.
 * For closer information visit my hlbsp project:
 * http://hlbsp.sourceforge.net/index.php?content=bspdef
 */

var    MAX_MAP_HULLS        = 4;

var    MAX_MAP_MODELS       = 400;
var    MAX_MAP_BRUSHES      = 4096;
var    MAX_MAP_ENTITIES     = 1024;
var    MAX_MAP_ENTSTRING    = (128*1024);

var    MAX_MAP_PLANES       = 32767;
var    MAX_MAP_NODES        = 32767; // because negative shorts are leaves
var    MAX_MAP_CLIPNODES    = 32767; //
var    MAX_MAP_LEAFS        = 8192;
var    MAX_MAP_VERTS        = 65535;
var    MAX_MAP_FACES        = 65535;
var    MAX_MAP_MARKSURFACES = 65535;
var    MAX_MAP_TEXINFO      = 8192;
var    MAX_MAP_EDGES        = 256000;
var    MAX_MAP_SURFEDGES    = 512000;
var    MAX_MAP_TEXTURES     = 512;
var    MAX_MAP_MIPTEX       = 0x200000;
var    MAX_MAP_LIGHTING     = 0x200000;
var    MAX_MAP_VISIBILITY   = 0x200000;

var    MAX_MAP_PORTALS      = 65536;

var    MAX_KEY              = 32;
var    MAX_VALUE            = 1024;

// BSP-30 files contain these lumps
var    LUMP_ENTITIES     = 0;
var    LUMP_PLANES       = 1;
var    LUMP_TEXTURES     = 2;
var    LUMP_VERTEXES     = 3;
var    LUMP_VISIBILITY   = 4;
var    LUMP_NODES        = 5;
var    LUMP_TEXINFO      = 6;
var    LUMP_FACES        = 7;
var    LUMP_LIGHTING     = 8;
var    LUMP_CLIPNODES    = 9;
var    LUMP_LEAFS        = 10;
var    LUMP_MARKSURFACES = 11;
var    LUMP_EDGES        = 12;
var    LUMP_SURFEDGES    = 13;
var    LUMP_MODELS       = 14;
var    HEADER_LUMPS      = 15;

// Leaf content values
var    CONTENTS_EMPTY        = -1;
var    CONTENTS_SOLID        = -2;
var    CONTENTS_WATER        = -3;
var    CONTENTS_SLIME        = -4;
var    CONTENTS_LAVA         = -5;
var    CONTENTS_SKY          = -6;
var    CONTENTS_ORIGIN       = -7;
var    CONTENTS_CLIP         = -8;
var    CONTENTS_CURRENT_0    = -9;
var    CONTENTS_CURRENT_90   = -10;
var    CONTENTS_CURRENT_180  = -11;
var    CONTENTS_CURRENT_270  = -12;
var    CONTENTS_CURRENT_UP   = -13;
var    CONTENTS_CURRENT_DOWN = -14;
var    CONTENTS_TRANSLUCENT  = -15;

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

// Describes a lump in the BSP file
function BspLump()
{
    var offset; // File offset to data
    var length; // Length of data
};

// The BSP file header
function BspHeader()
{
    var version;                         // Version number, must be 30 for a valid HL BSP file
    var lumps = new Array(HEADER_LUMPS); // Stores the directory of lumps.
};

// Describes a node of the BSP Tree
function BspNode()
{
    var plane;                   // Index into pPlanes lump
    var children = new Array(2); // If > 0, then indices into Nodes otherwise bitwise inverse indices into Leafs
	var mins = new Array(3);     // Bounding box
	var maxs = new Array(3);
	var firstFace;               // Index and count into BSPFACES array
	var faces;
};

// Leafs lump contains leaf structures
function BspLeaf()
{
    var content;                      // Contents enumeration, see vars
    var visOffset;                    // Offset into the compressed visibility lump
	var mins = new Array(3);          // Bounding box
	var maxs = new Array(3);
	var firstMarkSurface;             // Index and count into BSPMARKSURFACE array
	var markSurfaces
	var ambientLevels = new Array(4); // Ambient sound levels              
};

// Leaves index into marksurfaces, which index into pFaces
function BspMarkSurface()
{
	var index; // Index into faces
}

// Planes lump contains plane structures
function BspPlane()
{
    VECTOR3D vNormal; // The planes normal vector
    float    fDist;   // Plane equation is: vNormal * X = fDist
    int32_t  nType;   // Plane type, see vars
};

// Vertex lump is an array of float triples (VECTOR3D)
typedef VECTOR3D BSPVERTEX;

// Edge struct contains the begining and end vertex for each edge
typedef struct _BSPEDGE
{
    uint16_t iVertex[2];        // Indices into vertex array
};

// Faces are equal to the polygons that make up the world
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

// Surfedges lump is array of signed int indices into edge lump, where a negative index indicates
// using the referenced edge in the opposite direction. Faces index into pSurfEdges, which index
// into pEdges, which finally index into pVertices.
typedef int32_t BSPSURFEDGE;

// Textures lump begins with a header, followed by offsets to BSPMIPTEX structures, then BSPMIPTEX structures
typedef struct _BSPTEXTUREHEADER
{
    uint32_t nMipTextures; // Number of BSPMIPTEX structures
};

// 32-bit offsets (within texture lump) to (nMipTextures) BSPMIPTEX structures
typedef int32_t BSPMIPTEXOFFSET;

// BSPMIPTEX structures which defines a Texture
var MAXTEXTURENAME 16
var    MIPLEVELS 4
typedef struct _BSPMIPTEX
{
    char     szName[MAXTEXTURENAME]; // Name of texture, for reference from external WAD file
    uint32_t nWidth, nHeight;        // Extends of the texture
    uint32_t nOffsets[MIPLEVELS];    // Offsets to MIPLEVELS texture mipmaps, if 0 texture data is stored in an external WAD file
};

// Texinfo lump contains texinfo structures
typedef struct _BSPTEXTUREINFO
{
    VECTOR3D vS;      // 1st row of texture matrix
    float    fSShift; // Texture shift in s direction
    VECTOR3D vT;      // 2nd row of texture matrix - multiply 1st and 2nd by vertex to get texture coordinates
    float    fTShift; // Texture shift in t direction
    uint32_t iMiptex; // Index into textures array
    uint32_t nFlags;  // Texture flags, seems to always be 0
};

typedef struct _BSPMODEL
{
    float    nMins[3], nMaxs[3];        // Defines bounding box
    VECTOR3D vOrigin;                   // Coordinates to move the coordinate system before drawing the model
    int32_t  iHeadNodes[MAX_MAP_HULLS]; // Index into nodes array
    int32_t  nVisLeafs;                 // No idea
    int32_t  iFirstFace, nFaces;        // Index and count into face array
};

typedef struct _BSPCLIPNODE
{
    int32_t iPlane;       // Index into planes
    int16_t iChildren[2]; // negative numbers are contents behind and in front of the plane
};
