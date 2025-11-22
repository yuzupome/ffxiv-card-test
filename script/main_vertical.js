/**
 * FFXIV Character Card Generator - Vertical Version
 */
document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. DOM要素の取得 ---
    const backgroundLayer = document.getElementById('background-layer');
    const characterLayer = document.getElementById('character-layer');
    const uiLayer = document.getElementById('ui-layer');
    const bgCtx = backgroundLayer.getContext('2d');
    const charCtx = characterLayer.getContext('2d');
    const uiCtx = uiLayer.getContext('2d');
    
    // レイヤー分割用のCanvas
    const miscBgCanvas = document.createElement('canvas');     // 背景用
    const miscBgCtx = miscBgCanvas.getContext('2d');
    const miscFrameCanvas = document.createElement('canvas');  // 枠・文字用
    const miscFrameCtx = miscFrameCanvas.getContext('2d');

    const subJobBgCanvas = document.createElement('canvas');    // サブジョブ背景
    const subJobBgCtx = subJobBgCanvas.getContext('2d');
    const subJobFrameCanvas = document.createElement('canvas'); // サブジョブ枠
    const subJobFrameCtx = subJobFrameCanvas.getContext('2d');

    const mainJobCompositeCanvas = document.createElement('canvas');
    const mainJobCtx = mainJobCompositeCanvas.getContext('2d');

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
    
    const nameColorInputs = document.getElementsByName('nameColor');

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

    // --- 2. 定数と設定 ---
    const CANVAS_WIDTH = 850;
    const CANVAS_HEIGHT = 1200;

    [backgroundLayer, characterLayer, uiLayer, miscBgCanvas, miscFrameCanvas, mainJobCompositeCanvas, subJobBgCanvas, subJobFrameCanvas].forEach(c => {
        c.width = CANVAS_WIDTH;
        c.height = CANVAS_HEIGHT;
    });

    const NAME_COORDS = {
        _left:  { x: 211, y: 1073, width: 442, height: 70 },
        _right: { x: 197, y: 1073, width: 442, height: 70 }
    };

    // ジョブIDとファイル名の変換マップ
    const JOB_FILENAME_MAP = {
        'paladin': 'paladin', 'warrior': 'warrior', 'darkknight': 'darkknight', 'gunbreaker': 'gunbreaker',
        'whitemage': 'whitemage', 'scholar': 'scholar', 'astrologian': 'astrologian', 'sage': 'sage',
        'monk': 'monk', 'dragoon': 'dragoon', 'ninja': 'ninja', 'samurai': 'samurai', 'reaper': 'reaper', 'viper': 'viper',
        'bard': 'bard', 'machinist': 'machinist', 
        'dancer': 'dancer',
        'blackmage': 'blackmage', 'summoner': 'summoner', 'redmage': 'redmage', 'pictomancer': 'pictomancer', 'bluemage': 'bluemage',
        'carpenter': 'carpenter', 'blacksmith': 'blacksmith', 'armorer': 'armorer', 'goldsmith': 'goldsmith',
        'leatherworker': 'leatherworker', 'weaver': 'weaver', 'alchemist': 'alchemist', 'culinarian': 'culinarian',
        'miner': 'miner', 'botanist': 'botanist', 
        'fisher': 'fisher'
    };

    // テンプレート設定
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

    let state = { 
        font: "'Exo 2', sans-serif", 
        position: '_left',
        nameColorMode: 'auto'
    };
    let imageTransform = { img: null, x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, scale: 1.0, isDragging: false, lastX: 0, lastY: 0 };
    let imageCache = {};
    let isDownloading = false;
    let userHasManuallyPickedColor = false;
    let previousMainJob = '';

    const getAssetPath = (options) => {
        const isEn = currentLang === 'en';
        let langSuffix = '';
        if (isEn) {
            if (options.category === 'base' || 
                options.filename.includes('progress') || 
                options.filename.includes('playstyle') ||
                options.filename.includes('time')) {
                langSuffix = '_en';
            }
        }
        // ★修正: ignorePositionオプションがあれば _left/_right を付けない
        const posSuffix = options.ignorePosition ? '' : state.position; 
        let finalFilename = options.filename;
        return `./assets/images/vertical/${options.category}/${finalFilename}${posSuffix}${langSuffix}.webp`;
    };

    const loadImage = (src) => {
        if (imageCache[src]) return Promise.resolve(imageCache[src]);
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { imageCache[src] = img; resolve(img); };
            img.onerror = () => { console.warn(`Failed: ${src}`); resolve(null); };
            img.src = src;
        });
    };

    const drawTinted = async (ctx, path, tintColor) => {
        const img = await loadImage(path);
        if (!img) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CANVAS_WIDTH;
        tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (tintColor) {
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = tintColor;
            tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        ctx.drawImage(tempCanvas, 0, 0);
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
        const selectedColorMode = document.querySelector('input[name="nameColor"]:checked');

        state = {
            template: templateSelect.value,
            position: positionSelect.value,
            iconBgColor: iconBgColorPicker.value,
            characterName: nameInput.value,
            font: fontSelect.value,
            nameColorMode: selectedColorMode ? selectedColorMode.value : 'auto',
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

    const drawCharacterLayer = () => {
        bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (imageTransform.img) {
            bgCtx.save();
            bgCtx.translate(imageTransform.x, imageTransform.y);
            bgCtx.scale(imageTransform.scale, imageTransform.scale);
            bgCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
            bgCtx.restore();
        }
    };

    const drawTemplateLayer = async () => {
        charCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        await drawTinted(charCtx, getAssetPath({ category: 'base', filename: `${state.template}_cp` }));
    };

    const drawMiscParts = async (ctx, layerType) => {
        const config = templateConfig[state.template];
        if (!config) return;
        const raceAssetMap = { 'au_ra': 'aura', 'miqote': 'miqo_te' };

        // DC (Frameレイヤー)
        // ★修正: ignorePosition: true を指定して左右の接尾辞が付かないようにする
        if(state.dc && layerType === 'frame') {
            const dcTheme = state.template.startsWith('Royal') ? 'Royal' : 'Common';
            await drawTinted(ctx, getAssetPath({ 
                category: 'parts_text', 
                filename: `${dcTheme}_dc_${state.dc}`,
                ignorePosition: true 
            }), config.iconTint);
        }
        
        // Race
        const raceValue = raceAssetMap[state.race] || state.race;
        if (raceValue) {
            if (layerType === 'bg') {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_race_${raceValue}_bg` }), getIconBgColor('race'));
            }
            if (layerType === 'frame') {
                await drawTinted(ctx, getAssetPath({ category: 'parts_frame', filename: `Common_race_${raceValue}_frame` }), config.iconTint);
            }
        }
        
        // Progress
        if (state.progress) {
            const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
            if (layerType === 'bg') {
                if (state.progress === 'all_clear') {
                    for (const s of stages) await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_progress_${s}_bg` }), getIconBgColor('progress'));
                    await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: 'Common_progress_all_clear_bg' }), getIconBgColor('progress'));
                } else {
                    const idx = stages.indexOf(state.progress);
                    if (idx > -1) for (let i = 0; i <= idx; i++) await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_progress_${stages[i]}_bg` }), getIconBgColor('progress'));
                }
            }
            if (layerType === 'frame') {
                const pFile = state.progress === 'gyougetsu' ? 'gyougetsu' : state.progress;
                await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `Common_progress_${pFile}_moji` }), config.iconTint);
                await drawTinted(ctx, getAssetPath({ category: 'parts_frame', filename: `Common_progress_${pFile}_frame` }), config.iconTint);
            }
        }

        // Playstyle
        const playstyleBgNumMap = {
            leveling: '01',
            raid: '06',
            pvp: '03',
            dd: '14',
            hunt: '09',
            map: '08',
            gatherer: '05',
            crafter: '07',
            gil: '02',
            perform: '10',
            streaming: '12',
            glam: '04',
            studio: '13',
            housing: '11',
            screenshot: '15',
            drawing: '16',
            roleplay: '17'
        };

        if (layerType === 'bg') {
            for (const style of state.playstyles) {
                const bgNum = playstyleBgNumMap[style];
                if (bgNum) await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_playstyle_${bgNum}_bg` }), getIconBgColor('playstyle'));
            }
        }

        // Time
        for (const time of state.playtimes) {
            if (layerType === 'bg') {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_time_${time}_bg` }), getIconBgColor('time'));
            }
            if (layerType === 'frame') {
                await drawTinted(ctx, getAssetPath({ category: 'parts_frame', filename: `Common_time_${time}_frame` }), config.iconTint);
            }
        }

        // Raid
        if (layerType === 'bg') {
            for (const diff of state.difficulties) {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_raid_${diff}_bg` }), getIconBgColor('raid'));
            }
        }
    };

    const drawMainJobIcon = async (ctx) => {
        const filename = JOB_FILENAME_MAP[state.mainjob] || state.mainjob;
        if(state.mainjob) await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_main` }), templateConfig[state.template].iconTint);
    };

    const drawSubJobParts = async (ctx, layerType) => {
        const config = templateConfig[state.template];
        for (const job of state.subjobs) {
            const filename = JOB_FILENAME_MAP[job] || job;
            
            if (layerType === 'bg') {
                await drawTinted(ctx, getAssetPath({ category: 'parts_bg', filename: `Common_job_${filename}_sub_bg` }), getIconBgColor('subjob'));
            }
            if (layerType === 'frame') {
                await drawTinted(ctx, getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_sub_frame` }), config.iconTint);
            }
        }
    };

    const drawNameText = async (ctx) => {
        if (!state.characterName || !state.font) return;
        const config = templateConfig[state.template];
        if(!config) return;
        const fontName = state.font.split(',')[0].replace(/'/g, '');
        const nameArea = NAME_COORDS[state.position];
        let fontSize = 50;
        ctx.font = `${fontSize}px "${fontName}"`;
        while(ctx.measureText(state.characterName).width > nameArea.width && fontSize > 10) { fontSize--; ctx.font = `${fontSize}px "${fontName}"`; }
        
        if (state.nameColorMode === 'white') {
            ctx.fillStyle = '#ffffff';
        } else if (state.nameColorMode === 'black') {
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = config.nameColor || '#ffffff';
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.characterName, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
    };

    const redrawMiscBg = async () => { miscBgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); await drawMiscParts(miscBgCtx, 'bg'); await drawUiLayer(); };
    const redrawMiscFrame = async () => { miscFrameCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); await drawMiscParts(miscFrameCtx, 'frame'); await drawUiLayer(); };
    
    const redrawSubJobBg = async () => { subJobBgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); await drawSubJobParts(subJobBgCtx, 'bg'); await drawUiLayer(); };
    const redrawSubJobFrame = async () => { subJobFrameCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); await drawSubJobParts(subJobFrameCtx, 'frame'); await drawUiLayer(); };

    const redrawMainJob = async () => { mainJobCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); await drawMainJobIcon(mainJobCtx); await drawUiLayer(); };
    const redrawName = async () => { await drawUiLayer(); };
    
    const debouncedRedrawMisc = createDebouncer(async () => {
        miscBgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        miscFrameCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        await Promise.all([drawMiscParts(miscBgCtx, 'bg'), drawMiscParts(miscFrameCtx, 'frame')]);
        await drawUiLayer();
    }, 50);
    
    const debouncedRedrawSubJob = createDebouncer(async () => {
        subJobBgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        subJobFrameCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        await Promise.all([drawSubJobParts(subJobBgCtx, 'bg'), drawSubJobParts(subJobFrameCtx, 'frame')]);
        await drawUiLayer();
    }, 50);

    const debouncedRedrawMainJob = createDebouncer(redrawMainJob, 50);
    const debouncedRedrawName = createDebouncer(redrawName, 200);
    const debouncedTrackColor = createDebouncer((color) => { if(window.dataLayer) window.dataLayer.push({ event: 'select_icon_color', color_code: color }); }, 500);

    const drawUiLayer = async () => {
        uiCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const config = templateConfig[state.template];
        if (!config) return;

        uiCtx.drawImage(miscBgCanvas, 0, 0);
        uiCtx.drawImage(subJobBgCanvas, 0, 0);

        await drawTinted(uiCtx, getAssetPath({ category: 'frame', filename: 'Common_background_frame' }), config.iconTint);

        uiCtx.drawImage(miscFrameCanvas, 0, 0);
        uiCtx.drawImage(subJobFrameCanvas, 0, 0);
        uiCtx.drawImage(mainJobCompositeCanvas, 0, 0);
        await drawNameText(uiCtx);
    };
    
    const redrawAll = async () => {
        updateState();
        await drawTemplateLayer();
        
        miscBgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        miscFrameCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        subJobBgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        subJobFrameCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        mainJobCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        await Promise.all([
            drawMiscParts(miscBgCtx, 'bg'),
            drawMiscParts(miscFrameCtx, 'frame'),
            drawSubJobParts(subJobBgCtx, 'bg'),
            drawSubJobParts(subJobFrameCtx, 'frame'),
            drawMainJobIcon(mainJobCtx)
        ]);
        await drawUiLayer();
    };

    templateSelect.addEventListener('change', async () => {
        updateState();
        
        if (!userHasManuallyPickedColor) {
            const config = templateConfig[state.template];
            if (config) {
                let newColor = '#CCCCCC';
                if (typeof config.defaultBg === 'object') {
                    newColor = config.defaultBg.primary;
                } else if (config.defaultBg) {
                    newColor = config.defaultBg;
                }
                iconBgColorPicker.value = newColor;
                stickyIconBgColorPicker.value = newColor;
            }
        }
        await redrawAll();
    });
    positionSelect.addEventListener('change', async () => { updateState(); await redrawAll(); });
    
    nameColorInputs.forEach(input => {
        input.addEventListener('change', () => {
            updateState();
            debouncedRedrawName();
        });
    });

    const handleColorInput = (s, t) => { 
        userHasManuallyPickedColor = true; 
        t.value = s.value; 
        updateState(); 
        debouncedRedrawMisc(); 
        debouncedRedrawSubJob(); 
        debouncedTrackColor(s.value); 
    };
    iconBgColorPicker.addEventListener('input', () => handleColorInput(iconBgColorPicker, stickyIconBgColorPicker));
    stickyIconBgColorPicker.addEventListener('input', () => handleColorInput(stickyIconBgColorPicker, iconBgColorPicker));
    
    const resetColorAction = () => {
        userHasManuallyPickedColor = false;
        const config = templateConfig[templateSelect.value];
        let defaultColor = '#CCCCCC';
        if (config) {
            if (typeof config.defaultBg === 'object') {
                defaultColor = config.defaultBg.primary;
            } else if (config.defaultBg) {
                defaultColor = config.defaultBg;
            }
        }
        iconBgColorPicker.value = defaultColor;
        stickyIconBgColorPicker.value = defaultColor;
        updateState();
        debouncedRedrawMisc();
        debouncedRedrawSubJob();
    };
    resetColorBtn.addEventListener('click', resetColorAction);
    stickyResetColorBtn.addEventListener('click', resetColorAction);
    [dcSelect, raceSelect, progressSelect].forEach(el => el.addEventListener('change', () => { updateState(); debouncedRedrawMisc(); }));
    [styleButtonsContainer, playtimeOptionsContainer, difficultyOptionsContainer].forEach(c => c.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') e.target.classList.toggle('active'); if (e.target.tagName === 'BUTTON' || e.target.type === 'checkbox') { updateState(); debouncedRedrawMisc(); }}));
    
    mainjobSelect.addEventListener('change', (e) => {
        updateState();
        const newMainJob = e.target.value;

        if (previousMainJob) {
            const prevBtn = subjobSection.querySelector(`button[data-value="${previousMainJob}"]`);
            if (prevBtn) {
                prevBtn.disabled = false; 
                prevBtn.style.opacity = '1';
                prevBtn.style.cursor = 'pointer';
            }
        }

        if (newMainJob) {
            const newBtn = subjobSection.querySelector(`button[data-value="${newMainJob}"]`);
            if (newBtn) {
                newBtn.classList.remove('active');
                newBtn.disabled = true;
                newBtn.style.opacity = '0.5';
                newBtn.style.cursor = 'not-allowed';
            }
        }

        previousMainJob = newMainJob; 
        updateState();
        debouncedRedrawMainJob(); 
        debouncedRedrawSubJob();
    });

    subjobSection.addEventListener('click', (e) => { 
        if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
            e.target.classList.toggle('active'); 
            updateState(); 
            debouncedRedrawSubJob(); 
        }
    });

    nameInput.addEventListener('input', () => { updateState(); debouncedRedrawName(); });
    fontSelect.addEventListener('change', () => { updateState(); debouncedRedrawName(); });
    uploadImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) { imageTransform.img = null; fileNameDisplay.textContent = ''; drawCharacterLayer(); return; }
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                imageTransform.img = img;
                const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
                const imgAspect = img.width / img.height;
                imageTransform.scale = (imgAspect > canvasAspect) ? (CANVAS_HEIGHT / img.height) : (CANVAS_WIDTH / img.width);
                imageTransform.x = CANVAS_WIDTH / 2; imageTransform.y = CANVAS_HEIGHT / 2; drawCharacterLayer();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    const handleDrag = (e, isTouch = false) => {
        if (!imageTransform.isDragging || !imageTransform.img) return;
        e.preventDefault();
        const loc = isTouch ? e.touches[0] : e;
        const dx = loc.clientX - imageTransform.lastX; const dy = loc.clientY - imageTransform.lastY;
        imageTransform.x += dx; imageTransform.y += dy; imageTransform.lastX = loc.clientX; imageTransform.lastY = loc.clientY; drawCharacterLayer();
    };
    uiLayer.addEventListener('mousedown', (e) => { if (!imageTransform.img) return; imageTransform.isDragging = true; imageTransform.lastX = e.clientX; imageTransform.lastY = e.clientY; });
    window.addEventListener('mousemove', (e) => handleDrag(e, false));
    window.addEventListener('mouseup', () => { imageTransform.isDragging = false; });
    uiLayer.addEventListener('wheel', (e) => { if (!imageTransform.img) return; e.preventDefault(); imageTransform.scale *= e.deltaY < 0 ? 1.05 : 1 / 1.05; drawCharacterLayer(); });
    let lastTouchDistance = 0;
    uiLayer.addEventListener('touchstart', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1) { imageTransform.isDragging = true; imageTransform.lastX = e.touches[0].clientX; imageTransform.lastY = e.touches[0].clientY; }
        else if (e.touches.length === 2) { imageTransform.isDragging = false; const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; lastTouchDistance = Math.sqrt(dx * dx + dy * dy); }
    }, { passive: false });
    uiLayer.addEventListener('touchmove', (e) => {
        if (!imageTransform.img) return; e.preventDefault();
        if (e.touches.length === 1 && imageTransform.isDragging) handleDrag(e, true);
        else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; const newDist = Math.sqrt(dx * dx + dy * dy);
            if (lastTouchDistance > 0) imageTransform.scale *= newDist / lastTouchDistance;
            lastTouchDistance = newDist; drawCharacterLayer();
        }
    }, { passive: false });
    window.addEventListener('touchend', () => { imageTransform.isDragging = false; lastTouchDistance = 0; });
    downloadBtn.addEventListener('click', async () => {
        if (isDownloading) return;
        isDownloading = true;
        downloadBtn.querySelector('span').textContent = translations[currentLang].generating;
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = CANVAS_WIDTH; finalCanvas.height = CANVAS_HEIGHT;
            const finalCtx = finalCanvas.getContext('2d');
            if (imageTransform.img) finalCtx.drawImage(backgroundLayer, 0, 0);
            await drawTinted(finalCtx, getAssetPath({ category: 'base', filename: `${state.template}_cp` }));
            
            finalCtx.drawImage(miscBgCanvas, 0, 0);
            finalCtx.drawImage(subJobBgCanvas, 0, 0);
            await drawTinted(finalCtx, getAssetPath({ category: 'frame', filename: 'Common_background_frame' }), templateConfig[state.template].iconTint);
            finalCtx.drawImage(miscFrameCanvas, 0, 0);
            finalCtx.drawImage(subJobFrameCanvas, 0, 0);
            finalCtx.drawImage(mainJobCompositeCanvas, 0, 0);
            await drawNameText(finalCtx);
            
            const imageUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
            if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) { modalImage.src = imageUrl; saveModal.classList.remove('hidden'); }
            else { const link = document.createElement('a'); link.download = 'ffxiv_character_card_vertical.jpeg'; link.href = imageUrl; link.click(); }
        } catch (error) { console.error(error); alert("失敗しました"); }
        finally { isDownloading = false; downloadBtn.querySelector('span').textContent = translations[currentLang].generateDefault; }
    });
    closeModalBtn.addEventListener('click', () => { saveModal.classList.add('hidden'); });
    window.addEventListener('scroll', () => { const rect = mainColorPickerSection.getBoundingClientRect(); if (rect.bottom < 50) stickyColorDrawer.classList.remove('is-hidden'); else { stickyColorDrawer.classList.add('is-hidden'); stickyColorDrawer.classList.add('is-closed'); }});
    drawerHandle.addEventListener('click', () => stickyColorDrawer.classList.toggle('is-closed'));

    const initialize = async () => {
        await preloadFonts();
        fontSelect.value = state.font;
        const config = templateConfig[templateSelect.value];
        const initialColor = (config && typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config && config.defaultBg) ? config.defaultBg : '#CCCCCC';
        iconBgColorPicker.value = initialColor;
        stickyIconBgColorPicker.value = initialColor;
        drawCharacterLayer();
        await redrawAll();
        loaderElement.style.display = 'none';
        appElement.style.visibility = 'visible';
    };
    initialize();
});