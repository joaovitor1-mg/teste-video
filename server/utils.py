import re

def format_time(seconds: float) -> str:
    """Converte segundos para o formato SRT (hh:mm:ss,ms)."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def srt_time_to_seconds(time_str: str) -> float:
    """Converte o formato de tempo SRT (hh:mm:ss,ms) para segundos."""
    h, m, s_ms = time_str.split(':')
    s, ms = s_ms.split(',')
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000

def parse_srt(filepath: str) -> list:
    """
    Lê um arquivo .srt e retorna uma lista de segmentos.
    Formato da lista: [{'start': float, 'end': float, 'text': str}]
    """
    segments = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
    except FileNotFoundError:
        print(f"Erro: Arquivo '{filepath}' não encontrado.")
        return []

    # Regex para encontrar cada bloco de legenda (número, tempo, texto)
    pattern = re.compile(r'\d+\n([\d:,]+) --> ([\d:,]+)\n(.*?)\n\n', re.DOTALL)
    matches = pattern.findall(content)

    for match in matches:
        start_time_str = match[0]
        end_time_str = match[1]
        text = match[2].strip().replace('\n', ' ')

        segments.append({
            'start': srt_time_to_seconds(start_time_str),
            'end': srt_time_to_seconds(end_time_str),
            'text': text
        })

    return segments