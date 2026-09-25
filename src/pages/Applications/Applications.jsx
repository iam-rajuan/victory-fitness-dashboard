import { useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import InnerCircleQuestionsModal from "./InnerCircleQuestionsModal";
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

const DEFAULT_QUESTIONS = [
  {
    id: "q1",
    order: 1,
    question: "What are you training for in the next twelve months?",
    hint: "Something specific. A number, a date, or a moment you want to be ready for.",
    active: true,
  },
  {
    id: "q2",
    order: 2,
    question: "What have you already tried, and where did it stop working?",
    hint: "Be honest here. It tells Victor more than your goal does.",
    active: true,
  },
  {
    id: "q3",
    order: 3,
    question: "How many hours a week can you genuinely commit?",
    hint: "Not the hours you wish you had. The ones you actually have.",
    active: true,
  },
  {
    id: "q4",
    order: 4,
    question: "What needs to change first for a coach to be worth it to you?",
    hint: "One thing. The one that has held everything else up.",
    active: true,
  },
  {
    id: "q5",
    order: 5,
    question: "Why now?",
    hint: "Inner Circle is small. This is the question Victor reads first.",
    active: true,
  },
];

const normalizeQuestionSet = (data) => ({
  title: data?.title || "Victor reads every one of these himself",
  subtitle:
    data?.subtitle ||
    "There is no checkout for Inner Circle. Answer these, and if it looks like a fit he'll call you to talk it through.",
  questions:
    Array.isArray(data?.questions) && data.questions.length > 0
      ? data.questions.map((q, idx) => ({
          id: q.id || `q${idx + 1}`,
          order: Number(q.order || idx + 1),
          question: q.question || "",
          hint: q.hint || "",
          active: q.active !== false,
        }))
      : DEFAULT_QUESTIONS,
});

export default function Applications() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);
  const [questionDraft, setQuestionDraft] = useState(() => normalizeQuestionSet(null));
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
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
      .then((data) => {
        if (data) {
          setQuestionDraft(normalizeQuestionSet(data));
        }
      })
      .catch(() => {
        // Fallback to default questions without error noise
      });
  }, []);

  const saveQuestions = async (updatedDraft) => {
    const draftToSave = updatedDraft || questionDraft;
    if (!draftToSave) return;
    const questions = draftToSave.questions
      .map((item, idx) => ({
        ...item,
        id: item.id || `q${idx + 1}`,
        order: idx + 1,
        active: item.active !== false,
      }))
      .filter((item) => item.question && item.question.trim());

    if (!questions.length) {
      showToast("Keep at least one question.");
      return;
    }

    setSavingQuestions(true);
    try {
      const saved = await updateInnerCircleApplicationQuestions({
        title: draftToSave.title,
        subtitle: draftToSave.subtitle,
        questions,
      });
      setQuestionDraft(normalizeQuestionSet(saved));
      showToast("✓ Inner Circle questions updated in onboarding and profile.");
      setIsQuestionsModalOpen(false);
    } catch (error) {
      showToast(error.message || "Unable to save Inner Circle questions.");
    } finally {
      setSavingQuestions(false);
    }
  };

  return (
    <div>
      <ClaudeAdminTable
        pageKicker="INNER CIRCLE · BY APPLICATION ONLY"
        pageTitle="Applications"
        pageSub="Five questions, straight to you. No checkout exists for Inner Circle — you read the answers, then decide whether to call."
        pagePrimary="Book a call"
        pageSecondary="Export answers"
        extraHeaderActions={
          <button
            type="button"
            onClick={() => setIsQuestionsModalOpen(true)}
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "12px",
              boxSizing: "border-box",
              border: "1.5px solid rgba(201, 148, 58, 0.4)",
              background: "rgba(201, 148, 58, 0.08)",
              color: "#C9943A",
              font: "700 13.5px 'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(201, 148, 58, 0.16)";
              e.currentTarget.style.borderColor = "#C9943A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(201, 148, 58, 0.08)";
              e.currentTarget.style.borderColor = "rgba(201, 148, 58, 0.4)";
            }}
          >
            <span style={{ fontSize: "14px", lineHeight: 1 }}>✎</span>
            <span>Question set</span>
          </button>
        }
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

      <InnerCircleQuestionsModal
        isOpen={isQuestionsModalOpen}
        onClose={() => setIsQuestionsModalOpen(false)}
        initialData={questionDraft}
        onSave={saveQuestions}
        isSaving={savingQuestions}
      />
    </div>
  );
}
