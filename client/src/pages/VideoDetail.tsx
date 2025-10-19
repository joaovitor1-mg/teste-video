import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mic, BarChart3, Scissors, CheckCircle, AlertCircle } from "lucide-react";

interface VideoDetailProps {
  params: { videoId: string };
}

export default function VideoDetail({ params }: VideoDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const videoId = params.videoId;
  const [activeTab, setActiveTab] = useState<"transcription" | "analysis" | "cuts">("transcription");

  const { data: video, isLoading: videoLoading } = trpc.video.get.useQuery(
    { videoId },
    { enabled: isAuthenticated }
  );

  const { data: analysis, isLoading: analysisLoading } = trpc.video.getAnalysis.useQuery(
    { videoId },
    { enabled: isAuthenticated }
  );

  const transcribeMutation = trpc.video.transcribe.useMutation({
    onSuccess: () => {
      // Refetch video data
      trpc.useUtils().video.get.invalidate({ videoId });
    },
  });

  const analyzeMutation = trpc.video.analyze.useMutation({
    onSuccess: () => {
      trpc.useUtils().video.getAnalysis.invalidate({ videoId });
    },
  });

  const generateCutsMutation = trpc.video.generateCuts.useMutation({
    onSuccess: () => {
      trpc.useUtils().video.getAnalysis.invalidate({ videoId });
    },
  });

  if (videoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vídeo não encontrado</h1>
          <Button onClick={() => window.location.href = "/"} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/"}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 line-clamp-2">{video.filename}</h1>
          <p className="text-slate-600 mt-2">
            Duração: {video.duration ? `${video.duration}s` : "Desconhecida"} | Status: {video.status}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Steps */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Transcribe */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      video.status === "transcribing" || video.status === "analyzing" || video.status === "ready"
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {video.status === "transcribing" || video.status === "analyzing" || video.status === "ready" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        "1"
                      )}
                    </div>
                    <span className="font-semibold">Transcrever Vídeo</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => transcribeMutation.mutate({ videoId })}
                    disabled={transcribeMutation.isPending || video.status !== "pending"}
                  >
                    {transcribeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transcrevendo...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Transcrever
                      </>
                    )}
                  </Button>
                </div>

                {/* Step 2: Analyze */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      video.status === "analyzing" || video.status === "ready"
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {video.status === "analyzing" || video.status === "ready" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        "2"
                      )}
                    </div>
                    <span className="font-semibold">Analisar</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => analyzeMutation.mutate({ videoId })}
                    disabled={analyzeMutation.isPending || video.status !== "transcribing"}
                    variant={video.status === "transcribing" ? "default" : "outline"}
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analisar
                      </>
                    )}
                  </Button>
                </div>

                {/* Step 3: Generate Cuts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      video.status === "ready"
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {video.status === "ready" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        "3"
                      )}
                    </div>
                    <span className="font-semibold">Gerar Cortes</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => generateCutsMutation.mutate({ videoId })}
                    disabled={generateCutsMutation.isPending || video.status !== "analyzing"}
                    variant={video.status === "analyzing" ? "default" : "outline"}
                  >
                    {generateCutsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4 mr-2" />
                        Gerar Cortes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("transcription")}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === "transcription"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Transcrição
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === "analysis"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Análise
              </button>
              <button
                onClick={() => setActiveTab("cuts")}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === "cuts"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Cortes
              </button>
            </div>

            {/* Tab Content */}
            <Card>
              <CardContent className="pt-6">
                {activeTab === "transcription" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Transcrição</h3>
                    {video.status === "pending" ? (
                      <p className="text-slate-600">
                        Clique em "Transcrever" para iniciar a transcrição do vídeo.
                      </p>
                    ) : video.status === "transcribing" ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transcrevendo o vídeo...
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <p className="text-slate-600">Transcrição processada com sucesso.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "analysis" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Análise de Cortes</h3>
                    {video.status === "pending" || video.status === "transcribing" ? (
                      <p className="text-slate-600">
                        Conclua a transcrição para iniciar a análise.
                      </p>
                    ) : analysisLoading ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando análise...
                      </div>
                    ) : analysis ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">
                            <strong>{analysis.totalCuts}</strong> cortes identificados
                          </p>
                        </div>
                        {analysis.cuts && analysis.cuts.length > 0 && (
                          <div className="space-y-2">
                            {analysis.cuts.map((cut, index) => (
                              <div key={cut.id} className="border border-slate-200 p-3 rounded-lg">
                                <p className="font-semibold text-sm">Corte {index + 1}</p>
                                <p className="text-xs text-slate-600">
                                  {cut.startTime}s - {cut.endTime}s
                                </p>
                                {cut.textPreview && (
                                  <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                                    {cut.textPreview}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-600">Nenhuma análise disponível ainda.</p>
                    )}
                  </div>
                )}

                {activeTab === "cuts" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vídeos Cortados</h3>
                    {video.status !== "ready" ? (
                      <p className="text-slate-600">
                        Conclua a análise para gerar os vídeos cortados.
                      </p>
                    ) : analysis && analysis.cuts && analysis.cuts.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.cuts.map((cut, index) => (
                          <div key={cut.id} className="border border-slate-200 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm">Corte {index + 1}</p>
                                <p className="text-xs text-slate-600">
                                  {cut.startTime}s - {cut.endTime}s
                                </p>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                cut.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {cut.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600">Nenhum corte disponível.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

