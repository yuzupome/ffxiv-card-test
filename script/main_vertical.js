/**
 * FFXIV Character Card Generator - Vertical Version (Final High Performance)
 * 3-Layer Architecture with Image Preloading
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // --- 1. 設定 ---
        const BASE_WIDTH = 850;
        const BASE_HEIGHT = 1200;
        const SCALE_FACTOR = 1.0; 
        const CANVAS_WIDTH = BASE_WIDTH * SCALE_FACTOR;
        const CANVAS_HEIGHT = BASE_HEIGHT * SCALE_FACTOR;

        // --- 2. Canvasレイヤー取得 ---
        const backgroundLayer = document.getElementById('background-layer');
        const characterLayer = document.getElementById('character-layer');
        const uiLayer = document.getElementById('ui-layer');
        const miniLoader = document.getElementById('mini-loader'); // 追加

        if (!backgroundLayer || !characterLayer || !uiLayer) throw new Error("Canvas layers not found!");

        const bgCtx = backgroundLayer.getContext('2d');
        const charCtx = characterLayer.getContext('2d');
        const uiCtx = uiLayer.getContext('2d');

        // サイズ適用 & 座標初期化
        [backgroundLayer, characterLayer, uiLayer].forEach(c => {
            c.width = CANVAS_WIDTH;
            c.height = CANVAS_HEIGHT;
            c.getContext('2d').setTransform(1, 0, 0, 1, 0, 0);
        });

        // UI合成用の一時Canvas
        const uiCompositeCanvas = document.createElement('canvas');
        uiCompositeCanvas.width = CANVAS_WIDTH;
        uiCompositeCanvas.height = CANVAS_HEIGHT;
        const uiCompositeCtx = uiCompositeCanvas.getContext('2d');

        // --- 3. DOM要素 ---
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
            const posSuffix = options.ignorePosition ? '' : (state.position || '_left'); 
            return `./assets/images/vertical/${options.category}/${options.filename}${posSuffix}${langSuffix}.webp`;
        };

        const getTemplateAssetPath = (isDownload) => {
            const isEn = currentLang === 'en';
            const langSuffix = isEn ? '_en' : '';
            const cpSuffix = isDownload ? '_cp' : '';
            const posSuffix = state.position;
            return `./assets/images/vertical/base/${state.template}${cpSuffix}${posSuffix}${langSuffix}.webp`;
        };

        const loadImage = (src) => {
            if (imageCache[src]) return Promise.resolve(imageCache[src]);
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => { imageCache[src] = img; resolve(img); };
                img.onerror = () => { /* console.warn(`Failed to load: ${src}`); */ resolve(null); }; // 404は見逃す
                img.src = src;
            });
        };

        const drawTinted = async (targetCtx, path, tintColor) => {
            const img = await loadImage(path);
            if (!img) return;
            
            const tempC = document.createElement('canvas');
            tempC.width = CANVAS_WIDTH;
            tempC.height = CANVAS_HEIGHT;
            const tempCtx = tempC.getContext('2d');
            tempCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            if (tintColor) {
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = tintColor;
                tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            
            targetCtx.save();
            targetCtx.setTransform(1, 0, 0, 1, 0, 0);
            targetCtx.drawImage(tempC, 0, 0);
            targetCtx.restore();
        };

        const createDebouncer = (func, delay) => {
            let timer;
            return (...args) => { clearTimeout(timer); timer = setTimeout(() => func(...args), delay); };
        };

        const preloadFonts = () => {
            const fonts = Array.from(fontSelect.options).filter(o => o.value).map(o => o.value);
            return Promise.all(fonts.map(font => document.fonts.load(`10px ${font}`).catch(() => {})));
        };

        // ★追加: 素材の先読み機能
        const preloadTemplateAssets = async (templateName) => {
            miniLoader.classList.remove('hidden'); // ローダー表示
            const config = templateConfig[templateName];
            if (!config) {
                miniLoader.classList.add('hidden');
                return;
            }

            const assetsToLoad = new Set();
            
            // 1. テンプレートベース画像 (現在のPositionで)
            // 注: Positionを変えたら再ロードが必要なので、changeイベントで再呼び出しする
            assetsToLoad.add(getTemplateAssetPath(false)); 

            // 2. 選択肢の要素
            const raceAssetMap = { 'au_ra': 'aura', 'miqote': 'miqo_te' };
            const races = Array.from(raceSelect.options).filter(o => o.value).map(o => o.value);
            const dcs = Array.from(dcSelect.options).filter(o => o.value).map(o => o.value);
            const progresses = Array.from(progressSelect.options).filter(o => o.value).map(o => o.value);
            const styles = Array.from(styleButtonsContainer.querySelectorAll('button')).map(b => b.dataset.value);
            const times = ['morning', 'daytime', 'night', 'midnight', 'random', 'fulltime']; // Timeはcheckboxから全パターン推測
            const difficulties = Array.from(difficultyOptionsContainer.querySelectorAll('input')).map(i => i.value);
            const mainJobs = Array.from(mainjobSelect.options).filter(o => o.value).map(o => o.value);
            const subJobs = Array.from(subjobSection.querySelectorAll('button')).map(b => b.dataset.value);

            // パス生成ヘルパー (ignorePosition: false を前提として、現在のstate.positionを使う)
            // Verticalの場合は全てのパーツに _left / _right がつく
            
            // Race
            for (const race of races) {
                const raceValue = raceAssetMap[race] || race;
                assetsToLoad.add(getAssetPath({ category: 'parts_bg', filename: `Common_race_${raceValue}_bg` }));
                assetsToLoad.add(getAssetPath({ category: 'parts_frame', filename: `Common_race_${raceValue}_frame` }));
            }
            // DC (Common or Royal)
            const dcTheme = templateName.startsWith('Royal') ? 'Royal' : 'Common';
            for (const dc of dcs) {
                assetsToLoad.add(getAssetPath({ category: 'parts_text', filename: `${dcTheme}_dc_${dc}`, ignorePosition: true }));
            }
            // Progress
            for (const progress of progresses) {
                const pFile = progress === 'gyougetsu' ? 'gyougetsu' : progress;
                assetsToLoad.add(getAssetPath({ category: 'parts_bg', filename: `Common_progress_${progress}_bg` })); // bgは配列名そのまま
                assetsToLoad.add(getAssetPath({ category: 'parts_text', filename: `Common_progress_${pFile}_moji` }));
                assetsToLoad.add(getAssetPath({ category: 'parts_frame', filename: `Common_progress_${pFile}_frame` }));
                if (progress === 'all_clear') {
                     assetsToLoad.add(getAssetPath({ category: 'parts_bg', filename: 'Common_progress_all_clear_bg' }));
                }
            }
            // Playstyle
            const playstyleBgNumMap = { leveling: '01', raid: '06', pvp: '03', dd: '14', hunt: '09', map: '08', gatherer: '05', crafter: '07', gil: '02', perform: '10', streaming: '12', glam: '04', studio: '13', housing: '11', screenshot: '15', drawing: '16', roleplay: '17' };
            for (const style of styles) {
                const bgNum = playstyleBgNumMap[style];
                if (bgNum) assetsToLoad.add(getAssetPath({ category: 'parts_bg', filename: `Common_playstyle_${bgNum}_bg` }));
            }
            // Time
            for (const time of times) {
                // 休日・平日・その他でファイル名の規則が違うが、ここでは簡易的に全パターン網羅は難しいので
                // ユーザーがクリックしたときに遅延しても許容するか、あるいは主要なものを読む
                // ここでは一旦スキップ（数が多いため）
            }
            // Difficulty
            for (const diff of difficulties) {
                assetsToLoad.add(getAssetPath({ category: 'parts_bg', filename: `Common_raid_${diff}_bg` }));
            }
            // Main Job
            for (const job of mainJobs) {
                const filename = JOB_FILENAME_MAP[job] || job;
                assetsToLoad.add(getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_main` }));
            }
            // Sub Job
            for (const job of subJobs) {
                const filename = JOB_FILENAME_MAP[job] || job;
                assetsToLoad.add(getAssetPath({ category: 'parts_bg', filename: `Common_job_${filename}_sub_bg` }));
                assetsToLoad.add(getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_sub_frame` }));
            }
            
            // Frame (bg layer)
            assetsToLoad.add(getAssetPath({ category: 'frame', filename: 'Common_background_frame' }));

            // 実行
            const promises = [...assetsToLoad].map(src => loadImage(src));
            await Promise.all(promises);
            
            miniLoader.classList.add('hidden'); // 完了
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

        // --- 描画処理 ---

        // Layer 1: ユーザー画像
        const drawUserImageLayer = () => {
            bgCtx.setTransform(1, 0, 0, 1, 0, 0); 
            bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            bgCtx.fillStyle = '#000000';
            bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            if (imageTransform.img) {
                bgCtx.save();
                bgCtx.translate(imageTransform.x, imageTransform.y);
                bgCtx.scale(imageTransform.scale, imageTransform.scale);
                bgCtx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
                bgCtx.restore();
            }
        };

        // Layer 2: テンプレート（枠）
        const drawBaseFrameLayer = async () => {
            charCtx.setTransform(1, 0, 0, 1, 0, 0);
            charCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            const path = getTemplateAssetPath(false);
            await drawTinted(charCtx, path);
        };

        // Layer 3: UIアイコン・文字
        const drawUiLayer = async () => {
            uiCtx.setTransform(1, 0, 0, 1, 0, 0);
            uiCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            uiCompositeCtx.setTransform(1, 0, 0, 1, 0, 0);
            uiCompositeCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const config = templateConfig[state.template];
            const raceAssetMap = { 'au_ra': 'aura', 'miqote': 'miqo_te' };

            if(state.dc) {
                const dcTheme = state.template.startsWith('Royal') ? 'Royal' : 'Common';
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_text', filename: `${dcTheme}_dc_${state.dc}`, ignorePosition: true }), config.iconTint);
            }
            
            const raceValue = raceAssetMap[state.race] || state.race;
            if (raceValue) {
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: `Common_race_${raceValue}_bg` }), getIconBgColor('race'));
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_frame', filename: `Common_race_${raceValue}_frame` }), config.iconTint);
            }
            
            if (state.progress) {
                const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
                if (state.progress === 'all_clear') {
                    for (const s of stages) await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: `Common_progress_${s}_bg` }), getIconBgColor('progress'));
                    await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: 'Common_progress_all_clear_bg' }), getIconBgColor('progress'));
                } else {
                    const idx = stages.indexOf(state.progress);
                    if (idx > -1) for (let i = 0; i <= idx; i++) await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: `Common_progress_${stages[i]}_bg` }), getIconBgColor('progress'));
                }
                const pFile = state.progress === 'gyougetsu' ? 'gyougetsu' : state.progress;
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_text', filename: `Common_progress_${pFile}_moji` }), config.iconTint);
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_frame', filename: `Common_progress_${pFile}_frame` }), config.iconTint);
            }

            const playstyleBgNumMap = { leveling: '01', raid: '06', pvp: '03', dd: '14', hunt: '09', map: '08', gatherer: '05', crafter: '07', gil: '02', perform: '10', streaming: '12', glam: '04', studio: '13', housing: '11', screenshot: '15', drawing: '16', roleplay: '17' };
            for (const style of state.playstyles) {
                const bgNum = playstyleBgNumMap[style];
                if (bgNum) await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: `Common_playstyle_${bgNum}_bg` }), getIconBgColor('playstyle'));
            }

            for (const time of state.playtimes) {
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_frame', filename: `Common_time_${time}_frame` }), config.iconTint);
            }

            for (const diff of state.difficulties) {
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: `Common_raid_${diff}_bg` }), getIconBgColor('raid'));
            }

            for (const job of state.subjobs) {
                const filename = JOB_FILENAME_MAP[job] || job;
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_bg', filename: `Common_job_${filename}_sub_bg` }), getIconBgColor('subjob'));
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_sub_frame` }), config.iconTint);
            }

            if (config) {
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'frame', filename: 'Common_background_frame' }), config.iconTint);
            }

            if(state.mainjob) {
                const filename = JOB_FILENAME_MAP[state.mainjob] || state.mainjob;
                await drawTinted(uiCompositeCtx, getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_main` }), templateConfig[state.template].iconTint);
            }

            if (state.characterName && state.font) {
                const fontName = state.font.split(',')[0].replace(/'/g, '');
                const nameArea = NAME_COORDS[state.position];
                let fontSize = 50;
                uiCompositeCtx.font = `${fontSize}px "${fontName}"`;
                while(uiCompositeCtx.measureText(state.characterName).width > nameArea.width && fontSize > 10) { fontSize--; uiCompositeCtx.font = `${fontSize}px "${fontName}"`; }
                uiCompositeCtx.fillStyle = state.nameColor || '#ffffff';
                uiCompositeCtx.textAlign = 'center'; uiCompositeCtx.textBaseline = 'middle';
                uiCompositeCtx.fillText(state.characterName, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
            }

            uiCtx.drawImage(uiCompositeCanvas, 0, 0);
        };

        const redrawAll = async () => {
            updateState();
            drawUserImageLayer();
            await drawBaseFrameLayer();
            await drawUiLayer();
        };

        const debouncedRedrawUi = createDebouncer(drawUiLayer, 50);
        const debouncedRedrawAll = createDebouncer(redrawAll, 100);

        // --- イベントリスナー ---
        templateSelect.addEventListener('change', async () => {
            updateState();
            // テンプレート変更時に先読みを実行
            await preloadTemplateAssets(state.template);
            
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
        
        // Positionを変えたら全ての素材の _left / _right が変わるので、ここでもプリロードを呼ぶ
        positionSelect.addEventListener('change', async () => { 
            updateState(); 
            await preloadTemplateAssets(state.template);
            await redrawAll(); 
        });
        
        textColorPicker.addEventListener('input', () => { 
            userHasManuallyPickedTextColor = true; 
            updateState(); 
            debouncedRedrawUi(); 
        });
        
        const resetTextColorBtn = document.getElementById('resetTextColorBtn');
        resetTextColorBtn.addEventListener('click', () => {
            userHasManuallyPickedTextColor = false;
            const config = templateConfig[state.template];
            if (config && config.nameColor) {
                textColorPicker.value = config.nameColor;
            }

            updateState();
            debouncedRedrawUi();
        });

        const handleColorInput = (s, t) => { userHasManuallyPickedColor = true; t.value = s.value; updateState(); debouncedRedrawUi(); };
        iconBgColorPicker.addEventListener('input', () => handleColorInput(iconBgColorPicker, stickyIconBgColorPicker));
        stickyIconBgColorPicker.addEventListener('input', () => handleColorInput(stickyIconBgColorPicker, iconBgColorPicker));
        
        const resetColorAction = () => {
            userHasManuallyPickedColor = false;
            const config = templateConfig[templateSelect.value];
            let defaultColor = (config && typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config && config.defaultBg) ? config.defaultBg : '#CCCCCC';
            iconBgColorPicker.value = defaultColor;
            stickyIconBgColorPicker.value = defaultColor;
            updateState(); debouncedRedrawUi();
        };
        resetColorBtn.addEventListener('click', resetColorAction);
        stickyResetColorBtn.addEventListener('click', resetColorAction);

        [dcSelect, raceSelect, progressSelect, mainjobSelect].forEach(el => el.addEventListener('change', () => { updateState(); debouncedRedrawUi(); }));
        
        [styleButtonsContainer, playtimeOptionsContainer, difficultyOptionsContainer, subjobSection].forEach(c => c.addEventListener('click', (e) => { 
            if (e.target.tagName === 'BUTTON') e.target.classList.toggle('active'); 
            if (e.target.tagName === 'BUTTON' || e.target.type === 'checkbox') { updateState(); debouncedRedrawUi(); }
        }));
        
        nameInput.addEventListener('input', () => { updateState(); debouncedRedrawUi(); });
        fontSelect.addEventListener('change', () => { updateState(); debouncedRedrawUi(); });
        
        uploadImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) { imageTransform.img = null; drawUserImageLayer(); return; }
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
                    drawUserImageLayer(); 
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        // --- 拡大縮小・移動 ---
        let isDragging = false;
        let animationFrameId = null;
        let initialDistance = 0;
        let initialScale = 1.0;

        const getDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        uiLayer.addEventListener('wheel', (e) => {
            if (!imageTransform.img) return;
            e.preventDefault();
            const scaleAmount = 0.1;
            if (e.deltaY < 0) {
                imageTransform.scale += scaleAmount;
            } else {
                imageTransform.scale = Math.max(0.1, imageTransform.scale - scaleAmount);
            }
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(() => {
                    drawUserImageLayer();
                    animationFrameId = null;
                });
            }
        });

        const handleStart = (e) => {
            if (!imageTransform.img) return;
            e.preventDefault();
            if (e.touches && e.touches.length === 2) {
                isDragging = false;
                initialDistance = getDistance(e.touches);
                initialScale = imageTransform.scale;
            } else {
                isDragging = true;
                const loc = e.touches ? e.touches[0] : e;
                imageTransform.lastX = loc.clientX;
                imageTransform.lastY = loc.clientY;
            }
        };

        const handleMove = (e) => {
            if (!imageTransform.img) return;
            e.preventDefault();
            if (animationFrameId) return;

            if (e.touches && e.touches.length === 2) {
                const currentDistance = getDistance(e.touches);
                if (initialDistance > 0) {
                    const newScale = initialScale * (currentDistance / initialDistance);
                    imageTransform.scale = Math.max(0.1, newScale);
                }
            } else if (isDragging) {
                const loc = e.touches ? e.touches[0] : e;
                const dx = (loc.clientX - imageTransform.lastX) * (1 / SCALE_FACTOR); 
                const dy = (loc.clientY - imageTransform.lastY) * (1 / SCALE_FACTOR);
                imageTransform.x += dx; 
                imageTransform.y += dy; 
                imageTransform.lastX = loc.clientX; 
                imageTransform.lastY = loc.clientY; 
            }

            animationFrameId = requestAnimationFrame(() => {
                drawUserImageLayer();
                animationFrameId = null;
            });
        };

        const handleEnd = () => { isDragging = false; initialDistance = 0; };

        uiLayer.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        uiLayer.addEventListener('touchstart', handleStart, { passive: false });
        uiLayer.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);

        // ダウンロード処理
        downloadBtn.addEventListener('click', async () => {
            if (isDownloading) return;
            isDownloading = true;
            downloadBtn.querySelector('span').textContent = translations[currentLang].generating;
            try {
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = CANVAS_WIDTH;
                finalCanvas.height = CANVAS_HEIGHT;
                const finalCtx = finalCanvas.getContext('2d');

                finalCtx.drawImage(backgroundLayer, 0, 0);
                const cpPath = getTemplateAssetPath(true);
                await drawTinted(finalCtx, cpPath);
                finalCtx.drawImage(uiLayer, 0, 0);

                const imageUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
                if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) { 
                    modalImage.src = imageUrl; 
                    saveModal.classList.remove('hidden'); 
                } else { 
                    const link = document.createElement('a'); 
                    link.download = 'ffxiv_character_card_vertical.jpeg'; 
                    link.href = imageUrl; 
                    link.click(); 
                }
            } catch (error) { 
                console.error(error);
            } finally { 
                isDownloading = false; 
                downloadBtn.querySelector('span').textContent = translations[currentLang].generateDefault; 
            }
        });
        closeModalBtn.addEventListener('click', () => { saveModal.classList.add('hidden'); });
        
        drawerHandle.addEventListener('click', () => stickyColorDrawer.classList.toggle('is-closed'));

        const initialize = async () => {
            try {
                iconBgColorPicker.value = '#CCCCCC';
                stickyIconBgColorPicker.value = '#CCCCCC';
                loaderElement.style.display = 'none';
                appElement.style.visibility = 'visible';
                
                await preloadFonts();
                fontSelect.value = state.font;
                
                const config = templateConfig[templateSelect.value];
                const initialColor = (config && typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config && config.defaultBg) ? config.defaultBg : '#CCCCCC';
                iconBgColorPicker.value = initialColor;
                stickyIconBgColorPicker.value = initialColor;
                
                // 初回の先読みと描画
                await preloadTemplateAssets(state.template);
                await redrawAll();
                setTimeout(redrawAll, 500); 
            } catch (e) {
                console.error("Initialization error:", e);
                loaderElement.style.display = 'none';
                appElement.style.visibility = 'visible';
            }
        };
        initialize();

    } catch (mainError) {
        console.error(mainError);
    }
});