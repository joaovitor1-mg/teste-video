import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useRef, useState } from "react";
import { Upload, Play, BarChart3, Scissors, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: videos, isLoading: videosLoading } = trpc.video.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const uploadVideoMutation = trpc.video.upload.useMutation({
    onSuccess: (video) => {
      setUploading(false);
      window.location.href = `/video/${video.id}`;
    },
    onError: (error) => {
      setUploading(false);
      alert(`Erro ao fazer upload: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get video duration
      const video = document.createElement("video");
      video.onloadedmetadata = async () => {
        const duration = Math.round(video.duration);
        
        await uploadVideoMutation.mutateAsync({
          filename: file.name,
          fileSize: file.size,
          duration,
        });
      };
      video.src = URL.createObjectURL(file);
    } catch (error) {
      setUploading(false);
      console.error("Error uploading video:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4">
        <div className="text-center max-w-2xl">
          {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-16 h-16 mx-auto mb-6" />}
          <h1 className="text-5xl font-bold mb-4">{APP_TITLE}</h1>
          <p className="text-xl text-slate-300 mb-8">
            Transcreva, analise e corte seus vídeos automaticamente com inteligência artificial
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" />}
            <h1 className="text-2xl font-bold text-slate-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Upload Section */}
        <div className="mb-12">
          <Card className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Enviar Vídeo</h2>
                <p className="text-slate-600 mb-6">
                  Selecione um arquivo de vídeo para começar a transcrever e analisar
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Vídeo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Videos List */}
        {videosLoading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Meus Vídeos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/video/${video.id}`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{video.filename}</CardTitle>
                    <CardDescription>
                      {video.createdAt ? new Date(video.createdAt).toLocaleDateString("pt-BR") : "Data desconhecida"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Play className="w-4 h-4" />
                        <span>{video.duration ? `${video.duration}s` : "Duração desconhecida"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
                          {video.status}
                        </span>
                      </div>
                      <div className="pt-4 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/video/${video.id}`;
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analisar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">Nenhum vídeo enviado ainda. Comece enviando um vídeo acima!</p>
          </div>
        )}
      </main>
    </div>
  );
}

