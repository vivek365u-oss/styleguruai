import os

filepath = r'c:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\src\components\StyleNavigator.jsx'

with open(filepath, 'rb') as f:
    content = f.read()

# Jewelry fix
old_jewelry = b'className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"}'
# Wait, let's look at the grep/view_file again.
# 637: <p className="text-[10px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{tips.jewelry}</p>
# It seems there is no closing quote.

old_jewelry = b'className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"}'
# Actually, let's just replace the whole broken p tag string
# using a more flexible approach.

content = content.replace(b'className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"', 
                         b'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')

# And for Shoes
content = content.replace(b'className="text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`"', 
                         b'className={`text-[10px] font-bold truncate ${isDark ? \'text-white\' : \'text-slate-900\'}`}')

with open(filepath, 'wb') as f:
    f.write(content)

print("Fixed syntax errors in StyleNavigator.jsx (Binary mode)")
