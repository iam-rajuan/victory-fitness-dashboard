import { useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import {
  getInnerCircleApplicationQuestions,
  listAdminApplications,
  updateInnerCircleApplicationQuestions,
} from "../../../services/admin-applications.service";

const BASE_ROWS = [
  { a: "Ingrid Vogel", b: "Germany", c: "Back to competing at 52", d: "4 days", e: "Waiting", tone: "bad", id: "app1" },
  { a: "Ravi Iyer", b: "India", c: "Rebuild after injury", d: "2 days", e: "Waiting", tone: "warn", id: "app2" },
  { a: "Nana Owusu", b: "Ghana", c: "Consistency, not aesthetics", d: "—", e: "Call booked", tone: "good", id: "app3" },
  { a: "Dominik Schulz", b: "Germany", c: "Marathon in May", d: "—", e: "Accepted", tone: "good", id: "app4" },
  { a: "Sarah Fischer", b: "Germany", c: "General fitness", d: "—", e: "Declined · Platinum", tone: "warn", id: "app5" },
  { a: "Tomasz Nowak", b: "Poland", c: "Weight loss", d: "—", e: "Declined · Gold", tone: "warn", id: "app6" },
];

const normalizeQuestionSet = (data) => ({
  title: data?.title || "Victor reads every one of these himself",
  subtitle:
    data?.subtitle ||
    "There is no checkout for Inner Circle. Answer these, and if it looks like a fit he'll call you to talk it through.",
  questions: Array.isArray(data?.questions)
    ? data.questions.map((q, idx) => ({
        id: q.id || `q${idx + 1}`,
        order: Number(q.order || idx + 1),
        question: q.question || "",
        hint: q.hint || "",
        active: q.active !== false,
      }))
    : [],
});

export default function Applications() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);
  const [questionDraft, setQuestionDraft] = useState(null);
  const [savingQuestions, setSavingQuestions] = useState(false);

  useEffect(() => {
    listAdminApplications()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.applications || data?.items || [];
        if (list.length > 0) {
          setRows(
            list.map((a) => ({
              id: a.id || a._id,
              a: a.full_name || a.fullName || a.applicantName || `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Applicant",
              b: a.email || "",
              c: a.country || "Member",
              d: `${a.goal || "Coaching"} · ${a.status || "NEW"}`,
              e: a.status || "NEW",
              tone: a.status === "APPROVED" ? "good" : a.status === "NEW" ? "bad" : "warn",
              rawData: a,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getInnerCircleApplicationQuestions()
      .then((data) => setQuestionDraft(normalizeQuestionSet(data)))
      .catch((error) => showToast(error.message || "Unable to load Inner Circle question set."));
  }, [showToast]);

  const updateQuestion = (index, patch) => {
    setQuestionDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));
  };

  const saveQuestions = async () => {
    if (!questionDraft) return;
    const questions = questionDraft.questions
      .map((item, idx) => ({
        ...item,
        id: item.id || `q${idx + 1}`,
        order: idx + 1,
        active: item.active !== false,
      }))
      .filter((item) => item.question.trim());

    if (!questions.length) {
      showToast("Keep at least one question.");
      return;
    }

    setSavingQuestions(true);
    try {
      const saved = await updateInnerCircleApplicationQuestions({
        title: questionDraft.title,
        subtitle: questionDraft.subtitle,
        questions,
      });
      setQuestionDraft(normalizeQuestionSet(saved));
      showToast("✓ Inner Circle questions updated in onboarding and profile.");
    } catch (error) {
      showToast(error.message || "Unable to save Inner Circle questions.");
    } finally {
      setSavingQuestions(false);
    }
  };

  return (
    <div className="space-y-5">
      {questionDraft && (
        <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.18em] text-[#B5651D] uppercase mb-1">
                INNER CIRCLE · QUESTION SET
              </div>
              <h2 className="font-clash text-2xl font-semibold text-[#F7F3EE] leading-tight">
                The questions applicants answer
              </h2>
              <p className="max-w-2xl text-[13px] leading-relaxed text-[#F7F3EE]/60 mt-2 font-inter">
                These appear in onboarding and profile. Each submission stores the exact question text used at the time.
              </p>
            </div>
            <button
              type="button"
              onClick={saveQuestions}
              disabled={savingQuestions}
              className="h-11 px-5 rounded-xl bg-[#C9943A] text-[#0D0D0D] font-bold text-[13px] disabled:opacity-60"
            >
              {savingQuestions ? "Saving..." : "Save questions"}
            </button>
          </div>

          <div className="grid gap-3 mb-4">
            <input
              value={questionDraft.title}
              onChange={(e) => setQuestionDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="h-11 rounded-xl border border-[#F7F3EE]/14 bg-[#0D0D0D] px-4 text-[#F7F3EE] outline-none"
            />
            <textarea
              value={questionDraft.subtitle}
              onChange={(e) => setQuestionDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
              rows={2}
              className="rounded-xl border border-[#F7F3EE]/14 bg-[#0D0D0D] px-4 py-3 text-[#F7F3EE] outline-none resize-none"
            />
          </div>

          <div className="grid gap-3">
            {questionDraft.questions.map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D0D0D] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#C9943A]/20 text-[#C9943A] flex items-center justify-center font-mono font-bold text-xs">
                    {index + 1}
                  </div>
                  <input
                    value={item.question}
                    onChange={(e) => updateQuestion(index, { question: e.target.value })}
                    className="flex-1 h-10 rounded-lg border border-[#F7F3EE]/12 bg-[#111] px-3 text-[#F7F3EE] outline-none"
                  />
                </div>
                <input
                  value={item.hint}
                  onChange={(e) => updateQuestion(index, { hint: e.target.value })}
                  className="w-full h-10 rounded-lg border border-[#F7F3EE]/12 bg-[#111] px-3 text-[#F7F3EE]/70 outline-none text-sm"
                  placeholder="Small helper hint shown under the question"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <ClaudeAdminTable
        pageKicker="INNER CIRCLE · BY APPLICATION ONLY"
        pageTitle="Applications"
        pageSub="Five questions, straight to you. No checkout exists for Inner Circle — you read the answers, then decide whether to call."
        pagePrimary="Book a call"
        pageSecondary="Export answers"
        onPrimary={() => openDrawer("application", rows[0])}
        pageStats={[
          { k: "WAITING", v: "2", note: "Oldest: 4 days" },
          { k: "CALLS BOOKED", v: "1", note: "Thursday 19:00 CET" },
          { k: "ACCEPTED", v: "4", note: "Current Inner Circle size" },
          { k: "DECLINED", v: "3", note: "All pointed at Platinum instead" },
        ]}
        pageAdvice="Two applications have been waiting four days. The screen promises a reply within three — the oldest one is already past that."
        pageAdviceDone="Read them now"
        onAdvice={() => openDrawer("application", rows[0])}
        filters={["All", "Waiting", "Call booked", "Accepted", "Declined"]}
        cols={["APPLICANT", "MARKET", "GOAL", "WAITING", "STATUS"]}
        rows={rows}
        isLoading={loading}
        onEditRow={(row) => openDrawer("application", row)}
        onDeleteRow={(row) => showToast(`Archived application from ${row.a}.`)}
        onRowClick={(row) => openDrawer("application", row)}
      />
    </div>
  );
}
