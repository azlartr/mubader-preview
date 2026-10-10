"""Pull recent image posts from the association's X account into x.json (runs in GitHub Actions).

Uses X's public embed timeline (the same source the official embed widget reads), so no paid API.
If X changes or blocks it, the script exits without touching x.json and the board keeps its last posts.
"""
import json, os, re, sys, urllib.request

HANDLE = os.environ.get('X_HANDLE', 'Diorg01')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT, IMG = os.path.join(ROOT, 'x.json'), os.path.join(ROOT, 'assets', 'x')

def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': UA, 'Accept-Language': 'ar,en'}), timeout=30).read()

try:
    html = get(f'https://syndication.twitter.com/srv/timeline-profile/screen-name/{HANDLE}').decode('utf-8', 'replace')
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    entries = json.loads(m.group(1))['props']['pageProps']['timeline']['entries']
except Exception as e:
    print('could not read the timeline:', repr(e)); sys.exit(0)

old = {}
if os.path.exists(OUT):
    old = {p['id']: p for p in json.load(open(OUT, encoding='utf-8')).get('posts', [])}
os.makedirs(IMG, exist_ok=True)
posts = []
for en in entries:
    tw = (en.get('content') or {}).get('tweet') or {}
    if not tw.get('id_str') or tw.get('retweeted_status'):
        continue
    media = (tw.get('extended_entities') or tw.get('entities') or {}).get('media') or []
    photo = next((x['media_url_https'] for x in media if x.get('type') == 'photo'), None)
    if not photo:
        continue
    pid = tw['id_str']
    text = re.sub(r'https://t\.co/\S+', '', tw.get('full_text') or tw.get('text') or '').strip()
    rel = f'assets/x/{pid}.jpg'
    if not os.path.exists(os.path.join(ROOT, rel)):
        try:
            open(os.path.join(ROOT, rel), 'wb').write(get(photo + '?name=medium'))
        except Exception as e:
            print('image failed', pid, repr(e)); continue
    posts.append({'id': pid, 'text': text[:280], 'image': rel, 'url': f'https://x.com/{HANDLE}/status/{pid}', 'date': tw.get('created_at', '')})

if not posts:
    print('no image posts found; leaving x.json as is'); sys.exit(0)
for pid, p in old.items():  # keep older posts that scrolled out of the embed window
    if pid not in {q['id'] for q in posts}:
        posts.append(p)
posts.sort(key=lambda p: int(p['id']), reverse=True)
json.dump({'handle': HANDLE, 'posts': posts[:24]}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('posts:', len(posts))
