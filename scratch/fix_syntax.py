import os

filepath = r'c:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\src\components\StyleNavigator.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Fix line 627 (indexed as 626)
    if 'Finishing Touches' in line and 'className="text-[9px]' in line:
        line = line.replace('className="text-[9px] font-black uppercase ${isDark ? \'opacity-40\' : \'text-slate-500\'} mb-3 tracking-widest"', 'className={`text-[9px] font-black uppercase ${isDark ? \'opacity-40\' : \'text-slate-500\'} mb-3 tracking-widest`}')
    
    # Fix Labels (Jewelry, Shoes)
    if 'Jewelry' in line and 'className="text-[9px]' in line:
        line = line.replace('className="text-[9px] font-black uppercase ${isDark ? \'opacity-60\' : \'text-slate-500\'}"', 'className={`text-[9px] font-black uppercase ${isDark ? \'opacity-60\' : \'text-slate-500\'}`}')
    if 'Shoes' in line and 'className="text-[9px]' in line:
        line = line.replace('className="text-[9px] font-black uppercase ${isDark ? \'opacity-60\' : \'text-slate-500\'}"', 'className={`text-[9px] font-black uppercase ${isDark ? \'opacity-60\' : \'text-slate-500\'}`}')
    
    # Fix Values
    if 'tips.jewelry' in line and 'className="text-[10px]' in line:
        line = line.replace('className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}"`', 'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')
    if 'tips.shoes' in line and 'className="text-[10px]' in line:
        line = line.replace('className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}"`', 'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')
    
    new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed syntax errors in StyleNavigator.jsx")
