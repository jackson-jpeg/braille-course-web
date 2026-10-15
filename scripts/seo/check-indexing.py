"""Check teachbraille.org's indexing signals: apex 200, www 308 to apex, canonical == final URL,
and every sitemap URL 200 with no redirect. Exit 1 on any failure. Run: python3 scripts/seo/check-indexing.py"""
import re, sys, http.client, urllib.parse

APEX = 'teachbraille.org'
fails = []

def fetch(url):
    u = urllib.parse.urlsplit(url)
    C = http.client.HTTPSConnection if u.scheme == 'https' else http.client.HTTPConnection
    c = C(u.netloc, timeout=20)
    c.request('GET', (u.path or '/') + (('?' + u.query) if u.query else ''), headers={'User-Agent': 'Mozilla/5.0 (indexing-check)'})
    r = c.getresponse()
    body = r.read().decode('utf-8', 'replace')
    return r.status, r.getheader('location'), body

def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

st, loc, sm = fetch(f'https://{APEX}/sitemap.xml')
check(st == 200, f'sitemap.xml {st}')
urls = re.findall(r'<loc>([^<]+)</loc>', sm)
check(len(urls) > 0, f'sitemap lists {len(urls)} URLs')

st, loc, rb = fetch(f'https://{APEX}/robots.txt')
check(st == 200 and f'Sitemap: https://{APEX}/sitemap.xml' in rb, f'robots.txt {st}, points at apex sitemap')

for url in urls:
    st, loc, body = fetch(url)
    m = re.search(r'<link rel="canonical" href="([^"]+)"', body)
    canon = m.group(1) if m else None
    norm = lambda s: s.rstrip('/') if s else s
    check(st == 200 and norm(canon) == norm(url), f'{url} -> {st}{" " + loc if loc else ""}, canonical {canon}')
    path = urllib.parse.urlsplit(url).path or '/'
    st2, loc2, _ = fetch(f'https://www.{APEX}{path}')
    check(st2 == 308 and loc2 == f'https://{APEX}{path}', f'  www{path} -> {st2} {loc2}')

print(f'\n{len(urls)} sitemap URLs, {len(fails)} failure(s)')
sys.exit(1 if fails else 0)
