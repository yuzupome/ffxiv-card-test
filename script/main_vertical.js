/**
 * FFXIV Character Card Generator - Vertical Version
 * Fix: Initialization Error & Drag Optimization
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // --- 1. 設定 ---
        const BASE_WIDTH = 850;
        const BASE_HEIGHT = 1200;
        
        // 画質設定（1.0倍）
        const SCALE_FACTOR = 1.0; 
        const CANVAS_WIDTH = BASE_WIDTH * SCALE_FACTOR;
        const CANVAS_HEIGHT = BASE_HEIGHT * SCALE_FACTOR;

        // Canvas取得
        const canvas = document.getElementById('preview-canvas');
        if (!canvas) throw new Error("Canvas element 'preview-canvas' not found!");
        
        // コンテキスト作成 (alpha: false は削除して標準モードに)
        const ctx = canvas.getContext('2d');

        // サイズ適用
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // スケール設定
        ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

        // --- 2. DOM要素 ---
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
                img.onerror = () => { console.error(`Failed to load: ${src}`); resolve(null); };
                img.src = src;
            });
        };

        const drawTinted = async (path, tintColor) => {
            const img = await loadImage(path);
            if (!img) return;
            
            const tempC = document.createElement('canvas');
            tempC.width = CANVAS_WIDTH;
            tempC.height = CANVAS_HEIGHT;
            const tempCtx = tempC.getContext('2d');
            tempCtx.scale(SCALE_FACTOR, SCALE_FACTOR);
            tempCtx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);
            if (tintColor) {
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = tintColor;
                tempCtx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
            }
            
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(tempC, 0, 0);
            ctx.restore();
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

        // --- 描画処理 ---
        const redrawAll = async () => {
            updateState();
            try {
                // クリア & 黒背景
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.restore();

                if (imageTransform.img) {
                    ctx.save();
                    ctx.translate(imageTransform.x, imageTransform.y);
                    ctx.scale(imageTransform.scale, imageTransform.scale);
                    ctx.drawImage(imageTransform.img, -imageTransform.img.width / 2, -imageTransform.img.height / 2);
                    ctx.restore();
                }

                await drawTinted(getAssetPath({ category: 'base', filename: `${state.template}_cp` }));

                const config = templateConfig[state.template];
                const raceAssetMap = { 'au_ra': 'aura', 'miqote': 'miqo_te' };

                if(state.dc) {
                    const dcTheme = state.template.startsWith('Royal') ? 'Royal' : 'Common';
                    await drawTinted(getAssetPath({ category: 'parts_text', filename: `${dcTheme}_dc_${state.dc}`, ignorePosition: true }), config.iconTint);
                }
                
                const raceValue = raceAssetMap[state.race] || state.race;
                if (raceValue) {
                    await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_race_${raceValue}_bg` }), getIconBgColor('race'));
                    await drawTinted(getAssetPath({ category: 'parts_frame', filename: `Common_race_${raceValue}_frame` }), config.iconTint);
                }
                
                if (state.progress) {
                    const stages = ['shinsei', 'souten', 'guren', 'shikkoku', 'gyougetsu', 'ougon'];
                    if (state.progress === 'all_clear') {
                        for (const s of stages) await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_progress_${s}_bg` }), getIconBgColor('progress'));
                        await drawTinted(getAssetPath({ category: 'parts_bg', filename: 'Common_progress_all_clear_bg' }), getIconBgColor('progress'));
                    } else {
                        const idx = stages.indexOf(state.progress);
                        if (idx > -1) for (let i = 0; i <= idx; i++) await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_progress_${stages[i]}_bg` }), getIconBgColor('progress'));
                    }
                    const pFile = state.progress === 'gyougetsu' ? 'gyougetsu' : state.progress;
                    await drawTinted(getAssetPath({ category: 'parts_text', filename: `Common_progress_${pFile}_moji` }), config.iconTint);
                    await drawTinted(getAssetPath({ category: 'parts_frame', filename: `Common_progress_${pFile}_frame` }), config.iconTint);
                }

                const playstyleBgNumMap = { leveling: '01', raid: '06', pvp: '03', dd: '14', hunt: '09', map: '08', gatherer: '05', crafter: '07', gil: '02', perform: '10', streaming: '12', glam: '04', studio: '13', housing: '11', screenshot: '15', drawing: '16', roleplay: '17' };
                for (const style of state.playstyles) {
                    const bgNum = playstyleBgNumMap[style];
                    if (bgNum) await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_playstyle_${bgNum}_bg` }), getIconBgColor('playstyle'));
                }

                for (const time of state.playtimes) {
                    await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_time_${time}_bg` }), getIconBgColor('time'));
                    await drawTinted(getAssetPath({ category: 'parts_frame', filename: `Common_time_${time}_frame` }), config.iconTint);
                }

                for (const diff of state.difficulties) {
                    await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_raid_${diff}_bg` }), getIconBgColor('raid'));
                }

                for (const job of state.subjobs) {
                    const filename = JOB_FILENAME_MAP[job] || job;
                    await drawTinted(getAssetPath({ category: 'parts_bg', filename: `Common_job_${filename}_sub_bg` }), getIconBgColor('subjob'));
                    await drawTinted(getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_sub_frame` }), config.iconTint);
                }

                if (config) {
                    await drawTinted(getAssetPath({ category: 'frame', filename: 'Common_background_frame' }), config.iconTint);
                }

                if(state.mainjob) {
                    const filename = JOB_FILENAME_MAP[state.mainjob] || state.mainjob;
                    await drawTinted(getAssetPath({ category: 'parts_text', filename: `Common_job_${filename}_main` }), templateConfig[state.template].iconTint);
                }

                if (state.characterName && state.font) {
                    const fontName = state.font.split(',')[0].replace(/'/g, '');
                    const nameArea = NAME_COORDS[state.position];
                    let fontSize = 50;
                    ctx.font = `${fontSize}px "${fontName}"`;
                    while(ctx.measureText(state.characterName).width > nameArea.width && fontSize > 10) { fontSize--; ctx.font = `${fontSize}px "${fontName}"`; }
                    ctx.fillStyle = state.nameColor || '#ffffff';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(state.characterName, nameArea.x + nameArea.width / 2, nameArea.y + nameArea.height / 2);
                }

            } catch (e) {
                console.error(e);
            }
        };

        const debouncedRedrawAll = createDebouncer(redrawAll, 300);

        // イベントリスナー群
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
            if (!file) { imageTransform.img = null; redrawAll(); return; }
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
                    redrawAll();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        // ★軽量化: ドラッグ処理を requestAnimationFrame で間引き
        let isDragging = false;
        let animationFrameId = null;

        const handleDrag = (e, isTouch = false) => {
            if (!isDragging || !imageTransform.img) return;
            e.preventDefault();
            
            // 既に描画予約が入っていれば何もしない（間引き）
            if (animationFrameId) return;

            const loc = isTouch ? e.touches[0] : e;
            const dx = (loc.clientX - imageTransform.lastX) * (1 / SCALE_FACTOR); 
            const dy = (loc.clientY - imageTransform.lastY) * (1 / SCALE_FACTOR);
            
            imageTransform.x += dx; 
            imageTransform.y += dy; 
            imageTransform.lastX = loc.clientX; 
            imageTransform.lastY = loc.clientY; 

            // 次の描画タイミングで実行
            animationFrameId = requestAnimationFrame(() => {
                redrawAll();
                animationFrameId = null;
            });
        };

        const startDrag = (e, isTouch = false) => {
            if (!imageTransform.img) return;
            isDragging = true;
            const loc = isTouch ? e.touches[0] : e;
            imageTransform.lastX = loc.clientX;
            imageTransform.lastY = loc.clientY;
        };

        const endDrag = () => {
            isDragging = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        // マウスイベント
        canvas.addEventListener('mousedown', (e) => startDrag(e, false));
        window.addEventListener('mousemove', (e) => handleDrag(e, false));
        window.addEventListener('mouseup', endDrag);
        
        // タッチイベント (Passive: false でスクロール防止)
        canvas.addEventListener('touchstart', (e) => startDrag(e, true), { passive: false });
        canvas.addEventListener('touchmove', (e) => handleDrag(e, true), { passive: false });
        window.addEventListener('touchend', endDrag);

        // ダウンロード
        downloadBtn.addEventListener('click', async () => {
            if (isDownloading) return;
            isDownloading = true;
            downloadBtn.querySelector('span').textContent = translations[currentLang].generating;
            try {
                const imageUrl = canvas.toDataURL('image/jpeg', 0.92);
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
        
        // スクロール連動（右側ドロワーのみ）
        window.addEventListener('scroll', () => { 
            if(window.innerWidth > 768) {
                const rect = mainColorPickerSection.getBoundingClientRect(); 
                if (rect.bottom < 50) stickyColorDrawer.classList.remove('is-hidden'); 
                else { stickyColorDrawer.classList.add('is-hidden'); stickyColorDrawer.classList.add('is-closed'); }
            }
        });
        drawerHandle.addEventListener('click', () => stickyColorDrawer.classList.toggle('is-closed'));

        // ★修正: drawCharacterLayer()呼び出し削除 & initialize修正
        const initialize = async () => {
            try {
                iconBgColorPicker.value = '#CCCCCC';
                stickyIconBgColorPicker.value = '#CCCCCC';
                loaderElement.style.display = 'none';
                appElement.style.visibility = 'visible';
                
                // 削除: drawCharacterLayer(); // この関数はもう存在しないためエラーの原因だった
                await preloadFonts();
                fontSelect.value = state.font;
                
                const config = templateConfig[templateSelect.value];
                const initialColor = (config && typeof config.defaultBg === 'object') ? config.defaultBg.primary : (config && config.defaultBg) ? config.defaultBg : '#CCCCCC';
                iconBgColorPicker.value = initialColor;
                stickyIconBgColorPicker.value = initialColor;
                
                await redrawAll();
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