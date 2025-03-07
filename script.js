class TuringPattern {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gridA = new Array(width * height).fill(1);
        this.gridB = new Array(width * height).fill(0);
        this.params = this.generateRandomParams();
        this.changeRate = 1.0;
        this.stableCount = 0;
        this.noisePattern = Math.floor(Math.random() * 5);
        this.fitness = 0;
        this.age = 0;
        this.lastStates = []; // パターンの履歴を保存
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
        let totalChange = 0;

        // 状態履歴の更新
        if (this.lastStates.length >= 10) {
            this.lastStates.shift();
        }
        this.lastStates.push([...this.gridA]);

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

                totalChange += Math.abs(nextA[i] - this.gridA[i]) + Math.abs(nextB[i] - this.gridB[i]);
            }
        }

        this.gridA = nextA;
        this.gridB = nextB;
        this.changeRate = totalChange / (this.width * this.height);

        if (this.changeRate < 0.0001) {
            this.stableCount++;
        } else {
            this.stableCount = 0;
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;
        if (updateTime > 16) {
            this.mutate(updateTime / 16);
        }

        this.age++;
    }

    mutate(intensity) {
        const mutationRate = 0.1 * intensity;
        if (Math.random() < mutationRate) {
            const param = Object.keys(this.params)[Math.floor(Math.random() * 4)];
            const mutation = (Math.random() - 0.5) * 0.1 * intensity;
            this.params[param] += mutation;
            this.params[param] = Math.max(0, Math.min(1, this.params[param]));
        }
    }

    calculateFeatures() {
        let symmetry = 0;
        let complexity = 0;
        let density = 0;
        let dynamism = 0;
        let entropy = 0;
        let temporalCoherence = 0;

        // 対称性の計算（横方向と縦方向）
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width / 2; x++) {
                const i1 = this.index(x, y);
                const i2 = this.index(this.width - 1 - x, y);
                symmetry += 1 - Math.abs(this.gridA[i1] - this.gridA[i2]);
            }
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height / 2; y++) {
                const i1 = this.index(x, y);
                const i2 = this.index(x, this.height - 1 - y);
                symmetry += 1 - Math.abs(this.gridA[i1] - this.gridA[i2]);
            }
        }
        symmetry /= (this.width * this.height);

        // 複雑さと動的性の計算
        const histogram = new Array(10).fill(0);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const i = this.index(x, y);
                const right = this.index(x + 1, y);
                const bottom = this.index(x, y + 1);
                
                complexity += Math.abs(this.gridA[i] - this.gridA[right]);
                complexity += Math.abs(this.gridA[i] - this.gridA[bottom]);
                
                dynamism += Math.abs(this.gridA[i] - this.gridB[i]);
                
                const binIndex = Math.floor(this.gridA[i] * 9);
                histogram[binIndex]++;
            }
        }
        complexity /= (this.width * this.height * 2);
        dynamism /= (this.width * this.height);

        // エントロピーの計算
        const totalPixels = this.width * this.height;
        entropy = histogram.reduce((sum, count) => {
            if (count === 0) return sum;
            const p = count / totalPixels;
            return sum - p * Math.log2(p);
        }, 0) / Math.log2(10);

        // 時間的一貫性の計算
        if (this.lastStates.length > 0) {
            const lastState = this.lastStates[this.lastStates.length - 1];
            let coherenceSum = 0;
            for (let i = 0; i < this.gridA.length; i++) {
                coherenceSum += 1 - Math.abs(this.gridA[i] - lastState[i]);
            }
            temporalCoherence = coherenceSum / this.gridA.length;
        }

        // 密度の計算
        density = this.gridA.reduce((sum, val) => sum + val, 0) / (this.width * this.height);

        return { 
            symmetry,
            complexity,
            density,
            dynamism,
            entropy,
            temporalCoherence
        };
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
        this.autoRegenerate = true;
        
        const patternSize = 80;
        this.pattern = new TuringPattern(patternSize, patternSize);
        this.pattern.addRandomNoise();
        
        this.setupCanvas();
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 自律的な変化のための状態
        this.time = 0;
        this.bestPatterns = [];
        this.currentHue = Math.random() * 360;
        this.targetHue = this.currentHue;
        this.hueVelocity = 0; // 色相の変化速度
        this.lastFeatures = null; // 前回のパターン特徴
        this.transitionSpeed = 0.01; // 遷移の基本速度

        // 文字セットの拡張と分類
        this.charCategories = {
            dots: ' ･.。・:；',
            lines: '─│┌┐└┘├┤┬┴┼',
            blocks: '█▇▆▅▄▃▂▁',
            geometric: '△▲▽▼◇◆○●◎',
            special: '※×＋～＝',
            japanese: '月火水木金土日',
            emotions: '♠♡♢♣★☆♩♪♫♬',
            weather: '☀☁☂☃☼',
            arrows: '↑↓←→↖↗↙↘',
            math: '∑∏∆∇∈∉∋∌',
            misc: '☯☮✿❀❁❂❃❄'
        };

        // 現在のパターンの特徴に基づいて使用する文字セットを動的に構築
        this.activeCharSets = new Set(['dots', 'lines']);
        this.currentChars = Array.from(this.charCategories.dots + this.charCategories.lines);
        this.targetChars = [...this.currentChars];
        
        // アニメーションの開始
        this.animate();
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = size;
        this.canvas.height = size;
    }

    setupCanvas() {
        this.resizeCanvas();
        this.ctx.font = '12px monospace';
        document.body.style.cursor = 'none';
    }

    updateAutonomously() {
        this.time += 0.01;
        
        // パターンの特徴を取得
        const features = this.pattern.calculateFeatures();
        
        // パターンの特徴に基づいて目標色相を決定
        const targetHue = this.calculateTargetHue(features);
        
        // 色相の滑らかな遷移（物理ベースの動き）
        const hueDiff = ((targetHue - this.currentHue + 540) % 360) - 180;
        const springForce = hueDiff * 0.001; // バネの力
        const damping = -this.hueVelocity * 0.1; // 減衰力
        
        this.hueVelocity += springForce + damping;
        this.currentHue = (this.currentHue + this.hueVelocity + 360) % 360;

        // パターンの特徴に基づいて文字セットを動的に更新
        this.updateActiveCharSets(features);
        this.updateCharacterTransition();

        // 前回の特徴を保存
        this.lastFeatures = features;

        // パターンパラメータの自律的な変化
        const phase = Math.sin(this.time);
        const phase2 = Math.cos(this.time * 0.7);
        
        this.pattern.params = {
            diffusionA: 0.8 + 0.2 * (phase * 0.5 + 0.5),
            diffusionB: 0.3 + 0.2 * (phase2 * 0.5 + 0.5),
            feedRate: 0.02 + 0.04 * (Math.sin(this.time * 0.5) * 0.5 + 0.5),
            killRate: 0.05 + 0.03 * (Math.cos(this.time * 0.3) * 0.5 + 0.5)
        };
    }

    calculateTargetHue(features) {
        // 基本的な色相マッピング
        // - 対称性が高い → 青系統 (180-240)
        // - エントロピーが高い → 赤系統 (0-60)
        // - 複雑さが高い → 紫系統 (270-330)
        // - 動的性が高い → 黄系統 (30-90)
        // - 密度が高い → 緑系統 (90-150)
        
        let hueInfluences = [];
        
        if (features.symmetry > 0.6) {
            hueInfluences.push({
                hue: 210,
                weight: (features.symmetry - 0.6) * 2.5
            });
        }
        
        if (features.entropy > 0.5) {
            hueInfluences.push({
                hue: 30,
                weight: (features.entropy - 0.5) * 2
            });
        }
        
        if (features.complexity > 0.6) {
            hueInfluences.push({
                hue: 300,
                weight: (features.complexity - 0.6) * 2
            });
        }
        
        if (features.dynamism > 0.3) {
            hueInfluences.push({
                hue: 60,
                weight: features.dynamism * 2
            });
        }
        
        if (features.density > 0.5) {
            hueInfluences.push({
                hue: 120,
                weight: (features.density - 0.5) * 2
            });
        }
        
        // 時間的一貫性が高い場合は、より落ち着いた色調に
        if (features.temporalCoherence > 0.7) {
            hueInfluences.push({
                hue: 180, // シアン
                weight: (features.temporalCoherence - 0.7) * 3
            });
        }
        
        // 重み付き平均で目標色相を計算
        if (hueInfluences.length === 0) {
            return (this.currentHue + 1) % 360; // デフォルトの緩やかな回転
        }
        
        let totalWeight = 0;
        let weightedSin = 0;
        let weightedCos = 0;
        
        for (const influence of hueInfluences) {
            const radians = influence.hue * Math.PI / 180;
            weightedSin += Math.sin(radians) * influence.weight;
            weightedCos += Math.cos(radians) * influence.weight;
            totalWeight += influence.weight;
        }
        
        // 重み付き平均から色相を計算
        const averageHue = (Math.atan2(weightedSin, weightedCos) * 180 / Math.PI + 360) % 360;
        
        // パターンの活性度に応じて、色相の変化にゆらぎを加える
        const activityFactor = Math.min(features.dynamism * features.entropy, 0.2);
        const fluctuation = Math.sin(this.time * 2) * 10 * activityFactor;
        
        return (averageHue + fluctuation + 360) % 360;
    }

    updateActiveCharSets(features) {
        this.activeCharSets.clear();
        
        // 対称性が高い場合は幾何学的な文字を使用
        if (features.symmetry > 0.7) {
            this.activeCharSets.add('geometric');
        }
        
        // エントロピーが高い場合はより複雑な文字を使用
        if (features.entropy > 0.6) {
            this.activeCharSets.add('japanese');
            this.activeCharSets.add('special');
        }
        
        // 動的な変化が大きい場合は矢印や感情表現を使用
        if (features.dynamism > 0.5) {
            this.activeCharSets.add('arrows');
            this.activeCharSets.add('emotions');
        }
        
        // 密度に応じてブロックや点を使用
        if (features.density > 0.6) {
            this.activeCharSets.add('blocks');
        } else {
            this.activeCharSets.add('dots');
        }
        
        // 複雑さに応じて数学記号や特殊文字を使用
        if (features.complexity > 0.7) {
            this.activeCharSets.add('math');
            this.activeCharSets.add('misc');
        }
        
        // 最低限の文字セットを保証
        if (this.activeCharSets.size < 2) {
            this.activeCharSets.add('dots');
            this.activeCharSets.add('lines');
        }
    }

    updateCharacterTransition() {
        // 目標の文字セットを構築
        const targetChars = Array.from(
            Array.from(this.activeCharSets)
                .map(category => this.charCategories[category])
                .join('')
        );

        // 現在の文字セットを目標に向けて徐々に更新
        if (this.currentChars.length < targetChars.length) {
            // 文字を追加
            const charsToAdd = targetChars.filter(c => !this.currentChars.includes(c));
            if (charsToAdd.length > 0) {
                this.currentChars.push(charsToAdd[0]);
            }
        } else if (this.currentChars.length > targetChars.length) {
            // 文字を削除
            const charsToRemove = this.currentChars.filter(c => !targetChars.includes(c));
            if (charsToRemove.length > 0) {
                const index = this.currentChars.indexOf(charsToRemove[0]);
                if (index !== -1) {
                    this.currentChars.splice(index, 1);
                }
            }
        } else {
            // 文字を置換
            for (let i = 0; i < this.currentChars.length; i++) {
                if (this.currentChars[i] !== targetChars[i] && Math.random() < 0.1) {
                    this.currentChars[i] = targetChars[i];
                }
            }
        }
    }

    getCharacterForValue(value, x, y) {
        // 現在の文字セットから選択
        const positionFactor = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.1;
        const adjustedValue = Math.max(0, Math.min(1, value + positionFactor));
        
        const index = Math.floor(adjustedValue * (this.currentChars.length - 1));
        return this.currentChars[index];
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderAscii();
    }

    renderAscii() {
        const ctx = this.ctx;
        ctx.font = '12px monospace';
        
        const charWidth = 8;
        const charHeight = 8;
        const offsetX = (this.canvas.width - this.pattern.width * charWidth) / 2;
        const offsetY = (this.canvas.height - this.pattern.height * charHeight) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // パターン全体の平均値を計算
        let avgValue = 0;
        for (let i = 0; i < this.pattern.gridA.length; i++) {
            avgValue += (this.pattern.gridA[i] - this.pattern.gridB[i] + 1) / 2;
        }
        avgValue /= this.pattern.gridA.length;

        for (let y = 0; y < this.pattern.height; y++) {
            for (let x = 0; x < this.pattern.width; x++) {
                const i = this.pattern.index(x, y);
                const valueA = this.pattern.gridA[i];
                const valueB = this.pattern.gridB[i];
                const value = (valueA - valueB + 1) / 2;
                
                const baseSaturation = 80;
                const saturationRange = 20;
                const saturation = baseSaturation + (value - avgValue) * saturationRange;
                const lightness = Math.max(50, Math.min(90, value * 100));
                
                const char = this.getCharacterForValue(value, x, y);
                
                ctx.fillStyle = `hsl(${this.currentHue}, ${saturation}%, ${lightness}%)`;
                ctx.textBaseline = 'top';
                ctx.fillText(
                    char,
                    offsetX + x * charWidth,
                    offsetY + y * charHeight
                );
            }
        }
    }

    evaluatePattern() {
        const features = this.pattern.calculateFeatures();
        
        // 動的な重み付け
        const weights = {
            symmetry: 0.2 + Math.sin(this.time * 0.1) * 0.1,
            complexity: 0.2 + Math.cos(this.time * 0.15) * 0.1,
            density: 0.1 + Math.sin(this.time * 0.2) * 0.05,
            dynamism: 0.15 + Math.sin(this.time * 0.3) * 0.05,
            entropy: 0.15 + Math.cos(this.time * 0.35) * 0.05,
            temporalCoherence: 0.2 + Math.sin(this.time * 0.4) * 0.1
        };

        // 適応度の計算
        const fitness = 
            features.symmetry * weights.symmetry +
            features.complexity * weights.complexity +
            features.density * weights.density +
            features.dynamism * weights.dynamism +
            features.entropy * weights.entropy +
            features.temporalCoherence * weights.temporalCoherence;

        this.pattern.fitness = fitness;

        // パターンの保存（多様性を考慮）
        if (fitness > 0.6 && this.pattern.age > 50) {
            // 既存のパターンとの類似性をチェック
            const isDifferentEnough = this.bestPatterns.every(p => {
                const featureDiff = Math.abs(p.features.symmetry - features.symmetry) +
                                  Math.abs(p.features.complexity - features.complexity) +
                                  Math.abs(p.features.entropy - features.entropy);
                return featureDiff > 0.3; // 十分な違いがある場合のみ保存
            });

            if (isDifferentEnough || this.bestPatterns.length < 3) {
                this.bestPatterns.push({
                    params: { ...this.pattern.params },
                    fitness: fitness,
                    features: { ...features },
                    age: this.pattern.age
                });
                
                // 上位10個のパターンを保持（多様性を考慮してソート）
                this.bestPatterns.sort((a, b) => {
                    const diversityA = a.features.entropy * a.features.dynamism;
                    const diversityB = b.features.entropy * b.features.dynamism;
                    return (b.fitness * diversityB) - (a.fitness * diversityA);
                });
                
                if (this.bestPatterns.length > 10) {
                    this.bestPatterns.pop();
                }
            }
        }
    }

    checkPatternStability() {
        if (this.autoRegenerate && this.pattern.stableCount > 30) {
            const patternSize = 80;
            const newPattern = new TuringPattern(patternSize, patternSize);
            
            if (this.bestPatterns.length > 0 && Math.random() < 0.3) {
                const bestPattern = this.bestPatterns[Math.floor(Math.random() * Math.min(3, this.bestPatterns.length))];
                newPattern.params = { ...bestPattern.params };
            } else {
                newPattern.params = { ...this.pattern.params };
                // ランダムな変動を加える
                Object.keys(newPattern.params).forEach(key => {
                    newPattern.params[key] += (Math.random() - 0.5) * 0.1;
                    newPattern.params[key] = Math.max(0, Math.min(1, newPattern.params[key]));
                });
            }
            
            newPattern.addRandomNoise();
            this.pattern = newPattern;
        }
    }

    animate() {
        this.updateAutonomously();
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