import whisper
from utils import format_time
import os

# --- Configurações ---
VIDEO_FILE = "aula.mp4"
OUTPUT_SRT = "aula.srt"
MODEL_SIZE = "medium"  # Opções: "tiny", "base", "small", "medium", "large"
# --------------------

def transcribe_video():
    """
    Transcreve o áudio de um arquivo de vídeo e salva o resultado em um arquivo SRT.
    """
    if not os.path.exists(VIDEO_FILE):
        print(f"Erro: O arquivo de vídeo '{VIDEO_FILE}' não foi encontrado.")
        print("Adicione o vídeo na pasta e renomeie para 'aula.mp4' ou altere a variável VIDEO_FILE.")
        return

    print("Carregando o modelo do Whisper...")
    # Se você não tiver uma GPU NVIDIA, pode ser mais rápido usar a CPU:
    # model = whisper.load_model(MODEL_SIZE, device="cpu")
    model = whisper.load_model(MODEL_SIZE)

    print(f"Transcrevendo o vídeo '{VIDEO_FILE}'... Isso pode demorar bastante.")
    result = model.transcribe(VIDEO_FILE, verbose=True)

    print(f"Salvando a transcrição em '{OUTPUT_SRT}'...")
    with open(OUTPUT_SRT, "w", encoding="utf-8") as srt_file:
        for i, segment in enumerate(result["segments"], start=1):
            start_time = format_time(segment['start'])
            end_time = format_time(segment['end'])
            text = segment['text'].strip()

            srt_file.write(f"{i}\n")
            srt_file.write(f"{start_time} --> {end_time}\n")
            srt_file.write(f"{text}\n\n")

    print(f"Transcrição salva com sucesso em '{OUTPUT_SRT}'!")

if __name__ == "__main__":
    transcribe_video()