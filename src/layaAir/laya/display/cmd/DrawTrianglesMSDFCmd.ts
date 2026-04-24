import { Matrix } from "../../maths/Matrix";
import { Context } from "../../renders/Context";
import { Texture } from "../../resource/Texture";
import { ClassUtils } from "../../utils/ClassUtils";
import { ColorUtils } from "../../utils/ColorUtils";
import { Pool } from "../../utils/Pool";

export class DrawTrianglesMSDFCmd {
    static ID: string = "DrawTrianglesMSDF";

    texture: Texture | null;
    x: number;
    y: number;
    vertices: Float32Array;
    uvs: Float32Array;
    indices: Uint16Array;
    fillColors: Uint32Array;
    outlineColors: Uint32Array;
    glowColors: Uint32Array;
    shadowColors: Uint32Array;
    packedParamsA: Uint32Array;
    packedParamsB: Uint32Array;
    matrix: Matrix | null;
    alpha: number;
    blendMode: string | null;
    color: number | number[] | null;

    static create(
        texture: Texture,
        x: number,
        y: number,
        vertices: Float32Array,
        uvs: Float32Array,
        indices: Uint16Array,
        fillColors: Uint32Array,
        outlineColors: Uint32Array,
        glowColors: Uint32Array,
        shadowColors: Uint32Array,
        packedParamsA: Uint32Array,
        packedParamsB: Uint32Array,
        matrix: Matrix | null,
        alpha: number,
        color: string | number | number[],
        blendMode: string | null
    ): DrawTrianglesMSDFCmd {
        const cmd: DrawTrianglesMSDFCmd = Pool.getItemByClass("DrawTrianglesMSDFCmd", DrawTrianglesMSDFCmd);
        cmd.texture = texture;
        texture._addReference();
        cmd.x = x;
        cmd.y = y;
        cmd.vertices = vertices;
        cmd.uvs = uvs;
        cmd.indices = indices;
        cmd.fillColors = fillColors;
        cmd.outlineColors = outlineColors;
        cmd.glowColors = glowColors;
        cmd.shadowColors = shadowColors;
        cmd.packedParamsA = packedParamsA;
        cmd.packedParamsB = packedParamsB;
        cmd.matrix = matrix;
        cmd.alpha = alpha;
        cmd.color = color == null ? 0xffffffff : typeof (color) == "string" ? ColorUtils.create(color).numColor : color;
        cmd.blendMode = blendMode;
        return cmd;
    }

    recover(): void {
        this.texture && this.texture._removeReference();
        this.texture = null;
        this.vertices = null;
        this.uvs = null;
        this.indices = null;
        this.fillColors = null;
        this.outlineColors = null;
        this.glowColors = null;
        this.shadowColors = null;
        this.packedParamsA = null;
        this.packedParamsB = null;
        this.matrix = null;
        Pool.recover("DrawTrianglesMSDFCmd", this);
    }

    run(context: Context, gx: number, gy: number): void {    
        context.drawTrianglesMSDF(
            this.texture,
            this.x + gx,
            this.y + gy,
            this.vertices,
            this.uvs,
            this.indices,
            this.fillColors,
            this.outlineColors,
            this.glowColors,
            this.shadowColors,
            this.packedParamsA,
            this.packedParamsB,
            this.matrix,
            this.alpha,
            this.blendMode,
            this.color
        );
    }

    get cmdID(): string {
        return DrawTrianglesMSDFCmd.ID;
    }

    getBoundPoints(): number[] {
        const vert = this.vertices;
        const vnum = vert.length;
        if (vnum < 2) {
            return [];
        }

        let minx = vert[0];
        let miny = vert[1];
        let maxx = minx;
        let maxy = miny;

        for (let i = 2; i < vnum;) {
            const cx = vert[i++];
            const cy = vert[i++];
            if (minx > cx) minx = cx;
            if (miny > cy) miny = cy;
            if (maxx < cx) maxx = cx;
            if (maxy < cy) maxy = cy;
        }

        return [minx, miny, maxx, miny, maxx, maxy, minx, maxy];
    }
}

ClassUtils.regClass("DrawTrianglesMSDFCmd", DrawTrianglesMSDFCmd);
