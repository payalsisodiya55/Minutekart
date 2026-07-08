import InstamartSplashImage from "@/assets/de267d90-912f-46de-92e0-61e09f1b7cd3.png";
import { createPortal } from "react-dom";

export default function QuickLaunchSplash({ className = "" }) {
  const classes = ["fixed inset-0 z-[999999] overflow-hidden bg-[#0c831f]", className]
    .filter(Boolean)
    .join(" ");

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={classes}>
      <img
        src={InstamartSplashImage}
        alt="Minutekart quick splash"
        className="h-full w-full object-cover object-top"
      />
    </div>,
    document.body
  );
}
