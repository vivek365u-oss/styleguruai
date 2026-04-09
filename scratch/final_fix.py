import os

filepath = r'c:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\src\components\StyleNavigator.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The exact broken string from the user's error/view_file
broken_part = 'className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"'
correct_part = 'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}'

if broken_part in content:
    content = content.replace(broken_part, correct_part)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Fixed broken className string.")
else:
    print("ERROR: Could not find broken string. Checking for variations...")
    # Try common variations
    content = content.replace('className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}"', correct_part)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Variation replacement attempted.")
