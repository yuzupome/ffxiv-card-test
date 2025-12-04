document.addEventListener('DOMContentLoaded', () => {
    
    // --- 設定データ (2400x1350) ---
    // ★修正: すべての拡張子を .webp に統一しました
    const CONFIG = {
        width: 2400,
        height: 1350,
        gridCols: 6,
        gridRows: 2,
        assets: {
            square: './assets/images/memories/template_square.webp',
            jan:    './assets/images/memories/template_jan.webp',
            circle: './assets/images/memories/template_circle.webp',
            moji:   './assets/images/memories/text_overlay.webp'
        }
    };

    // テンプレート定義
    const TEMPLATES = {
        square: {
            layout: { startX: 353, startY: 23, width: 316, height: 634, gapX: 27, gapY: 36 },
            shape: 'rect',
            radius: 0
        },
        jan: {
            layout: { startX: 353, startY: 23, width: 316, height: 634, gapX: 27, gapY: 36 },
            shape: 'cut',
            radius: 55
        },
        circle: {
            layout: { startX: 342, startY: 23, width: 334, height: 630, gapX: 12, gapY: 44 },
            shape: 'rect',
            radius: 0
        }
    };

    // --- 状態管理 ---
    const state = {
        currentTemplate: 'square',
        userImages: new Array(12).fill(null),
        imageStates: [], // { x, y, scale }
        assets: {}, 
        frameColor: '#ffffff',
        textColor: '#333333',
        texture: 'none',
        isDragging: false,
        dragTargetIndex: -1,
        lastMouseX: 0,
        lastMouseY: 0
    };

    for(let i=0; i<12; i++) state.imageStates.push({ x: 0, y: 0, scale: 1.0 });

    // --- DOM Elements ---
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('file-input');
    const thumbnailList = document.getElementById('thumbnail-list');
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    
    // Modal Elements
    const saveModal = document.getElementById('saveModal');
    const modalImage = document.getElementById('modalImage');
    const closeModalBtn = document.getElementById('closeModal');

    // --- 初期化処理 ---
    async function init() {
        canvas.width = CONFIG.width;
        canvas.height = CONFIG.height;

        renderThumbnails();
        setupSortable(); // ★並び替え機能の初期化

        // アセット読み込み
        try {
            await Promise.all([
                loadAsset('square', CONFIG.assets.square),
                loadAsset('jan', CONFIG.assets.jan),
                loadAsset('circle', CONFIG.assets.circle),
                loadAsset('moji', CONFIG.assets.moji)
            ]);
        } catch (e) {
            console.warn('一部の画像の読み込みに失敗しました:', e);
        }
        
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            app.style.visibility = 'visible';
        }, 500);

        draw();
        setupEvents();
    }

    function loadAsset(key, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { state.assets[key] = img; resolve(); };
            img.onerror = () => { console.warn(`Missing: ${src}`); resolve(); };
            img.src = src;
        });
    }

    // --- ★並び替え機能 (SortableJS) ---
    function setupSortable() {
        if (typeof Sortable !== 'undefined') {
            Sortable.create(thumbnailList, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: (evt) => {
                    // 並び替え後の処理: 配列の中身も入れ替える
                    const oldIndex = evt.oldIndex;
                    const newIndex = evt.newIndex;
                    
                    if (oldIndex !== newIndex) {
                        // 画像データの移動
                        const movedImage = state.userImages.splice(oldIndex, 1)[0];
                        state.userImages.splice(newIndex, 0, movedImage);
                        
                        // 位置・拡縮設定の移動 (これもしないと、移動先で拡大率がおかしくなる)
                        const movedState = state.imageStates.splice(oldIndex, 1)[0];
                        state.imageStates.splice(newIndex, 0, movedState);
                        
                        // 再描画 (サムネイルはSortableがDOMを動かしているので、Canvasだけ更新)
                        // ただしID振り直しのためrenderThumbnailsも呼んだほうが安全
                        renderThumbnails();
                        draw();
                    }
                }
            });
        }
    }

    // --- イベント設定 ---
    function setupEvents() {
        fileInput.addEventListener('change', handleFileUpload);

        document.querySelectorAll('.temp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.temp-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                state.currentTemplate = e.target.dataset.template;
                draw();
            });
        });

        document.getElementById('frame-color').addEventListener('input', (e) => {
            state.frameColor = e.target.value;
            draw();
        });
        document.getElementById('text-color').addEventListener('input', (e) => {
            state.textColor = e.target.value;
            draw();
        });
        document.getElementById('texture-select').addEventListener('change', (e) => {
            state.texture = e.target.value;
            draw();
        });
        document.getElementById('save-btn').addEventListener('click', saveImage);
        
        closeModalBtn.addEventListener('click', () => {
            saveModal.classList.add('hidden');
        });

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onMouseUp);
    }

    // --- ファイル処理 ---
    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        let loadedCount = 0;
        files.slice(0, 12).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const emptyIdx = state.userImages.findIndex(i => i === null);
                    // 複数選択時は、空きがあればそこへ、なければ現在のロード順の位置へ
                    const targetIdx = emptyIdx !== -1 ? emptyIdx : (state.userImages.length > loadedCount ? loadedCount : null);
                    
                    if (targetIdx !== null && targetIdx < 12) {
                        state.userImages[targetIdx] = img;
                        state.imageStates[targetIdx] = { x: 0, y: 0, scale: 1.0 }; 
                        renderThumbnails();
                        draw();
                    }
                    loadedCount++;
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; 
    }

    function renderThumbnails() {
        thumbnailList.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const div = document.createElement('div');
            div.className = 'thumb-slot' + (state.userImages[i] ? '' : ' empty');
            // データ属性でインデックスを持たせる（削除時などに使用）
            div.dataset.index = i;
            
            if (state.userImages[i]) {
                const img = document.createElement('img');
                img.src = state.userImages[i].src;
                div.appendChild(img);
                
                // 削除機能: ダブルクリックで削除 (シングルクリックは並び替えの邪魔になるため)
                div.ondblclick = () => {
                    if(confirm(`${i+1}番目の画像を削除しますか？`)) {
                        state.userImages[i] = null;
                        state.imageStates[i] = { x: 0, y: 0, scale: 1.0 };
                        renderThumbnails();
                        draw();
                    }
                };
            }
            thumbnailList.appendChild(div);
        }
    }

    // --- 描画ロジック ---
    function draw() {
        ctx.fillStyle = state.frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const tmpl = TEMPLATES[state.currentTemplate];
        const { startX, startY, width, height, gapX, gapY } = tmpl.layout;

        if (state.assets[state.currentTemplate]) {
            ctx.save();
            if (state.currentTemplate === 'circle') {
                ctx.drawImage(state.assets[state.currentTemplate], 0, 0, CONFIG.width, CONFIG.height);
            } else {
                ctx.globalCompositeOperation = 'multiply';
                ctx.drawImage(state.assets[state.currentTemplate], 0, 0, CONFIG.width, CONFIG.height);
            }
            ctx.restore();
        }

        for (let i = 0; i < 12; i++) {
            const col = i % CONFIG.gridCols;
            const row = Math.floor(i / CONFIG.gridCols);
            const cellX = startX + col * (width + gapX);
            const cellY = startY + row * (height + gapY);

            ctx.save();
            
            createShapePath(ctx, cellX, cellY, width, height, tmpl.shape, tmpl.radius);
            ctx.clip();

            if (state.userImages[i]) {
                const img = state.userImages[i];
                const s = state.imageStates[i];
                
                const scaleBase = Math.max(width / img.width, height / img.height);
                const finalScale = scaleBase * s.scale;
                const drawW = img.width * finalScale;
                const drawH = img.height * finalScale;
                const centerX = cellX + width / 2 + s.x;
                const centerY = cellY + height / 2 + s.y;
                
                ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
            } else {
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.fill();
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.font = "bold 60px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(i + 1, cellX + width / 2, cellY + height / 2);
            }
            ctx.restore();
        }

        if (state.texture !== 'none') {
            drawTexture(state.texture);
        }

        if (state.assets.moji) {
            drawColoredText(state.assets.moji, state.textColor);
        }
    }

    function drawColoredText(img, color) {
        const osc = document.createElement('canvas');
        osc.width = CONFIG.width;
        osc.height = CONFIG.height;
        const octx = osc.getContext('2d');

        octx.drawImage(img, 0, 0, CONFIG.width, CONFIG.height);
        
        const idata = octx.getImageData(0, 0, CONFIG.width, CONFIG.height);
        const data = idata.data;
        for(let i = 0; i < data.length; i += 4) {
            const brightness = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
            data[i+3] = 255 - brightness;
        }
        octx.putImageData(idata, 0, 0);

        octx.globalCompositeOperation = 'source-in';
        octx.fillStyle = color;
        octx.fillRect(0, 0, CONFIG.width, CONFIG.height);

        ctx.drawImage(osc, 0, 0);
    }

    function createShapePath(ctx, x, y, w, h, shape, r) {
        ctx.beginPath();
        if (shape === 'cut') {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + h - r);
            ctx.lineTo(x + w - r, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    function drawTexture(type) {
        ctx.save();
        ctx.globalCompositeOperation = "overlay";
        if (type === 'noise') {
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            for(let i=0; i<CONFIG.height; i+=6) ctx.fillRect(0, i, CONFIG.width, 3);
        } else if (type === 'paper') {
            ctx.fillStyle = "rgba(139,69,19,0.2)";
            ctx.fillRect(0,0, CONFIG.width, CONFIG.height);
        } else if (type === 'metal') {
            const grad = ctx.createLinearGradient(0,0,CONFIG.width,CONFIG.height);
            grad.addColorStop(0, "rgba(255,255,255,0.1)");
            grad.addColorStop(0.5, "rgba(0,0,0,0.3)");
            grad.addColorStop(1, "rgba(255,255,255,0.1)");
            ctx.fillStyle = grad;
            ctx.fillRect(0,0, CONFIG.width, CONFIG.height);
        }
        ctx.restore();
    }

    // --- 操作ロジック ---
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function getTargetIndex(x, y) {
        const tmpl = TEMPLATES[state.currentTemplate];
        const { startX, startY, width, height, gapX, gapY } = tmpl.layout;
        for (let i = 0; i < 12; i++) {
            const col = i % CONFIG.gridCols;
            const row = Math.floor(i / CONFIG.gridCols);
            const bx = startX + col * (width + gapX);
            const by = startY + row * (height + gapY);
            if (x >= bx && x <= bx + width && y >= by && y <= by + height) return i;
        }
        return -1;
    }

    function onMouseDown(e) {
        const p = getPos(e);
        const idx = getTargetIndex(p.x, p.y);
        if (idx !== -1 && state.userImages[idx]) {
            state.isDragging = true;
            state.dragTargetIndex = idx;
            state.lastMouseX = p.x;
            state.lastMouseY = p.y;
            canvas.style.cursor = 'grabbing';
        }
    }
    function onMouseMove(e) {
        if (!state.isDragging) return;
        const p = getPos(e);
        const dx = p.x - state.lastMouseX;
        const dy = p.y - state.lastMouseY;
        const s = state.imageStates[state.dragTargetIndex];
        s.x += dx; 
        s.y += dy;
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        requestAnimationFrame(draw);
    }
    function onMouseUp() {
        state.isDragging = false;
        canvas.style.cursor = 'grab';
    }
    function onWheel(e) {
        e.preventDefault();
        const p = getPos(e);
        const idx = getTargetIndex(p.x, p.y);
        if (idx !== -1 && state.userImages[idx]) {
            const s = state.imageStates[idx];
            s.scale += e.deltaY * -0.001;
            s.scale = Math.max(0.1, s.scale); 
            requestAnimationFrame(draw);
        }
    }

    let initialPinchDist = 0;
    let initialScale = 1;
    
    function onTouchStart(e) {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            onMouseDown({ clientX: t.clientX, clientY: t.clientY });
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const p = getPos({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
            const idx = getTargetIndex(p.x, p.y);
            if (idx !== -1 && state.userImages[idx]) {
                state.dragTargetIndex = idx;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDist = Math.sqrt(dx*dx + dy*dy);
                initialScale = state.imageStates[idx].scale;
            }
        }
    }
    
    function onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const t = e.touches[0];
            onMouseMove({ clientX: t.clientX, clientY: t.clientY });
        } else if (e.touches.length === 2 && state.dragTargetIndex !== -1) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (initialPinchDist > 0) {
                const scale = (dist / initialPinchDist) * initialScale;
                state.imageStates[state.dragTargetIndex].scale = Math.max(0.1, scale);
                requestAnimationFrame(draw);
            }
        }
    }

    async function saveImage() {
        const btn = document.getElementById('save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Processing...</span>';
        btn.disabled = true;

        try {
            const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            if (isIOS) {
                modalImage.src = imageUrl;
                saveModal.classList.remove('hidden');
            } else {
                const link = document.createElement('a');
                link.download = `ffxiv_memories_${Date.now()}.jpg`;
                link.href = imageUrl;
                link.click();
            }
        } catch(e) {
            console.error(e);
            alert('保存に失敗しました');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    init();
});