from utils import parse_srt
import json

# --- Configurações de Análise ---
INPUT_SRT = "aula.srt"
OUTPUT_CORTES_TXT = "cortes.txt"
OUTPUT_CORTES_JSON = "cortes.json" # Formato mais robusto para o próximo passo

# Define uma pausa longa entre falas (em segundos). Ajuste conforme necessário.
PAUSA_LONGA = 2.0

# Duração mínima e máxima para um corte ser considerado válido (em segundos).
DURACAO_MINIMA_CORTE = 20.0
DURACAO_MAXIMA_CORTE = 300.0 # 5 minutos
# --------------------------------

def analyze_transcription():
    """
    Analisa um arquivo SRT para encontrar segmentos de fala contínua,
    separados por pausas, e os salva como possíveis cortes.
    """
    print(f"Analisando '{INPUT_SRT}' para encontrar possíveis cortes...")
    segments = parse_srt(INPUT_SRT)

    if not segments:
        return

    potential_cuts = []
    current_cut_segments = [segments[0]]

    for i in range(len(segments) - 1):
        current_segment = segments[i]
        next_segment = segments[i+1]
        pause = next_segment['start'] - current_segment['end']

        if pause >= PAUSA_LONGA:
            potential_cuts.append(current_cut_segments)
            current_cut_segments = [next_segment]
        else:
            current_cut_segments.append(next_segment)
    
    potential_cuts.append(current_cut_segments)

    final_cuts = []
    print(f"Encontrados {len(potential_cuts)} grupos de fala. Filtrando por duração...")

    for cut_group in potential_cuts:
        start_time = cut_group[0]['start']
        end_time = cut_group[-1]['end']
        duration = end_time - start_time

        if DURACAO_MINIMA_CORTE <= duration <= DURACAO_MAXIMA_CORTE:
            full_text = " ".join([seg['text'] for seg in cut_group])
            final_cuts.append({
                "start": start_time,
                "end": end_time,
                "text_preview": full_text[:150] + ("..." if len(full_text) > 150 else "")
            })

    print(f"Foram selecionados {len(final_cuts)} cortes que atendem aos critérios.")

    # Salva os cortes em .txt (como no seu exemplo)
    with open(OUTPUT_CORTES_TXT, "w", encoding="utf-8") as f:
        for i, cut in enumerate(final_cuts, start=1):
            f.write(f"Corte {i}: {cut['start']:.3f} - {cut['end']:.3f}\n")
            f.write(f"{cut['text_preview']}\n\n")

    # Salva também em JSON, que é mais fácil para o script de corte ler
    with open(OUTPUT_CORTES_JSON, "w", encoding="utf-8") as f:
        json.dump(final_cuts, f, indent=4, ensure_ascii=False)

    print(f"Análise concluída. Cortes salvos em '{OUTPUT_CORTES_TXT}' e '{OUTPUT_CORTES_JSON}'.")

if __name__ == "__main__":
    analyze_transcription()