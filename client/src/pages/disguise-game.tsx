import { useEffect } from "react";
import { useLocation } from "wouter";
import { useDisguise } from "@/lib/disguise-context";
import { Game2048 } from "@/components/game-2048";

export default function DisguiseGamePage() {
  const [, navigate] = useLocation();
  const { settings, showCamera } = useDisguise();

  useEffect(() => {
    if (!settings.enabled) {
      navigate("/");
    }
  }, [settings.enabled, navigate]);

  const handleSecretGesture = () => {
    showCamera();
    navigate("/");
  };

  return (
    <Game2048
      onSecretGesture={handleSecretGesture}
      gestureType={settings.gestureType}
      secretPattern={settings.secretPattern}
    />
  );
}
