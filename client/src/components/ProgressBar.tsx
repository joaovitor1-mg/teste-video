import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0-100
  status: "pending" | "processing" | "completed" | "error";
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  status,
  label,
  showPercentage = true,
}: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "processing":
        return "bg-blue-500";
      default:
        return "bg-slate-300";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "error":
        return "Erro";
      case "processing":
        return "Processando...";
      default:
        return "Pendente";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <span className="text-xs text-slate-600">{getStatusText()}</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            getStatusColor()
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-right text-xs text-slate-600">
          {Math.min(progress, 100)}%
        </div>
      )}
    </div>
  );
}

