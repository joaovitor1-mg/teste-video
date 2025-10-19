import ffmpeg
import json
import os

# --- Configurações de Corte ---
VIDEO_FILE = "aula.mp4"
INPUT_CORTES_JSON = "cortes.json"
OUTPUT_FOLDER = "cortes_gerados"
# -----------------------------

def cut_videos():
    """
    Lê a lista de cortes do JSON e usa FFmpeg para cortar o vídeo original.
    """
    if not os.path.exists(INPUT_CORTES_JSON):
        print(f"Erro: Arquivo '{INPUT_CORTES_JSON}' não encontrado. Execute 'analisar.py' primeiro.")
        return

    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    with open(INPUT_CORTES_JSON, "r", encoding="utf-8") as f:
        cuts = json.load(f)

    print(f"Iniciando processo de corte. {len(cuts)} clipes serão gerados.")

    for i, cut in enumerate(cuts, start=1):
        start_time = cut['start']
        end_time = cut['end']
        output_filename = os.path.join(OUTPUT_FOLDER, f"corte_{i:03d}.mp4")

        print(f"Processando Corte {i}: {start_time:.2f}s -> {end_time:.2f}s...")

        try:
            # Usa 'c=copy' para cortar sem re-codificar, o que é muito mais rápido
            ffmpeg.input(VIDEO_FILE, ss=start_time, to=end_time).output(
                output_filename, c='copy', avoid_negative_ts='make_zero'
            ).run(overwrite_output=True, quiet=True)
            print(f"Corte {i} salvo com sucesso em '{output_filename}'!")

        except ffmpeg.Error as e:
            print(f"Ocorreu um erro no FFmpeg ao processar o corte {i}:")
            if e.stderr:
                 print(e.stderr.decode('utf8'))

    print(f"\nProcesso finalizado! Vídeos salvos na pasta '{OUTPUT_FOLDER}'.")

if __name__ == "__main__":
    cut_videos()