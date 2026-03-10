import os
import re

root = r'd:\code\Creator_2.5\MVP-Web-2.5-Creator-Platform\frontend\src'

def resolve_conflicts_keep_theirs(content):
    """
    Removes git conflict markers and keeps the 'theirs' (hasif_branch) version.
    """
    result = []
    in_ours = False
    in_theirs = False
    changed = False

    lines = content.split('\n')
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            in_ours = True
            in_theirs = False
            changed = True
            continue
        elif line.startswith('======='):
            in_ours = False
            in_theirs = True
            continue
        elif line.startswith('>>>>>>> hasif_branch'):
            in_ours = False
            in_theirs = False
            continue

        if in_ours:
            # Skip ours (HEAD) version
            continue
        else:
            result.append(line)

    return '\n'.join(result), changed

conflict_files = []
for dirpath, dirnames, filenames in os.walk(root):
    for filename in filenames:
        if filename.endswith(('.ts', '.tsx', '.css')):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if '<<<<<<< HEAD' in content:
                conflict_files.append(filepath)
                resolved, changed = resolve_conflicts_keep_theirs(content)
                if changed:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(resolved)
                    print(f'FIXED: {filepath}')

print(f'\nTotal files fixed: {len(conflict_files)}')
