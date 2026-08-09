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
    'poblacion bustos': 4, 'alejo santos bustos': 4, 'alejo bridge bustos': 4,
    'tibag baliwag': 5, 'alejo santos baliwag': 5,
    'parulan': 6,
    'sto cristo': 7, 'santo cristo': 7,
    'banga 1st': 8, 'banga first': 8,
    'tibag pulilan': 9, 'nlex bridge': 9,
    'caniogan': 10, 'bagbag bridge': 10, 'caniogan river': 10,
    'calizon': 11, 'calumpit bridge': 11,
    'san vicente san miguel': 12, 'oriente bridge': 12,
    'san juan bridge': 13,
    'salacot bridge': 14, 'ilog bulo': 14,
    'madlum river': 15, 'sibul': 15,
    'maasim': 16,
    'sta maria bridge': 17, 'santa maria bridge': 17, 'poblacion bridge sta maria': 17,
    'cadiz bridge': 18, 'fabian cadiz': 18,
    'karyapay bridge': 19, 'dulong bayan': 19,
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def norm(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def station_id(name):
    n = norm(name)
    for alias, sid in ALIASES.items():
        if alias in n:
            return sid
    return None


def parse_float(text):
    m = re.search(r'-?\d+(?:\.\d+)?', str(text or '').replace(',', ''))
    return float(m.group()) if m else None


def official_status(row, level):
    """Classify only from PDRRMO-published threshold columns."""
    alert = parse_float(row.get('alert'))
    alarm = parse_float(row.get('alarm'))
    critical = parse_float(row.get('critical'))
    if critical is not None and level >= critical:
        return 'CRITICAL'
    if alarm is not None and level >= alarm:
        return 'ALARM'
    if alert is not None and level >= alert:
        return 'WATCH'  # UI label corresponding to PDRRMO Alert threshold
    if any(v is not None for v in (alert, alarm, critical)):
        return 'NORMAL'
    return 'NO_DATA'


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.heading = None
        self.capture = False
        self.hbuf = []
        self.in_table = False
        self.table_heading = None
        self.rows = []
        self.row = []
        self.in_cell = False
        self.cbuf = []
        self.tables = []

    def handle_starttag(self, tag, attrs):
        if re.fullmatch(r'h[1-6]', tag):
            self.capture = True
            self.hbuf = []
        elif tag == 'table':
            self.in_table = True
            self.table_heading = self.heading
            self.rows = []
        elif self.in_table and tag == 'tr':
            self.row = []
        elif self.in_table and tag in ('td', 'th'):
            self.in_cell = True
            self.cbuf = []

    def handle_endtag(self, tag):
        if re.fullmatch(r'h[1-6]', tag) and self.capture:
            self.heading = ' '.join(''.join(self.hbuf).split())
            self.capture = False
        elif self.in_table and tag in ('td', 'th') and self.in_cell:
            self.row.append(' '.join(''.join(self.cbuf).split()))
            self.in_cell = False
        elif self.in_table and tag == 'tr':
            if self.row:
                self.rows.append(self.row)
        elif tag == 'table' and self.in_table:
            self.tables.append((self.table_heading, self.rows))
            self.in_table = False

    def handle_data(self, data):
        if self.capture:
            self.hbuf.append(data)
        if self.in_cell:
            self.cbuf.append(data)


def rows_to_dicts(rows):
    if not rows:
        return []
    headers = [norm(x).replace(' ', '_') for x in rows[0]]
    out = []
    for cells in rows[1:]:
        if len(cells) == 1 and 'no record' in norm(cells[0]):
            continue
        if len(cells) == len(headers):
            out.append(dict(zip(headers, cells)))
    return out


def fetch_pdrrmo():
    req = Request(PDRRMO_URL, headers={'User-Agent': 'BYDRRM-RiverWatch/1.1 public-safety-monitor'})
    with urlopen(req, timeout=20) as r:
        html = r.read().decode(r.headers.get_content_charset() or 'utf-8', errors='replace')

    p = Parser()
    p.feed(html)
    river, dams = [], []
    for heading, rows in p.tables:
        h = norm(heading)
        if 'river status stations' in h:
            river = rows_to_dicts(rows)
        elif 'status of dams' in h:
            dams = rows_to_dicts(rows)

    readings = []
    unmatched = []
    fetched = now_iso()
    for row in river:
        name = row.get('station') or row.get('location')
        level = parse_float(row.get('actual_level') or row.get('water_level') or row.get('level'))
        if not name or level is None:
            continue
        sid = station_id(name)
        if not sid:
            unmatched.append({'stationName': name, 'row': row})
            continue
        status = official_status(row, level)
        readings.append({
            'stationId': sid,
            'stationName': name,
            'level': level,
            'status': status,
            'time': row.get('date') or fetched,
            'observationPrecision': 'date' if row.get('date') else 'sync-time',
            'source': 'Bulacan PDRRMO',
            'officialThresholds': {
                'alert': parse_float(row.get('alert')),
                'alarm': parse_float(row.get('alarm')),
                'critical': parse_float(row.get('critical')),
            },
            'note': 'Status is derived only from PDRRMO-published Alert/Alarm/Critical thresholds.'
        })

    return {
        'name': 'Bulacan PDRRMO',
        'ok': True,
        'river_records': len(river),
        'normalized_readings': len(readings),
        'unmatched_records': unmatched,
        'dams': dams,
        'fetched_at': fetched,
        'message': 'River readings, when present, use PDRRMO-published thresholds only.'
    }, readings


def main():
    sources, readings = [], []
    try:
        src, readings = fetch_pdrrmo()
        sources.append(src)
    except Exception as e:
        sources.append({'name': 'Bulacan PDRRMO', 'ok': False, 'error': str(e)})

    sources.append({
        'name': 'DOST-ASTI PhilSensors',
        'ok': True,
        'configured': False,
        'readings': 0,
        'message': 'Official API/data-sharing connector pending.'
    })

    OUT.write_text(json.dumps({
        'generatedAt': now_iso(),
        'readings': readings,
        'sources': sources
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'success': True, 'readings': len(readings), 'sources': sources}, ensure_ascii=False))


if __name__ == '__main__':
    main()
