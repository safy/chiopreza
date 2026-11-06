"""Собирает index.html из SVG-выгрузок слайдов Figma.

Слои с суффиксом __k<id> получают id="k<id>" и data-name с исходным именем слоя,
по ним deck.js находит элементы для анимаций. Картинки выносятся в assets/img.
"""
import re, os, glob, html, hashlib, base64, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_DIR = os.path.join(ROOT, 'svg')
IMG_DIR = os.path.join(ROOT, 'assets', 'img')
os.makedirs(IMG_DIR, exist_ok=True)


def dec(s):
    s = html.unescape(s)
    b = bytearray()
    for ch in s:
        o = ord(ch)
        if o < 256:
            b.append(o)
        else:
            try:
                b += ch.encode('cp1252')
            except Exception:
                b += ch.encode('utf-8')
    try:
        return b.decode('utf-8')
    except Exception:
        return s


def process(n, raw):
    # 1. картинки → файлы
    def img(m):
        mime, b64 = m.group(1), m.group(2)
        data = base64.b64decode(b64)
        ext = 'jpg' if 'jpeg' in mime else 'png'
        name = hashlib.md5(data).hexdigest()[:12] + '.' + ext
        p = os.path.join(IMG_DIR, name)
        if not os.path.exists(p):
            open(p, 'wb').write(data)
        return 'xlink:href="assets/img/' + name + '"'
    raw = re.sub(r'xlink:href="data:(image/[a-z]+);base64,([^"]+)"', img, raw)

    # 2. id: слои Figma → k<id>, служебные → уникальные с префиксом слайда
    names = {}
    def rid(m):
        old = m.group(1)
        nm = dec(old)
        k = re.search(r'__k(\d+_\d+)$', nm)
        if k:
            new = 'k' + k.group(1)
            names[new] = nm[:k.start()]
            return 'id="%s" data-name="%s"' % (new, html.escape(nm[:k.start()], quote=True))
        return 'id="s%d_%s"' % (n, re.sub(r'[^A-Za-z0-9_-]', '_', old)[:40])
    ids = re.findall(r'id="([^"]*)"', raw)
    raw = re.sub(r'id="([^"]*)"', rid, raw)
    for old in set(ids):
        if '__k' in dec(old):
            continue
        new = 's%d_%s' % (n, re.sub(r'[^A-Za-z0-9_-]', '_', old)[:40])
        raw = raw.replace('url(#%s)' % old, 'url(#%s)' % new)
        raw = raw.replace('href="#%s"' % old, 'href="#%s"' % new)

    raw = re.sub(r'^<\?xml[^>]*>\s*', '', raw)
    raw = raw.replace('<svg ', '<svg class="art" preserveAspectRatio="xMidYMid meet" ', 1)
    # корневая группа слайда
    raw = re.sub(r'<g id="s%d_[^"]*" clip-path' % n, '<g class="root" clip-path', raw, count=1)
    return raw, names


def main():
    files = sorted(glob.glob(os.path.join(SVG_DIR, 's*.svg')))
    sections, allnames = [], {}
    for f in files:
        n = int(re.search(r's(\d+)\.svg', f).group(1))
        raw = open(f, encoding='utf-8').read()
        svg, names = process(n, raw)
        allnames[n] = names
        sections.append('<section class="slide" data-n="%d">%s</section>' % (n, svg))
    tpl = open(os.path.join(ROOT, 'tools', 'template.html'), encoding='utf-8').read()
    out = tpl.replace('<!--SLIDES-->', '\n'.join(sections))
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(out)
    json.dump(allnames, open(os.path.join(ROOT, 'tools', 'names.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('slides:', len(sections), 'size MB:', round(len(out.encode()) / 1e6, 2))


if __name__ == '__main__':
    main()
