import re,sys,html,glob,os
import xml.etree.ElementTree as ET
NS='{http://www.w3.org/2000/svg}'
def dec(s):
    s=html.unescape(s)
    try: return s.encode('latin-1').decode('utf-8')
    except: return s
for f in sorted(glob.glob(os.path.join(sys.argv[1],'s*.svg'))):
    t=ET.parse(f); root=t.getroot()
    top=[g for g in root if g.tag==NS+'g'][0]
    print('##',os.path.basename(f), dec(top.get('id',''))[:40])
    def walk(el,d):
        for c in el:
            i=c.get('id')
            if i and '__k' in i:
                nm=dec(i); m=re.search(r'__k(\d+_\d+)$',nm)
                print('  '*d+m.group(1)+' '+c.tag.replace(NS,'')+' '+nm[:m.start()][:38].replace('\n',' '))
                if d<1: walk(c,d+1)
            elif c.tag in (NS+'g',):
                walk(c,d)
    walk(top,0)
