const IS_TOUCH = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);
const TOUCH_SLACK = 1.1;

CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
}

const DEFAULT_AR = 1833;
const DEFAULT_OD_MINUS = 366;
const DEFAULT_OD_PLUS = 166;

const TRANSITION_ANIMATION = 100;
const MISS_ANIMATION = 500;
const HIT_ANIMATION = 500;


const KEY_MAP = {
    'A': 0,
    'W': 1,
    'D': 2,
    'S': 3,
    'J': 4,
    'I': 5,
    'L': 6,
    'K': 7,
};

function render_miss(ctx, tick, note, assets) {
    const progress = Math.sqrt((tick - note.miss_tick) / MISS_ANIMATION);
    ctx.save();
    if (progress < 0.2) {
        ctx.globalAlpha = progress / 0.3;
    }
    else if (progress > 0.8) {
        ctx.globalAlpha = (1 - progress) / 0.1;
    }
    const flare_size = 1.5 + progress;
    const star_size = 1.5 - 1.5 * progress;

    const inner_bg_size = 0.75 - progress * 0.2;
    const outer_bg_size = 0.75 + progress * 0.6;
    ctx.fillStyle = 'hsla(7, 80%, 82%, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, inner_bg_size, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, outer_bg_size, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.drawImage(assets.miss_flare, -flare_size / 2, -flare_size / 2, flare_size, flare_size);
    ctx.drawImage(assets.miss_star, -star_size / 2, -star_size / 2, star_size, star_size);
    const scale = 0.2 * progress;
    ctx.scale(scale, scale);
    ctx.font = `bold 2pt sans-serif`;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.1;
    ctx.strokeText('失败', 0, 0);
    ctx.fillStyle = 'hsl(11, 90%, 72%)';
    ctx.fillText('失败', 0, 0);

    ctx.restore();
}

function render_hit(ctx, tick, note, assets) {
    const progress = Math.sqrt((tick - note.hit_tick) / HIT_ANIMATION);
    ctx.save();
    if (progress < 0.2) {
        ctx.globalAlpha = progress / 0.3;
    }
    else if (progress > 0.8) {
        ctx.globalAlpha = (1 - progress) / 0.1;
    }

    const flare_size = 2 + 0.5 * progress;
    const outline_size = 1.5 + 0.7 * progress;
    ctx.drawImage(assets.hit_flare, -flare_size / 2, -flare_size / 2, flare_size, flare_size);
    ctx.drawImage(assets.hit_outline, -outline_size / 2, -outline_size / 2, outline_size, outline_size);

    if (note.hit_parameters === undefined) {
        note.hit_parameters = Array(5).fill(0).map(() => {
            const direction = Math.random() * 2 * Math.PI;
            const near = Math.random() * 0.5 + 0.5;
            const far = Math.random() * 2 + near;
            const nx = Math.cos(direction) * near;
            const ny = Math.sin(direction) * near;
            const fx = Math.cos(direction) * far;
            const fy = Math.sin(direction) * far;
            return {
                type: `note${Math.floor(Math.random() * 4)}`,
                nx: nx,
                ny: ny,
                fx: fx,
                fy: fy,
                rotation: Math.random() * 2 * Math.PI
            };
        });
    }

    for (const p of note.hit_parameters) {
        ctx.save();
        const x = progress * (p.fx - p.nx) + p.nx;
        const y = progress * (p.fy - p.ny) + p.ny;
        ctx.translate(x, y);
        ctx.scale(0.25, 0.25);
        ctx.rotate(p.rotation);
        ctx.drawImage(assets[p.type], -1, -1, 2, 2);
        ctx.restore();
    }

    const scale = 0.2 * progress;
    ctx.scale(scale, scale);
    ctx.font = `bold 2pt sans-serif`;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.1;
    ctx.strokeText('成功', 0, 0);
    ctx.fillStyle = 'hsl(51, 92%, 62%)';
    ctx.fillText('成功', 0, 0);
    ctx.restore();
}

function render_key_map(ctx, keys) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, 'hsla(0, 100%, 0%, 0.2)');
    gradient.addColorStop(0.25, 'hsla(0, 100%, 0%, 0.2)');
    gradient.addColorStop(0.3, 'hsla(0, 100%, 0%, 0.4)');
    gradient.addColorStop(0.6, 'hsla(0, 100%, 0%, 0.4)');
    gradient.addColorStop(0.9, 'hsla(0, 100%, 0%, 0.4)');
    gradient.addColorStop(1, 'hsla(0, 100%, 0%, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, 2 * Math.PI, false);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'hsla(0, 100%, 100%, 0.3';
    ctx.beginPath();
    ctx.arc(0, 0, 0.25, 0, 2 * Math.PI, false);
    ctx.lineWidth = 0.05;
    ctx.stroke();

    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.arc(0, 0, 0.35, 0, 2 * Math.PI, false);
    const anchor = 0.25 * Math.sqrt(2) / 2;
    ctx.moveTo(anchor, anchor);
    ctx.lineTo(anchor * 4, anchor * 4);
    ctx.moveTo(-anchor, anchor);
    ctx.lineTo(-anchor * 4, anchor * 4);
    ctx.moveTo(anchor, -anchor);
    ctx.lineTo(anchor * 4, -anchor * 4);
    ctx.moveTo(-anchor, -anchor);
    ctx.lineTo(-anchor * 4, -anchor * 4);
    ctx.stroke();

    const RECT = [0.35, 0.3];
    const CENTERS = [
        [-0.4, 0],
        [0, -0.4],
        [0.4, 0],
        [0, 0.4],
    ];

    ctx.fillStyle = 'white';
    for (const [x, y] of CENTERS) {
        ctx.roundRect(x - RECT[0] / 2, y - RECT[1] / 2, RECT[0], RECT[1], 0.05);
        ctx.fill();
    }
    for (let i = 0; i < 4; ++i) {
        const [x, y] = CENTERS[i];
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.5 * RECT[0], 0.5 * RECT[0]);
        ctx.fillStyle = 'hsl(0, 0%, 15%)';
        ctx.font = '1pt sans-serif';
        ctx.fillText(keys[i], 0, 0);
        ctx.restore();
    }
}

class Note {
    constructor(time, key) {
        this.time = time;
        this.key = key;
    }

    ar_duration(ar) {
        return DEFAULT_AR / ar;
    }

    appear(ar) {
        return this.time - this.ar_duration(ar);
    }

    beat_begin(od) {
        return this.time - DEFAULT_OD_MINUS / od;
    }

    beat_end(od) {
        return this.time + DEFAULT_OD_PLUS / od;
    }

    to_active(ar, od) {
        return new ActiveNote(this, ar, od);
    }
}

class Slider {
    constructor(time, key, length) {
        this.time = time;
        this.key = key;
        this.length = length;
    }

    ar_duration(ar) {
        return DEFAULT_AR / ar;
    }

    appear(ar) {
        return this.time - this.ar_duration(ar);
    }

    start_beat_begin(od) {
        return this.time - DEFAULT_OD_MINUS / od;
    }

    start_beat_end(od) {
        return this.time + DEFAULT_OD_PLUS / od;
    }

    end_beat() {
        return this.time + this.length;
    }

    end_appear(ar) {
        return this.end_beat() - this.ar_duration(ar);
    }

    end_beat_begin(od) {
        return this.time + this.length - DEFAULT_OD_MINUS / od;
    }

    end_beat_end(od) {
        return this.time + this.length + DEFAULT_OD_PLUS / od;
    }

    to_active(ar, od) {
        return new ActiveSlider(this, ar, od);
    }
}

class ActiveNote {
    constructor(note, ar, od) {
        this.note = {
            time: note.time,
            appear: note.appear(ar),
            beat_begin: note.beat_begin(od),
            beat_end: note.beat_end(od)
        };
        // 0: pre
        // 1: miss
        // 2: hit
        this.state = 0;
    }

    update(tick) {
        switch(this.state) {
            case 0:
                if (tick > this.note.beat_end) {
                    this.state = 1;
                    this.miss_tick = tick;
                    // move to finishing
                    return false;
                }
                // keep in active
                return true;
            case 1:
                if (tick > this.miss_tick + MISS_ANIMATION) {
                    // completely remove
                    return false;
                }
                // keep in finishing pile
                return true;
            case 2:
                if (tick > this.hit_tick + HIT_ANIMATION) {
                    return false;
                }
                return true;
        }
    }

    down(tick) {
        if (this.note.beat_begin <= tick && tick <= this.note.beat_end) {
            this.state = 2;
            this.hit_tick = tick;
        }
        else {
            this.state = 1;
            this.miss_tick = tick;
        }
        return false;
    }

    up(tick) {
        return true;
    }

    render_approach(tick, ctx, assets) {
        if (tick < this.note.time) {
            const coprogress = (this.note.time - tick) / (this.note.time - this.note.appear);
            const scale = 0.75 +
                (KEY_APPROACH - 0.75) * coprogress;
            ctx.beginPath();
            ctx.arc(0, 0, scale, 0, 2 * Math.PI, false);
            ctx.lineWidth = 0.07;
            if (coprogress > 0.6) {
                ctx.strokeStyle = `hsla(143, 100%, 78%, ${0.8 * (1 - coprogress) / 0.3})`;
            }
            else if (coprogress > 0.5) {
                ctx.strokeStyle = 'hsla(143, 100%, 78%, 0.8)';
            }
            else {
                const ratio = coprogress / 0.5;
                const h = 51 * (1 - ratio) + 143 * ratio;
                const s = 92 * (1 - ratio) + 100 * ratio;
                const l = 62 * (1 - ratio) + 78 * ratio;
                ctx.strokeStyle = `hsl(${h}, ${s}%, ${l}%, 0.8)`;
            }
            ctx.stroke();
        }
        else {
            ctx.beginPath();
            ctx.arc(0, 0, 0.75, 0, 2 * Math.PI, false);
            ctx.lineWidth = 0.07;
            ctx.strokeStyle = 'hsla(51, 92%, 62%, 0.8)';
            ctx.stroke();
        }
    }

    render(tick, ctx, assets) {
        ctx.save();
        switch (this.state) {
            case 0:
                if (tick < this.note.appear + TRANSITION_ANIMATION) {
                    ctx.globalAlpha = (tick - this.note.appear) / TRANSITION_ANIMATION;
                }
                else if (this.note.beat_begin < tick) {
                    ctx.beginPath();
                    ctx.arc(0, 0, 0.6, 0, 2 * Math.PI, false);
                    if (tick < this.note.beat_begin + TRANSITION_ANIMATION) {
                        ctx.fillStyle = `hsl(0, 0%, ${80 * (tick - this.note.beat_begin) / TRANSITION_ANIMATION}%)`;
                    }
                    else {
                        ctx.fillStyle = `hsl(0, 0%, 80%)`;
                    }
                    ctx.fill();
                    ctx.globalCompositeOperation = 'hard-light';
                }
                ctx.drawImage(assets.note, -0.75, -0.75, 1.5, 1.5);
                ctx.drawImage(assets.note_outline, -1, -1, 2, 2);
                break;
            case 1:
                render_miss(ctx, tick, this, assets);
                break;
            case 2:
                render_hit(ctx, tick, this, assets);
                break;
        }
        ctx.restore();
    }
}

class ActiveSlider {
    constructor(slider,ar, od) {
        this.slider = {
            time: slider.time,
            appear: slider.appear(ar),
            start_beat_begin: slider.start_beat_begin(od),
            start_beat_end: slider.start_beat_end(od),
            end_appear: slider.end_appear(ar),
            end_beat: slider.end_beat(),
            end_beat_begin: slider.end_beat_begin(od),
            end_beat_end: slider.end_beat_end(od)
        };
        // 0: pre
        // 1: start miss
        // 2: hold
        // 3: miss
        // 4: end hit
        // 5: end miss
        this.state = 0;
    }

    update(tick) {
        switch(this.state) {
            case 0:
                if (tick > this.slider.start_beat_end) {
                    this.state = 1;
                    this.miss_tick = tick;
                    return false;
                }
                return true;
            case 1:
                if (tick > this.miss_tick + MISS_ANIMATION) {
                    this.state = 3;
                }
                return true;
            case 2:
                if (tick > this.slider.end_beat_end) {
                    this.state = 5;
                    this.miss_tick = tick;
                    return false;
                }
                return true;
            case 3:
                if (tick > this.slider.end_beat) {
                    return false;
                }
                return true;
            case 4:
                if (tick > this.hit_tick + HIT_ANIMATION) {
                    return false;
                }
                return true;
            case 5:
                if (tick > this.miss_tick + MISS_ANIMATION) {
                    return false;
                }
                return true;
        }
    }

    down(tick) {
        switch(this.state) {
            case 0:
                if (this.slider.start_beat_begin <= tick && tick <= this.slider.start_beat_end) {
                    this.state = 2;
                    this.hit_tick = tick;
                    return true;
                }
                else {
                    this.state = 1;
                    this.miss_tick = tick;
                    return false;
                }
            default:
                return true;
        }
    }

    up(tick) {
        switch(this.state) {
            case 2:
                if (tick < this.slider.end_beat_begin) {
                    this.state = 3;
                }
                else if (this.slider.end_beat_begin <= tick && tick <= this.slider.end_beat_end) {
                    this.state = 4;
                    this.hit_tick = tick;
                }
                else {
                    this.state = 5;
                    this.miss_tick = tick;
                }
                return false;
            default:
                return true;
        }
    }

    render_approach(tick, ctx, assets) {}

    render(tick, ctx, assets) {
        const head_coprogress = Math.max(0, (this.slider.time - tick) / (this.slider.time - this.slider.appear));
        const tail_coprogress = Math.min(1, Math.max(0, (this.slider.end_beat - tick) / (this.slider.end_beat - this.slider.end_appear)));

        const head_y = -head_coprogress * CEILING;
        const tail_y = -tail_coprogress * CEILING;

        if (this.state <= 3) {
            ctx.save();
            if (this.state === 1 || this.state === 3) {
                ctx.globalAlpha = 0.3;
            }

            if (this.state === 0 || this.state === 2) {
                ctx.fillStyle = 'hsla(227, 100%, 67%, 0.8)';
            }
            else {
                ctx.fillStyle = 'hsla(0, 100%, 100%, 0.5)';
            }
            ctx.strokeStyle = 'hsla(0, 100%, 100%, 0.7)';
            ctx.lineWidth = 0.03;
            ctx.beginPath();
            ctx.arc(0, head_y, 0.6, 0, Math.PI, true);
            ctx.lineTo(-0.6, tail_y);
            ctx.arc(0, tail_y, 0.6, Math.PI, 0, true);
            ctx.closePath();
            ctx.clip()

            ctx.fillRect(-0.4, tail_y, 0.8, head_y - tail_y);
            ctx.strokeRect(-0.4, tail_y, 0.8, head_y - tail_y);
            ctx.restore();

            ctx.save();
            if (tick < this.slider.appear + TRANSITION_ANIMATION) {
                ctx.globalAlpha = (tick - this.slider.appear) / TRANSITION_ANIMATION;
            }
            else if (this.slider.start_beat_begin < tick) {
                ctx.beginPath();
                ctx.arc(0, 0, 0.6, 0, 2 * Math.PI, false);
                if (tick < this.slider.start_beat_begin + TRANSITION_ANIMATION) {
                    ctx.fillStyle = `hsl(0, 0%, ${80 * Math.sqrt((tick - this.slider.start_beat_begin) / TRANSITION_ANIMATION)}%)`;
                }
                else if (tick < this.slider.time) {
                    ctx.fillStyle = `hsl(0, 0%, 80%)`;
                }
                ctx.fill();
                ctx.globalCompositeOperation = 'hard-light';
            }
            ctx.drawImage(assets.note, -0.75, -0.75, 1.5, 1.5);
            ctx.drawImage(assets.note_outline, -1, -1, 2, 2);
            ctx.restore();

            if (tick >= this.slider.end_appear) {
                ctx.drawImage(assets.note, -0.75, tail_y - 0.75, 1.5, 1.5);
            }
            if (tick < this.slider.start_beat_end) {
                ctx.drawImage(assets.note, -0.75, head_y - 0.75, 1.5, 1.5);
            }
        }
        switch(this.state) {
            case 1:
                render_miss(ctx, tick, this, assets);
                break;
            case 2:
                if (tick < this.hit_tick + HIT_ANIMATION) {
                    render_hit(ctx, tick, this, assets);
                }
                break;
            case 4:
                render_hit(ctx, tick, this, assets);
                break;
            case 5:
                render_miss(ctx, tick, this, assets);
                break;
        }
    }
}

const KEY_HPAD = 0.25;
const KEY_VCENTER = 0.6;
const KEY_D = 0.33;
const KEY_R = 0.13;
const KEY_APPROACH = 2.1;
const CEILING = (KEY_VCENTER + KEY_D) / KEY_R;
const KEY_D_2 = KEY_D / 2;
const KEY_L_H_CENTER = KEY_HPAD + KEY_D_2;
const KEY_R_H_CENTER = 2 - KEY_HPAD - KEY_D_2;

const KEY_POS = (function() {
    return [
        [KEY_L_H_CENTER - KEY_D_2, KEY_VCENTER],
        [KEY_L_H_CENTER, KEY_VCENTER - KEY_D_2],
        [KEY_L_H_CENTER + KEY_D_2, KEY_VCENTER],
        [KEY_L_H_CENTER, KEY_VCENTER + KEY_D_2],

        [KEY_R_H_CENTER - KEY_D_2, KEY_VCENTER],
        [KEY_R_H_CENTER, KEY_VCENTER - KEY_D_2],
        [KEY_R_H_CENTER + KEY_D_2, KEY_VCENTER],
        [KEY_R_H_CENTER, KEY_VCENTER + KEY_D_2]
    ];
})();

function open_modal(id) {
    const elem = document.getElementById(id);
    document.getElementById('backdrop').style.display = 'block';
    elem.style.display = 'block';
    elem.classList.add('show');
}

function close_modal(id) {
    const elem = document.getElementById(id);
    document.getElementById('backdrop').style.display = 'none';
    elem.style.display = 'none';
    elem.classList.remove('show');
}

class Game {
    constructor() {
        this.ar = 1.0;
        this.od = 1.0;
        
        this.reset_state();
        this.canvas = document.getElementById('game');
    }

    run() {
        const that = this;
        fix_canvas_size();

        window.addEventListener('resize', fix_canvas_size);
        function fix_canvas_size() {
            const width = that.canvas.clientWidth;
            const height = that.canvas.clientHeight;
            that.canvas.width = width;
            that.canvas.height = height;
            that.gamearea_transform = calc_gamearea_transform(that.canvas);
            that.gamearea_transform_inv = that.gamearea_transform.inverse();
        }

        function calc_gamearea_transform(canvas) {
            const w = canvas.width;
            const h = canvas.height;
            const ctx = canvas.getContext('2d');

            let draw_area_w = w;
            let draw_area_h = h * 0.9;
            let draw_area_x = w / 2;
            let draw_area_y = h - draw_area_h / 2;

            if (2 * draw_area_h <= draw_area_w) {
                draw_area_w = draw_area_h * 2;
            }
            const scale = draw_area_w / 2.0;

            ctx.save();
            ctx.translate(draw_area_x, draw_area_y);
            ctx.scale(scale, scale);
            ctx.translate(-1, -0.5);
            const transform = ctx.getTransform();
            ctx.restore();

            return transform;
        }

        document.getElementById('ar-ms').textContent = DEFAULT_AR;
        document.getElementById('od-ms').textContent = (DEFAULT_OD_PLUS + DEFAULT_OD_MINUS);

        document.getElementById('ar-input').addEventListener('input', e => {
            const ar = e.target.value;
            document.getElementById('ar-value').textContent = parseFloat(ar).toFixed(2);
            document.getElementById('ar-ms').textContent = (DEFAULT_AR / ar).toFixed(0);
        });

        document.getElementById('ar-input').addEventListener('change', e => {
            that.ar = e.target.value;
        });

        document.getElementById('od-input').addEventListener('input', e => {
            const od = e.target.value;
            document.getElementById('od-value').textContent = parseFloat(od).toFixed(2);
            document.getElementById('od-ms').textContent = ((DEFAULT_OD_PLUS + DEFAULT_OD_MINUS) / od).toFixed(0);
        });

        document.getElementById('od-input').addEventListener('change', e => {
            that.od = e.target.value;
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            close_modal('settings');
            that.reset();
            that.start();
        });
        document.getElementById('pause-btn').addEventListener('click', () => {
            open_modal('pause');
            that.pause();
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            close_modal('pause');
            open_modal('settings');
        });
        document.getElementById('resume-btn').addEventListener('click', () => {
            close_modal('pause');
            that.start();
        });

        window.addEventListener('keydown', e => {
            if (that.is_pause) {
                return;
            }
            const lane = KEY_MAP[String.fromCharCode(e.keyCode)];
            if (lane !== undefined) {
                that.down(lane);
            }
        });

        window.addEventListener('keyup', e => {
            if (that.is_pause) {
                return;
            }
            const lane = KEY_MAP[String.fromCharCode(e.keyCode)];
            if (lane !== undefined) {
                that.up(lane);
            }
        });

        if (IS_TOUCH) {
            function calc_touches(touch_list) {
                const lanes = Array(8).fill(false);
                const touches = Array(touch_list.length).fill(0).map((_, idx) => {
                    const touch = touch_list.item(idx);
                    return [touch.clientX, touch.clientY];
                }).map(([x, y]) => {
                    const point = that.gamearea_transform_inv.transformPoint(
                        DOMPoint.fromPoint({ x: x, y: y, z: 0, w: 1 }));
                    return [point.x, point.y];
                });

                for (const [sx, sy] of touches) {
                    for (let i = 0; i < 8; ++i) {
                        const [tx, ty] = KEY_POS[i];
                        if ((sx - tx) * (sx - tx) + (sy - ty) * (sy - ty) <= TOUCH_SLACK * KEY_R * KEY_R) {
                            lanes[i] = true;
                        }
                    }
                }
                return lanes;
            }

            const touch_handler = e => {
                that.update_down(calc_touches(e.targetTouches));
                e.preventDefault();
            };

            this.canvas.addEventListener('touchstart', touch_handler);
            this.canvas.addEventListener('touchmove', touch_handler);
            this.canvas.addEventListener('touchcancel', touch_handler);
            this.canvas.addEventListener('touchend', touch_handler);
        }


        open_modal('settings');
    }

    loop(timestamp) {
        if (this.is_pause) {
            return;
        }

        this.update(timestamp)
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const progress = this.assets.audio.currentTime / this.assets.audio.duration;

        if (progress > 1) {
            this.pause();
            open_modal("settings");
        }

        ctx.fillStyle = 'hsl(180, 100%, 62%)';
        ctx.fillRect(0, 0, progress * this.canvas.width, 5);

        ctx.save();
        ctx.setTransform(this.gamearea_transform);
        ctx.beginPath();
        ctx.rect(-1, 0, 4, 1);
        ctx.clip();

        this.render(ctx);

        ctx.globalCompositeOperation = "destination-in";
        const gamearea_mask = ctx.createLinearGradient(0, 0, 0, 1);
        gamearea_mask.addColorStop(0, 'hsla(0, 100%, 100%, 0)');
        gamearea_mask.addColorStop(0.1, 'hsla(0, 100%, 100%, 1)');
        gamearea_mask.addColorStop(1, 'hsla(0, 100%, 100%, 1)');
        ctx.fillStyle = gamearea_mask;
        ctx.rect(-1, 0, 4, 1);

        ctx.restore();

        requestAnimationFrame(this.loop.bind(this));
    }

    load_image(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', () => resolve([src, img]), false);
            img.addEventListener('error', (e) => reject(e), false);
            img.src = `assets/img/${src}.png`;
        });
    }

    load_audio() {
        return new Promise((resolve, reject) => {
            const audio = new Audio('assets/music/raiden.mp3');
            audio.addEventListener('canplaythrough', () => resolve(['audio', audio]), false);
            audio.addEventListener('error', (e) => reject(e), false);
        });
    }

    load_assets() {
        const that = this;
        var loaded = 0;
        const jobs = [
            this.load_image('note'),
            this.load_image('note_outline'),
            this.load_image('approach_circle'),
            this.load_image('miss_flare'),
            this.load_image('miss_star'),
            this.load_image('hit_flare'),
            this.load_image('hit_outline'),
            this.load_image('note0'),
            this.load_image('note1'),
            this.load_image('note2'),
            this.load_image('note3'),
            this.load_audio()
        ].map(job => {
            return job.then((resource) => {
                loaded += 1;
                document.getElementById('loaded').textContent = loaded;
                return resource;
            });
        });
        document.getElementById('toload').textContent = jobs.length;

        return Promise.all(jobs).then((resources) => {
            that.assets = Object.fromEntries(resources);
        });
    }

    reset_state() {
        // this.combo = 0;
        // this.great = 0;

        this.tick = 0.0;
        this.is_pause = true;

        this.window = 0;
        this.active = Array.from(Array(8), () => []);
        this.finishing = Array.from(Array(8), () => []);
    }

    reset() {
        this.reset_state();
        this.assets.audio.currentTime = 0;
    }

    start() {
        this.down_lane = Array(8).fill(false);
        this.is_pause = false;
        this.last = undefined;
        this.assets.audio.play();
        requestAnimationFrame(this.loop.bind(this));
    }

    pause() {
        this.is_pause = true;
        this.assets.audio.pause();
    }

    down(lane) {
        if (this.active[lane][0]) {
            if (!this.active[lane][0].down(this.tick)) {
                this.finishing[lane].push(this.active[lane].shift());
            }
        }
        this.down_lane[lane] = true;
    }

    up(lane) {
        if (this.active[lane][0]) {
            if (!this.active[lane][0].up(this.tick)) {
                this.finishing[lane].push(this.active[lane].shift());
            }
        }
        this.down_lane[lane] = false;
    }

    update_down(lanes) {
        for (let i = 0; i < 8; ++i) {
            if (lanes[i] !== this.down_lane[i]) {
                if (lanes[i]) {
                    this.down(i);
                }
                else {
                    this.up(i);
                }
            }
        }
    }

    update(timestamp) {
        const that = this;
        if (this.last === undefined) {
            this.last = timestamp;
        }
        this.tick += timestamp - this.last;
        this.last = timestamp;

        while (this.window < BEATMAP.notes.length &&
               BEATMAP.notes[this.window].appear(this.ar) < this.tick) {
            const note = BEATMAP.notes[this.window];
            this.active[note.key].push(note.to_active(this.ar, this.od));
            ++this.window;
        }

        for (const [key, list] of this.active.entries()) {
            for (let i = 1; i < list.length; ++i) {
                list[i].update(this.tick);
            }
            if (list[0]) {
                if (!list[0].update(this.tick)) {
                    this.finishing[key].push(list.shift());
                }
            }
        }

        for (const [key, list] of this.finishing.entries()) {
            this.finishing[key] = list.filter(note => note.update(that.tick));
        }
    }

    // Assume appropriate transformation has been set to have a [0,2] x [0,1] canvas
    render(ctx) {
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        ctx.save();
        ctx.translate(KEY_L_H_CENTER, KEY_VCENTER);
        ctx.scale(0.9 * KEY_D_2, 0.9 * KEY_D_2);
        render_key_map(ctx, ['A', 'W', 'D', 'S']);
        ctx.restore();

        ctx.save();
        ctx.translate(KEY_R_H_CENTER, KEY_VCENTER);
        ctx.scale(0.9 * KEY_D_2, 0.9 * KEY_D_2);
        render_key_map(ctx, ['J', 'I', 'L', 'K']);
        ctx.restore();


        for (let i = 0; i < 8; ++i) {
            ctx.save();
            const [x, y] = KEY_POS[i];
            ctx.translate(x, y);
            ctx.scale(KEY_R, KEY_R);

            if (this.active[i][0]) {
                this.active[i][0].render(this.tick, ctx, this.assets);
            }

            for (const note of this.finishing[i]) {
                note.render(this.tick, ctx, this.assets);
            }

            for (const note of this.active[i]) {
                note.render_approach(this.tick, ctx, this.assets);

            }

            ctx.restore();
        }
    }
}

const BEATMAP = {
    bpm: 201.35,
    bar_resolution: 4,
    offset: 6389,
    notes: [
        new Note(8, 6),
        new Note(8.5, 6),
        new Note(9, 1),
        new Note(9, 5),
        new Note(10.5, 0),
        new Note(10.75, 1),
        new Note(11, 2),
        new Note(11.25, 0),
        new Note(11.5, 3),
        new Note(11.75, 1),
        new Note(12, 5),
        new Note(12.75, 4),
        new Slider(13, 6, 1.25),

        new Note(16, 0),
        new Note(16.5, 0),
        new Note(17, 1),
        new Note(17, 5),
        new Note(18.5, 6),
        new Note(18.75, 7),
        new Note(19, 4),
        new Note(19.25, 5),
        new Note(19.5, 7),
        new Note(19.75, 2),
        new Note(20, 3),
        new Slider(21, 0, 1.25),

        new Note(24, 7),
        new Note(24.5, 7),
        new Slider(25, 5, 1),
        new Note(26.5, 0),
        new Note(26.75, 1),
        new Note(27, 3),
        new Note(27.25, 2),
        new Note(27.5, 0),
        new Note(27.75, 1),
        new Note(28, 5),
        new Note(28.75, 7),
        new Slider(29, 6, 1.25),

        new Note(31.5, 3),
        new Note(32, 1),
        new Note(32, 5),

        new Note(34.5, 4),
        new Note(34.75, 7),
        new Note(35, 6),
        new Note(35.25, 5),
        new Note(35.5, 7),
        new Note(35.75, 4),
        new Slider(36, 6, 1.25),
        new Note(36.5, 3),
        new Slider(38, 3, 1.25),
        new Note(38.5, 7),

        new Note(52, 2),
        new Note(52, 6),
        new Note(52.5, 3),
        new Note(52.5, 7),
        new Note(53, 1),
        new Note(53, 5),

        new Note(54.5, 6),
        new Note(54.75, 7),
        new Note(55, 5),
        new Note(55.25, 2),
        new Note(55.5, 3),
        new Note(55.75, 0),
        new Note(56, 1),
        new Note(56, 5),
        new Slider(57, 4, 1.25),

        new Note(67.5, 3),
        new Slider(68, 1, 1.25),
        new Slider(68, 5, 1.25),

        new Note(70.5, 0),
        new Note(70.75, 3),
        new Note(71, 2),
        new Note(71.25, 4),
        new Note(71.5, 7),
        new Note(71.75, 6),
        new Slider(72, 0, 1.25),
        new Slider(72, 4, 1.25),
        new Slider(74, 2, 1.25),
        new Slider(74, 6, 1.25),
    ]
};

BEATMAP.notes.forEach((note) => {
    note.time = note.time * BEATMAP.bar_resolution / BEATMAP.bpm * 60 * 1000 + BEATMAP.offset;
    if (note.length !== undefined) {
        note.length = note.length * BEATMAP.bar_resolution / BEATMAP.bpm * 60 * 1000;
    }
});