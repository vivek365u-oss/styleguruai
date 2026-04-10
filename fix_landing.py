
filepath = r'C:\Users\VIVEK\OneDrive\Desktop\ToneFit\frontend\src\components\LandingPage.jsx'

with open(filepath, 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
# Show lines around line 532
for i in range(525, min(545, len(lines))):
    print(f"{i+1}: {repr(lines[i])}")
