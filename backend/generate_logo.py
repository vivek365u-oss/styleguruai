from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import os

# Create a 1024x1024 image
size = 1024
img = Image.new("RGBA", (size, size), (14, 7, 26, 255)) # Dark plum background
draw = ImageDraw.Draw(img)

# 1. Radiant Background Gradient
for y in range(size):
    # simple vertical gradient mixed with radial
    factor = abs(y - size/2) / (size/2)
    r = int(26 - 15 * factor)
    g = int(14 - 8 * factor)
    b = int(46 - 25 * factor)
    draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

# Draw some subtle glow
glow = Image.new("RGBA", (size, size), (0,0,0,0))
glow_draw = ImageDraw.Draw(glow)
# Center glow
glow_draw.ellipse((size//2 - 400, size//2 - 400, size//2 + 400, size//2 + 400), fill=(80, 40, 100, 30))
img = Image.alpha_composite(img, glow)
draw = ImageDraw.Draw(img)

# 2. Draw Stars (top right, bottom left)
def draw_star(cx, cy, radius, color):
    # draw 4-point star
    points = [
        (cx, cy - radius),
        (cx + radius*0.2, cy - radius*0.2),
        (cx + radius, cy),
        (cx + radius*0.2, cy + radius*0.2),
        (cx, cy + radius),
        (cx - radius*0.2, cy + radius*0.2),
        (cx - radius, cy),
        (cx - radius*0.2, cy - radius*0.2),
    ]
    draw.polygon(points, fill=color)

draw_star(850, 150, 40, (255, 190, 50, 255))  # Gold star
draw_star(150, 850, 30, (150, 80, 255, 255))  # Purple star

# 3. Draw Outer thin accent rings
center = (size//2, size//2)
radius_outer = 380
draw.ellipse((center[0]-radius_outer, center[1]-radius_outer, center[0]+radius_outer, center[1]+radius_outer), outline=(100, 70, 150, 100), width=4)
draw.ellipse((center[0]-radius_outer-20, center[1]-radius_outer-20, center[0]+radius_outer+20, center[1]+radius_outer+20), outline=(60, 40, 90, 80), width=2)

# 4. Draw the 9-Segment Skin Tone Wheel
tones = [
    "#FDE8D7", # 1
    "#EFC6A6", # 2
    "#DFAC81", # 3
    "#CA8B5C", # 4
    "#A66A3D", # 5
    "#824922", # 6
    "#633315", # 7
    "#461F0A", # 8
    "#291004"  # 9
]
radius_wheel = 360
radius_inner = 180
# The wheel spans 360 degrees. Each slice is 40 degrees.
start_angle = -90 # Start at 12 o'clock

for i, color in enumerate(tones):
    end_angle = start_angle + 40
    # Draw pie slice
    draw.pieslice(
        (center[0]-radius_wheel, center[1]-radius_wheel, center[0]+radius_wheel, center[1]+radius_wheel),
        start_angle, end_angle, fill=color, outline=(20, 10, 30, 255), width=3
    )
    start_angle = end_angle

# 5. Draw Inner Dark Center (to make it a hollow ring)
draw.ellipse((center[0]-radius_inner, center[1]-radius_inner, center[0]+radius_inner, center[1]+radius_inner), fill=(20, 9, 36, 255), outline=(120, 80, 180, 255), width=6)

# 6. Draw White T-Shirt Icon in the Center
# We will draw it using polygons
shirt_color = (255, 255, 255, 255)
# Neck
# T-shirt coordinates relative to exact center scale
sc = 1.6 # scale
# Polygon points for a clean t-shirt icon
pts = [
    (-60, -70), # Left shoulder top
    (-25, -60), # Left collar
    (0, -50),   # Center collar dip
    (25, -60),  # Right collar
    (60, -70),  # Right shoulder top
    (80, -30),  # Right sleeve outer
    (55, -20),  # Right armpit
    (55, 60),   # Right bottom
    (-55, 60),  # Left bottom
    (-55, -20), # Left armpit
    (-80, -30)  # Left sleeve outer
]
# scale and translate
tshirt_pts = [(center[0] + x * sc, center[1] + y * sc) for x, y in pts]
draw.polygon(tshirt_pts, fill=shirt_color, outline=(200, 200, 200, 255))
# Collar cutout
draw.chord((center[0] - 25*sc, center[1] - 70*sc, center[0] + 25*sc, center[1] - 40*sc), 0, 180, fill=(20, 9, 36, 255))

# Add some nice glow lines
img = img.resize((512, 512), Image.Resampling.LANCZOS)
img.save(r"C:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\public\logo.png")
img.save(r"C:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\public\favicon.ico", sizes=[(64, 64)])
print("Logo generated successfully!")
