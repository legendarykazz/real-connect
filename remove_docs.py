import sys
import os

path = r"c:\Users\USER\Desktop\real connect\src\pages\PropertyDetails.jsx"
with open(path, 'r', encoding='utf-8', newline='') as f:
    lines = f.readlines()

# Removing lines 465 to 493 (1-indexed)
# 465 maps to index 464
start = 464
end = 493
new_lines = lines[:start] + [l for i, l in enumerate(lines) if not (start <= i < end)]

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)
