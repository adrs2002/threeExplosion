"use strict";

/**
 * @author Jey-en  https://github.com/adrs2002
 * 
 * this Three.js Plugin repo -> https://github.com/adrs2002/
 *
 */


class jenParticle extends THREE.Object3D{
    // コンストラクタ
    constructor(Texloader, _option) {
        super();
        this.particleCount = 7500;	//これがパーティクルの作成最大数。多すぎると死ぬ

        /*
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.getVshader());
        gl.compileShader(vertexShader);
        gl.attachShader(program, vertexShader);
        */
        this.geo = new THREE.InstancedBufferGeometry();
        this.geo.copy(new THREE.CircleBufferGeometry(1, 6));

        //入れ物を初期化していく
        //シェーダに渡すには明確に【型】が決まってる必要があるため、こういうことを行う
        this.translateArray = new Float32Array(this.particleCount * 3);
        this.colArray = new Float32Array(this.particleCount * 3);
        this.vectArray = new Float32Array(this.particleCount * 3);
        this.scaleArray = new Float32Array(this.particleCount * 1);
        this.timeArray = new Float32Array(this.particleCount * 1);

        //カウンタでぶん回してガンガン初期化
        for (let i = 0; i < this.particleCount; i++) {
            //いわば、パーティクルの初期位置に該当。どうせ書き換わるから気にするな
            this.translateArray[i * 3 + 0] = 1.0;
            this.translateArray[i * 3 + 1] = 1.0;
            this.translateArray[i * 3 + 2] = 1.0;

            //パーティクルの大きさをセットする入れ物
            this.scaleArray[i * 3 + 0] = 0.0;

            //【色】を管理する入れ物
            this.colArray[i * 3 + 0] = 0.0;
            this.colArray[i * 3 + 1] = 1.0;
            this.colArray[i * 3 + 2] = 0.0;

            //出現してからの時間管理の入れ物
            this.timeArray[i * 3 + 0] = 0.0;

        }


        const material = new THREE.RawShaderMaterial({
            uniforms: {
                //　map: { value: new THREE.TextureLoader().load("textures/sprites/circle.png") },
                time: { value: 0.0 }
            },
            vertexShader: this.getVshader(),
            fragmentShader: this.getFshader(),
            depthTest: true,
            depthWrite: false,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.geo.addAttribute("translate", new THREE.InstancedBufferAttribute(this.translateArray, 3, 1));
        this.geo.addAttribute("col", new THREE.InstancedBufferAttribute(this.colArray, 3, 1));
        this.geo.addAttribute("movevect", new THREE.InstancedBufferAttribute(this.vectArray, 3, 1));
        this.geo.addAttribute("scale", new THREE.InstancedBufferAttribute(this.scaleArray, 1, 1));
        this.geo.addAttribute("time", new THREE.InstancedBufferAttribute(this.timeArray, 1, 1));

        const mesh = new THREE.Mesh(this.geo, material);
        mesh.scale.set(1, 1, 1);
        this.add(mesh);

        this.updateMatrixWorld = this.updater;

        return this;
    }

    updater() {

        // 1粒毎のアップデート
        this.geo.attributes.translate.needsUpdate = true;
        this.geo.attributes.col.needsUpdate = true;
        this.geo.attributes.movevect.needsUpdate = true;
        this.geo.attributes.scale.needsUpdate = true;
        this.geo.attributes.time.needsUpdate = true;
        THREE.Object3D.prototype.updateMatrixWorld.call(this);
        console.log('OK');
    }


    getVshader() {
        return `

        precision highp float;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        attribute vec3 position;
        attribute vec2 uv;
        attribute vec3 translate;
        attribute vec3 movevect;
        attribute vec3 col;
        attribute float scale;
        attribute float time;

        varying vec2 vUv;
        varying float vScale;
        varying vec3 vCol;
        varying float vTime;

        void main() {

            vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );
            vScale = scale;
            mvPosition.xyz += position * (scale + time * 0.001) + (movevect * time );
            vUv = uv;
            gl_Position = projectionMatrix * mvPosition;
            vCol = col;
            vTime = time;
        }

        `;
    }

    getFshader() {
        return `

        precision highp float;
        uniform sampler2D map;

        varying vec2 vUv;
        varying float vScale;
        varying vec3 vCol;
        varying float vTime;

        void main() {
            vec4 diffuseColor = texture2D( map, vUv );
            gl_FragColor = vec4( diffuseColor.xyz * vCol, diffuseColor.w * (1.0 - vTime / 1000.0) );

            //if ( diffuseColor.w < 0.5 ) discard;
        }
        
        `;
    }
}