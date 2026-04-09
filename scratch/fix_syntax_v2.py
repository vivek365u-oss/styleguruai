import os

filepath = r'c:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\src\components\StyleNavigator.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Jewelry line
content = content.replace('className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"', 'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')

# Fix Shoes line
content = content.replace('className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"', 'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')

# Also handle cases where there might not be a backtick or slightly different spacing
# If the previous replace didn't work, try these
content = content.replace('className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}"', 'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors in StyleNavigator.jsx (Round 2)")
