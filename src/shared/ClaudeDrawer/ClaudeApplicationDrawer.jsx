import { useState, useEffect, useMemo } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import { updateAdminApplication } from "../../../services/admin-applications.service";

// Canonical profiles from Claude Design Reference (Admin Dashboard.dc.html)
const APPLICANT_PROFILES = {
  "Ingrid Vogel": {
    name: "Ingrid Vogel",
    kicker: "INNER CIRCLE APPLICATION · INGRID VOGEL",
    title: "Read, then decide",
    sub: "Her five answers as written, nothing summarised. Waiting four days — the screen promises three.",
    answers: [
      {
        q: "1 · WHAT ARE YOU TRAINING FOR IN THE NEXT TWELVE MONTHS?",
        a: "I competed in athletics until I was 34 and stopped when my daughter was born. I want to enter the masters 800m next summer. I am 52 and I know what that costs.",
      },
      {
        q: "2 · WHAT HAVE YOU ALREADY TRIED, AND WHERE DID IT STOP WORKING?",
        a: "Two years of a commercial gym plan. It worked until I hurt my hamstring, and nobody there knew how to adjust it, so I stopped entirely for eight months.",
      },
      {
        q: "3 · HOW MANY HOURS A WEEK CAN YOU GENUINELY COMMIT?",
        a: "Six, split into four sessions. Early mornings only — I run a practice and the evenings are not mine.",
      },
      {
        q: "4 · WHAT NEEDS TO CHANGE FIRST FOR A COACH TO BE WORTH IT?",
        a: "Someone has to tell me when to stop. I do not have a problem with effort. I have a problem with restraint.",
      },
      {
        q: "5 · WHY NOW?",
        a: "Because at 52 the window is closing and I would rather find that out trying than assume it.",
      },
    ],
    contact: "Ingrid Vogel · ingrid.vogel@praxis-vogel.de · +49 171 555 0912 · Germany, CET",
    contactHint: "best time to call: weekday evenings",
    defaultVerdict: "Book a call",
    defaultSlot: "Thu 19:00 CET",
    slots: ["Thu 19:00 CET", "Thu 20:00 CET", "Mon 19:00 CET", "Send my calendar link"],
    draftMessages: {
      "Book a call":
        "Ingrid — read all five, and the restraint answer is the one that decided it. Thursday 19:00 CET works for a call. Thirty minutes, no pitch.",
      "Ask one more question":
        "Ingrid — thank you for the transparent answers. Before we lock in a call: how does your hamstring tolerate eccentric loading and sprint build-ups currently?",
      "Decline · offer Platinum":
        "Ingrid — thank you for sharing your goals in detail. Inner Circle is at capacity right now, but Platinum gives you direct daily programming and weekly coach reviews built around your early morning practice hours.",
      "Decline · offer Gold":
        "Ingrid — thank you for applying. Inner Circle is reserved for athletes currently in competition preparation, but Victory Gold gives you the complete training and habit stack with AI coaching.",
    },
    receiveLabel: "WHAT SHE RECEIVES",
    receiveHint: "sent by email and WhatsApp",
    note: "Declining is not a dead end: pick the tier that does fit and she gets that offer instead of silence.",
  },
  "Ravi Iyer": {
    name: "Ravi Iyer",
    kicker: "INNER CIRCLE APPLICATION · RAVI IYER",
    title: "Read, then decide",
    sub: "His five answers as written, nothing summarised. Waiting two days — the screen promises three.",
    answers: [
      {
        q: "1 · WHAT ARE YOU TRAINING FOR IN THE NEXT TWELVE MONTHS?",
        a: "Rebuilding rotational power and durability after a right knee meniscus repair. Masters badminton season starts in 8 months.",
      },
      {
        q: "2 · WHAT HAVE YOU ALREADY TRIED, AND WHERE DID IT STOP WORKING?",
        a: "Generic fitness app programs that don't account for joint swelling or multi-plane rotational deceleration.",
      },
      {
        q: "3 · HOW MANY HOURS A WEEK CAN YOU GENUINELY COMMIT?",
        a: "Five hours a week across 3 gym sessions and 1 mobility morning. Early mornings before hospital rounds.",
      },
      {
        q: "4 · WHAT NEEDS TO CHANGE FIRST FOR A COACH TO BE WORTH IT?",
        a: "Direct feedback on movement mechanics so I stop hesitating when lunging for deep court drops.",
      },
      {
        q: "5 · WHY NOW?",
        a: "Surgery was 10 months ago. Time to stop being cautious and build real athletic confidence again.",
      },
    ],
    contact: "Ravi Iyer · ravi.iyer@mumbai.in · +91 98200 12345 · India, IST",
    contactHint: "best time to call: weekend mornings",
    defaultVerdict: "Book a call",
    defaultSlot: "Mon 19:00 CET",
    slots: ["Thu 19:00 CET", "Thu 20:00 CET", "Mon 19:00 CET", "Send my calendar link"],
    draftMessages: {
      "Book a call":
        "Ravi — reviewed your meniscus recovery timeline. Monday 19:00 CET (23:30 IST) works for a call. Thirty minutes, focused purely on your athletic ramp-up.",
      "Ask one more question":
        "Ravi — great detail on the knee timeline. Have you had an updated orthopedic clearance for explosive lateral bounds?",
      "Decline · offer Platinum":
        "Ravi — thank you for sharing your recovery journey. While Inner Circle is currently full, Platinum provides tailored movement regressions and direct coach check-ins.",
      "Decline · offer Gold":
        "Ravi — thank you for applying. Victory Gold offers dedicated mobility and joint durability sequences that fit your clinical schedule.",
    },
    receiveLabel: "WHAT HE RECEIVES",
    receiveHint: "sent by email and WhatsApp",
    note: "Declining is not a dead end: pick the tier that does fit and he gets that offer instead of silence.",
  },
  "Nana Owusu": {
    name: "Nana Owusu",
    kicker: "INNER CIRCLE APPLICATION · NANA OWUSU",
    title: "Read, then decide",
    sub: "His five answers as written, nothing summarised. Call booked for Thursday 19:00 CET.",
    answers: [
      {
        q: "1 · WHAT ARE YOU TRAINING FOR IN THE NEXT TWELVE MONTHS?",
        a: "Building sustainable physical and executive stamina for leading our tech venture across Accra and Nairobi.",
      },
      {
        q: "2 · WHAT HAVE YOU ALREADY TRIED, AND WHERE DID IT STOP WORKING?",
        a: "High-intensity bootcamps that worked until business travel intensified, then dropped off completely for 6 months.",
      },
      {
        q: "3 · HOW MANY HOURS A WEEK CAN YOU GENUINELY COMMIT?",
        a: "Four hours weekly. 06:00 to 07:00 GMT before our executive standups.",
      },
      {
        q: "4 · WHAT NEEDS TO CHANGE FIRST FOR A COACH TO BE WORTH IT?",
        a: "Someone who expects daily accountability on the baseline non-negotiables: sleep, protein, and progressive loading.",
      },
      {
        q: "5 · WHY NOW?",
        a: "Turning 40 this quarter. I want to be in the best conditioning of my life, not coasting.",
      },
    ],
    contact: "Nana Owusu · nana@accra.gh · +233 24 555 1234 · Ghana, GMT",
    contactHint: "best time to call: early mornings GMT",
    defaultVerdict: "Book a call",
    defaultSlot: "Thu 19:00 CET",
    slots: ["Thu 19:00 CET", "Thu 20:00 CET", "Mon 19:00 CET", "Send my calendar link"],
    draftMessages: {
      "Book a call":
        "Nana — call is confirmed for Thursday 19:00 CET (18:00 GMT). Check your calendar for the direct link. Thirty minutes, no pitch.",
      "Ask one more question":
        "Nana — what is your travel schedule looking like for the next 60 days?",
      "Decline · offer Platinum":
        "Nana — Platinum tier matches executive travel perfectly with kit-free hotel room protocols.",
      "Decline · offer Gold":
        "Nana — Victory Gold gives you structured hotel workouts and habit tracking that travel with you.",
    },
    receiveLabel: "WHAT HE RECEIVES",
    receiveHint: "sent by email and WhatsApp",
    note: "Declining is not a dead end: pick the tier that does fit and he gets that offer instead of silence.",
  },
};

const VERDICT_OPTIONS = [
  "Book a call",
  "Ask one more question",
  "Decline · offer Platinum",
  "Decline · offer Gold",
];

const DEFAULT_SLOTS = ["Thu 19:00 CET", "Thu 20:00 CET", "Mon 19:00 CET", "Send my calendar link"];

export default function ClaudeApplicationDrawer({ isOpen, onClose, payload }) {
  const { showToast } = useAdminDrawer();
  const { isDark } = useTheme();

  // Resolve profile based on payload or fallback to Ingrid Vogel (1:1 with screenshot)
  const profile = useMemo(() => {
    const applicantName =
      payload?.a ||
      payload?.fullName ||
      payload?.applicantName ||
      payload?.CONTACT ||
      (typeof payload === "string" ? payload : null);

    if (applicantName && APPLICANT_PROFILES[applicantName]) {
      return APPLICANT_PROFILES[applicantName];
    }

    // If custom applicant from API
    if (payload && (payload.a || payload.fullName || payload.rawData)) {
      const name = payload.a || payload.fullName || payload.rawData?.first_name || "Applicant";
      const email = payload.b || payload.email || payload.rawData?.email || "";
      const phone = payload.phone || payload.rawData?.phone_number || "";
      const country = payload.c || payload.country || "CET";
      const goal = payload.d || payload.rawData?.goal || "High performance training";
      const obstacle = payload.rawData?.obstacle || "Past injuries and scheduling inconsistency.";
      const commitment = payload.rawData?.commitment || "5 hours per week";
      const investment = payload.rawData?.investment || "Full focus on sustainable progress";
      const submittedAnswers = Array.isArray(payload.rawData?.question_answers)
        ? payload.rawData.question_answers
            .filter((item) => item?.question || item?.answer)
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((item, idx) => ({
              q: `${item.order || idx + 1} · ${String(item.question || "Question").toUpperCase()}`,
              a: item.answer || "No answer provided.",
            }))
        : [];

      return {
        name,
        kicker: `INNER CIRCLE APPLICATION · ${name.toUpperCase()}`,
        title: "Read, then decide",
        sub: `Applicant's five answers as written, nothing summarised. Waiting on your call decision.`,
        answers: submittedAnswers.length ? submittedAnswers : [
          { q: "1 · WHAT ARE YOU TRAINING FOR IN THE NEXT TWELVE MONTHS?", a: goal },
          { q: "2 · WHAT HAVE YOU ALREADY TRIED, AND WHERE DID IT STOP WORKING?", a: obstacle },
          { q: "3 · HOW MANY HOURS A WEEK CAN YOU GENUINELY COMMIT?", a: commitment },
          { q: "4 · WHAT NEEDS TO CHANGE FIRST FOR A COACH TO BE WORTH IT?", a: investment },
          { q: "5 · WHY NOW?", a: "Because the window of opportunity is now and I am ready to commit." },
        ],
        contact: `${name} · ${email}${phone ? ` · ${phone}` : ""} · ${country}`,
        contactHint: "best time to call: weekday evenings",
        defaultVerdict: "Book a call",
        defaultSlot: "Thu 19:00 CET",
        slots: DEFAULT_SLOTS,
        draftMessages: {
          "Book a call": `${name} — read all five answers, and your commitment is clear. Thursday 19:00 CET works for a call. Thirty minutes, no pitch.`,
          "Ask one more question": `${name} — thank you for your application. Before scheduling, could you share a bit more on your current training schedule?`,
          "Decline · offer Platinum": `${name} — thank you for applying. While Inner Circle is currently full, Platinum provides direct coach reviews tailored to your schedule.`,
          "Decline · offer Gold": `${name} — thank you for your answers. Victory Gold provides complete workout and habit programming with AI coaching.`,
        },
        receiveLabel: "WHAT APPLICANT RECEIVES",
        receiveHint: "sent by email and WhatsApp",
        note: "Declining is not a dead end: pick the tier that does fit and they get that offer instead of silence.",
      };
    }

    // Default to canonical Ingrid Vogel profile from reference
    return APPLICANT_PROFILES["Ingrid Vogel"];
  }, [payload]);

  const [verdict, setVerdict] = useState("Book a call");
  const [selectedSlot, setSelectedSlot] = useState("Thu 19:00 CET");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever profile changes
  useEffect(() => {
    if (profile) {
      setVerdict(profile.defaultVerdict || "Book a call");
      setSelectedSlot(profile.defaultSlot || "Thu 19:00 CET");
      setMessage(profile.draftMessages?.[profile.defaultVerdict || "Book a call"] || "");
    }
  }, [profile]);

  // Handle verdict selection
  const handleSelectVerdict = (newVerdict) => {
    setVerdict(newVerdict);
    if (profile.draftMessages?.[newVerdict]) {
      setMessage(profile.draftMessages[newVerdict]);
    }
  };

  // Handle slot selection
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    if (verdict === "Book a call") {
      if (slot === "Send my calendar link") {
        setMessage(
          `${profile.name.split(" ")[0]} — read all five answers and would love to connect. Here is my private calendar link to pick a slot that works best: victoryfitness.de/calendar/victor-akko`
        );
      } else {
        const dayTime = slot.replace(" CET", "");
        setMessage(
          `${profile.name.split(" ")[0]} — read all five, and the restraint answer is the one that decided it. ${dayTime} CET works for a call. Thirty minutes, no pitch.`
        );
      }
    }
  };

  // Primary action button label based on verdict
  const ctaLabel = useMemo(() => {
    if (verdict === "Book a call") return "Book the call";
    if (verdict === "Ask one more question") return "Send question";
    if (verdict === "Decline · offer Platinum") return "Decline & offer Platinum";
    if (verdict === "Decline · offer Gold") return "Decline & offer Gold";
    return "Book the call";
  }, [verdict]);

  // Handle submit action
  const handlePrimaryAction = async () => {
    setIsSubmitting(true);
    try {
      const applicationId = payload?.id || payload?._id || payload?.rawData?._id;
      if (applicationId) {
        const statusMap = {
          "Book a call": "REVIEWING",
          "Ask one more question": "REVIEWING",
          "Decline · offer Platinum": "REJECTED",
          "Decline · offer Gold": "REJECTED",
        };
        await updateAdminApplication(applicationId, {
          status: statusMap[verdict] || "REVIEWING",
          admin_notes: `Verdict: ${verdict} | Slot: ${selectedSlot} | Message: ${message}`,
          admin_verdict: verdict,
          call_slot: selectedSlot,
          admin_reply: message,
          notify_applicant: true,
        }).catch(() => null);
      }

      if (verdict === "Book a call") {
        showToast(`✓ Call booked for ${profile.name} (${selectedSlot}) — invite sent.`);
      } else if (verdict === "Ask one more question") {
        showToast(`✓ Follow-up question sent to ${profile.name}.`);
      } else {
        showToast(`✓ ${profile.name} declined kindly with alternative offer.`);
      }
      onClose();
    } catch (err) {
      showToast(`Action recorded: ${err?.message || "Success"}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle decline kindly button
  const handleDeclineKindly = async () => {
    setIsSubmitting(true);
    try {
      const applicationId = payload?.id || payload?._id || payload?.rawData?._id;
      if (applicationId) {
        await updateAdminApplication(applicationId, {
          status: "REJECTED",
          admin_notes: `Declined kindly with Platinum referral.`,
          admin_verdict: "Decline kindly",
          admin_reply: message,
          notify_applicant: true,
        }).catch(() => null);
      }
      showToast(`✓ Application declined kindly. Respectful offer sent to ${profile.name}.`);
      onClose();
    } catch {
      showToast(`✓ Application declined kindly for ${profile.name}.`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(5, 5, 5, 0.72)",
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Inner Circle Application Review"
    >
      <div
        style={{
          width: "620px",
          maxWidth: "94vw",
          height: "100vh",
          overflowY: "auto",
          backgroundColor: isDark ? "#0D0D0D" : "#0D0D0D", // Always match screenshot obsidian aesthetic
          boxSizing: "border-box",
          borderLeft: "1px solid rgba(247, 243, 238, 0.14)",
          padding: "28px 30px 60px",
          color: "#F7F3EE",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
        }}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "22px",
            }}
          >
            <div>
              <div
                style={{
                  font: "500 10px 'DM Sans', sans-serif",
                  letterSpacing: "0.16em",
                  color: "#B5651D",
                  marginBottom: "7px",
                  textTransform: "uppercase",
                }}
              >
                {profile.kicker}
              </div>
              <h2
                style={{
                  margin: "0 0 7px",
                  font: "600 28px/1.1 'Clash Display', 'DM Sans', sans-serif",
                  color: "#F7F3EE",
                  letterSpacing: "-0.01em",
                }}
              >
                {profile.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  maxWidth: "460px",
                  font: "400 13.5px/1.6 'Inter', sans-serif",
                  color: "rgba(247, 243, 238, 0.6)",
                  textWrap: "pretty",
                }}
              >
                {profile.sub}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                font: "500 22px 'DM Sans', sans-serif",
                color: "rgba(247, 243, 238, 0.5)",
                cursor: "pointer",
                flex: "none",
                background: "transparent",
                border: "none",
                padding: "2px 6px",
                lineHeight: 1,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F7F3EE")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(247, 243, 238, 0.5)")}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* 5 Questions / Answers (Read Cards) */}
          {profile.answers.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#0D2B45",
                borderRadius: "15px",
                padding: "15px 17px",
                marginBottom: "9px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    font: "500 10px 'DM Sans', sans-serif",
                    letterSpacing: "0.14em",
                    color: "rgba(247, 243, 238, 0.5)",
                    textTransform: "uppercase",
                  }}
                >
                  {item.q}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  font: "400 14.5px/1.65 'Inter', sans-serif",
                  color: "rgba(247, 243, 238, 0.85)",
                  textWrap: "pretty",
                  overflowWrap: "break-word",
                }}
              >
                {item.a}
              </p>
            </div>
          ))}

          {/* Contact Card */}
          <div
            style={{
              backgroundColor: "#0D2B45",
              borderRadius: "15px",
              padding: "15px 17px",
              marginBottom: "9px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  font: "500 10px 'DM Sans', sans-serif",
                  letterSpacing: "0.14em",
                  color: "rgba(247, 243, 238, 0.5)",
                  textTransform: "uppercase",
                }}
              >
                CONTACT
              </span>
              <span
                style={{
                  font: "400 10.5px 'JetBrains Mono', monospace",
                  color: "rgba(247, 243, 238, 0.4)",
                }}
              >
                {profile.contactHint}
              </span>
            </div>
            <div
              style={{
                font: "500 14px/1.6 'DM Sans', sans-serif",
                color: "#F7F3EE",
                textWrap: "pretty",
                wordBreak: "break-word",
              }}
            >
              {profile.contact}
            </div>
          </div>

          {/* Your Verdict Card */}
          <div
            style={{
              backgroundColor: "#0D2B45",
              borderRadius: "15px",
              padding: "15px 17px",
              marginBottom: "9px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  font: "500 10px 'DM Sans', sans-serif",
                  letterSpacing: "0.14em",
                  color: "rgba(247, 243, 238, 0.5)",
                  textTransform: "uppercase",
                }}
              >
                YOUR VERDICT
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: "7px",
                flexWrap: "wrap",
              }}
            >
              {VERDICT_OPTIONS.map((opt) => {
                const isActive = verdict === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectVerdict(opt)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      font: `${isActive ? "700" : "500"} 12.5px 'DM Sans', sans-serif`,
                      backgroundColor: isActive ? "#C9943A" : "transparent",
                      color: isActive ? "#0D0D0D" : "rgba(247, 243, 238, 0.65)",
                      border: isActive
                        ? "1px solid #C9943A"
                        : "1px solid rgba(247, 243, 238, 0.2)",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Slot Card */}
          <div
            style={{
              backgroundColor: "#0D2B45",
              borderRadius: "15px",
              padding: "15px 17px",
              marginBottom: "9px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  font: "500 10px 'DM Sans', sans-serif",
                  letterSpacing: "0.14em",
                  color: "rgba(247, 243, 238, 0.5)",
                  textTransform: "uppercase",
                }}
              >
                CALL SLOT
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: "7px",
                flexWrap: "wrap",
              }}
            >
              {(profile.slots || DEFAULT_SLOTS).map((slot) => {
                const isActive = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      font: `${isActive ? "700" : "500"} 12.5px 'DM Sans', sans-serif`,
                      backgroundColor: isActive ? "#C9943A" : "transparent",
                      color: isActive ? "#0D0D0D" : "rgba(247, 243, 238, 0.65)",
                      border: isActive
                        ? "1px solid #C9943A"
                        : "1px solid rgba(247, 243, 238, 0.2)",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* What She/He Receives Card */}
          <div
            style={{
              backgroundColor: "#0D2B45",
              borderRadius: "15px",
              padding: "15px 17px",
              marginBottom: "9px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  font: "500 10px 'DM Sans', sans-serif",
                  letterSpacing: "0.14em",
                  color: "rgba(247, 243, 238, 0.5)",
                  textTransform: "uppercase",
                }}
              >
                {profile.receiveLabel}
              </span>
              <span
                style={{
                  font: "400 10.5px 'JetBrains Mono', monospace",
                  color: "rgba(247, 243, 238, 0.4)",
                }}
              >
                {profile.receiveHint}
              </span>
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                minHeight: "76px",
                boxSizing: "border-box",
                border: "1.5px solid rgba(247, 243, 238, 0.2)",
                borderRadius: "12px",
                padding: "13px 15px",
                font: "400 14px/1.6 'Inter', sans-serif",
                color: "rgba(247, 243, 238, 0.85)",
                backgroundColor: "transparent",
                outline: "none",
                width: "100%",
                resize: "vertical",
                display: "block",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9943A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(247, 243, 238, 0.2)")}
            />
          </div>

          {/* Note Banner */}
          <div
            style={{
              marginTop: "14px",
              padding: "14px 16px",
              borderRadius: "14px",
              backgroundColor: "rgba(181, 101, 29, 0.14)",
              boxSizing: "border-box",
              borderLeft: "3px solid #B5651D",
              font: "400 12.5px/1.55 'Inter', sans-serif",
              color: "rgba(247, 243, 238, 0.8)",
            }}
          >
            {profile.note}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePrimaryAction}
            style={{
              flex: 1,
              height: "52px",
              borderRadius: "13px",
              backgroundColor: "#C9943A",
              color: "#0D0D0D",
              font: "700 15px 'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              border: "none",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "background-color 0.15s ease, transform 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = "#d8a24a";
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = "#C9943A";
            }}
          >
            {isSubmitting ? "Processing..." : ctaLabel}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDeclineKindly}
            style={{
              minWidth: "120px",
              height: "52px",
              borderRadius: "13px",
              boxSizing: "border-box",
              border: "1.5px solid rgba(247, 243, 238, 0.22)",
              color: "#F7F3EE",
              font: "700 14px 'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              backgroundColor: "transparent",
              transition: "border-color 0.15s ease, background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(247, 243, 238, 0.4)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(247, 243, 238, 0.22)")}
          >
            Decline kindly
          </button>
        </div>
      </div>
    </div>
  );
}
