"""Monta a versão com takes: abertura (quadros já renderizados) + takes editados + fechamento.
Escreve quadros RGB crus direto no ffmpeg (1080x1920, 60 fps)."""
import sys, os, math, subprocess
import numpy as np
from PIL import Image, ImageFilter

S = sys.argv[1]
OUT = sys.argv[2]
PREVIEW = sys.argv[3:]  # tempos (s) para exportar PNG de conferência em vez do vídeo
W, H, FPS = 1080, 1920, 60

clamp = lambda x: 0.0 if x < 0 else 1.0 if x > 1 else x
outExpo = lambda x: 1.0 if x >= 1 else 1 - 2 ** (-10 * x)
outCubic = lambda x: 1 - (1 - x) ** 3
inOutCubic = lambda x: 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
inOutQuint = lambda x: 16 * x ** 5 if x < .5 else 1 - (-2 * x + 2) ** 5 / 2

# cores das bolsas (amostradas dos takes e levemente limpas)
SALVIA, OFFWHITE, AREIA, MARE, ROSE, INK = (125, 140, 110), (238, 232, 222), (216, 203, 183), (43, 76, 116), (237, 186, 175), (0, 0, 0)

# ---------- edição dos takes (tempos locais em s); zoom z0->z1 com easing, foco normalizado no take
def const(speed):
    return lambda lt: lt * speed
def ramp_fast_slow(lt):  # rampa de velocidade: 1.6x e depois 0.6x
    return 1.6 * lt if lt < .65 else 1.04 + .6 * (lt - .65)

SEGS = [
    dict(take=1, src=0.3, dur=1.9, z=(1.04, 1.17), ease=inOutCubic, focus=(.5, .58), time=const(1.0)),
    dict(take=6, src=0.6, dur=0.9, z=(1.24, 1.06), ease=outExpo, focus=(.72, .46), time=const(1.0)),
    dict(take=4, src=0.2, dur=1.3, z=(1.05, 1.14), ease=inOutCubic, focus=(.35, .45), time=ramp_fast_slow),
    dict(take=2, src=0.5, dur=1.0, z=(1.0, 1.09), ease=outCubic, focus=(.45, .5), time=const(1.0)),
    dict(take=3, src=0.4, dur=1.5, z=(1.05, 1.38), ease=inOutQuint, focus=(.53, .56), time=const(1.0)),
    dict(take=5, src=0.5, dur=1.5, z=(1.28, 1.05), ease=outCubic, focus=(.62, .45), time=const(1.0)),
    dict(take=7, src=0.3, dur=1.8, z=(1.04, 1.2), ease=inOutCubic, focus=(.38, .62), time=const(.85)),
    # cortes rápidos com punch-in
    dict(take=1, src=3.6, dur=0.3, z=(1.45, 1.3), ease=outExpo, focus=(.58, .55), time=const(1.0), flash=True),
    dict(take=3, src=2.6, dur=0.3, z=(1.35, 1.2), ease=outExpo, focus=(.5, .55), time=const(1.0), flash=True),
    dict(take=6, src=3.0, dur=0.3, z=(1.4, 1.25), ease=outExpo, focus=(.72, .48), time=const(1.0), flash=True),
    dict(take=5, src=3.0, dur=0.3, z=(1.4, 1.25), ease=outExpo, focus=(.62, .45), time=const(1.0), flash=True),
    dict(take=7, src=3.1, dur=0.36, z=(1.35, 1.22), ease=outExpo, focus=(.4, .62), time=const(1.0), flash=True),
]

OPEN_N = 351                      # abertura: quadros 0..350 (até 5,85 s)
t = OPEN_N / FPS
for sg in SEGS:
    sg['start'] = t; t += sg['dur']
MID_END = t
CLOSE_N = 237                     # fechamento renderizado de 6,05 s a 10 s
TOTAL_N = OPEN_N + round((MID_END - OPEN_N / FPS) * FPS) + CLOSE_N

# cortinas na cor da bolsa que entra: (tempo do corte, cor principal, cor de trás)
def seg_start(i): return SEGS[i]['start']
WIPES = [
    (seg_start(0), SALVIA, ROSE),
    (seg_start(3), OFFWHITE, SALVIA),
    (seg_start(5), AREIA, OFFWHITE),
    (seg_start(6), MARE, AREIA),
    (MID_END, ROSE, MARE),
]
WD = .44  # duração da cortina

# ---------- tratamento de cor: contraste em S, leve calor nas altas, saturação seletiva
x = np.linspace(0, 1, 256)
s_curve = x + .09 * np.sin(2 * np.pi * x) * -1 * (1 - abs(2 * x - 1)) * .9
s_curve = np.clip(.015 + s_curve * .975, 0, 1)            # pretos levemente levantados (cara de editorial)
LUT_R = np.clip(s_curve * 1.025 + .006, 0, 1)
LUT_G = s_curve
LUT_B = np.clip(s_curve * .975, 0, 1)
LUTS = [(l * 255).astype(np.uint8) for l in (LUT_R, LUT_G, LUT_B)]

def grade(a, take):
    a = np.stack([LUTS[c][a[..., c]] for c in range(3)], -1).astype(np.float32)
    L = a @ np.array([.299, .587, .114], np.float32)
    sat = 1.14 if take != 1 else 1.04                         # o take 1 já vem quente
    a = L[..., None] + (a - L[..., None]) * sat
    if take == 1:
        a *= np.array([.985, 1.0, 1.02], np.float32)         # tira um pouco do laranja para casar com os outros
    return np.clip(a, 0, 255)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = 1 - .32 * np.clip(((xx / W - .5) ** 2 * 1.6 + (yy / H - .5) ** 2 * 1.1) * 2.2 - .25, 0, 1)
VIG = VIG[..., None]
rng = np.random.default_rng(7)

_cache = {}
def src_frame(take, idx):
    key = (take, idx)
    if key not in _cache:
        if len(_cache) > 40: _cache.clear()
        n = len(os.listdir(f'{S}/takes/src{take}'))
        idx = max(1, min(n, idx))
        _cache[key] = Image.open(f'{S}/takes/src{take}/{idx:04d}.png').convert('RGB')
    return _cache[key]

def take_frame(T):
    for sg in SEGS:
        if sg['start'] <= T < sg['start'] + sg['dur'] + 1e-9:
            break
    lt = T - sg['start']; p = clamp(lt / sg['dur'])
    st = sg['src'] + sg['time'](lt)
    im = src_frame(sg['take'], int(st * 24) + 1)
    sw, sh = im.size
    z = sg['z'][0] + (sg['z'][1] - sg['z'][0]) * sg['ease'](p)
    k = (sw / W) / z
    hw, hh = W * k / 2 / sw, H * k / 2 / sh
    cx = min(max(sg['focus'][0], hw), 1 - hw) * sw
    cy = min(max(sg['focus'][1], hh), 1 - hh) * sh
    out = im.transform((W, H), Image.AFFINE, (k, 0, cx - W / 2 * k, 0, k, cy - H / 2 * k), resample=Image.BICUBIC)
    out = out.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    a = grade(np.asarray(out), sg['take'])
    if sg.get('flash'):
        a = a + (255 - a) * .35 * clamp(1 - lt / .08)        # flash curto no corte rápido
    a = a * VIG
    g = rng.normal(0, 4.2, (H // 2, W // 2)).astype(np.float32)
    a = a + np.repeat(np.repeat(g, 2, 0), 2, 1)[..., None]   # grão leve, igual ao da abertura
    return np.clip(a, 0, 255).astype(np.uint8)

def wipe(a, T):
    for tc, col, back in WIPES:
        p = (T - (tc - WD / 2)) / WD
        if 0 <= p <= 1:
            a = a.copy()
            # duas faixas: a de trás (cor anterior) puxa a principal (cor que entra)
            for lag, c in ((0.0, back), (.12, col)):
                q = clamp((p - lag) / (1 - .12))
                e = inOutCubic(q)
                top = H * (1 - min(1, 2 * e)); bot = H * (1 - max(0, 2 * e - 1))
                y0, y1 = int(round(top)), int(round(bot))
                if y1 > y0: a[y0:y1] = c
    return a

def frame(n):
    if n < OPEN_N:
        a = np.asarray(Image.open(f'{S}/fv/f{n:04d}.png').convert('RGB'))
        T = n / FPS
    elif n >= TOTAL_N - CLOSE_N:
        a = np.asarray(Image.open(f'{S}/fc/c{n - (TOTAL_N - CLOSE_N):04d}.png').convert('RGB'))
        T = MID_END + (n - (TOTAL_N - CLOSE_N)) / FPS
    else:
        T = n / FPS
        a = take_frame(T)
    return wipe(a, T)

print(f'total {TOTAL_N} quadros = {TOTAL_N / FPS:.2f} s; takes de {OPEN_N / FPS:.2f} a {MID_END:.2f} s', flush=True)
if PREVIEW:
    for ts in PREVIEW:
        Image.fromarray(frame(round(float(ts) * FPS))).save(f'{S}/prev_{ts}.png')
    sys.exit()

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                       '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', OUT],
                      stdin=subprocess.PIPE)
for n in range(TOTAL_N):
    ff.stdin.write(frame(n).tobytes())
    if n % 120 == 0: print(n, flush=True)
ff.stdin.close(); ff.wait()
print('ok', OUT)
