import json, sys
from PIL import Image, ImageDraw, ImageFont
S = sys.argv[1]
cols = json.load(open(f"{S}/cols.json"))
k = 8  # scale of the live nav logo (CSS px)
navy, gold = (0x1b, 0x2a, 0x4a, 255), (0xd4, 0xa8, 0x53, 255)
ring = (0xd4, 0xa8, 0x53, int(255 * 0.3))
font = ImageFont.truetype(f"{S}/font/DMSerifDisplay-Regular.ttf", int(21.6 * k))
text = "TeachBraille"
# letter-spacing -0.5px: draw per glyph
def text_width():
    w = 0
    for ch in text: w += font.getlength(ch) - 0.5 * k
    return w + 0.5 * k
pad = 6 * k
cell_w, cell_h, dot, gap = 14 * k, 20 * k, 5 * k, 2 * k
asc, desc = font.getmetrics()
H = max(cell_h, asc + desc) + 2 * pad
W = int(pad + cell_w + 8 * k + text_width() + pad)
im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
cx0, cy0 = pad, (H - cell_h) // 2
rowpitch = (cell_h - dot) / 2
for ci, col in enumerate(cols):
    for ri, raised in enumerate(col):
        x = cx0 + ci * (cell_w + gap) / 2; y = cy0 + ri * rowpitch
        box = [x, y, x + dot, y + dot]
        if raised: d.ellipse(box, fill=gold)
        else: d.ellipse(box, outline=ring, width=k)
x = pad + cell_w + 8 * k
y = (H - (asc + desc)) // 2
for ch in text:
    d.text((x, y), ch, font=font, fill=navy)
    x += font.getlength(ch) - 0.5 * k
bbox = im.getbbox()
im = im.crop((bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad))
im.save(f"{S}/out/teach-braille/logo.png", optimize=True)
print(im.size)
