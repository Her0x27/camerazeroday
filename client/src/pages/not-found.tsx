import { Link } from "wouter";
import { Camera, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-6">
        <Camera className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-semibold mb-2">{t.notFound.title}</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        {t.notFound.description}
      </p>
      
      <Link href="/">
        <Button data-testid="button-go-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.common.backToCamera}
        </Button>
      </Link>
    </div>
  );
}
