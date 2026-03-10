import os
import re

root = r'd:\code\Creator_2.5\MVP-Web-2.5-Creator-Platform\frontend\src'

def resolve_all_conflicts(content):
    """
    Removes ALL git conflict markers (any branch name/hash) and keeps the 'theirs' version.
    Handles: <<<<<<< HEAD ... ======= ... >>>>>>> <anything>
    """
    changed = False
    
    # Pattern matches any conflict block regardless of branch name or hash
    conflict_pattern = re.compile(
        r'<<<<<<< [^\n]+\n(.*?)\n=======\n(.*?)\n>>>>>>> [^\n]+',
        re.DOTALL
    )
    
    def replace_with_theirs(m):
        nonlocal changed
        changed = True
        return m.group(2)  # keep 'theirs' (after =======)
    
    result = conflict_pattern.sub(replace_with_theirs, content)
    return result, changed

def fix_duplicate_functions(content, func_name):
    """Remove duplicate function definitions, keeping the last one."""
    # Find all occurrences of 'const funcName ='
    pattern = re.compile(rf'(    const {func_name} = async.*?)(?=    const {func_name} = async)', re.DOTALL)
    if pattern.search(content):
        result = pattern.sub('', content)
        print(f'  -> Removed duplicate {func_name}')
        return result
    return content

total_fixed = 0
for dirpath, dirnames, filenames in os.walk(root):
    for filename in filenames:
        if filename.endswith(('.ts', '.tsx', '.css')):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            original = content
            
            # Resolve conflict markers
            resolved, changed = resolve_all_conflicts(content)
            
            # Fix duplicate handleDelete in posts/page.tsx
            if 'posts/page.tsx' in filepath.replace('\\', '/') or 'posts\\page.tsx' in filepath:
                resolved = fix_duplicate_functions(resolved, 'handleDelete')
                resolved = fix_duplicate_functions(resolved, 'handleSubmit')
            
            if resolved != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(resolved)
                print(f'FIXED: {filepath}')
                total_fixed += 1

# Final check
print(f'\nTotal files fixed: {total_fixed}')
print('\nVerifying no remaining conflict markers...')
remaining = []
for dirpath, dirnames, filenames in os.walk(root):
    for filename in filenames:
        if filename.endswith(('.ts', '.tsx')):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if re.search(r'<<<<<<< |>>>>>>> ', content):
                remaining.append(filepath)
                
if remaining:
    print('STILL HAS CONFLICTS:')
    for f in remaining:
        print(f'  {f}')
else:
    print('All clear! No conflict markers remain.')
