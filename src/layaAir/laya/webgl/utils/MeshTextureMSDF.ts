import { Matrix } from "../../maths/Matrix";
import { VertexDeclaration } from "../../RenderEngine/VertexDeclaration";
import { VertexElement } from "../../renders/VertexElement";
import { VertexElementFormat } from "../../renders/VertexElementFormat";
import { Sprite2DGeometry } from "./Sprite2DGeometry";

export class MeshTextureMSDF extends Sprite2DGeometry {
    static const_stride = 48;
    static VertexDeclarition: VertexDeclaration = null;

    private _vbFloat32Array: Float32Array;
    private _vbUInt32Array: Uint32Array;
    private _ibU16Array: Uint16Array;

    private static readonly USE_TEX_FLAG = 1;

    static __init__(): void {
        MeshTextureMSDF.VertexDeclarition = new VertexDeclaration(48, [
            new VertexElement(0, VertexElementFormat.Vector4, 0),
            new VertexElement(16, VertexElementFormat.NorUByte4, 1),
            new VertexElement(20, VertexElementFormat.Byte4, 2),
            new VertexElement(24, VertexElementFormat.NorUByte4, 3),
            new VertexElement(28, VertexElementFormat.NorUByte4, 4),
            new VertexElement(32, VertexElementFormat.NorUByte4, 5),
            new VertexElement(36, VertexElementFormat.NorUByte4, 6),
            new VertexElement(40, VertexElementFormat.NorUByte4, 7),
            new VertexElement(44, VertexElementFormat.Byte4, 8),
        ]);
    }

    constructor() {
        super(MeshTextureMSDF.const_stride, 4, 4);
    }

    protected onVBRealloc(buff: ArrayBuffer): void {
        this._vbFloat32Array = new Float32Array(buff);
        this._vbUInt32Array = new Uint32Array(buff);
    }

    protected onIBRealloc(buff: ArrayBuffer): void {
        this._ibU16Array = new Uint16Array(buff);
    }

    addData(
        vertices: Float32Array,
        uvs: Float32Array,
        idx: Uint16Array,
        matrix: Matrix,
        abgr: number | number[],
        fillColors: Uint32Array,
        outlineColors: Uint32Array,
        glowColors: Uint32Array,
        shadowColors: Uint32Array,
        packedParamsA: Uint32Array,
        packedParamsB: Uint32Array,
        uvrect: number[] = null
    ): void {
        const addVert = vertices.length / 2;
        this.expVBSize(addVert * MeshTextureMSDF.const_stride);
        const vertsz = vertices.length >> 1;
        const startpos = this._vertNum * MeshTextureMSDF.const_stride;
        let f32pos = startpos >> 2;
        let u32pos = f32pos;
        const vbFloatData = this._vbFloat32Array;
        const vbUIntData = this._vbUInt32Array;
        let ci = 0;
        const m00 = matrix.a;
        const m01 = matrix.b;
        const m10 = matrix.c;
        const m11 = matrix.d;
        const tx = matrix.tx;
        const ty = matrix.ty;

        let uvminx = 0;
        let uvminy = 0;
        let uvu = 1;
        let uvv = 1;
        if (uvrect) {
            uvminx = uvrect[0];
            uvminy = uvrect[1];
            uvu = uvrect[2];
            uvv = uvrect[3];
        }

        let packedColor = typeof (abgr) == "number" ? abgr >>> 0 : 0xffffffff;

        for (let i = 0; i < vertsz; i++) {
            if (Array.isArray(abgr)) {
                packedColor = abgr[(ci / 8) | 0] >>> 0;
            }

            const x = vertices[ci];
            const y = vertices[ci + 1];
            vbFloatData[f32pos] = x * m00 + y * m10 + tx;
            vbFloatData[f32pos + 1] = x * m01 + y * m11 + ty;
            vbFloatData[f32pos + 2] = uvminx + uvs[ci] * uvu;
            vbFloatData[f32pos + 3] = uvminy + uvs[ci + 1] * uvv;

            vbUIntData[u32pos + 4] = packedColor;
            vbUIntData[u32pos + 5] = MeshTextureMSDF.USE_TEX_FLAG;
            vbUIntData[u32pos + 6] = fillColors[i];
            vbUIntData[u32pos + 7] = outlineColors[i];
            vbUIntData[u32pos + 8] = glowColors[i];
            vbUIntData[u32pos + 9] = shadowColors[i];
            vbUIntData[u32pos + 10] = packedParamsA[i];
            vbUIntData[u32pos + 11] = packedParamsB[i];

            f32pos += 12;
            u32pos += 12;
            ci += 2;
        }

        const vertN = this._vertNum;
        const ibstart = this._indexNum;
        this.expIBSize(idx.byteLength);
        const indexBuffer = this._ibU16Array;
        if (vertN > 0) {
            for (let i = ibstart, si = 0, end = ibstart + idx.length; i < end; i++, si++) {
                indexBuffer[i] = idx[si] + vertN;
            }
        } else {
            indexBuffer.set(idx);
        }

        this._vertNum += vertsz;
        this._indexNum += idx.length;
    }

    get vertexDeclarition(): VertexDeclaration {
        return MeshTextureMSDF.VertexDeclarition;
    }
}
