import os

dirs_to_scan = ['app', 'components', 'controllers', 'services', 'models', 'repositories', 'lib', 'utils', 'validators']
files_to_scan = ['package.json', 'README.md', 'tsconfig.json', 'next.config.ts', 'middleware.ts']

with open('code_dump.txt', 'w', encoding='utf-8') as outfile:
    for f in files_to_scan:
        if os.path.exists(f):
            outfile.write(f"\n{'='*80}\n")
            outfile.write(f"FILE: {f}\n")
            outfile.write(f"{'='*80}\n")
            with open(f, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
                
    for d in dirs_to_scan:
        if os.path.exists(d):
            for root, dirs, files in os.walk(d):
                for file in files:
                    filepath = os.path.join(root, file)
                    outfile.write(f"\n{'='*80}\n")
                    outfile.write(f"FILE: {filepath}\n")
                    outfile.write(f"{'='*80}\n")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"Error reading {filepath}: {e}\n")
