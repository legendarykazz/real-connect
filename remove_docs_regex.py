import re
import sys

path = r"c:\Users\USER\Desktop\real connect\src\pages\PropertyDetails.jsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Match the Documents section block
# This regex looks for the comment and the following block until the closing )}
pattern = r'\n\s*\{/\* Documents \*/\}\s*\n\s*\{property\.documents\.length > 0 && \(\s*\n[\s\S]+?\n\s*\}\)'
new_content = re.sub(pattern, '', content)

if len(new_content) < len(content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully removed Documents section")
else:
    print("Pattern not found")
    sys.exit(1)
