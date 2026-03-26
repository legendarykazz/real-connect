import os

path = r"c:\Users\USER\Desktop\real connect\src\pages\PropertyDetails.jsx"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

# Find the header first
for i, line in enumerate(lines):
    if 'mb-5">Documents</h2>' in line:
        # Search backwards for the start of the block
        for j in range(i, max(0, i - 20), -1):
            if 'property.documents.length > 0 && (' in lines[j]:
                start_idx = j
                # Also include the comment on the line before if it exists
                if j > 0 and '{/* Documents */}' in lines[j-1]:
                    start_idx = j-1
                break
        
        # Search forwards for the end of the block
        # The block ends with )}
        for j in range(i, min(len(lines), i + 30)):
             if ')}' in lines[j]:
                 # Check if this )} is the one we want (at the right indentation)
                 # Original Code:
                 # 493:                                 )}
                 if lines[j].strip() == ')}':
                     end_idx = j
                     break
        break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Removed lines {start_idx+1} to {end_idx+1}")
else:
    print(f"Indices not found: start={start_idx}, end={end_idx}")
