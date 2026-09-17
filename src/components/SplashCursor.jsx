import { useEffect, useRef } from 'react';

/**
 * This is the original React Bits fluid simulation (curl / divergence /
 * vorticity / pressure-relaxation / advection / splat) — same algorithm,
 * same visual character — with three categories of change, nothing else:
 *
 * PERFORMANCE: DYE_RESOLUTION/PRESSURE_ITERATIONS/DPR are capped and
 * adaptively tiered by `navigator.hardwareConcurrency` instead of the
 * original's fixed 1440/20/uncapped-DPR, which is what made the original
 * heavy enough to trigger a GPU driver reset on ordinary hardware. SIM_RESOLUTION
 * (the velocity field, already cheap at 128) is untouched.
 *
 * SAFETY: the original never cleaned up its listeners/rAF loop (fine for a
 * mount-once demo, not for a component that mounts/unmounts every time the
 * user scrolls the entry section in and out of view), and had no handling
 * at all for WebGL being unavailable or the context being lost mid-session.
 * Both are added here. Critically, every failure path explicitly forces
 * `canvas.style.display = 'none'` rather than assuming a failed/lost WebGL
 * context happens to paint as transparent — that assumption is what caused
 * the entry section to go blank in an earlier attempt.
 *
 * LIFECYCLE DETERMINISM: initialization is split into a re-entrant
 * `attemptInitialize()` instead of a single run-once sequence, so that:
 *   - the canvas backing buffer is always sized from real layout dimensions
 *     BEFORE any WebGL/context/framebuffer work happens (never a 300x150
 *     default first frame — see `prepareCanvasDimensions`);
 *   - a `webglcontextrestored` event triggers a genuine from-scratch rebuild
 *     instead of permanently disabling the effect for that mount, so a
 *     transient failure (e.g. a browser-level context-creation cooldown
 *     after rapid churn) recovers on its own once the browser signals it's
 *     safe to retry — no guessed delays, only real browser events;
 *   - the underlying GL context is only forcibly released
 *     (WEBGL_lose_context) on a genuine unmount — detected via
 *     `canvas.isConnected`, which is synchronously false by the time real
 *     unmount cleanup runs but stays true through React StrictMode's
 *     synchronous dev-only mount->cleanup->mount — so repeated route
 *     navigation (Men <-> Women) actually frees contexts instead of
 *     leaking them to GC, while StrictMode's double-invoke still works.
 */
function SplashCursor({
  color = '#ff0000',
  className = '',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let gl = null;
    let activeCleanup = () => {};
    let resizeObserver = null;

    const cores = navigator.hardwareConcurrency || 4;
    const highTier = cores >= 6;
    const MAX_DPR = highTier ? 2 : 1.5;

    function hideCanvas() {
      canvas.style.display = 'none';
    }
    function showCanvas() {
      canvas.style.display = '';
    }

    // Sizes the backing buffer from the canvas's *real* current layout
    // dimensions. Called before any WebGL work so context creation,
    // capability detection, and framebuffer allocation never operate on the
    // browser's 300x150 default. Returns false if the canvas isn't
    // measurable yet (e.g. 0x0 — extremely unlikely for this fixed/inset-0
    // canvas, but guarded rather than assumed).
    function prepareCanvasDimensions() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.floor(canvas.clientWidth * pixelRatio);
      const height = Math.floor(canvas.clientHeight * pixelRatio);
      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
      }
      return canvas.width > 0 && canvas.height > 0;
    }

    function teardownActive() {
      activeCleanup();
      activeCleanup = () => {};
    }

    function handleContextLost(event) {
      event.preventDefault();
      teardownActive();
      hideCanvas();
    }
    // Real recovery: a restored context has none of its previous GL objects
    // (they're invalidated by the loss), so this rebuilds everything from
    // scratch on the same canvas rather than permanently disabling the
    // effect. Triggered only by the browser's own event — never a guess.
    function handleContextRestored() {
      attemptInitialize();
    }

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    function getWebGLContext(canvas) {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = canvas.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
      if (!gl) return { gl: null, ext: null };

      let halfFloat;
      let supportLinearFiltering;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat && halfFloat.HALF_FLOAT_OES;
      let formatRGBA, formatRG, formatR;

      if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }

      return { gl, ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering } };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F:
            return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F:
            return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default:
            return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status === gl.FRAMEBUFFER_COMPLETE;
    }

    function attemptInitialize() {
      if (disposed) return;
      teardownActive();
      if (!prepareCanvasDimensions()) return;
      try {
        const result = getWebGLContext(canvas);
        gl = result.gl;
        const ext = result.ext;
        if (!gl) {
          hideCanvas();
          return;
        }
        if (!ext.formatRGBA || !ext.formatRG || !ext.formatR) {
          // Could be genuine hardware/driver limitation, or a transient
          // context-creation issue (e.g. a browser-level cooldown after
          // rapid context churn). We don't guess which — the webglcontextlost
          // / webglcontextrestored listeners are already attached, so if this
          // context is or becomes actually "lost", the browser will tell us
          // when it's safe to retry via handleContextRestored.
          hideCanvas();
          return;
        }
        buildAndRun(gl, ext);
        showCanvas();
      } catch {
        hideCanvas();
      }
    }

    function buildAndRun(gl, ext) {
      // ---- adaptive quality tier ----
      function pointerPrototype() {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = [0, 0, 0];
      }

      let config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: highTier ? 768 : 512,
        DENSITY_DISSIPATION: 3.5,
        VELOCITY_DISSIPATION: 2,
        PRESSURE: 0.1,
        PRESSURE_ITERATIONS: highTier ? 14 : 8,
        CURL: 3,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 6000,
        SHADING: true,
        COLOR_UPDATE_SPEED: 10,
        TRANSPARENT: true,
        RAINBOW_MODE: false,
        COLOR: color,
      };

      let pointers = [new pointerPrototype()];

      if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = Math.min(config.DYE_RESOLUTION, 256);
        config.SHADING = false;
      }

      class Material {
        constructor(vertexShader, fragmentShaderSource) {
          this.vertexShader = vertexShader;
          this.fragmentShaderSource = fragmentShaderSource;
          this.programs = [];
          this.activeProgram = null;
          this.uniforms = [];
        }
        setKeywords(keywords) {
          let hash = 0;
          for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);
          let program = this.programs[hash];
          if (program == null) {
            let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
          }
          if (program === this.activeProgram) return;
          this.uniforms = getUniforms(program);
          this.activeProgram = program;
        }
        bind() {
          gl.useProgram(this.activeProgram);
        }
      }

      class Program {
        constructor(vertexShader, fragmentShader) {
          this.uniforms = {};
          this.program = createProgram(vertexShader, fragmentShader);
          this.uniforms = getUniforms(this.program);
        }
        bind() {
          gl.useProgram(this.program);
        }
      }

      function createProgram(vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        return program;
      }

      function getUniforms(program) {
        let uniforms = [];
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          let uniformName = gl.getActiveUniform(program, i).name;
          uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
      }

      function compileShader(type, source, keywords) {
        source = addKeywords(source, keywords);
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      }

      function addKeywords(source, keywords) {
        if (!keywords) return source;
        let keywordsString = '';
        keywords.forEach(keyword => {
          keywordsString += '#define ' + keyword + '\n';
        });
        return keywordsString + source;
      }

      const baseVertexShader = compileShader(
        gl.VERTEX_SHADER,
        `
          precision highp float;
          attribute vec2 aPosition;
          varying vec2 vUv;
          varying vec2 vL;
          varying vec2 vR;
          varying vec2 vT;
          varying vec2 vB;
          uniform vec2 texelSize;
          void main () {
              vUv = aPosition * 0.5 + 0.5;
              vL = vUv - vec2(texelSize.x, 0.0);
              vR = vUv + vec2(texelSize.x, 0.0);
              vT = vUv + vec2(0.0, texelSize.y);
              vB = vUv - vec2(0.0, texelSize.y);
              gl_Position = vec4(aPosition, 0.0, 1.0);
          }
        `
      );

      const copyShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision mediump float;
          precision mediump sampler2D;
          varying highp vec2 vUv;
          uniform sampler2D uTexture;
          void main () { gl_FragColor = texture2D(uTexture, vUv); }
        `
      );

      const clearShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision mediump float;
          precision mediump sampler2D;
          varying highp vec2 vUv;
          uniform sampler2D uTexture;
          uniform float value;
          void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
        `
      );

      const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform vec2 texelSize;
        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;
            #ifdef SHADING
                vec3 lc = texture2D(uTexture, vL).rgb;
                vec3 rc = texture2D(uTexture, vR).rgb;
                vec3 tc = texture2D(uTexture, vT).rgb;
                vec3 bc = texture2D(uTexture, vB).rgb;
                float dx = length(rc) - length(lc);
                float dy = length(tc) - length(bc);
                vec3 n = normalize(vec3(dx, dy, length(texelSize)));
                vec3 l = vec3(0.0, 0.0, 1.0);
                float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
                c *= diffuse;
            #endif
            float a = max(c.r, max(c.g, c.b));
            gl_FragColor = vec4(c, a);
        }
      `;

      const splatShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision highp float;
          precision highp sampler2D;
          varying vec2 vUv;
          uniform sampler2D uTarget;
          uniform float aspectRatio;
          uniform vec3 color;
          uniform vec2 point;
          uniform float radius;
          void main () {
              vec2 p = vUv - point.xy;
              p.x *= aspectRatio;
              vec3 splat = exp(-dot(p, p) / radius) * color;
              vec3 base = texture2D(uTarget, vUv).xyz;
              gl_FragColor = vec4(base + splat, 1.0);
          }
        `
      );

      const advectionShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision highp float;
          precision highp sampler2D;
          varying vec2 vUv;
          uniform sampler2D uVelocity;
          uniform sampler2D uSource;
          uniform vec2 texelSize;
          uniform vec2 dyeTexelSize;
          uniform float dt;
          uniform float dissipation;
          vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
              vec2 st = uv / tsize - 0.5;
              vec2 iuv = floor(st);
              vec2 fuv = fract(st);
              vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
              vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
              vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
              vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
              return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
          }
          void main () {
              #ifdef MANUAL_FILTERING
                  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
                  vec4 result = bilerp(uSource, coord, dyeTexelSize);
              #else
                  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                  vec4 result = texture2D(uSource, coord);
              #endif
              float decay = 1.0 + dissipation * dt;
              gl_FragColor = result / decay;
          }
        `,
        ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
      );

      const divergenceShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision mediump float;
          precision mediump sampler2D;
          varying highp vec2 vUv;
          varying highp vec2 vL;
          varying highp vec2 vR;
          varying highp vec2 vT;
          varying highp vec2 vB;
          uniform sampler2D uVelocity;
          void main () {
              float L = texture2D(uVelocity, vL).x;
              float R = texture2D(uVelocity, vR).x;
              float T = texture2D(uVelocity, vT).y;
              float B = texture2D(uVelocity, vB).y;
              vec2 C = texture2D(uVelocity, vUv).xy;
              if (vL.x < 0.0) { L = -C.x; }
              if (vR.x > 1.0) { R = -C.x; }
              if (vT.y > 1.0) { T = -C.y; }
              if (vB.y < 0.0) { B = -C.y; }
              float div = 0.5 * (R - L + T - B);
              gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
          }
        `
      );

      const curlShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision mediump float;
          precision mediump sampler2D;
          varying highp vec2 vUv;
          varying highp vec2 vL;
          varying highp vec2 vR;
          varying highp vec2 vT;
          varying highp vec2 vB;
          uniform sampler2D uVelocity;
          void main () {
              float L = texture2D(uVelocity, vL).y;
              float R = texture2D(uVelocity, vR).y;
              float T = texture2D(uVelocity, vT).x;
              float B = texture2D(uVelocity, vB).x;
              float vorticity = R - L - T + B;
              gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
          }
        `
      );

      const vorticityShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision highp float;
          precision highp sampler2D;
          varying vec2 vUv;
          varying vec2 vL;
          varying vec2 vR;
          varying vec2 vT;
          varying vec2 vB;
          uniform sampler2D uVelocity;
          uniform sampler2D uCurl;
          uniform float curl;
          uniform float dt;
          void main () {
              float L = texture2D(uCurl, vL).x;
              float R = texture2D(uCurl, vR).x;
              float T = texture2D(uCurl, vT).x;
              float B = texture2D(uCurl, vB).x;
              float C = texture2D(uCurl, vUv).x;
              vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
              force /= length(force) + 0.0001;
              force *= curl * C;
              force.y *= -1.0;
              vec2 velocity = texture2D(uVelocity, vUv).xy;
              velocity += force * dt;
              velocity = min(max(velocity, -1000.0), 1000.0);
              gl_FragColor = vec4(velocity, 0.0, 1.0);
          }
        `
      );

      const pressureShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision mediump float;
          precision mediump sampler2D;
          varying highp vec2 vUv;
          varying highp vec2 vL;
          varying highp vec2 vR;
          varying highp vec2 vT;
          varying highp vec2 vB;
          uniform sampler2D uPressure;
          uniform sampler2D uDivergence;
          void main () {
              float L = texture2D(uPressure, vL).x;
              float R = texture2D(uPressure, vR).x;
              float T = texture2D(uPressure, vT).x;
              float B = texture2D(uPressure, vB).x;
              float C = texture2D(uPressure, vUv).x;
              float divergence = texture2D(uDivergence, vUv).x;
              float pressure = (L + R + B + T - divergence) * 0.25;
              gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
          }
        `
      );

      const gradientSubtractShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
          precision mediump float;
          precision mediump sampler2D;
          varying highp vec2 vUv;
          varying highp vec2 vL;
          varying highp vec2 vR;
          varying highp vec2 vT;
          varying highp vec2 vB;
          uniform sampler2D uPressure;
          uniform sampler2D uVelocity;
          void main () {
              float L = texture2D(uPressure, vL).x;
              float R = texture2D(uPressure, vR).x;
              float T = texture2D(uPressure, vT).x;
              float B = texture2D(uPressure, vB).x;
              vec2 velocity = texture2D(uVelocity, vUv).xy;
              velocity.xy -= vec2(R - L, T - B);
              gl_FragColor = vec4(velocity, 0.0, 1.0);
          }
        `
      );

      const quadVBO = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      const quadIBO = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIBO);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      function blit(target, clear = false) {
        if (target == null) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (clear) {
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }

      let dye, velocity, divergence, curl, pressure;

      const copyProgram = new Program(baseVertexShader, copyShader); // eslint-disable-line no-unused-vars
      const clearProgram = new Program(baseVertexShader, clearShader);
      const splatProgram = new Program(baseVertexShader, splatShader);
      const advectionProgram = new Program(baseVertexShader, advectionShader);
      const divergenceProgram = new Program(baseVertexShader, divergenceShader);
      const curlProgram = new Program(baseVertexShader, curlShader);
      const vorticityProgram = new Program(baseVertexShader, vorticityShader);
      const pressureProgram = new Program(baseVertexShader, pressureShader);
      const gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
      const displayMaterial = new Material(baseVertexShader, displayShaderSource);

      function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return {
          texture, fbo, width: w, height: h,
          texelSizeX: 1.0 / w, texelSizeY: 1.0 / h,
          attach(id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
          },
        };
      }

      function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);
        return {
          width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
          get read() { return fbo1; }, set read(v) { fbo1 = v; },
          get write() { return fbo2; }, set write(v) { fbo2 = v; },
          swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
        };
      }

      function getResolution(resolution) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
        const min = Math.round(resolution);
        const max = Math.round(resolution * aspectRatio);
        if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
        return { width: min, height: max };
      }

      function initFramebuffers() {
        let simRes = getResolution(config.SIM_RESOLUTION);
        let dyeRes = getResolution(config.DYE_RESOLUTION);
        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        gl.disable(gl.BLEND);
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      }

      function updateKeywords() {
        let displayKeywords = [];
        if (config.SHADING) displayKeywords.push('SHADING');
        displayMaterial.setKeywords(displayKeywords);
      }
      updateKeywords();
      initFramebuffers();

      let lastUpdateTime = Date.now();
      let colorUpdateTimer = 0.0;
      let rafId = 0;

      function scaleByPixelRatio(input) {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        return Math.floor(input * pixelRatio);
      }

      function resizeCanvasIfNeeded() {
        let width = scaleByPixelRatio(canvas.clientWidth);
        let height = scaleByPixelRatio(canvas.clientHeight);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          return true;
        }
        return false;
      }

      function hexToRGB(hex) {
        let val = hex.replace('#', '');
        if (val.length === 3) val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
        return {
          r: (parseInt(val.slice(0, 2), 16) / 255) * 0.15,
          g: (parseInt(val.slice(2, 4), 16) / 255) * 0.15,
          b: (parseInt(val.slice(4, 6), 16) / 255) * 0.15,
        };
      }
      function generateColor() {
        return hexToRGB(config.COLOR);
      }
      function wrap(value, min, max) {
        const range = max - min;
        if (range === 0) return min;
        return ((value - min) % range) + min;
      }
      function hashCode(s) {
        if (s.length === 0) return 0;
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = (hash << 5) - hash + s.charCodeAt(i);
          hash |= 0;
        }
        return hash;
      }

      function correctRadius(radius) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
      }

      function splat(x, y, dx, dy, colorRgb) {
        splatProgram.bind();
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.point, x, y);
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProgram.uniforms.color, colorRgb.r, colorRgb.g, colorRgb.b);
        blit(dye.write);
        dye.swap();
      }

      function splatPointer(pointer) {
        let dx = pointer.deltaX * config.SPLAT_FORCE;
        let dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
      }

      function updatePointerDownData(pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = generateColor();
      }
      function updatePointerMoveData(pointer, posX, posY, colorRgb) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
        pointer.color = colorRgb;
      }
      function correctDeltaX(delta) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
      }
      function correctDeltaY(delta) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
      }

      function step(dt) {
        gl.disable(gl.BLEND);

        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
          gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
          blit(pressure.write);
          pressure.swap();
        }

        gradientSubtractProgram.bind();
        gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        advectionProgram.bind();
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        if (!ext.supportLinearFiltering)
          gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        let velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        if (!ext.supportLinearFiltering)
          gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();
      }

      function render() {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        displayMaterial.bind();
        if (config.SHADING) gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / canvas.width, 1.0 / canvas.height);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        blit(null);
      }

      function updateFrame() {
        if (disposed) return;
        if (gl.isContextLost()) {
          // handleContextLost will already be firing/have fired to stop this
          // loop via teardownActive(); this is a defensive belt-and-suspenders
          // check in case a frame was already in flight when loss occurred.
          return;
        }
        const now = Date.now();
        let dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
        lastUpdateTime = now;

        if (resizeCanvasIfNeeded()) initFramebuffers();

        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (colorUpdateTimer >= 1) {
          colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
          pointers.forEach(p => { p.color = generateColor(); });
        }

        pointers.forEach(p => {
          if (p.moved) {
            p.moved = false;
            splatPointer(p);
          }
        });

        step(dt);
        render();
        rafId = requestAnimationFrame(updateFrame);
      }

      const onMouseDown = e => {
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY);
        updatePointerDownData(pointer, -1, posX, posY);
      };
      const onMouseMove = e => {
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY);
        updatePointerMoveData(pointer, posX, posY, pointer.color);
      };
      const onTouchStart = e => {
        const touches = e.targetTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
          updatePointerDownData(pointer, touches[i].identifier, scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY));
        }
      };
      const onTouchMove = e => {
        const touches = e.targetTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
          updatePointerMoveData(pointer, scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY), pointer.color);
        }
      };
      const onTouchEnd = () => {
        pointers[0].down = false;
      };

      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      // passive: true is explicit here (not just the browser default) so the
      // browser never waits on this listener before starting a scroll — we
      // never call preventDefault, so normal page scrolling stays untouched
      // even while a finger inside the entry area is also feeding the fluid.
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });

      rafId = requestAnimationFrame(updateFrame);

      activeCleanup = () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchstart', onTouchStart, { passive: true });
        window.removeEventListener('touchmove', onTouchMove, { passive: true });
        window.removeEventListener('touchend', onTouchEnd, { passive: true });
      };
    }

    attemptInitialize();

    // If the canvas wasn't measurable at mount time (extremely unlikely for
    // this fixed/inset-0 canvas, but not assumed), retry once real layout
    // dimensions land. Event-based via ResizeObserver, not a guessed delay.
    if (canvas.width === 0 || canvas.height === 0) {
      resizeObserver = new ResizeObserver(() => {
        if (disposed) return;
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
          resizeObserver.disconnect();
          resizeObserver = null;
          attemptInitialize();
        }
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      teardownActive();
      // Only force-release the WebGL context on a *genuine* unmount. By the
      // time this cleanup runs, canvas.isConnected is already false for a
      // real unmount (React detaches the DOM node during commit, before
      // passive-effect cleanups fire) but stays true throughout React
      // StrictMode's synchronous dev-only mount->cleanup->mount — so this
      // check reliably tells the two apart without any timing guess.
      // Releasing here (rather than leaving it to GC) is what keeps repeated
      // Men<->Women navigation and repeated scroll-in/out from accumulating
      // live contexts.
      if (!canvas.isConnected && gl && !gl.isContextLost()) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      data-splash-cursor="true"
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-40 h-full w-full ${className}`}
    />
  );
}

export default SplashCursor;
