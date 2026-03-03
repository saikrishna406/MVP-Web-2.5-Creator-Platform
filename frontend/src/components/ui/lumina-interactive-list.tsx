'use client';
import React, { useEffect, useRef } from 'react';

declare const gsap: any;
declare const THREE: any;

export function Component() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // --- DYNAMIC SCRIPT LOADING ---
        const loadScripts = async () => {
            const loadScript = (src: string, globalName: string) => new Promise<void>((res, rej) => {
                if ((window as any)[globalName]) { res(); return; }
                if (document.querySelector(`script[src="${src}"]`)) {
                    const check = setInterval(() => {
                        if ((window as any)[globalName]) { clearInterval(check); res(); }
                    }, 50);
                    setTimeout(() => { clearInterval(check); rej(new Error(`Timeout waiting for ${globalName}`)); }, 10000);
                    return;
                }
                const s = document.createElement('script');
                s.src = src;
                s.onload = () => { setTimeout(() => res(), 100); };
                s.onerror = () => rej(new Error(`Failed to load ${src}`));
                document.head.appendChild(s);
            });

            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', 'gsap');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE');
            } catch (e) {
                console.error('Failed to load base scripts:', e);
            }
        };

        const initApplication = async () => {
            // --- PRELOADER REMOVED ---

            // --- MAIN LOGIC ---
            const SLIDER_CONFIG: any = {
                settings: {
                    transitionDuration: 1.2, autoSlideSpeed: 3500, currentEffect: "glass", currentEffectPreset: "Default",
                    globalIntensity: 1.0, speedMultiplier: 1.0, distortionStrength: 1.0, colorEnhancement: 1.0,
                    glassRefractionStrength: 1.0, glassChromaticAberration: 1.0, glassBubbleClarity: 1.0, glassEdgeGlow: 1.0, glassLiquidFlow: 1.0,
                    frostIntensity: 1.5, frostCrystalSize: 1.0, frostIceCoverage: 1.0, frostTemperature: 1.0, frostTexture: 1.0,
                    rippleFrequency: 25.0, rippleAmplitude: 0.08, rippleWaveSpeed: 1.0, rippleRippleCount: 1.0, rippleDecay: 1.0,
                    plasmaIntensity: 1.2, plasmaSpeed: 0.8, plasmaEnergyIntensity: 0.4, plasmaContrastBoost: 0.3, plasmaTurbulence: 1.0,
                    timeshiftDistortion: 1.6, timeshiftBlur: 1.5, timeshiftFlow: 1.4, timeshiftChromatic: 1.5, timeshiftTurbulence: 1.4
                },
                effectPresets: {
                    glass: { Subtle: { glassRefractionStrength: 0.6, glassChromaticAberration: 0.5, glassBubbleClarity: 1.3, glassEdgeGlow: 0.7, glassLiquidFlow: 0.8 }, Default: { glassRefractionStrength: 1.0, glassChromaticAberration: 1.0, glassBubbleClarity: 1.0, glassEdgeGlow: 1.0, glassLiquidFlow: 1.0 }, Crystal: { glassRefractionStrength: 1.5, glassChromaticAberration: 1.8, glassBubbleClarity: 0.7, glassEdgeGlow: 1.4, glassLiquidFlow: 0.5 }, Liquid: { glassRefractionStrength: 0.8, glassChromaticAberration: 0.4, glassBubbleClarity: 1.2, glassEdgeGlow: 0.8, glassLiquidFlow: 1.8 } },
                    frost: { Light: { frostIntensity: 0.8, frostCrystalSize: 1.3, frostIceCoverage: 0.6, frostTemperature: 0.7, frostTexture: 0.8 }, Default: { frostIntensity: 1.5, frostCrystalSize: 1.0, frostIceCoverage: 1.0, frostTemperature: 1.0, frostTexture: 1.0 }, Heavy: { frostIntensity: 2.2, frostCrystalSize: 0.7, frostIceCoverage: 1.4, frostTemperature: 1.5, frostTexture: 1.3 }, Arctic: { frostIntensity: 2.8, frostCrystalSize: 0.5, frostIceCoverage: 1.8, frostTemperature: 2.0, frostTexture: 1.6 } },
                    ripple: { Gentle: { rippleFrequency: 15.0, rippleAmplitude: 0.05, rippleWaveSpeed: 0.7, rippleRippleCount: 0.8, rippleDecay: 1.2 }, Default: { rippleFrequency: 25.0, rippleAmplitude: 0.08, rippleWaveSpeed: 1.0, rippleRippleCount: 1.0, rippleDecay: 1.0 }, Strong: { rippleFrequency: 35.0, rippleAmplitude: 0.12, rippleWaveSpeed: 1.4, rippleRippleCount: 1.3, rippleDecay: 0.8 }, Tsunami: { rippleFrequency: 45.0, rippleAmplitude: 0.18, rippleWaveSpeed: 1.8, rippleRippleCount: 1.6, rippleDecay: 0.6 } },
                    plasma: { Calm: { plasmaIntensity: 0.8, plasmaSpeed: 0.5, plasmaEnergyIntensity: 0.2, plasmaContrastBoost: 0.1, plasmaTurbulence: 0.6 }, Default: { plasmaIntensity: 1.2, plasmaSpeed: 0.8, plasmaEnergyIntensity: 0.4, plasmaContrastBoost: 0.3, plasmaTurbulence: 1.0 }, Storm: { plasmaIntensity: 1.8, plasmaSpeed: 1.3, plasmaEnergyIntensity: 0.7, plasmaContrastBoost: 0.5, plasmaTurbulence: 1.5 }, Nuclear: { plasmaIntensity: 2.5, plasmaSpeed: 1.8, plasmaEnergyIntensity: 1.0, plasmaContrastBoost: 0.8, plasmaTurbulence: 2.0 } },
                    timeshift: { Subtle: { timeshiftDistortion: 0.5, timeshiftBlur: 0.6, timeshiftFlow: 0.5, timeshiftChromatic: 0.4, timeshiftTurbulence: 0.6 }, Default: { timeshiftDistortion: 1.6, timeshiftBlur: 1.5, timeshiftFlow: 1.4, timeshiftChromatic: 1.5, timeshiftTurbulence: 1.4 }, Intense: { timeshiftDistortion: 2.2, timeshiftBlur: 2.0, timeshiftFlow: 2.0, timeshiftChromatic: 2.2, timeshiftTurbulence: 2.0 }, Dreamlike: { timeshiftDistortion: 2.8, timeshiftBlur: 2.5, timeshiftFlow: 2.5, timeshiftChromatic: 2.6, timeshiftTurbulence: 2.5 } }
                }
            };

            // --- GLOBAL STATE ---
            let currentSlideIndex = 0;
            let isTransitioning = false;
            let shaderMaterial: any, renderer: any, scene: any, camera: any;
            let slideTextures: any[] = [];
            let texturesLoaded = false;
            let autoSlideTimer: any = null;
            let progressAnimation: any = null;
            let sliderEnabled = false;
            let rafId: any = null; // Stored to prevent memory leak

            const SLIDE_DURATION = () => SLIDER_CONFIG.settings.autoSlideSpeed;
            const PROGRESS_UPDATE_INTERVAL = 50;
            const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;

            const slides = [
                { title: "From you to your crew", description: "Direct token-gated content, exclusive interaction, and a thriving dual economy.", media: "/herosection.mp4" },
                { title: "Your creative empire", description: "Set up token packages, price your content, and get paid instantly via Stripe.", media: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?q=80&w=2000" },
                { title: "Engage and reward", description: "Turn active fans into super-fans with gamified points and exclusive redemption stores.", media: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2000" }
            ];

            // --- SHADERS ---
            const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
            const fragmentShader = `
            uniform sampler2D uTexture1, uTexture2;
            uniform float uProgress;
            uniform vec2 uResolution, uTexture1Size, uTexture2Size;
            uniform int uEffectType;
            uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength, uColorEnhancement;
            uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
            uniform float uFrostIntensity, uFrostCrystalSize, uFrostIceCoverage, uFrostTemperature, uFrostTexture;
            uniform float uRippleFrequency, uRippleAmplitude, uRippleWaveSpeed, uRippleRippleCount, uRippleDecay;
            uniform float uPlasmaIntensity, uPlasmaSpeed, uPlasmaEnergyIntensity, uPlasmaContrastBoost, uPlasmaTurbulence;
            uniform float uTimeshiftDistortion, uTimeshiftBlur, uTimeshiftFlow, uTimeshiftChromatic, uTimeshiftTurbulence;
            varying vec2 vUv;

            vec2 getCoverUV(vec2 uv, vec2 textureSize) {
                vec2 s = uResolution / textureSize;
                float scale = max(s.x, s.y);
                vec2 scaledSize = textureSize * scale;
                vec2 offset = (uResolution - scaledSize) * 0.5;
                return (uv * uResolution - offset) / scaledSize;
            }
            float noise(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            
            vec4 glassEffect(vec2 uv, float progress) {
                float time = progress * 5.0 * uSpeedMultiplier;
                vec2 uv1 = getCoverUV(uv, uTexture1Size); vec2 uv2 = getCoverUV(uv, uTexture2Size);
                float maxR = length(uResolution) * 0.85; float br = progress * maxR;
                vec2 p = uv * uResolution; vec2 c = uResolution * 0.5;
                float d = length(p - c); float nd = d / max(br, 0.001);
                float param = smoothstep(br + 3.0, br - 3.0, d); // Inside circle
                vec4 img;
                if (param > 0.0) {
                     float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
                     vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
                     vec2 distUV = uv2 - dir * ro;
                     distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
                     float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
                     img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
                     if (uGlassEdgeGlow > 0.0) {
                        float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
                        img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
                     }
                } else { img = texture2D(uTexture2, uv2); }
                vec4 oldImg = texture2D(uTexture1, uv1);
                if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
                return mix(oldImg, img, param);
            }
            // Simplified stubs for other effects (to save space, logic is in glassEffect mainly for demo)
            vec4 frostEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
            vec4 rippleEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
            vec4 plasmaEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }
            vec4 timeshiftEffect(vec2 uv, float progress) { return mix(texture2D(uTexture1, getCoverUV(uv, uTexture1Size)), texture2D(uTexture2, getCoverUV(uv, uTexture2Size)), progress); }

            void main() {
                if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
                else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
                else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
                else if (uEffectType == 3) gl_FragColor = plasmaEffect(vUv, uProgress);
                else gl_FragColor = timeshiftEffect(vUv, uProgress);
            }
        `;

            // --- CORE FUNCTIONS ---
            const getEffectIndex = (n: string) => ({ glass: 0, frost: 1, ripple: 2, plasma: 3, timeshift: 4 } as any)[n] || 0;

            const updateShaderUniforms = () => {
                if (!shaderMaterial) return;
                const s = SLIDER_CONFIG.settings, u = shaderMaterial.uniforms;
                for (const key in s) {
                    const uName = 'u' + key.charAt(0).toUpperCase() + key.slice(1);
                    if (u[uName]) u[uName].value = s[key];
                }
                u.uEffectType.value = getEffectIndex(s.currentEffect);
            };

            const splitText = (text: string) => {
                return text.split(' ').map(word => `<span style="display: inline-block; opacity: 0; white-space: nowrap;">${word}</span>`).join(' ');
            };

            const updateContent = (idx: number) => {
                const titleEl = document.getElementById('mainTitle');
                const descEl = document.getElementById('mainDesc');
                if (titleEl && descEl) {
                    // Universal animate out (fade up)
                    gsap.to(titleEl.children, { y: -20, opacity: 0, duration: 0.5, stagger: 0.02, ease: "power2.in" });
                    gsap.to(descEl, { y: -10, opacity: 0, duration: 0.4, ease: "power2.in" });

                    setTimeout(() => {
                        // Set new content
                        titleEl.innerHTML = splitText(slides[idx].title);
                        descEl.textContent = slides[idx].description;

                        // Reset state (general reset, specific animations might override)
                        gsap.set(titleEl.children, { opacity: 0 });
                        gsap.set(descEl, { y: 20, opacity: 0 });

                        // 6 Different Animations
                        const children = titleEl.children;
                        switch (idx) {
                            case 0: // Stagger Up (Original)
                                gsap.set(children, { y: 20 });
                                gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "power3.out" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
                                break;
                            case 1: // Stagger Down
                                gsap.set(children, { y: -20 });
                                gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "back.out(1.7)" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
                                break;
                            case 2: // Blur Reveal (Randomish)
                                gsap.set(children, { filter: "blur(10px)", scale: 1.5, y: 0 });
                                gsap.to(children, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 1, stagger: { amount: 0.5, from: "random" }, ease: "power2.out" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power2.out" });
                                break;
                            case 3: // Scale In
                                gsap.set(children, { scale: 0, y: 0 });
                                gsap.to(children, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: "back.out(1.5)" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
                                break;
                            case 4: // Rotate X (Flip)
                                gsap.set(children, { rotationX: 90, y: 0, transformOrigin: "50% 50%" });
                                gsap.to(children, { rotationX: 0, opacity: 1, duration: 0.8, stagger: 0.04, ease: "power2.out" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power2.out" });
                                break;
                            case 5: // Side Reveal (Slide Left)
                                gsap.set(children, { x: 30, y: 0 });
                                gsap.to(children, { x: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "power3.out" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
                                break;
                            default: // Fallback
                                gsap.set(children, { y: 20 });
                                gsap.to(children, { y: 0, opacity: 1, duration: 0.8, stagger: 0.03, ease: "power3.out" });
                                gsap.to(descEl, { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
                        }

                    }, 500);
                }
            };

            const navigateToSlide = (targetIndex: number) => {
                if (isTransitioning || targetIndex === currentSlideIndex) return; // BLOCKING LOGIC
                stopAutoSlideTimer();
                quickResetProgress(currentSlideIndex);

                const currentTexture = slideTextures[currentSlideIndex];
                const targetTexture = slideTextures[targetIndex];
                if (!currentTexture || !targetTexture) {
                    isTransitioning = false;
                    safeStartTimer(100);
                    return;
                }

                isTransitioning = true;
                shaderMaterial.uniforms.uTexture1.value = currentTexture;
                shaderMaterial.uniforms.uTexture2.value = targetTexture;
                shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
                shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;

                updateContent(targetIndex);

                currentSlideIndex = targetIndex;
                updateCounter(currentSlideIndex);
                updateNavigationState(currentSlideIndex);

                gsap.fromTo(shaderMaterial.uniforms.uProgress,
                    { value: 0 },
                    {
                        value: 1,
                        duration: TRANSITION_DURATION(),
                        ease: "power2.inOut",
                        onComplete: () => {
                            shaderMaterial.uniforms.uProgress.value = 0;
                            shaderMaterial.uniforms.uTexture1.value = targetTexture;
                            shaderMaterial.uniforms.uTexture1Size.value = targetTexture.userData.size;
                            isTransitioning = false;
                            safeStartTimer(100);
                        }
                    }
                );
            };

            const handleSlideChange = () => {
                if (isTransitioning || !texturesLoaded || !sliderEnabled) return;
                const nextIndex = currentSlideIndex + 1 >= slides.length ? 0 : currentSlideIndex + 1;
                navigateToSlide(nextIndex);
            };

            const createSlidesNavigation = () => {
                const nav = document.getElementById("slidesNav"); if (!nav) return;
                nav.innerHTML = "";
                slides.forEach((slide, i) => {
                    const item = document.createElement("div");
                    item.className = `slide-nav-item${i === 0 ? " active" : ""}`;
                    item.dataset.slideIndex = String(i);
                    item.innerHTML = `<div class="slide-nav-title">${slide.title}</div>`;
                    item.addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (!isTransitioning && i !== currentSlideIndex) {
                            stopAutoSlideTimer();
                            quickResetProgress(currentSlideIndex);
                            navigateToSlide(i);
                        }
                    });
                    nav.appendChild(item);
                });
            };

            const updateNavigationState = (idx: number) => document.querySelectorAll(".slide-nav-item").forEach((el, i) => el.classList.toggle("active", i === idx));
            const updateSlideProgress = (idx: number, prog: number) => { /* removed */ };
            const fadeSlideProgress = (idx: number) => { /* removed */ };
            const quickResetProgress = (idx: number) => { /* removed */ };
            const updateCounter = (idx: number) => {
                const sn = document.getElementById("slideNumber"); if (sn) sn.textContent = String(idx + 1).padStart(2, "0");
                const st = document.getElementById("slideTotal"); if (st) st.textContent = String(slides.length).padStart(2, "0");
            };

            const startAutoSlideTimer = () => {
                if (!texturesLoaded || !sliderEnabled) return;
                stopAutoSlideTimer();
                autoSlideTimer = setTimeout(() => {
                    if (!isTransitioning) handleSlideChange();
                }, SLIDE_DURATION());
            };
            const stopAutoSlideTimer = () => {
                if (autoSlideTimer) clearTimeout(autoSlideTimer);
                autoSlideTimer = null;
            };
            const safeStartTimer = (delay = 0) => {
                stopAutoSlideTimer();
                if (sliderEnabled && texturesLoaded) {
                    if (delay > 0) autoSlideTimer = setTimeout(startAutoSlideTimer, delay);
                    else startAutoSlideTimer();
                }
            };

            const loadMediaTexture = (src: string) => new Promise<any>((resolve, reject) => {
                if (src.endsWith('.mp4') || src.endsWith('.webm')) {
                    const video = document.createElement('video');
                    video.src = src;
                    video.crossOrigin = 'anonymous';
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.play().then(() => {
                        const t = new THREE.VideoTexture(video);
                        t.minFilter = t.magFilter = THREE.LinearFilter;
                        t.userData = { size: new THREE.Vector2(video.videoWidth, video.videoHeight) };
                        resolve(t);
                    }).catch(reject);
                } else {
                    const l = new THREE.TextureLoader();
                    l.load(src, (t: any) => { t.minFilter = t.magFilter = THREE.LinearFilter; t.userData = { size: new THREE.Vector2(t.image.width, t.image.height) }; resolve(t); }, undefined, reject);
                }
            });

            const initRenderer = async () => {
                const canvas = document.querySelector(".webgl-canvas") as HTMLCanvasElement; if (!canvas) return;

                try {
                    scene = new THREE.Scene(); camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
                    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                    shaderMaterial = new THREE.ShaderMaterial({
                        uniforms: {
                            uTexture1: { value: null }, uTexture2: { value: null }, uProgress: { value: 0 },
                            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                            uTexture1Size: { value: new THREE.Vector2(1, 1) }, uTexture2Size: { value: new THREE.Vector2(1, 1) },
                            uEffectType: { value: 0 },
                            uGlobalIntensity: { value: 1.0 }, uSpeedMultiplier: { value: 1.0 }, uDistortionStrength: { value: 1.0 }, uColorEnhancement: { value: 1.0 },
                            uGlassRefractionStrength: { value: 1.0 }, uGlassChromaticAberration: { value: 1.0 }, uGlassBubbleClarity: { value: 1.0 }, uGlassEdgeGlow: { value: 1.0 }, uGlassLiquidFlow: { value: 1.0 },
                            // Init others defaults
                            uFrostIntensity: { value: 1.0 }, uFrostCrystalSize: { value: 1.0 }, uFrostIceCoverage: { value: 1.0 }, uFrostTemperature: { value: 1.0 }, uFrostTexture: { value: 1.0 },
                            uRippleFrequency: { value: 25.0 }, uRippleAmplitude: { value: 0.08 }, uRippleWaveSpeed: { value: 1.0 }, uRippleRippleCount: { value: 1.0 }, uRippleDecay: { value: 1.0 },
                            uPlasmaIntensity: { value: 1.2 }, uPlasmaSpeed: { value: 0.8 }, uPlasmaEnergyIntensity: { value: 0.4 }, uPlasmaContrastBoost: { value: 0.3 }, uPlasmaTurbulence: { value: 1.0 },
                            uTimeshiftDistortion: { value: 1.6 }, uTimeshiftBlur: { value: 1.5 }, uTimeshiftFlow: { value: 1.4 }, uTimeshiftChromatic: { value: 1.5 }, uTimeshiftTurbulence: { value: 1.4 }
                        },
                        vertexShader, fragmentShader
                    });
                    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

                    // Create a fallback placeholder texture for failed loads
                    const createFallbackTexture = () => {
                        const c = document.createElement('canvas'); c.width = 2; c.height = 2;
                        const ctx = c.getContext('2d');
                        if (ctx) { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 2, 2); }
                        const t = new THREE.CanvasTexture(c);
                        t.userData = { size: new THREE.Vector2(2, 2) };
                        return t;
                    };

                    for (const s of slides) {
                        try {
                            slideTextures.push(await loadMediaTexture(s.media));
                        } catch (e) {
                            console.warn("Failed texture:", s.media, e);
                            slideTextures.push(createFallbackTexture());
                        }
                    }
                    if (slideTextures.length > 0) {
                        shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
                        shaderMaterial.uniforms.uTexture2.value = slideTextures.length > 1 ? slideTextures[1] : slideTextures[0];
                        shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
                        shaderMaterial.uniforms.uTexture2Size.value = (slideTextures.length > 1 ? slideTextures[1] : slideTextures[0]).userData.size;
                        texturesLoaded = true; sliderEnabled = true;
                        updateShaderUniforms(); // Apply config
                        document.querySelector(".slider-wrapper")?.classList.add("loaded"); // Fade in immediately
                        safeStartTimer(500);
                    }

                    const render = () => { rafId = requestAnimationFrame(render); if (renderer) renderer.render(scene, camera); };
                    render();
                } catch (e) {
                    console.warn("WebGL initialization failed, falling back gracefully:", e);
                    document.querySelector(".slider-wrapper")?.classList.add("loaded");
                }
            };

            createSlidesNavigation(); updateCounter(0);

            // Init text content
            const tEl = document.getElementById('mainTitle');
            const dEl = document.getElementById('mainDesc');
            if (tEl && dEl) {
                tEl.innerHTML = splitText(slides[0].title);
                dEl.textContent = slides[0].description;
                // animate initial in
                gsap.fromTo(tEl.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.03, ease: "power3.out", delay: 0.5 });
                gsap.fromTo(dEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 });
            }

            initRenderer();

            // Listeners
            const handleVisChange = () => document.hidden ? stopAutoSlideTimer() : (!isTransitioning && safeStartTimer());
            document.addEventListener("visibilitychange", handleVisChange);

            const handleResize = () => { if (renderer) { renderer.setSize(window.innerWidth, window.innerHeight); shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight); } };
            window.addEventListener("resize", handleResize);

            // Cleanup
            return () => {
                stopAutoSlideTimer();
                document.removeEventListener("visibilitychange", handleVisChange);
                window.removeEventListener("resize", handleResize);
                if (rafId) cancelAnimationFrame(rafId);
                if (renderer) renderer.dispose();
                if (scene) scene.clear();
            };
        };

        let cleanupFn: any = null;
        loadScripts().then(() => {
            // initApplication returns a cleanup function promise, let's capture it.
            initApplication().then(cleanup => {
                cleanupFn = cleanup;
            });
        });

        return () => {
            if (cleanupFn) cleanupFn();
        };
    }, []);

    return (
        <>
            <main className="slider-wrapper" ref={containerRef}>
                <canvas className="webgl-canvas"></canvas>
                <span className="slide-number" id="slideNumber" style={{ display: 'none' }}>01</span>
                <span className="slide-total" id="slideTotal" style={{ display: 'none' }}>03</span>

                <div className="slide-content">
                    <h1 className="slide-title" id="mainTitle"></h1>
                    <p className="slide-description" id="mainDesc"></p>
                </div>

                <nav className="slides-navigation" id="slidesNav"></nav>
            </main>
        </>
    );
}
