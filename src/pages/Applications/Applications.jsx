import { useCallback, useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import InnerCircleQuestionsModal from "./InnerCircleQuestionsModal";
import {
  getInnerCircleApplicationQuestions,
  listAdminApplications,
  updateInnerCircleApplicationQuestions,
} from "../../../services/admin-applications.service";
import { readStaleCache, writeStaleCache } from "../../utils/staleCache";

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

const statusLabel = (value) => {
  const status = String(value || "NEW").trim().toUpperCase();
  if (status === "NEW") return "Waiting";
  if (status === "REVIEWING") return "Call booked";
  if (status === "APPROVED") return "Accepted";
  if (status === "REJECTED") return "Declined";
  return status;
};

const toneForStatus = (value) => {
  const status = String(value || "NEW").trim().toUpperCase();
  if (status === "APPROVED" || status === "REVIEWING") return "good";
  if (status === "REJECTED") return "warn";
  return "bad";
};

const marketFromApplication = (application) => {
  if (!application) return "Not set";
  const explicit = String(application.country || application.market || "").trim();
  if (explicit) return explicit;
  const phone = String(application.phone_number || "").trim();
  if (phone.startsWith("+49")) return "Germany";
  if (phone.startsWith("+233")) return "Ghana";
  if (phone.startsWith("+91")) return "India";
  if (phone.startsWith("+44")) return "UK";
  if (phone.startsWith("+1")) return "US";
  return "Not set";
};

const waitingLabel = (application) => {
  if (!application) return "Today";
  const status = String(application.status || "NEW").trim().toUpperCase();
  if (status === "REVIEWING" && application.call_slot) return application.call_slot;
  if (status === "APPROVED" || status === "REJECTED") return "—";
  const created = application.created_at ? new Date(application.created_at) : null;
  if (!created || Number.isNaN(created.getTime())) return "Today";
  const diffDays = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
  if (diffDays <= 0) return "Today";
  return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
};

const goalFromApplication = (application) => {
  if (!application) return "Coaching";
  const firstAnswer = Array.isArray(application.question_answers)
    ? application.question_answers.find((item) => Number(item.order || 0) === 1)?.answer
    : "";
  return String(firstAnswer || application.goal || "Coaching").trim() || "Coaching";
};

const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename, rowsToExport) => {
  const csv = rowsToExport.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildApplicationExportRows = (applications) => {
  const normalized = applications.filter(Boolean);
  const maxAnswers = Math.max(
    0,
    ...normalized.map((application) =>
      Array.isArray(application.question_answers) ? application.question_answers.length : 0
    )
  );
  const answerHeaders = Array.from({ length: maxAnswers }, (_, idx) => [
    `Question ${idx + 1}`,
    `Answer ${idx + 1}`,
  ]).flat();

  return [
    [
      "Applicant",
      "Market",
      "Email",
      "Phone",
      "Account email",
      "Status",
      "Call slot",
      "Submitted at",
      "Goal",
      "Obstacle",
      "Investment",
      "Commitment",
      "Injury",
      "Additional notes",
      "Admin verdict",
      "Admin reply",
      ...answerHeaders,
    ],
    ...normalized.map((application) => {
      const answers = Array.isArray(application.question_answers)
        ? [...application.question_answers].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        : [];
      const answerCells = Array.from({ length: maxAnswers }, (_, idx) => {
        const item = answers[idx] || {};
        return [item.question || "", item.answer || ""];
      }).flat();
      return [
        application.full_name || `${application.first_name || ""} ${application.last_name || ""}`.trim(),
        marketFromApplication(application),
        application.email || "",
        application.phone_number || "",
        application.applicant_user_email || "",
        statusLabel(application.status),
        application.call_slot || "",
        application.created_at || "",
        application.goal || "",
        application.obstacle || "",
        application.investment || "",
        application.commitment || "",
        application.injury || "",
        application.additional_notes || "",
        application.admin_verdict || "",
        application.admin_reply || "",
        ...answerCells,
      ];
    }),
  ];
};

const mapApplicationRow = (application) => {
  const fullName =
    application.full_name ||
    application.fullName ||
    `${application.first_name || ""} ${application.last_name || ""}`.trim() ||
    application.email ||
    "Applicant";
  const status = statusLabel(application.status);
  const market = marketFromApplication(application);
  const email = String(application.email || "").trim();
  return {
    id: application.id || application._id,
    a: fullName,
    b: email ? `${market} · ${email}` : market,
    c: goalFromApplication(application),
    d: waitingLabel(application),
    e: status,
    tone: toneForStatus(application.status),
    rawData: application,
  };
};

export default function Applications() {
  const { openDrawer, showToast } = useAdminDrawer();
  const cached = readStaleCache("applications");
  const [loading, setLoading] = useState(!cached);
  const [rows, setRows] = useState(() => cached?.rows || []);
  const [questionDraft, setQuestionDraft] = useState(() => normalizeQuestionSet(null));
  const [summary, setSummary] = useState(() => cached?.summary || null);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const loadApplications = useCallback(() => {
    setLoading(true);
    return listAdminApplications()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.applications || data?.items || [];
        const nextRows = list.map(mapApplicationRow);
        const nextSummary = data?.summary || null;
        setSummary(nextSummary);
        setRows(nextRows);
        writeStaleCache("applications", { rows: nextRows, summary: nextSummary });
      })
      .catch(() => {
        showToast("Failed to load applications.");
      })
      .finally(() => setLoading(false));
  }, []);

  const openApplicationDrawer = useCallback((row) => {
    if (!row) return;
    openDrawer("application", { ...row, onSaved: loadApplications });
  }, [loadApplications, openDrawer]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

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

  const exportAnswers = async () => {
    try {
      const data = await listAdminApplications({ limit: 1000 });
      const applications = Array.isArray(data) ? data : data?.applications || data?.items || [];
      if (!applications.length) {
        showToast("No applications to export.");
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(`inner-circle-applications-${today}.csv`, buildApplicationExportRows(applications));
      showToast(`✓ Exported ${applications.length} application${applications.length === 1 ? "" : "s"}.`);
    } catch (error) {
      showToast(error.message || "Unable to export application answers.");
    }
  };

  const pageStats = useMemo(() => {
    const waitingRows = rows.filter((row) => String(row.rawData?.status || "NEW").toUpperCase() === "NEW");
    const reviewingRows = rows.filter((row) => String(row.rawData?.status || "").toUpperCase() === "REVIEWING");
    const accepted = summary?.approvedApplications ?? rows.filter((row) => String(row.rawData?.status || "").toUpperCase() === "APPROVED").length;
    const declined = summary?.rejectedApplications ?? rows.filter((row) => String(row.rawData?.status || "").toUpperCase() === "REJECTED").length;
    const oldestWaiting = waitingRows
      .map((row) => waitingLabel(row.rawData))
      .find((label) => label && label !== "Today") || "Today";
    return [
      { k: "WAITING", v: String(summary?.newApplications ?? waitingRows.length), note: `Oldest: ${oldestWaiting}` },
      { k: "CALLS BOOKED", v: String(summary?.reviewingApplications ?? reviewingRows.length), note: reviewingRows[0]?.rawData?.call_slot || "No slot selected" },
      { k: "ACCEPTED", v: String(accepted), note: "Current Inner Circle size" },
      { k: "DECLINED", v: String(declined), note: "Alternative offer sent" },
    ];
  }, [rows, summary]);

  const nextUnbookedRow = useMemo(
    () => rows.find((row) => String(row.rawData?.status || "NEW").toUpperCase() === "NEW") || null,
    [rows]
  );
  const unbookedCount = useMemo(
    () => rows.filter((row) => String(row.rawData?.status || "NEW").toUpperCase() === "NEW").length,
    [rows]
  );
  const bookCallStatus = unbookedCount > 0
    ? `${unbookedCount} waiting for call`
    : rows.length > 0
      ? "Call booked for everyone"
      : "No applications yet";

  return (
    <div>
      <ClaudeAdminTable
        pageKicker="INNER CIRCLE · BY APPLICATION ONLY"
        pageTitle="Applications"
        pageSub="Five questions, straight to you. No checkout exists for Inner Circle — you read the answers, then decide whether to call."
        pagePrimary="Book a call"
        pageSecondary="Export answers"
        extraHeaderActions={
          <>
            <div
              style={{
                height: "44px",
                padding: "0 12px",
                borderRadius: "12px",
                boxSizing: "border-box",
                border: unbookedCount > 0 ? "1.5px solid rgba(201, 148, 58, 0.28)" : "1.5px solid rgba(95, 196, 142, 0.38)",
                background: unbookedCount > 0 ? "rgba(201, 148, 58, 0.06)" : "rgba(95, 196, 142, 0.1)",
                color: unbookedCount > 0 ? "#C9943A" : "#5FC48E",
                font: "700 12px 'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              {bookCallStatus}
            </div>
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
          </>
        }
        onPrimary={() => {
          if (nextUnbookedRow) {
            openApplicationDrawer(nextUnbookedRow);
            return;
          }
          showToast(rows.length > 0 ? "✓ Call booked for everyone." : "No applications to book.");
        }}
        onSecondary={exportAnswers}
        pageStats={pageStats}
        pageAdvice={`${pageStats[0].v} ${pageStats[0].v === "1" ? "application is" : "applications are"} waiting for a decision. Open the oldest one, read the answers, then send the applicant a real reply.`}
        pageAdviceDone="Read them now"
        onAdvice={() => openApplicationDrawer(nextUnbookedRow || rows[0])}
        filters={["All", "Waiting", "Call booked", "Accepted", "Declined"]}
        cols={["APPLICANT", "MARKET", "GOAL", "WAITING", "STATUS"]}
        rows={rows}
        isLoading={loading}
        onEditRow={openApplicationDrawer}
        onDeleteRow={(row) => showToast(`Archived application from ${row.a}.`)}
        onRowClick={openApplicationDrawer}
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
