import { Laya } from "../../Laya";
import { LayaEnv } from "../../LayaEnv";
import { IRenderEngine } from "../RenderDriver/DriverDesign/RenderDevice/IRenderEngine";
import { HTMLCanvas } from "../resource/HTMLCanvas";
import { Texture2D } from "../resource/Texture2D";
import { Texture2DArray } from "../resource/Texture2DArray";
import { TextureCube } from "../resource/TextureCube";
import { HalfFloatUtils } from "../utils/HalfFloatUtils";
import { BlendMode } from "../webgl/canvas/BlendMode";
import { Shader2D } from "../webgl/shader/d2/Shader2D";
import { ShaderDefines2D } from "../webgl/shader/d2/ShaderDefines2D";
import { Config } from "./../../Config";
import { ILaya } from "./../../ILaya";
import { Context } from "./Context";

/**
 * <code>Render</code> 是渲染管理类。它是一个单例，可以使用 Laya.render 访问。
 */
export class Render {
    /**
     * @en The interval time of each frame in milliseconds.
     * @zh 每帧的间隔时间，单位为毫秒。
     */
    static frameInterval = 1000 / 60;
    /**
     * @en The frame number of the last run.
     * @zh 最近一次运行的帧号。
     */
    static lastFrame = 0;

    /** @internal */
    static _context: Context;
    /** @internal 主画布。canvas和webgl渲染都用这个画布*/
    static _mainCanvas: HTMLCanvas;
    /** 表示是否是 3D 模式。*/
    static is3DMode: boolean;
    /**自定义帧循环 */
    static _customRequestAnimationFrame: any;
    /**帧循环函数 */
    static _loopFunction: any;

    static _Render: Render;

    static customRequestAnimationFrame(value: any, loopFun: any) {
        Render._customRequestAnimationFrame = value;
        Render._loopFunction = loopFun;
    }

    private static _customEngine: IRenderEngine;
    static set customRenderEngine(engine: IRenderEngine) {
        Render._customEngine = engine;
    }
    static get customRenderEngine() {
        return Render._customEngine;
    }

    // static clearResources(){
    //     Laya.timer.frameOnce(2, this, () => {

    //         EngineUtils.gc();
    //     })
    // }

    static gc() {
        if (LayaEnv.isConch) {
            (window as any).gc({ type: 'major', execution: 'async' });
        }
    }

    private _timestamp: number = 0;
    private _systemTimestamp: number = 0;


    /**
     * 初始化引擎。
     * @param	width 游戏窗口宽度。
     * @param	height	游戏窗口高度。
     */
    constructor(width: number, height: number, mainCanv: HTMLCanvas) {
        Render._Render = this;
        Render._mainCanvas = mainCanv;
        let source: HTMLCanvasElement = Render._mainCanvas.source as HTMLCanvasElement;
        //创建主画布。改到Browser中了，因为为了runtime，主画布必须是第一个
        source.id = "layaCanvas";
        source.width = width;
        source.height = height;
        if (LayaEnv.isConch) {
            document.body.appendChild(source);
            Render._mainCanvas.getContext("2d");
        }

        this.initRender(Render._mainCanvas, width, height);
        if (Config._enableWindowRAFFunction) {
            window.requestAnimationFrame(loop);
        } else {
            requestAnimationFrame(loop);
        }
        
        let first = true;
        let startTm = 0;
        let leftTime = 0;
        let lastTime = 0;

        Render.frameInterval = 1000 / Config.FPS;

        const self = this;

        function loop(timestamp: number) {
            timestamp = timestamp ?? performance.now();

            self._timestamp = timestamp;
            self._systemTimestamp = performance.now();

            const interval = Render.frameInterval;

            if (first) {
                first = false;
                startTm = Math.floor(timestamp / interval) * interval;
                leftTime = 0;
                lastTime = timestamp;
            }

            let delta = leftTime + timestamp - lastTime;
            if (delta + 1 >= interval || !Config.fixedFrames) {
                leftTime = Math.min(delta - interval, interval);
                lastTime = timestamp;

                Render.lastFrame = Math.floor((timestamp - startTm) / interval);
                ILaya.stage.loop(timestamp);
            }

            if (!!Render._customRequestAnimationFrame && !!Render._loopFunction) {
                Render._customRequestAnimationFrame(Render._loopFunction);
            }
            else {
                if (Config._enableWindowRAFFunction) {
                    window.requestAnimationFrame(loop);
                } else {
                    requestAnimationFrame(loop);
                }
            }
        }
        ILaya.stage.on("visibilitychange", this, this._onVisibilitychange);
        LayaEnv.isConch && Laya.timer.frameOnce(2, null, Render.gc);
    }

    /**@private */
    private _timeId: number = 0;

    /**@private */
    /**
     * @performanceTool  func count 
     */
    private _onVisibilitychange(): void {
        if (!ILaya.stage.isVisibility) {
            this._timeId = window.setInterval(() => {
                this._enterFrame(this._timestamp + performance.now() - this._systemTimestamp);
            }, 1000);
        } else if (this._timeId != 0) {
            window.clearInterval(this._timeId);
        }
    }


    initRender(canvas: HTMLCanvas, w: number, h: number): boolean {

        canvas.size(w, h);	//在ctx之后调用。
        ShaderDefines2D.__init__();
        Context.__init__();

        var ctx = new Context();
        ctx.isMain = true;
        Render._context = ctx;
        canvas._setContext(ctx);

        Shader2D.__init__();
        BlendMode._init_();
        Texture2D.__init__();
        TextureCube.__init__();
        Texture2DArray.__init__();
        HalfFloatUtils.__init__();


        return true;
    }

     /**
     * @ignore
     */
     static vsyncTime() {
        return Render.lastFrame * Render.frameInterval;
    }


    /**@private */
    private _enterFrame(timestamp: number): void {
        ILaya.stage.loop(timestamp);
    }

    /** 目前使用的渲染器。*/
    static get context(): Context {
        return Render._context;
    }

    /** 渲染使用的原生画布引用。 */
    static get canvas(): any {
        return Render._mainCanvas.source;
    }
}
