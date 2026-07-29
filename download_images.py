import re
import ssl
import urllib.parse
import urllib.request
from pathlib import Path

urls = [
    'https://colinasengenharia.com.br/',
    'https://colinasengenharia.com.br/empreendimento/jardins-dos-alecrins/',
    'https://colinasengenharia.com.br/empreendimento/vista-campina/',
    'https://colinasengenharia.com.br/empreendimento/vista-borborema/',
    'https://colinasengenharia.com.br/institucional/'
]

out_dir = Path('assets/colinas-site')
out_dir.mkdir(parents=True, exist_ok=True)

seen = set()
count = 0
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for url in urls:
    print(f'Fetching {url}')
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    candidates = set(re.findall(r'https://[^\s"\'>)]+\.(?:jpg|jpeg|png|webp|svg)', html, re.I))
    for cand in candidates:
        if cand in seen:
            continue
        seen.add(cand)
        try:
            parsed = urllib.parse.urlparse(cand)
            ext = Path(parsed.path).suffix.lower() or '.jpg'
            filename = f'img_{count:02d}{ext}'
            out_path = out_dir / filename
            req2 = urllib.request.Request(cand, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req2, context=ctx) as resp2:
                data = resp2.read()
            out_path.write_bytes(data)
            print(f'  downloaded {cand} -> {out_path}')
            count += 1
        except Exception as exc:
            print(f'  error {cand}: {exc}')

print(f'Total downloaded: {count}')
