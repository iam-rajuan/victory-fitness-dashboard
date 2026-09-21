import { useAdminDrawer } from "../../context/AdminDrawerContext";

export default function ClaudeToast() {
  const { toast, dismissToast } = useAdminDrawer();

  if (!toast) return null;

  return (
    <div
      onClick={dismissToast}
      style={{ borderLeftWidth: 4, borderLeftColor: "#C9943A", borderLeftStyle: "solid" }}
      className="fixed bottom-6 right-6 z-[120] max-w-md bg-[#0D2B45] border border-[#F7F3EE]/15 px-5 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-4 cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-200"
      role="alert"
    >
      <span className="text-sm font-semibold text-[#F7F3EE] font-dmsans">{toast}</span>
      <span className="text-lg text-[#F7F3EE]/55 hover:text-[#F7F3EE] transition-colors font-medium">
        ×
      </span>
    </div>
  );
}
