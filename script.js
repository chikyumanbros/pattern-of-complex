class TuringPattern {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gridA = new Array(width * height).fill(1);
        this.gridB = new Array(width * height).fill(0);
        this.params = this.generateRandomParams();
        this.changeRate = 1.0; // パターンの変化率
        this.stableCount = 0; // 安定している時間をカウント
        this.noisePattern = Math.floor(Math.random() * 5); // ランダムにパターンを選択
        this.fitness = 0; // パターンの適応度
        this.age = 0; // パターンの生存時間
    }

    generateRandomParams() {
        return {
            diffusionA: Math.random() * 0.2 + 0.8,
            diffusionB: Math.random() * 0.2 + 0.3,
            feedRate: Math.random() * 0.06 + 0.02,
            killRate: Math.random() * 0.06 + 0.05
        };
    }

    index(x, y) {
        return ((x + this.width) % this.width) + ((y + this.height) % this.height) * this.width;
    }

    update() {
        const startTime = performance.now();
        
        const dA = this.params.diffusionA;
        const dB = this.params.diffusionB;
        const f = this.params.feedRate;
        const k = this.params.killRate;
        const dt = 0.2;

        const nextA = [...this.gridA];
        const nextB = [...this.gridB];
        let totalChange = 0; // 全体の変化量

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const i = this.index(x, y);
                
                let sumA = 0;
                let sumB = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const idx = this.index(x + dx, y + dy);
                        sumA += this.gridA[idx];
                        sumB += this.gridB[idx];
                    }
                }
                
                const centerA = this.gridA[i];
                const centerB = this.gridB[i];
                
                const lapA = sumA / 9 - centerA;
                const lapB = sumB / 9 - centerB;
                
                const reactionA = centerA * centerB * centerB;
                
                nextA[i] = centerA + (dA * lapA - reactionA + f * (1 - centerA)) * dt;
                nextB[i] = centerB + (dB * lapB + reactionA - (k + f) * centerB) * dt;
                
                nextA[i] = Math.max(0, Math.min(1, nextA[i]));
                nextB[i] = Math.max(0, Math.min(1, nextB[i]));

                // 変化量を計算
                totalChange += Math.abs(nextA[i] - this.gridA[i]) + Math.abs(nextB[i] - this.gridB[i]);
            }
        }

        this.gridA = nextA;
        this.gridB = nextB;

        // 平均変化率を計算
        this.changeRate = totalChange / (this.width * this.height);

        // 安定性の判定
        if (this.changeRate < 0.0001) {
            this.stableCount++;
        } else {
            this.stableCount = 0;
        }

        // CPU負荷に基づく突然変異
        const endTime = performance.now();
        const updateTime = endTime - startTime;
        if (updateTime > 16) { // 60FPSを下回る場合
            this.mutate(updateTime / 16); // CPU負荷が高いほど大きな突然変異
        }

        this.age++;
    }

    mutate(intensity) {
        const mutationRate = 0.1 * intensity;
        if (Math.random() < mutationRate) {
            const param = Object.keys(this.params)[Math.floor(Math.random() * 4)];
            const mutation = (Math.random() - 0.5) * 0.1 * intensity;
            this.params[param] += mutation;
            
            // パラメータの範囲を制限
            this.params[param] = Math.max(0, Math.min(1, this.params[param]));
        }
    }

    // パターンの特徴を計算
    calculateFeatures() {
        let symmetry = 0;
        let complexity = 0;
        let density = 0;

        // 対称性の計算
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width / 2; x++) {
                const i1 = this.index(x, y);
                const i2 = this.index(this.width - 1 - x, y);
                symmetry += 1 - Math.abs(this.gridA[i1] - this.gridA[i2]);
            }
        }
        symmetry /= (this.width * this.height / 2);

        // 複雑さの計算（隣接セル間の差分）
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const i = this.index(x, y);
                const right = this.index(x + 1, y);
                const bottom = this.index(x, y + 1);
                complexity += Math.abs(this.gridA[i] - this.gridA[right]);
                complexity += Math.abs(this.gridA[i] - this.gridA[bottom]);
            }
        }
        complexity /= (this.width * this.height * 2);

        // 密度の計算
        density = this.gridA.reduce((sum, val) => sum + val, 0) / (this.width * this.height);

        return { symmetry, complexity, density };
    }

    addRandomNoise() {
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        
        switch (this.noisePattern) {
            case 0: // 円形
                this.addCircleNoise(centerX, centerY);
                break;
            case 1: // 縦縞
                this.addVerticalStripeNoise();
                break;
            case 2: // 横縞
                this.addHorizontalStripeNoise();
                break;
            case 3: // 格子
                this.addGridNoise();
                break;
            case 4: // ランダムドット
                this.addRandomDotsNoise();
                break;
        }
    }

    addCircleNoise(centerX, centerY) {
        const radius = Math.min(this.width, this.height) / 4;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < radius) {
                    const i = this.index(x, y);
                    this.gridB[i] = Math.random();
                }
            }
        }
    }

    addVerticalStripeNoise() {
        const stripeWidth = Math.floor(this.width / 8);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if ((x % (stripeWidth * 2)) < stripeWidth) {
                    const i = this.index(x, y);
                    this.gridB[i] = Math.random();
                }
            }
        }
    }

    addHorizontalStripeNoise() {
        const stripeHeight = Math.floor(this.height / 8);
        for (let y = 0; y < this.height; y++) {
            if ((y % (stripeHeight * 2)) < stripeHeight) {
                for (let x = 0; x < this.width; x++) {
                    const i = this.index(x, y);
                    this.gridB[i] = Math.random();
                }
            }
        }
    }

    addGridNoise() {
        const cellSize = Math.floor(Math.min(this.width, this.height) / 8);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if ((x % (cellSize * 2)) < cellSize && (y % (cellSize * 2)) < cellSize) {
                    const i = this.index(x, y);
                    this.gridB[i] = Math.random();
                }
            }
        }
    }

    addRandomDotsNoise() {
        const dotCount = Math.floor(this.width * this.height * 0.1); // 10%のピクセルにノイズを追加
        for (let i = 0; i < dotCount; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const idx = this.index(x, y);
            this.gridB[idx] = Math.random();
        }
    }
}

class TuringArt {
    constructor() {
        this.canvas = document.getElementById('turingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.updateSpeed = 3;
        this.currentPoint = { x: 0.5, y: 0.5 }; // 画面中心から開始
        this.autoRegenerate = true; // 自動生成フラグ
        
        // パターンのサイズも正方形に
        const patternSize = 80;
        this.pattern = new TuringPattern(patternSize, patternSize);
        this.pattern.addRandomNoise();
        
        this.setupCanvas();
        this.setupEvents();
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.animate();
        this.bestPatterns = []; // 優れたパターンを保存
        this.lastInteractionTime = performance.now();
        this.interactionCount = 0;
    }

    resizeCanvas() {
        // キャンバスを正方形にする
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = size;
        this.canvas.height = size;
    }

    setupCanvas() {
        this.resizeCanvas();
        this.ctx.font = '12px monospace';
        document.body.style.cursor = 'none'; // カーソルを非表示
    }

    setupEvents() {
        // マウスの動きを追跡
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.currentPoint = {
                x: (e.clientX - rect.left) / rect.width,
                y: 1 - (e.clientY - rect.top) / rect.height
            };
            this.updatePatternFromEmotion();
        });

        // マウスが外れた時は中心に戻す
        this.canvas.addEventListener('mouseout', () => {
            this.currentPoint = { x: 0.5, y: 0.5 };
            this.updatePatternFromEmotion();
        });
    }

    updatePatternFromEmotion() {
        const { x, y } = this.currentPoint;
        this.pattern.params = {
            diffusionA: 0.8 + x * 0.2,
            diffusionB: 0.3 + y * 0.2,
            feedRate: 0.02 + (1 - x) * 0.04,
            killRate: 0.05 + y * 0.03
        };

        // インタラクションを記録
        const now = performance.now();
        if (now - this.lastInteractionTime > 1000) { // 1秒以上の間隔があるインタラクションのみカウント
            this.interactionCount++;
            this.lastInteractionTime = now;
            
            // パターンの評価
            this.evaluatePattern();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderAscii();
    }

    renderAscii() {
        // より細かい階調を表現するための文字セット
        const chars = ' .:;+=^*%#$@█▓▒░・:;=+~-‥…━┃┏┓┗┛┣┫┳┻╋┠┯┨┷┿┝┰┥┸╂'.split('');
        const ctx = this.ctx;
        ctx.font = '12px monospace';
        
        const charWidth = 8;
        const charHeight = 8;
        const offsetX = (this.canvas.width - this.pattern.width * charWidth) / 2;
        const offsetY = (this.canvas.height - this.pattern.height * charHeight) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.pattern.height; y++) {
            for (let x = 0; x < this.pattern.width; x++) {
                const i = this.pattern.index(x, y);
                const valueA = this.pattern.gridA[i];
                const valueB = this.pattern.gridB[i];
                const value = (valueA - valueB + 1) / 2;
                
                // カーソル位置に基づいて色を決定
                const hue = this.currentPoint.x * 360;
                const saturation = 70 + this.currentPoint.y * 30;
                const lightness = Math.max(40, Math.min(90, value * 100));
                
                const charIndex = Math.floor(value * (chars.length - 1));
                const char = chars[charIndex];
                
                const glowSize = 4;
                ctx.shadowBlur = glowSize;
                ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.textBaseline = 'top';
                ctx.fillText(
                    char,
                    offsetX + x * charWidth,
                    offsetY + y * charHeight
                );
            }
        }
        
        ctx.shadowBlur = 0;
    }

    evaluatePattern() {
        const features = this.pattern.calculateFeatures();
        
        // パターンの評価基準
        const fitness = 
            features.symmetry * 0.4 +      // 対称性を重視
            features.complexity * 0.4 +     // 複雑さを重視
            features.density * 0.2;         // 適度な密度

        this.pattern.fitness = fitness;

        // 優れたパターンを保存
        if (fitness > 0.7 && this.pattern.age > 100) {
            this.bestPatterns.push({
                params: { ...this.pattern.params },
                fitness: fitness,
                features: { ...features }
            });
            
            // 上位10個のパターンのみ保持
            this.bestPatterns.sort((a, b) => b.fitness - a.fitness);
            if (this.bestPatterns.length > 10) {
                this.bestPatterns.pop();
            }
        }
    }

    checkPatternStability() {
        if (this.autoRegenerate && this.pattern.stableCount > 30) {
            const { x, y } = this.currentPoint;
            const patternSize = 80;
            const newPattern = new TuringPattern(patternSize, patternSize);
            
            // 学習したパターンを活用
            if (this.bestPatterns.length > 0 && Math.random() < 0.3) {
                // 30%の確率で優れたパターンのパラメータを基にする
                const bestPattern = this.bestPatterns[Math.floor(Math.random() * Math.min(3, this.bestPatterns.length))];
                newPattern.params = { ...bestPattern.params };
            } else {
                newPattern.params = {
                    diffusionA: 0.8 + x * 0.2,
                    diffusionB: 0.3 + y * 0.2,
                    feedRate: 0.02 + (1 - x) * 0.04,
                    killRate: 0.05 + y * 0.03
                };
            }
            
            // ランダムな変動を加える
            newPattern.params.diffusionA += (Math.random() - 0.5) * 0.1;
            newPattern.params.diffusionB += (Math.random() - 0.5) * 0.1;
            newPattern.params.feedRate += (Math.random() - 0.5) * 0.01;
            newPattern.params.killRate += (Math.random() - 0.5) * 0.01;
            
            newPattern.addRandomNoise();
            this.pattern = newPattern;
        }
    }

    animate() {
        for (let i = 0; i < this.updateSpeed; i++) {
            this.pattern.update();
        }
        this.checkPatternStability();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the application
window.addEventListener('load', () => {
    new TuringArt();
}); 