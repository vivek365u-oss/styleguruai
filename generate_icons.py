import os
import sys
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create an image with a dark transparent background
    # Actually for PWA icons it's best to have a solid background or a rounded background
    # Let's create a rounded rectangle background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # We will simulate the linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)
    # We can do this by drawing horizontal/vertical lines or just a solid color with the SG
    # For simplicity in PIL, let's use a solid premium color that represents the brand
    # Or actually, we can manually draw a 1D gradient. Since it's a square, we can do a simple radial or linear.
    # Let's write a simple linear gradient painter.
    for y in range(size):
        for x in range(size):
            # 135 deg roughly: (x + y) / (2 * size)
            factor = (x + y) / (2.0 * size)
            if factor < 0.5:
                # #6366F1 (99, 102, 241) to #8B5CF6 (139, 92, 246)
                r = int(99 + factor * 2 * (139 - 99))
                g = int(102 + factor * 2 * (92 - 102))
                b = int(241 + factor * 2 * (246 - 241))
            else:
                f2 = (factor - 0.5) * 2
                # #8B5CF6 to #EC4899 (236, 72, 153)
                r = int(139 + f2 * (236 - 139))
                g = int(92 + f2 * (72 - 92))
                b = int(246 + f2 * (153 - 246))
                
            img.putpixel((x, y), (r, g, b, 255))
    
    
    # Text "SG" in the center using basic shapes if font is missing, but PIL default font usually works
    # We want a bold, big SG. Let's try to load a default TrueType font, or create an image mask.
    # Since we might not have 'Plus Jakarta Sans' installed locally in the script environment,
    # we'll use arial.ttf or the default font.
    font_size = int(size * 0.45)
    
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
        
    text = "SG"
    # Fallback positioning mapping since modern Pillow font handles things a bit differently
    try:
        left, top, right, bottom = d.textbbox((0, 0), text, font=font)
        text_w = right - left
        text_h = bottom - top
    except AttributeError:
        text_w, text_h = d.textsize(text, font=font)
        
    text_x = (size - text_w) / 2
    text_y = (size - text_h) / 2 - (size * 0.05) # adjust vertical center slightly
    
    # Draw white text
    d.text((text_x, text_y), text, font=font, fill=(255, 255, 255, 255))
    
    # The output directory might not exist yet
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, "PNG")
    print(f"Created {filename}")

if __name__ == "__main__":
    create_icon(192, "frontend/public/icons/icon-192x192.png")
    create_icon(512, "frontend/public/icons/icon-512x512.png")
