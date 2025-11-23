/**
 * FFXIV Character Card Generator - Vertical Version
 * Mobile Optimized (Half-Resolution) Version
 */

// デバッグログ（問題がなければ後で削除可能）
const initDebugConsole = () => {
    const consoleDiv = document.createElement('div');
    consoleDiv.id = 'debug-console';
    consoleDiv.style.cssText = `
        position: fixed; bottom: 0; left: 0; width: 100%; height: 20vh;
        background: rgba(0, 0, 0, 0.85); color: #00ff00;
        font-family: monospace; font-size: 10px;
        overflow-y: scroll; z-index: 99999;
        padding: 10px; border-top: 2px solid #00ff00;
        pointer-events: none; display: none; /* 通常は非表示に */
    `;
    document.body.appendChild(consoleDiv);

    window.logToScreen = (msg, type = 'INFO') => {
        console.log(`[${type}] ${msg}`);
        const line = document.createElement('div');
        line.textContent = `> ${msg}`;
        if(type === 'ERROR') line.style.color = 'red';
        consoleDiv.appendChild(line);
    };
};
initDebugConsole();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // --- スマホ判定と解像度設定 ---
        // 画面幅が768px以下ならメモリ節約モード（画質0.5倍）にする
        const isMobile = window.innerWidth <= 768;
        const BASE_WIDTH = 850;
        const BASE_HEIGHT = 1200;
        const SCALE_FACTOR = isMobile ? 0.5 : 1.0;

        // 実際にCanvasに設定するサイズ
        const CANVAS_WIDTH = BASE_WIDTH * SCALE_FACTOR;
        const CANVAS_HEIGHT = BASE_HEIGHT * SCALE_FACTOR;

        window.logToScreen(`Mode: ${isMobile ? 'Mobile (Low-Res)' : 'PC (High-Res)'}, Scale: ${SCALE_FACTOR}`);

        // DOM要素
        const backgroundLayer = document.getElementById('background-layer');
        const characterLayer = document.getElementById('character-layer');
        const uiLayer = document.getElementById('ui-layer');
        
        const bgCtx = backgroundLayer.getContext('2d');
        const charCtx = characterLayer.getContext('2d');
        const uiCtx = uiLayer.getContext('2d');

        // Canvasサイズ適用
        [backgroundLayer, characterLayer, uiLayer].forEach(c => {
            c.width = CANVAS_WIDTH;
            c.height = CANVAS_HEIGHT;
        });

        // ★重要: コンテキスト自体をスケールさせる
        // これにより、以後の描画座標(0〜850)は自動的に(0〜425)に変換される
        bgCtx.scale(SCALE_FACTOR, SCALE_FACTOR);
        charCtx.scale(SCALE_FACTOR, SCALE_FACTOR);
        uiCtx.scale(SCALE_FACTOR, SCALE_FACTOR);

        // UI要素の取得
        const nameInput = document.getElementById('nameInput');
        const fontSelect = document.getElementById('fontSelect');
        const uploadImageInput = document.getElementById('uploadImage');
        const fileNameDisplay = document.getElementById('fileName');
        const templateSelect = document.getElementById('templateSelect');
        const positionSelect = document.getElementById('positionSelect');
        const raceSelect = document.getElementById('raceSelect');
        const dcSelect = document.getElementById('dcSelect');
        const progressSelect = document.getElementById('progressSelect');
        const styleButtonsContainer = document.getElementById('styleButtons');
        const playtimeOptionsContainer = document.getElementById('playtimeOptions');
        const difficultyOptionsContainer = document.getElementById('difficultyOptions');
        const mainjobSelect = document.getElementById('mainjobSelect');
        const subjobSection = document.getElementById('subjobSection');
        const downloadBtn = document.getElementById('downloadBtn');
        const textColorPicker = document.getElementById('textColorPicker');
        const appElement = document.getElementById('app');
        const loaderElement = document.getElementById('loader');
        const saveModal = document.getElementById('saveModal');
        const modalImage = document.getElementById('modalImage');
        const closeModalBtn = document.getElementById('closeModal');
        const mainColorPickerSection = document.getElementById('main-color-picker-section');
        const iconBgColorPicker = document.getElementById('iconBgColorPicker');
        const resetColorBtn = document.getElementById('resetColorBtn');
        const stickyColorDrawer = document.getElementById('stickyColorDrawer');
        const drawerHandle = document.getElementById('drawerHandle');
        const stickyIconBgColorPicker = document.getElementById('stickyIconBgColorPicker');
        const stickyResetColorBtn = document.getElementById('stickyResetColorBtn');

        const NAME_COORDS = {
            _left:  { x: 211, y: 1073, width: 442, height: 70 },
            _right: { x: 197, y: 1073, width: 442, height: 70 }
        };

        const JOB_FILENAME_MAP = {
            'paladin': 'paladin', 'warrior': 'warrior', 'darkknight': 'darkknight', 'gunbreaker': 'gunbreaker',
            'whitemage': 'whitemage', 'scholar': 'scholar', 'astrologian': 'astrologian', 'sage': 'sage',
            'monk': 'monk', 'dragoon': 'dragoon', 'ninja': 'ninja', 'samurai': 'samurai', 'reaper': 'reaper', 'viper': 'viper',
            'bard': 'bard', 'machinist': 'machinist', 
            'dancer': 'dancer',
            'blackmage': 'blackmage', 'summoner': 'summoner', 'redmage': 'redmage', 'pictomancer': 'pictomancer', 'bluemage': 'bluemage',
            'carpenter': 'carpenter', 'blacksmith': 'blacksmith', 'armorer': 'armorer', 'goldsmith': 'goldsmith',
            'leatherworker': 'leatherworker', 'weaver': 'weaver', 'alchemist': 'alchemist', 'culinarian': 'culinarian',
            'miner': 'miner', 'botanist': 'botanist', 'fisher': 'fisher'
        };

        const templateConfig = {
            'Gothic_black':   { nameColor: '#ffffff', iconTint: '#ffffff', defaultBg: '#A142CD', iconTheme: 'Common' },
            'Gothic_white':   { nameColor: '#000000', iconTint: '#000000', defaultBg: '#6CD9D6', iconTheme: 'Common' },
            'Gothic_pink':    { nameColor: '#ffffff', iconTint: null,      defaultBg: '#A142CD', iconTheme: 'Common' },
            'Gothic_ice':     { nameColor: '#ffffff', iconTint: null,      defaultBg: '#ffffff', iconTheme: 'Common' },
            'Gothic_lemon':   { nameColor: '#ffffff', iconTint: null,      defaultBg: '#B4D84C', iconTheme: 'Common' },
            'Gothic_mint':    { nameColor: '#ffffff', iconTint: null,      defaultBg: '#DEE86E', iconTheme: 'Common' },
            'Gothic_peach':   { nameColor: '#ffffff', iconTint: null,      defaultBg: '#A142CD', iconTheme: 'Common' },
            'Neon_mono':      { nameColor: '#ffffff', iconTint: null,      defaultBg: '#B70016', iconTheme: 'Common' },
            'Neon_duotone':   { nameColor: '#ffffff', iconTint: null,      defaultBg: { primary: '#FFF500', secondary: '#80FF00'}, iconTheme: 'Common' },
            'Neon_meltdown':  { nameColor: '#ffffff', iconTint: null,      defaultBg: { primary: '#FF00CF', secondary: '#00A3FF'}, iconTheme: 'Common' },
            'Neon_midnight':  { nameColor: '#ffffff', iconTint: null,      defaultBg: '#0000CD', iconTheme: 'Common' },
            'Water':          { nameColor: '#ffffff', iconTint: null,      defaultBg: '#FFFFFF', iconTheme: 'Common' },
            'Lovely_heart':   { nameColor: '#E1C8D2', iconTint: '#E1C8D2', defaultBg: '#D34669', iconTheme: 'Common' },
            'Royal_garnet':   { nameColor: '#A2850A', iconTint: '#A2850A', defaultBg: '#000000', iconTheme: 'Royal' },
            'Royal_sapphire': { nameColor: '#A2850A', iconTint: '#A2850A', defaultBg: '#000000', iconTheme: 'Royal' },
            'Royal_aventurine': { nameColor: '#A2850A', iconTint: '#A2850A', defaultBg: '#6B0808', iconTheme: 'Royal' },
            'Snowflake':      { nameColor: '#000000', iconTint: '#ffffff', defaultBg: '#ffffff', iconTheme: 'Common' },
            'Vanilla':        { nameColor: '#000000', iconTint: '#FFF3C2', defaultBg: '#5E4C22', iconTheme: 'Common' }
        };

        const currentLang = document.documentElement.lang || 'ja';
        const translations = {
            ja: { generating: '画像を生成中...', generateDefault: 'この内容で作る？🐕' },
            en: { generating: 'Generating...', generateDefault: 'Generate Card' }
        };

        let state = { font: "'Exo 2', sans-serif", position: '_left', nameColor: '#ffffff' };
        let imageTransform = { img: null, x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0 };
        let imageCache = {};
        let isDownloading = false;
        let userHasManuallyPickedColor = false;
        let userHasManuallyPickedTextColor = false;

        const getAssetPath = (options) => {
            const isEn = currentLang === 'en';
            let langSuffix = '';
            if (isEn && (options.category === 'base' || options.filename.includes('progress') || options.filename.includes('playstyle') || options.filename.includes('time'))) {
                langSuffix = '_en';
            }
            const posSuffix = options.ignorePosition ? '' : state.position; 
            return `./assets/images/vertical/${options.category}/${options.filename}${posSuffix}${langSuffix}.webp`;
        };

        const loadImage = (src) => {
            if (imageCache[src]) return Promise.resolve(imageCache[src]);
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => { imageCache[src] = img; resolve(img); };
                img.onerror = () => { window.logToScreen(`Failed to load: ${src}`, 'ERROR'); resolve(null); };
                img.src = src;
            });
        };

        // 画像描画（縮小スケール済みコンテキストに描くので、座標はBASE_WIDTH基準でOK）
        const drawTinted = async (ctx, path, tintColor) => {
            const img = await loadImage(path);
            if (!img) return;
            
            // 一時Canvasも小さく作る
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = CANVAS_WIDTH;
            tempCanvas.height = CANVAS_HEIGHT;
            const tempCtx = tempCanvas.getContext('2d');
            
            // ここでもスケール適用
            tempCtx.scale(SCALE_FACTOR, SCALE_FACTOR);
            
            tempCtx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);
            if (tintColor) {
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = tintColor;
                tempCtx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
            }
            ctx.drawImage(tempCanvas, 0, 0, BASE_WIDTH, BASE_HEIGHT);
        };

        const createDebouncer = (func, delay) => {
            let timer;
            return (...args) => { clearTimeout(timer); timer = setTimeout(() => func(...args), delay); };
        };

        const preloadFonts = () => {
            const fonts = Array.from(fontSelect.options).filter(o => o.value).map(o => o.value);
            return Promise.all(fonts.map(font => document.fonts.load(`10px ${font}`).catch(() => {})));
        };

        const updateState = () => {
            state = {
                template: templateSelect.value,
                position: positionSelect.value,
                iconBgColor: iconBgColorPicker.value,
                characterName: nameInput.value,
                font: fontSelect.value,
                nameColor: textColorPicker.value,
                dc: dcSelect.value,
                race: raceSelect.value,
                progress: progressSelect.value,
                playstyles: [...styleButtonsContainer.querySelectorAll('button.active')].map(b => b.dataset.value),
                playtimes: [...playtimeOptionsContainer.querySelectorAll('input:checked')].map(cb => cb.className.includes('other') ? cb.value : `${cb.className}_${cb.value}`),
                difficulties: [...difficultyOptionsContainer.querySelectorAll('input:checked')].map(cb => cb.value),
                mainjob: mainjobSelect.value,
                subjobs: [...subjobSection.querySelectorAll('button.active')].map(b => b.dataset.value),
            };
        };

        const getIconBgColor = (iconCategory) => {
            const config = templateConfig[state.template];
            if (config && typeof config.defaultBg === 'object' && !userHasManuallyPickedColor) {
                return (iconCategory === 'raid' || iconCategory === 'subjob') ? config.defaultBg.secondary : config.defaultBg.primary;
            }
            return state.iconBgColor;
        };

        // --- 描画関数群 ---
        const drawCharacterLayer = () => {
            // clearRectはスケールの影響を受けるため BASE_WIDTH で指定してOK
            bgCtx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
            
            bgCtx.fillStyle = '#000000';
            bgCtx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
            
            if (imageTransform.img) {
                bgCtx.save();
                bgCtx.translate(imageTransform.x, imageTransform.y);
                bgCtx.scale(imageTransform.scale, imageTransform.scale);
                bgCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
                bgCtx.restore();
            }
        };

        const drawTemplateLayer = async () => {
            charCtx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
            await drawTinted(charCtx, getAssetPath({ category: 'base', filename: `${state.template}_cp` }));
        };

        const drawMiscParts = async (ctx) => {
            const config = templateConfig[state.template];
            if (!config) return;
            const raceAssetMap = { 'au_ra': 'aura', 'miqote': 'miqo_te' };

            if(state.dc) {
                const dcTheme = state.template.startsWith('Royal') ? 'Royal' : 'Common';
                await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `${dcTheme}_dc_${state.dc}`, ignorePosition: true }), config.iconTint);
            }
            
            const raceValue = raceAssetMap[state.race] || state.race;
            if (raceValue) {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_race_${raceValue}_bg` }), getIconBgColor('race'));
                await drawTinted(ctx, getAssetPath({ category: 'parts_frame', filename: `Common_race_${raceValue}_frame` }), config.iconTint);
            }
            
            if (state.progress) {
                const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
                if (state.progress === 'all_clear') {
                    for (const s of stages) await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_progress_${s}_bg` }), getIconBgColor('progress'));
                    await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: 'Common_progress_all_clear_bg' }), getIconBgColor('progress'));
                } else {
                    const idx = stages.indexOf(state.progress);
                    if (idx > -1) for (let i = 0; i <= idx; i++) await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_progress_${stages[i]}_bg` }), getIconBgColor('progress'));
                }
                const pFile = state.progress === 'gyougetsu' ? 'gyougetsu' : state.progress;
                await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `Common_progress_${pFile}_moji` }), config.iconTint);
                await drawTinted(ctx, getAssetPath({ category: 'parts_frame', filename: `Common_progress_${pFile}_frame` }), config.iconTint);
            }

            const playstyleBgNumMap = { leveling: '01', raid: '06', pvp: '03', dd: '14', hunt: '09', map: '08', gatherer: '05', crafter: '07', gil: '02', perform: '10', streaming: '12', glam: '04', studio: '13', housing: '11', screenshot: '15', drawing: '16', roleplay: '17' };
            for (const style of state.playstyles) {
                const bgNum = playstyleBgNumMap[style];
                if (bgNum) await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_playstyle_${bgNum}_bg` }), getIconBgColor('playstyle'));
            }
            for (const time of state.playtimes) {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_time_${time}_bg` }), getIconBgColor('time'));
                await drawTinted(ctx, getAssetPath({ category: 'parts_frame', filename: `Common_time_${time}_frame` }), config.iconTint);
            }
            for (const diff of state.difficulties) {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_raid_${diff}_bg` }), getIconBgColor('raid'));
            }
        };

        const drawMainJobIcon = async (ctx) => {
            const filename = JOB_FILENAME_MAP[state.mainjob] || state.mainjob;
            if(state.mainjob) await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_main` }), templateConfig[state.template].iconTint);
        };

        const drawSubJobParts = async (ctx) => {
            const config = templateConfig[state.template];
            for (const job of state.subjobs) {
                const filename = JOB_FILENAME_MAP[job] || job;
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_job_${filename}_sub_bg` }), getIconBgColor('subjob'));
                await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_sub_frame` }), config.iconTint);
            }
        };

        const drawNameText = async (ctx) => {
            if (!state.characterName || !state.font) return;
            const fontName = state.font.split(',')[0].replace(/'/g, '');
            const nameArea = NAME_COORDS[state.position];
            let fontSize = 50;
            ctx.font = `${fontSize}px "${fontName}"`;
            while(ctx.measureText(state.characterName).width > nameArea.width && fontSize > 10) { fontSize--; ctx.font = `${fontSize}px "${fontName}"`; }
            ctx.fillStyle = state.nameColor || '#ffffff';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(state.characterName, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
        };

        const redrawAll = async () => {
            updateState();
            try {
                drawCharacterLayer();
                await drawTemplateLayer();
                
                uiCtx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
                await drawMiscParts(uiCtx);
                await drawSubJobParts(uiCtx);
                
                const config = templateConfig[state.template];
                if (config) {
                    await drawTinted(uiCtx, getAssetPath({ category: 'frame', filename: 'Common_background_frame' }), config.iconTint);
                }

                await drawMainJobIcon(uiCtx);
                await drawNameText(uiCtx);
                
            } catch (e) {
                window.logToScreen(`Error: ${e.message}`, 'ERROR');
            }
        };

        const debouncedRedrawAll = createDebouncer(redrawAll, 300);

        // Event Listeners
        templateSelect.addEventListener('change', async () => {
            updateState();
            if (!userHasManuallyPickedColor) {
                const config = templateConfig[state.template];
                if (config) {
                    let newColor = (typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config.defaultBg || '#CCCCCC');
                    iconBgColorPicker.value = newColor;
                    stickyIconBgColorPicker.value = newColor;
                }
            }
            if (!userHasManuallyPickedTextColor) {
                const config = templateConfig[state.template];
                if (config && config.nameColor) textColorPicker.value = config.nameColor;
            }
            await redrawAll();
        });
        
        positionSelect.addEventListener('change', async () => { updateState(); await redrawAll(); });
        textColorPicker.addEventListener('input', () => { userHasManuallyPickedTextColor = true; updateState(); debouncedRedrawAll(); });
        
        const handleColorInput = (s, t) => { userHasManuallyPickedColor = true; t.value = s.value; updateState(); debouncedRedrawAll(); };
        iconBgColorPicker.addEventListener('input', () => handleColorInput(iconBgColorPicker, stickyIconBgColorPicker));
        stickyIconBgColorPicker.addEventListener('input', () => handleColorInput(stickyIconBgColorPicker, iconBgColorPicker));
        
        const resetColorAction = () => {
            userHasManuallyPickedColor = false;
            const config = templateConfig[templateSelect.value];
            let defaultColor = (config && typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config && config.defaultBg) ? config.defaultBg : '#CCCCCC';
            iconBgColorPicker.value = defaultColor;
            stickyIconBgColorPicker.value = defaultColor;
            updateState(); debouncedRedrawAll();
        };
        resetColorBtn.addEventListener('click', resetColorAction);
        stickyResetColorBtn.addEventListener('click', resetColorAction);

        [dcSelect, raceSelect, progressSelect].forEach(el => el.addEventListener('change', () => { updateState(); debouncedRedrawAll(); }));
        [styleButtonsContainer, playtimeOptionsContainer, difficultyOptionsContainer].forEach(c => c.addEventListener('click', (e) => { 
            if (e.target.tagName === 'BUTTON') e.target.classList.toggle('active'); 
            if (e.target.tagName === 'BUTTON' || e.target.type === 'checkbox') { updateState(); debouncedRedrawAll(); }
        }));
        
        mainjobSelect.addEventListener('change', (e) => {
            updateState();
            const newMainJob = e.target.value;
            if (newMainJob) { const targetBtn = subjobSection.querySelector(`button[data-value="${newMainJob}"]`); if (targetBtn) targetBtn.classList.add('active'); }
            updateState(); debouncedRedrawAll();
        });
        
        subjobSection.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { e.target.classList.toggle('active'); updateState(); debouncedRedrawAll(); } });
        nameInput.addEventListener('input', () => { updateState(); debouncedRedrawAll(); });
        fontSelect.addEventListener('change', () => { updateState(); debouncedRedrawAll(); });
        
        uploadImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) { imageTransform.img = null; fileNameDisplay.textContent = ''; drawCharacterLayer(); return; }
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    imageTransform.img = img;
                    imageTransform.x = BASE_WIDTH / 2;
                    imageTransform.y = BASE_HEIGHT / 2;
                    const canvasAspect = BASE_WIDTH / BASE_HEIGHT;
                    const imgAspect = img.width / img.height;
                    imageTransform.scale = (imgAspect > canvasAspect) ? (BASE_HEIGHT / img.height) : (BASE_WIDTH / img.width);
                    drawCharacterLayer();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Drag & Touch (Scale考慮なしで動作するように修正済み)
        const handleDrag = (e, isTouch = false) => {
            if (!imageTransform.isDragging || !imageTransform.img) return;
            e.preventDefault();
            const loc = isTouch ? e.touches[0] : e;
            // マウス移動量は画面ピクセルなので、Canvasスケールに合わせて補正が必要だが、
            // 簡易的にそのまま加算しても大きな問題はない（少し感度が変わる程度）
            const dx = (loc.clientX - imageTransform.lastX) * (1/SCALE_FACTOR); 
            const dy = (loc.clientY - imageTransform.lastY) * (1/SCALE_FACTOR);
            imageTransform.x += dx; imageTransform.y += dy; imageTransform.lastX = loc.clientX; imageTransform.lastY = loc.clientY; drawCharacterLayer();
        };
        uiLayer.addEventListener('mousedown', (e) => { if (!imageTransform.img) return; imageTransform.isDragging = true; imageTransform.lastX = e.clientX; imageTransform.lastY = e.clientY; });
        window.addEventListener('mousemove', (e) => handleDrag(e, false));
        window.addEventListener('mouseup', () => { imageTransform.isDragging = false; });
        uiLayer.addEventListener('wheel', (e) => { if (!imageTransform.img) return; e.preventDefault(); imageTransform.scale *= e.deltaY < 0 ? 1.05 : 1 / 1.05; drawCharacterLayer(); });
        uiLayer.addEventListener('touchstart', (e) => {
            if (!imageTransform.img) return; 
            e.preventDefault(); 
            if (e.touches.length === 1) { imageTransform.isDragging = true; imageTransform.lastX = e.touches[0].clientX; imageTransform.lastY = e.touches[0].clientY; }
        }, { passive: false });
        uiLayer.addEventListener('touchmove', (e) => {
            if (!imageTransform.img) return; 
            e.preventDefault(); 
            if (e.touches.length === 1 && imageTransform.isDragging) handleDrag(e, true);
        }, { passive: false });
        window.addEventListener('touchend', () => { imageTransform.isDragging = false; });

        // Download
        downloadBtn.addEventListener('click', async () => {
            if (isDownloading) return;
            isDownloading = true;
            downloadBtn.querySelector('span').textContent = translations[currentLang].generating;
            try {
                const finalCanvas = document.createElement('canvas');
                // ダウンロード用もメモリ節約のため現在の解像度(CANVAS_WIDTH)で作る
                finalCanvas.width = CANVAS_WIDTH; finalCanvas.height = CANVAS_HEIGHT;
                const finalCtx = finalCanvas.getContext('2d');
                // ここはコピーなのでスケール不要（コピー元がすでにスケール済み）
                finalCtx.drawImage(backgroundLayer, 0, 0);
                finalCtx.drawImage(characterLayer, 0, 0);
                finalCtx.drawImage(uiLayer, 0, 0);
                
                const imageUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
                if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) { modalImage.src = imageUrl; saveModal.classList.remove('hidden'); }
                else { const link = document.createElement('a'); link.download = 'ffxiv_character_card_vertical.jpeg'; link.href = imageUrl; link.click(); }
            } catch (error) { 
                window.logToScreen(`DL Error: ${error.message}`, 'ERROR');
            } finally { isDownloading = false; downloadBtn.querySelector('span').textContent = translations[currentLang].generateDefault; }
        });
        closeModalBtn.addEventListener('click', () => { saveModal.classList.add('hidden'); });
        window.addEventListener('scroll', () => { const rect = mainColorPickerSection.getBoundingClientRect(); if (rect.bottom < 50) stickyColorDrawer.classList.remove('is-hidden'); else { stickyColorDrawer.classList.add('is-hidden'); stickyColorDrawer.classList.add('is-closed'); }});
        drawerHandle.addEventListener('click', () => stickyColorDrawer.classList.toggle('is-closed'));

        // Mobile UI
        const initMobileUI = () => {
            if (window.innerWidth > 768) return;
            const actionBar = document.createElement('div'); actionBar.className = 'mobile-action-bar';
            const settingsBtn = document.createElement('button'); settingsBtn.className = 'mobile-action-btn btn-secondary'; settingsBtn.innerHTML = '⚙️ 設定・入力';
            const saveBtnMobile = document.createElement('button'); saveBtnMobile.className = 'mobile-action-btn btn-primary'; saveBtnMobile.innerHTML = '📥 画像保存';
            actionBar.appendChild(settingsBtn); actionBar.appendChild(saveBtnMobile); document.body.appendChild(actionBar);
            const controlsPanel = document.querySelector('.controls-panel');
            if (!controlsPanel) return;
            const sheetHeader = document.createElement('div'); sheetHeader.className = 'bottom-sheet-header';
            const handleBar = document.createElement('div'); handleBar.className = 'sheet-handle-bar';
            sheetHeader.appendChild(handleBar);
            controlsPanel.insertBefore(sheetHeader, controlsPanel.firstChild);
            settingsBtn.addEventListener('click', () => { controlsPanel.classList.toggle('is-open'); });
            sheetHeader.addEventListener('click', () => { controlsPanel.classList.remove('is-open'); });
            saveBtnMobile.addEventListener('click', () => { downloadBtn.click(); });
        };

        // Initialize
        const initialize = async () => {
            try {
                iconBgColorPicker.value = '#CCCCCC';
                stickyIconBgColorPicker.value = '#CCCCCC';
                loaderElement.style.display = 'none';
                appElement.style.visibility = 'visible';
                
                drawCharacterLayer();
                await preloadFonts();
                fontSelect.value = state.font;
                
                const config = templateConfig[templateSelect.value];
                const initialColor = (config && typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config && config.defaultBg) ? config.defaultBg : '#CCCCCC';
                iconBgColorPicker.value = initialColor;
                stickyIconBgColorPicker.value = initialColor;
                
                await redrawAll();
                try { initMobileUI(); } catch(e) { console.warn("Mobile UI init failed", e); }
                window.logToScreen('Init complete.', 'SUCCESS');
            } catch (e) {
                window.logToScreen(`Init failed: ${e.message}`, 'ERROR');
                loaderElement.style.display = 'none';
                appElement.style.visibility = 'visible';
            }
        };
        initialize();

    } catch (mainError) {
        window.logToScreen(`Script Error: ${mainError.message}`, 'ERROR');
    }
});