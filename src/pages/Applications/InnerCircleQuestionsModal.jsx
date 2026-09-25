import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";

export default function InnerCircleQuestionsModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  isSaving,
}) {
  const { isDark } = useTheme();
  const [draft, setDraft] = useState(initialData);

  useEffect(() => {
    if (initialData) {
      setDraft(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !draft) return null;

  const updateQuestion = (index, patch) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));
  };

  const handleAddQuestion = () => {
    setDraft((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_${Date.now()}`,
          order: prev.questions.length + 1,
          question: "",
          hint: "",
          active: true,
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index) => {
    if (draft.questions.length <= 1) return;
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, idx) => idx !== index)
        .map((q, idx) => ({ ...q, order: idx + 1 })),
    }));
  };

  const handleMoveQuestion = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draft.questions.length) return;
    const items = [...draft.questions];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    setDraft((prev) => ({
      ...prev,
      questions: items.map((q, idx) => ({ ...q, order: idx + 1 })),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(draft);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-3xl rounded-[24px] border flex flex-col max-h-[92vh] overflow-hidden my-auto ${
          isDark
            ? "bg-[#0D2B45] text-[#F7F3EE] border-[#F7F3EE]/14 shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_0_1px_rgba(201,148,58,0.18)]"
            : "bg-white text-[#0D2B45] border-[#0D2B45]/12 shadow-[0_24px_64px_rgba(13,43,69,0.18),0_0_0_1px_rgba(201,148,58,0.22)]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-question-set-title"
      >
        {/* Header */}
        <div className={`px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b flex items-start justify-between gap-4 ${
          isDark ? "bg-[#0D2B45] border-[#F7F3EE]/10" : "bg-white border-[#0D2B45]/10"
        }`}>
          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.18em] text-[#C9943A] uppercase mb-1 font-dmsans">
              INNER CIRCLE · QUESTION SET
            </div>
            <h2
              id="modal-question-set-title"
              className={`text-2xl sm:text-[28px] font-semibold tracking-tight font-clash leading-tight ${
                isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
              }`}
            >
              The questions applicants answer
            </h2>
            <p className={`text-[13px] mt-1.5 font-inter leading-relaxed max-w-xl ${
              isDark ? "text-[#F7F3EE]/65" : "text-[#0D2B45]/70"
            }`}>
              These appear in onboarding and profile. Each submission stores the exact question text used at the time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
              isDark
                ? "bg-white/5 hover:bg-white/10 text-[#F7F3EE]/60 hover:text-[#F7F3EE]"
                : "bg-black/5 hover:bg-black/10 text-[#0D2B45]/60 hover:text-[#0D2B45]"
            }`}
            aria-label="Close modal"
          >
            <span className="text-xl leading-none font-light">×</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Section: Applicant Onboarding Copy */}
          <div className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 ${
            isDark ? "border-[#F7F3EE]/10 bg-black/25" : "border-[#0D2B45]/10 bg-[#FAF7F2]"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#C9943A] uppercase font-dmsans">
                ONBOARDING PROMPT & GUIDANCE
              </span>
              <span className={`text-[11px] font-mono ${isDark ? "text-[#F7F3EE]/40" : "text-[#0D2B45]/50"}`}>
                Shown to candidates
              </span>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold tracking-wider uppercase font-dmsans ${
                isDark ? "text-[#F7F3EE]/70" : "text-[#0D2B45]/75"
              }`}>
                Prompt Headline
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Victor reads every one of these himself"
                className={`w-full h-11 rounded-xl border px-4 text-[13.5px] font-medium outline-none focus:border-[#C9943A] transition-all ${
                  isDark
                    ? "border-[#F7F3EE]/14 bg-[#0A1118] text-[#F7F3EE]"
                    : "border-[#0D2B45]/15 bg-white text-[#0D2B45]"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold tracking-wider uppercase font-dmsans ${
                isDark ? "text-[#F7F3EE]/70" : "text-[#0D2B45]/75"
              }`}>
                Introductory Subtitle / Guidance
              </label>
              <textarea
                value={draft.subtitle}
                onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
                rows={2}
                placeholder="There is no checkout for Inner Circle. Answer these, and if it looks like a fit he'll call you to talk it through."
                className={`w-full rounded-xl border px-4 py-3 text-[13px] leading-relaxed outline-none focus:border-[#C9943A] transition-all resize-none ${
                  isDark
                    ? "border-[#F7F3EE]/14 bg-[#0A1118] text-[#F7F3EE]"
                    : "border-[#0D2B45]/15 bg-white text-[#0D2B45]"
                }`}
              />
            </div>
          </div>

          {/* Section: Questions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10.5px] font-bold tracking-[0.16em] text-[#C9943A] uppercase font-dmsans">
                APPLICATION QUESTIONS ({draft.questions.length})
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-[12px] font-semibold text-[#C9943A] hover:text-[#d8a24a] flex items-center gap-1 transition-colors cursor-pointer"
              >
                + Add question
              </button>
            </div>

            <div className="space-y-3.5">
              {draft.questions.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    isDark
                      ? "border-[#F7F3EE]/10 bg-[#0A1118]/80 hover:border-[#C9943A]/30"
                      : "border-[#0D2B45]/10 bg-[#FAF7F2] hover:border-[#C9943A]/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#C9943A]/20 text-[#C9943A] flex items-center justify-center font-mono font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className={`text-[11.5px] font-bold tracking-wider uppercase font-dmsans ${
                        isDark ? "text-[#F7F3EE]/80" : "text-[#0D2B45]/80"
                      }`}>
                        Question {index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Reorder Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(index, -1)}
                        disabled={index === 0}
                        title="Move question up"
                        className={`w-7 h-7 rounded-lg disabled:opacity-20 flex items-center justify-center text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          isDark ? "bg-white/5 hover:bg-white/10 text-[#F7F3EE]/70" : "bg-black/5 hover:bg-black/10 text-[#0D2B45]/70"
                        }`}
                      >
                        ▲
                      </button>
                      {/* Reorder Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(index, 1)}
                        disabled={index === draft.questions.length - 1}
                        title="Move question down"
                        className={`w-7 h-7 rounded-lg disabled:opacity-20 flex items-center justify-center text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          isDark ? "bg-white/5 hover:bg-white/10 text-[#F7F3EE]/70" : "bg-black/5 hover:bg-black/10 text-[#0D2B45]/70"
                        }`}
                      >
                        ▼
                      </button>

                      {/* Remove question */}
                      {draft.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          title="Remove question"
                          className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-300 flex items-center justify-center text-xs transition-colors cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => updateQuestion(index, { question: e.target.value })}
                        placeholder={`Question ${index + 1} prompt`}
                        className={`w-full h-11 rounded-xl border px-3.5 font-medium text-[13.5px] outline-none focus:border-[#C9943A] transition-all ${
                          isDark
                            ? "border-[#F7F3EE]/12 bg-[#0D0D0D] text-[#F7F3EE]"
                            : "border-[#0D2B45]/15 bg-white text-[#0D2B45]"
                        }`}
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={item.hint}
                        onChange={(e) => updateQuestion(index, { hint: e.target.value })}
                        placeholder="Helper hint shown under question to guide applicant"
                        className={`w-full h-9 rounded-xl border px-3.5 text-[12px] outline-none focus:border-[#C9943A]/70 transition-all font-inter ${
                          isDark
                            ? "border-[#F7F3EE]/8 bg-[#0D0D0D]/60 text-[#F7F3EE]/65"
                            : "border-[#0D2B45]/10 bg-white/80 text-[#0D2B45]/70"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className={`px-6 sm:px-8 py-4 border-t flex items-center justify-between gap-4 ${
          isDark ? "bg-[#0D2B45] border-[#F7F3EE]/10" : "bg-white border-[#0D2B45]/10"
        }`}>
          <div className={`text-[12px] font-inter hidden sm:block ${
            isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
          }`}>
            ⚡ Updates reflect immediately for new applicants.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`h-10 px-4 rounded-xl border font-semibold text-[13px] transition-all cursor-pointer disabled:opacity-50 ${
                isDark
                  ? "border-[#F7F3EE]/20 hover:bg-white/5 text-[#F7F3EE]/80 hover:text-[#F7F3EE]"
                  : "border-[#0D2B45]/20 hover:bg-black/5 text-[#0D2B45]/80 hover:text-[#0D2B45]"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="h-10 px-6 rounded-xl bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-[13px] shadow-[0_4px_16px_rgba(201,148,58,0.25)] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save question set"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

InnerCircleQuestionsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        order: PropTypes.number,
        question: PropTypes.string,
        hint: PropTypes.string,
        active: PropTypes.bool,
      })
    ),
  }),
  onSave: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
};
