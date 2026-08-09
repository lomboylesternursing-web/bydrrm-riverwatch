import json, re, unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

PDRRMO_URL = "https://pdrrmo.bulacan.gov.ph/"
OUT = Path("official-data.json")
ALIASES = {
    'matictic': 1,
    'sta lucia': 2, 'santa lucia': 2, 'angat drt': 2,
    'tibagan': 3, 'bustos dam downstream': 3,
    'poblacion bustos': 4, 'alejo santos bustos': 4,
    'tibag baliwag': 5, 'alejo santos baliwag': 5,
    'parulan': 6,
    'sto cristo': 7, 'santo cristo': 7,
    'banga 1st': 8, 'banga first': 8,
    'tibag pulilan': 9, 'nlex bridge': 9,
    'caniogan': 10, 'bagbag bridge': 10,
    'calizon': 11, 'calumpit bridge': 11,
    'san vicente san miguel': 12, 'oriente bridge': 12,
    'san juan bridge': 13,
    'salacot bridge': 14, 'ilog bulo': 14,
    'madlum river': 15, 'sibul': 15,
    'maasim': 16,
    'sta maria bridge': 17, 'santa maria bridge': 17,
    'cadiz bridge': 18,
    'karyapay bridge': 19, 'dulong bayan': 19,
}

def now_iso(): return datetime.now(timezone.utc).isoformat()
def norm(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii','ignore').decode().lower()
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()
def station_id(name):
    n=norm(name)
    for alias,sid in ALIASES.items():
        if alias in n: return sid
    return None
def parse_float(text):
    m=re.search(r'-?\d+(?:\.\d+)?', str(text or '').replace(',',''))
    return float(m.group()) if m else None

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.heading=None; self.capture=False; self.hbuf=[]; self.in_table=False; self.table_heading=None; self.rows=[]; self.row=[]; self.in_cell=False; self.cbuf=[]; self.tables=[]
    def handle_starttag(self, tag, attrs):
        if re.fullmatch(r'h[1-6]',tag): self.capture=True; self.hbuf=[]
        elif tag=='table': self.in_table=True; self.table_heading=self.heading; self.rows=[]
        elif self.in_table and tag=='tr': self.row=[]
        elif self.in_table and tag in ('td','th'): self.in_cell=True; self.cbuf=[]
    def handle_endtag(self, tag):
        if re.fullmatch(r'h[1-6]',tag) and self.capture:
            self.heading=' '.join(''.join(self.hbuf).split()); self.capture=False
        elif self.in_table and tag in ('td','th') and self.in_cell:
            self.row.append(' '.join(''.join(self.cbuf).split())); self.in_cell=False
        elif self.in_table and tag=='tr':
            if self.row: self.rows.append(self.row)
        elif tag=='table' and self.in_table:
            self.tables.append((self.table_heading,self.rows)); self.in_table=False
    def handle_data(self,data):
        if self.capture: self.hbuf.append(data)
        if self.in_cell: self.cbuf.append(data)

def rows_to_dicts(rows):
    if not rows: return []
    headers=[norm(x).replace(' ','_') for x in rows[0]]
    out=[]
    for cells in rows[1:]:
        if len(cells)==1 and 'no record' in norm(cells[0]): continue
        if len(cells)==len(headers): out.append(dict(zip(headers,cells)))
    return out

def fetch_pdrrmo():
    req=Request(PDRRMO_URL,headers={'User-Agent':'BYDRRM-RiverWatch/1.0 public-safety-monitor'})
    with urlopen(req,timeout=20) as r: html=r.read().decode(r.headers.get_content_charset() or 'utf-8',errors='replace')
    p=Parser(); p.feed(html)
    river=[]; dams=[]
    for heading,rows in p.tables:
        h=norm(heading)
        if 'river status stations' in h: river=rows_to_dicts(rows)
        elif 'status of dams' in h: dams=rows_to_dicts(rows)
    readings=[]
    fetched=now_iso()
    for row in river:
        name=row.get('station') or row.get('location')
        level=parse_float(row.get('actual_level') or row.get('water_level') or row.get('level'))
        sid=station_id(name)
        if sid and level is not None:
            readings.append({'stationId':sid,'stationName':name,'level':level,'status':'NORMAL','time':row.get('date') or fetched,'source':'Bulacan PDRRMO','note':'Imported from the public PDRRMO River Status Stations table. Warning status is not inferred.'})
    return {'name':'Bulacan PDRRMO','ok':True,'river_records':len(river),'normalized_readings':len(readings),'dams':dams,'fetched_at':fetched},readings

def main():
    sources=[]; readings=[]
    try:
        src, readings = fetch_pdrrmo(); sources.append(src)
    except Exception as e:
        sources.append({'name':'Bulacan PDRRMO','ok':False,'error':str(e)})
    sources.append({'name':'DOST-ASTI PhilSensors','ok':True,'configured':False,'readings':0,'message':'Official API/data-sharing connector pending.'})
    OUT.write_text(json.dumps({'generatedAt':now_iso(),'readings':readings,'sources':sources},ensure_ascii=False,indent=2)+"\n",encoding='utf-8')
    print(json.dumps({'success':True,'readings':len(readings),'sources':sources},ensure_ascii=False))

if __name__=='__main__': main()
