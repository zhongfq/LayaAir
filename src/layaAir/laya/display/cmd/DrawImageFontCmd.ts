import { Context, IGraphicCMD } from "../../renders/Context"
import { Texture } from "../../resource/Texture"
import { ColorUtils } from "../../utils/ColorUtils";
import { Pool } from "../../utils/Pool"

/**
 * @en Draw image command
 * @zh 绘制图片命令
 */
export class DrawImageFontCmd implements IGraphicCMD {
    /**
     * @en Identifier for the DrawImageFontCmd
     * @zh 绘制图片命令的标识符
     */
    static ID: string = "DrawImageFontCmd";

    /**
     * @en Texture to be drawn
     * @zh 要绘制的纹理
     */
    texture: Texture | null;
    /**
     * @en (Optional) X-axis offset
     * @zh （可选）X轴偏移量
     */
    x: number;
    /**
     * @en (Optional) Y-axis offset
     * @zh （可选）Y轴偏移量
     */
    y: number;
    /**
     * @en (Optional) Width of the drawn image
     * @zh （可选）绘制图片的宽度
     */
    width: number;
    /**
     * @en (Optional) Height of the drawn image
     * @zh （可选）绘制图片的高度
     */
    height: number;

    /**
     * @en (Optional) Drawing color
     * @zh （可选）绘图颜色
     */
    color: number = 0xffffffff;

    /**
     * @en UV coordinates
     * @zh UV坐标
     */
    uv: ArrayLike<number>;

    /**
     * @en Create a DrawImageFontCmd instance
     * @param texture Texture to be drawn
     * @param x X-axis offset
     * @param y Y-axis offset
     * @param width Width of the drawn image
     * @param height Height of the drawn image
     * @param color Drawing color
     * @returns A DrawImageFontCmd instance
     * @zh 创建一个绘制图片命令实例
     * @param texture 要绘制的纹理
     * @param x X轴偏移量
     * @param y Y轴偏移量
     * @param width 绘制图片的宽度
     * @param height 绘制图片的高度
     * @param color 绘图颜色
     * @returns 绘制图片命令实例
     */
    static create(texture: Texture, x: number, y: number, width: number, height: number, color: string, uv: ArrayLike<number>): DrawImageFontCmd {
        if (width == null) width = texture.sourceWidth;
        if (height == null) height = texture.sourceHeight;

        let wRate = width / texture.sourceWidth;
        let hRate = height / texture.sourceHeight;
        width = texture.width * wRate;
        height = texture.height * hRate;

        x += texture.offsetX * wRate;
        y += texture.offsetY * hRate;

        var cmd: DrawImageFontCmd = Pool.getItemByClass("DrawImageFontCmd", DrawImageFontCmd);
        cmd.texture = texture;
        texture._addReference();
        cmd.x = x;
        cmd.y = y;
        cmd.width = width;
        cmd.height = height;
        cmd.color = color != null ? ColorUtils.create(color).numColor : 0xffffffff;
        cmd.uv = uv;
        return cmd;
    }

    /**
     * @en Recycle the instance to the object pool
     * @zh 将实例回收到对象池
     */
    recover(): void {
        this.texture && this.texture._removeReference();
        this.texture = null;
        Pool.recover("DrawImageFontCmd", this);
    }

    /**
     * @en Execute the draw image command
     * @param context The rendering context
     * @param gx Global X offset
     * @param gy Global Y offset
     * @zh 执行绘制图片命令
     * @param context 渲染上下文
     * @param gx 全局X偏移
     * @param gy 全局Y偏移
     */
    run(context: Context, gx: number, gy: number): void {
        if (this.texture) {
            context._drawTextureFont(this.texture, this.x + gx, this.y + gy, this.width, this.height, null, 1, this.uv as number[], this.color);
        }
    }

    /**
     * @en The identifier for the DrawImageFontCmd
     * @zh 绘制图片命令的标识符
     */
    get cmdID(): string {
        return DrawImageFontCmd.ID;
    }

}

