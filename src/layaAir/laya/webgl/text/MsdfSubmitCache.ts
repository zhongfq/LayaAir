import { ColorFilter } from "../../filters/ColorFilter";
import { Matrix } from "../../maths/Matrix";
import { Context } from "../../renders/Context";
import { Material } from "../../resource/Material";
import { Texture } from "../../resource/Texture";
import { RenderSpriteData, Value2D } from "../shader/d2/value/Value2D";
import { SubmitBase } from "../submit/SubmitBase";
import { MeshTextureMSDF } from "../utils/MeshTextureMSDF";
import { RenderInfo } from "../../renders/RenderInfo";

type MsdfSubmitCacheItem = {
    tex: Texture;
    imgId: number;
    clipInfoID: number;
    clipMatrix: Matrix;
    colorFilter: ColorFilter | null;
    material: Material | null;
    blendShader: number;
    vertices: Float32Array;
    uvs: Float32Array;
    indices: Uint16Array;
    fillColors: Uint32Array;
    outlineColors: Uint32Array;
    glowColors: Uint32Array;
    shadowColors: Uint32Array;
    packedParamsA: Uint32Array;
    packedParamsB: Uint32Array;
    color: number | number[];
};

export class MsdfSubmitCache {
    private _data: MsdfSubmitCacheItem[] = [];
    /**@internal */
    _enable = false;

    clear(): void {
        this._data.length = 0;
        this._enable = false;
    }

    destroy(): void {
        this.clear();
        this._data = null;
    }

    add(item: MsdfSubmitCacheItem): void {
        this._data.push(item);
    }

    enable(value: boolean, ctx: Context): void {
        if (value === this._enable)
            return;
        this._enable = value;
        this._enable || this.submit(ctx);
    }

    submit(ctx: Context): void {
        const data = this._data;
        const count = data.length;
        if (!count)
            return;

        ctx.drawLeftData();
        const mesh = (<any>ctx)._mesh = (<any>ctx)._meshTexMSDF as MeshTextureMSDF;

        for (let i = 0; i < count; i++) {
            const item = data[i];
            const preKey = (<any>ctx)._curSubmit._key;
            const sameKey = preKey.submitType === SubmitBase.KEY_TRIANGLES_MSDF &&
                preKey.other === item.imgId &&
                preKey.blendShader === item.blendShader &&
                (<any>ctx)._mesh.vertexNum + item.vertices.length / 2 < 65535 &&
                (<any>ctx)._curSubmit.material === item.material &&
                (<any>ctx)._curSubmit._colorFiler === item.colorFilter &&
                (<any>ctx)._curSubmit.clipInfoID === item.clipInfoID;

            if (!sameKey) {
                ctx.drawLeftData();
                (<any>ctx)._mesh = mesh;
                const submit = (<any>ctx)._curSubmit = SubmitBase.create(ctx, mesh, Value2D.create(RenderSpriteData.Texture2D));
                submit.shaderValue.textureHost = item.tex;
                //@ts-ignore
                ctx.fillShaderValue(submit.shaderValue);
                submit._key.submitType = SubmitBase.KEY_TRIANGLES_MSDF;
                submit._key.other = item.imgId;
                submit._key.blendShader = item.blendShader;
                submit._colorFiler = item.colorFilter;
                submit.material = item.material;

                const clipInfo = item.clipMatrix;
                const cm = submit.shaderValue.clipMatDir;
                cm.x = clipInfo.a;
                cm.y = clipInfo.b;
                cm.z = clipInfo.c;
                cm.w = clipInfo.d;
                submit.shaderValue.clipMatDir = cm;
                const cmp = submit.shaderValue.clipMatPos;
                cmp.x = clipInfo.tx;
                cmp.y = clipInfo.ty;
                submit.shaderValue.clipMatPos = cmp;
                submit.clipInfoID = item.clipInfoID;
            }

            mesh.addData(
                item.vertices,
                item.uvs,
                item.indices,
                Matrix.EMPTY,
                item.color,
                item.fillColors,
                item.outlineColors,
                item.glowColors,
                item.shadowColors,
                item.packedParamsA,
                item.packedParamsB
            );
            (<any>ctx)._curSubmit._numEle += item.indices.length;
        }

        this._data.length = 0;
        if (RenderInfo.loopCount % 100 == 0)
            data.length = 0;
        ctx.drawLeftData();
    }
}
