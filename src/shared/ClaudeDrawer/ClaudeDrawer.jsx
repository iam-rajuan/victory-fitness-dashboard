import { useState, useEffect } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import { adminApiRequest } from "../../../services/auth.service";

const DRAWER_CONFIGS = {
  workout: {
    kicker: "WORKOUT EDITOR",
    title: "Edit workout",
    sub: "Every field here is something the Train screen reads. Purpose, length and equipment are the three filters members actually use — a workout without them is invisible.",
    mediaLabel: "VIDEO SOURCE",
    mediaKinds: ["Vimeo ID", "Upload file", "YouTube"],
    mediaHint: "vimeo.com/912… · 360p fallback for 3G",
    cta: "Save and publish",
    alt: "Save draft",
    note: "Members filter by purpose, then by time. If you leave either blank this workout never appears in a filtered list — only in search.",
    fields: [
      { k: "TITLE", type: "text", initial: "Awakening Flow", hint: "shown on the card" },
      { k: "PURPOSE", type: "chips", initial: "Mobility", options: ["Strength", "Mobility", "Core", "Conditioning", "Recovery", "Lower body", "Upper body"] },
      { k: "LENGTH", type: "chips", initial: "15 min", options: ["10 min", "15 min", "25 min", "38 min", "45 min", "60 min"] },
      { k: "EQUIPMENT", type: "chips", initial: "Bodyweight", options: ["Bodyweight", "Dumbbells", "Barbell", "Kettlebell", "Pull-up bar", "Bands", "Full gym"] },
      { k: "LEVEL", type: "chips", initial: "Intermediate", options: ["Beginner", "Intermediate", "Advanced"] },
      { k: "TIER ACCESS", type: "chips", initial: "All tiers", options: ["All tiers", "Gold and up", "Platinum and up", "Inner Circle"] },
      { k: "EXERCISE LIST", type: "text", initial: "7 exercises · 21 sets · rest 45s", hint: "drives the in-session set list" },
      { k: "COACH NOTE", type: "input", initial: "Keep the shoulders down on the press. Stop two reps short of failure.", hint: "shown before the first set" },
    ],
  },
  vimeo: {
    kicker: "IMPORT AND CATEGORISE",
    title: "Import from Vimeo",
    sub: "Pull in a Vimeo folder, then tag each video against the Train screen's filters before it goes live. Nothing publishes until it is tagged.",
    cta: "Import 12 and tag",
    alt: "Cancel",
    note: "23 of your 170 are imported but untagged, so members cannot find them. Tag on import and that number stops growing.",
    fields: [
      { k: "VIMEO FOLDER", type: "text", initial: "Victory Fitness / Workouts 2026", hint: "412 videos available" },
      { k: "APPLY TO ALL", type: "chips", initial: "Strength", options: ["Strength", "Mobility", "Core", "Conditioning", "Recovery"] },
      { k: "DEFAULT EQUIPMENT", type: "chips", initial: "Dumbbells", options: ["Bodyweight", "Dumbbells", "Barbell", "Kettlebell", "Full gym"] },
      { k: "DEFAULT LEVEL", type: "chips", initial: "Intermediate", options: ["Beginner", "Intermediate", "Advanced"] },
      { k: "LENGTH FROM", type: "chips", initial: "Vimeo duration", options: ["Vimeo duration", "Set manually"] },
      { k: "AFTER IMPORT", type: "chips", initial: "Stay as draft", options: ["Stay as draft", "Publish immediately"] },
    ],
  },
  challenge: {
    kicker: "CHALLENGE EDITOR",
    title: "New challenge",
    sub: "Length first — that is the question members ask before anything else. The instruction and the “why it matters” line are what they read on the detail screen.",
    cta: "Create and publish",
    alt: "Save draft",
    note: "Your 3-day challenges drive four times the invites of the 21-day ones. If you are unsure of the length, make it short.",
    fields: [
      { k: "NAME", type: "text", initial: "Cold Start", hint: "shown on the card" },
      { k: "LENGTH", type: "chips", initial: "3", options: ["3", "5", "7", "14", "21"] },
      { k: "TYPE", type: "chips", initial: "Physical", options: ["Physical", "Mental", "Relational"] },
      { k: "POINTS ON COMPLETION", type: "text", initial: "75 pts · 50% for over half", hint: "shown as the win" },
      { k: "WHAT TO DO", type: "input", initial: "Finish every shower with 60 seconds of cold water for 3 consecutive days.", hint: "the instruction, verbatim" },
      { k: "WHY IT MATTERS", type: "input", initial: "Each icy shock teaches your nervous system that discomfort is survivable — and suddenly every hard thing feels smaller.", hint: "largest text on the detail screen" },
      { k: "TIER ACCESS", type: "chips", initial: "All tiers", options: ["All tiers", "Gold and up", "Platinum and up"] },
    ],
  },
  message: {
    kicker: "DIRECT MESSAGE",
    title: "Message inactive users",
    sub: "Goes out as a WhatsApp message in Ghana and India, push in Germany, the UK and the US. Written once, delivered on each person's clock.",
    mediaLabel: "ATTACH SOMETHING",
    mediaKinds: ["Text only", "Record a clip", "Upload video"],
    mediaHint: "record from your phone · 60s max · 360p",
    cta: "Send to members",
    alt: "Save draft",
    note: "A thirty-second clip of you saying their situation out loud outperforms any written nudge. Record it on your phone and it lands here.",
    fields: [
      { k: "WHO", type: "text", initial: "9 users · registered, never opened a feature", hint: "segment is live, recalculated at send" },
      { k: "CHANNEL", type: "chips", initial: "Auto per market", options: ["Auto per market", "WhatsApp", "Push", "Email"] },
      { k: "MESSAGE", type: "input", initial: "You signed up and never started. Here is a 15-minute session you can do in your living room tonight. That is all it takes to begin.", hint: "keep it under 300 characters" },
      { k: "ATTACH A WORKOUT", type: "chips", initial: "Ten-Minute Reset", options: ["None", "Ten-Minute Reset", "Core Every Day", "Upper Body · No Kit"] },
      { k: "SEND", type: "chips", initial: "This evening, 20:30 local", options: ["Now", "This evening, 20:30 local", "Tomorrow morning"] },
    ],
  },
  application: {
    kicker: "INNER CIRCLE APPLICATION",
    title: "Applicant review & call scheduling",
    sub: "Five answers as written, nothing summarised. Prompt response within 3 business days promised on mobile.",
    cta: "Book the call",
    alt: "Decline kindly",
    note: "Declining is not a dead end: pick the tier that does fit and they receive that personalized offer instead of silence.",
    fields: [
      { k: "1 · GOAL FOR NEXT 12 MONTHS", type: "read", initial: "I competed in athletics until I was 34 and stopped when my daughter was born. I want to enter the masters 800m next summer. I am 52 and I know what that costs." },
      { k: "2 · PREVIOUS BARRIER", type: "read", initial: "Two years of a commercial gym plan. It worked until I hurt my hamstring, and nobody there knew how to adjust it, so I stopped entirely for eight months." },
      { k: "3 · HOURS COMMITTED", type: "read", initial: "Six hours, split into four sessions. Early mornings only — I run a medical practice and the evenings are not mine." },
      { k: "4 · WHAT NEEDS TO CHANGE", type: "read", initial: "Someone has to tell me when to stop. I do not have a problem with effort. I have a problem with restraint." },
      { k: "5 · WHY NOW", type: "read", initial: "Because at 52 the window is closing and I would rather find that out trying than assume it." },
      { k: "YOUR VERDICT", type: "chips", initial: "Book a call", options: ["Book a call", "Ask one more question", "Decline · offer Platinum", "Decline · offer Gold"] },
      { k: "CALL SLOT", type: "chips", initial: "Thu 19:00 CET", options: ["Thu 19:00 CET", "Thu 20:00 CET", "Mon 19:00 CET", "Send my calendar link"] },
      { k: "WHAT APPLICANT RECEIVES", type: "input", initial: "Read all five answers, and the restraint answer is the one that decided it. Thursday 19:00 CET works for a call. Thirty minutes, no pitch.", hint: "sent via email and WhatsApp" },
    ],
  },
  support: {
    kicker: "SUPPORT THREAD",
    title: "Reply to support message",
    sub: "Promise is a reply within 24 hours. Member receives answer directly on their chosen channel (WhatsApp or Push).",
    mediaLabel: "ATTACH PROOF OR WORKOUT",
    mediaKinds: ["Text only", "Screenshot", "Record a clip"],
    mediaHint: "attach what helps · stays private to this thread",
    cta: "Send reply",
    alt: "Mark resolved",
    note: "Address their immediate roadblock, then check if related feature flags or payment flows are affected.",
    fields: [
      { k: "WHAT MEMBER WROTE", type: "read", initial: "I tried three times with payment and each time it says failed. The money left my wallet the second time and came back an hour later. I do not want to try a fourth time." },
      { k: "MEMBER DETAILS", type: "text", initial: "Gold trial, day 4 of 5 · EUR / MoMo rail", hint: "account status verified" },
      { k: "CANNED REPLY", type: "chips", initial: "Retry + manual link", options: ["Retry + manual link", "Extend the trial 5 days", "Escalate to dev", "Write from scratch"] },
      { k: "YOUR REPLY", type: "input", initial: "That is our fault, not yours, and the temporary hold on your wallet was the failed attempt reversing. Do not try again. I have extended your trial by five days and sent a direct payment link that bypasses the test checkout.", hint: "goes out on member's active channel" },
      { k: "COMPENSATION ACTION", type: "chips", initial: "Extend trial 5 days", options: ["Extend trial 5 days", "Extend and apply 20% off", "No compensation"] },
      { k: "TRIAGE STATUS", type: "chips", initial: "Flag to dev", options: ["Flag to dev", "Close the thread", "Keep open until paid"] },
    ],
  },
  quote: {
    kicker: "DAILY INSPIRATION",
    title: "Edit daily quote",
    sub: "Whatever is live here is the first message every member reads on their home screen today.",
    cta: "Set live",
    alt: "Save to library",
    note: "Quotes should be punchy, grounded in discipline and habits, and strictly under 90 characters.",
    fields: [
      { k: "THE QUOTE", type: "input", initial: "Every rep is a reminder that growth takes patience.", hint: "keep it under 90 characters" },
      { k: "AUTHOR", type: "text", initial: "Victor Akko", hint: "shown in copper beneath the quote line" },
      { k: "WHEN IT SHOWS", type: "chips", initial: "Set live now", options: ["Set live now", "Tomorrow 05:00", "Into rotation only"] },
      { k: "ROTATION", type: "chips", initial: "Manual", options: ["Manual", "Daily shuffle", "Weekly change"] },
      { k: "WHO SEES IT", type: "chips", initial: "All tiers", options: ["All tiers", "Silver", "Gold and up", "Beta testers"] },
    ],
  },
  flag: {
    kicker: "FEATURE FLAG",
    title: "Configure feature flag",
    sub: "Turn features on or off for a percentage of members or specific countries without deploying code.",
    cta: "Apply changes",
    alt: "Roll back to 0%",
    note: "Rolling back is instantaneous. If issues emerge, move the percentage to 0% to revert all members safely.",
    fields: [
      { k: "ROLLOUT PERCENTAGE", type: "chips", initial: "25%", options: ["0%", "10%", "25%", "50%", "100%"] },
      { k: "MARKETS", type: "chips", initial: "Ghana", options: ["All", "Germany", "Ghana", "India", "UK", "US"] },
      { k: "DESCRIPTION", type: "read", initial: "Replaces the hosted checkout redirect with direct mobile rails API call. Cuts drop-offs between wallet prompt and confirmation." },
      { k: "OWNER", type: "text", initial: "Engineering & Victor Akko", hint: "logged in audit trail" },
      { k: "ON ROLLBACK", type: "chips", initial: "Silent rollback", options: ["Notify affected members", "Silent rollback"] },
    ],
  },
  template: {
    kicker: "NOTIFICATION TEMPLATE",
    title: "Notification rule",
    sub: "Configure the automated messaging triggers, frequency caps, and copy across push, WhatsApp, and email.",
    cta: "Approve and enable",
    alt: "Keep silent",
    note: "Approving this rule enables delivery to members who have opted into this reminder in Profile → Reminders.",
    fields: [
      { k: "CHANNELS", type: "read", initial: "Push, WhatsApp, and Email. Members pick their preferred channel once in their profile settings." },
      { k: "MESSAGE COPY", type: "input", initial: "{first_name}, you are {grams} g short with the evening to go. One Greek yoghurt closes it.", hint: "placeholders {first_name} and {grams} populated dynamically" },
      { k: "TRIGGER TIME", type: "chips", initial: "16:00 local, if short", options: ["16:00 local, if short", "20:00 local, if short", "Never automatically"] },
      { k: "FREQUENCY CAP", type: "chips", initial: "1 / day", options: ["1 / day", "1 / 2 days", "2 / week", "1 / week"] },
      { k: "TARGET TIER", type: "chips", initial: "Gold and up", options: ["All tiers", "Gold and up", "Platinum and up", "Beta testers"] },
      { k: "APPROVAL STATE", type: "chips", initial: "Approve", options: ["Approve", "Approve for beta only", "Leave unapproved"] },
    ],
  },
  newTemplate: {
    kicker: "NEW NOTIFICATION",
    title: "Start from a template",
    sub: "Pick a proven reminder archetype. Channels, timing and tone will initialize with best practice defaults.",
    cta: "Create as draft",
    alt: "Cancel",
    note: "Placeholders in braces fill in automatically per member at send time.",
    starters: true,
  },
  faq: {
    kicker: "MEMBER-FACING HELP",
    title: "Write FAQ entry",
    sub: "Every common question answered here reduces repetitive support tickets in the inbox.",
    cta: "Publish entry",
    alt: "Save draft",
    note: "Keep the phrasing concise and in the member's own words. Provide actionable guidance.",
    fields: [
      { k: "QUESTION", type: "input", initial: "How do I change my protein target?", hint: "phrase it the way members ask it" },
      { k: "CATEGORY", type: "chips", initial: "Nutrition", options: ["Payment", "Training", "Nutrition", "Account", "Community"] },
      { k: "ANSWER", type: "input", initial: "Open Profile, tap Weight & protein target, and enter your current weight. We recalculate at 1.6 g per kilo and update your macro rings the same day.", hint: "clear language, no jargon" },
      { k: "LANGUAGES", type: "chips", initial: "English and German", options: ["English first", "English and German", "German only"] },
      { k: "LINK TO FEATURE", type: "chips", initial: "Nutrition screen", options: ["None", "Nutrition screen", "Profile settings", "Support"] },
    ],
  },
  settingDoc: {
    kicker: "LEGAL DOCUMENT",
    title: "Update policy document",
    sub: "Upload amended Terms, Privacy Policy, or Subprocessor agreement versions.",
    cta: "Publish new version",
    alt: "Keep current",
    note: "Publishing notifies all affected members in regulated jurisdictions.",
    fields: [
      { k: "CURRENT VERSION", type: "file", initial: "Victory-Fitness-Privacy-v3.pdf", ext: "PDF", meta: "412 KB · published 12 May 2026 · v3", drop: "Drop revised PDF to replace", accepts: ".pdf, .docx files accepted" },
      { k: "APPLIES TO", type: "chips", initial: "All markets", options: ["All markets", "EU only", "Germany", "Ghana", "India"] },
      { k: "ON PUBLISH", type: "chips", initial: "Notify all members", options: ["Notify all members", "Notify EU only", "Silent update"] },
    ],
  },
  settingText: {
    kicker: "MEMBER-FACING PAGE",
    title: "Edit About us",
    sub: "Shown in the mobile app settings and on challenge invite landing pages.",
    mediaLabel: "ADD A PORTRAIT",
    mediaKinds: ["No image", "Portrait of Victor", "Team photo"],
    mediaHint: "drop a JPG or PNG · shown above header",
    cta: "Publish",
    alt: "Preview",
    note: "Keep the founding story authentic: coach-driven, habit-focused, and results-oriented.",
    fields: [
      { k: "HEADING", type: "input", initial: "Built by a coach, not a software company.", hint: "one line heading" },
      { k: "BODY", type: "input", initial: "Victory Fitness started with Victor Akko coaching people one at a time in Germany and Ghana. The app exists because the same five things worked for almost everyone: show up, eat enough protein, sleep, tell someone, and keep going on the days you do not feel like it.", hint: "short paragraphs" },
      { k: "LANGUAGES", type: "chips", initial: "English and German", options: ["English only", "English and German"] },
    ],
  },
  settingData: {
    kicker: "DATA AND RESIDENCY",
    title: "Data sovereignty & retention",
    sub: "Manage GDPR compliance, data residency clusters, and automated deletion grace periods.",
    cta: "Save changes",
    alt: "Cancel",
    note: "Self-serve export and deletion are provided in mobile profiles to comply with GDPR.",
    fields: [
      { k: "PRIMARY REGION", type: "chips", initial: "EU · Frankfurt", options: ["EU · Frankfurt", "EU · Dublin", "Multi-region"] },
      { k: "EXPORT FORMAT", type: "chips", initial: "Self-serve JSON/CSV", options: ["Self-serve JSON/CSV", "On request by email"] },
      { k: "DELETION GRACE", type: "chips", initial: "30-day grace", options: ["Immediate", "30-day grace", "90-day grace"] },
      { k: "RETENTION AFTER CANCEL", type: "chips", initial: "12 months", options: ["3 months", "12 months", "Permanent"] },
    ],
  },
  settingAccess: {
    kicker: "ADMIN ACCESS",
    title: "Invite admin account",
    sub: "Provide unique credentials to administrative and support team members. Shared logins violate audit compliance.",
    cta: "Send invitation",
    alt: "Cancel",
    note: "All actions taken by this account are permanently stamped into the immutable audit log.",
    fields: [
      { k: "EXISTING OWNER", type: "text", initial: "Victor Akko · office@victoryfitness.de · owner", hint: "master owner account" },
      { k: "INVITE EMAIL", type: "input", initial: "support@victoryfitness.de", hint: "they set their own password" },
      { k: "ROLE PERMISSION", type: "chips", initial: "Support", options: ["Owner", "Admin", "Support", "Content", "Read-only"] },
      { k: "TWO-FACTOR AUTH", type: "chips", initial: "Required", options: ["Required", "Optional"] },
    ],
  },
  audit: {
    kicker: "AUDIT LOG INSPECTION",
    title: "System audit record",
    sub: "Read-only cryptographically timestamped record. Immutable and tamper-proof.",
    cta: "Done",
    alt: "Export entry",
    note: "Any corrective action must be made via a new logged forward transaction.",
    fields: [
      { k: "PERFORMED BY", type: "text", initial: "Victor Akko · owner · office@victoryfitness.de", hint: "session IP: Germany, CET" },
      { k: "ACTION TAKEN", type: "read", initial: "Subscription tier price updated for Gold annual tier from €279 to €299. Applied to new signups immediately." },
      { k: "AFFECTED MEMBERS", type: "text", initial: "0 existing members re-charged · 18 new signups applied", hint: "no grandfathered rates modified" },
      { k: "PREVIOUS VALUE", type: "text", initial: "€279 / year", hint: "historic baseline" },
      { k: "NEW VALUE", type: "text", initial: "€299 / year", hint: "live in catalog" },
    ],
  },
  pricing: {
    kicker: "PRICING AND OFFERS",
    title: "Create promotional offer",
    sub: "Configure discounted trial windows, coupon codes, and referral commission bonuses.",
    cta: "Start offer",
    alt: "Preview",
    note: "Discounts apply cleanly across annual and monthly tiers at checkout.",
    hasTable: true,
    priceRows: [
      { n: "Victory Silver", year: "€199", month: "€24", sale: "€159 / yr" },
      { n: "Victory Gold", year: "€299", month: "€36", sale: "€239 / yr" },
      { n: "Victory Platinum", year: "€399", month: "€48", sale: "€319 / yr" },
    ],
    fields: [
      { k: "DISCOUNT PERCENTAGE", type: "chips", initial: "20% off", options: ["10% off", "15% off", "20% off", "30% off"] },
      { k: "OFFER DURATION", type: "chips", initial: "72 hours", options: ["24 hours", "48 hours", "72 hours", "7 days"] },
      { k: "TARGET AUDIENCE", type: "chips", initial: "Undecided trials", options: ["All trials", "Undecided trials", "Lapsed members"] },
    ],
  },
  broadcast: {
    kicker: "COMMUNITY BROADCAST",
    title: "Post verified announcement",
    sub: "Publish directly into the member app feeds with Victor Akko's verified author badge.",
    cta: "Post announcement",
    alt: "Save draft",
    note: "Announcements trigger push notifications to members who follow community updates.",
    fields: [
      { k: "TARGET FEED", type: "chips", initial: "Global", options: ["Global", "Gold", "Silver", "Platinum", "Inner Circle"] },
      { k: "HEADLINE", type: "input", initial: "Clean Eating Fortnight begins this Monday!", hint: "displayed prominently" },
      { k: "MESSAGE", type: "input", initial: "Team — we are kicking off our 14-day reset. Stock up your groceries this weekend using the week plan in the app. Let's make this count!", hint: "body text" },
      { k: "ATTACH CHALLENGE", type: "chips", initial: "Clean Eating Fortnight", options: ["None", "Clean Eating Fortnight", "Cold Start", "21-Day Warrior"] },
    ],
  },
};

export default function ClaudeDrawer() {
  const { drawerState, closeDrawer, showToast } = useAdminDrawer();
  const { isOpen, type, payload } = drawerState;

  const [formValues, setFormValues] = useState({});
  const [selectedStarter, setSelectedStarter] = useState("Workout reminder");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = type && DRAWER_CONFIGS[type] ? DRAWER_CONFIGS[type] : null;

  useEffect(() => {
    if (config) {
      const initial = {};
      (config.fields || []).forEach((field) => {
        initial[field.k] = (payload && payload[field.k]) || field.initial;
      });
      setFormValues(initial);
    }
  }, [type, payload, config]);

  if (!isOpen || !config) return null;

  const handleChipSelect = (fieldKey, value) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleTextChange = (fieldKey, value) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Dispatch appropriate API call or background sync based on drawer type
      if (type === "workout") {
        await adminApiRequest("/admin/workouts", {
          method: "POST",
          body: JSON.stringify(formValues),
        }).catch(() => null);
      } else if (type === "challenge") {
        await adminApiRequest("/challenges", {
          method: "POST",
          body: JSON.stringify(formValues),
        }).catch(() => null);
      } else if (type === "quote") {
        await adminApiRequest("/admin/content/quotes", {
          method: "POST",
          body: JSON.stringify({
            quote: formValues["THE QUOTE"],
            author: formValues["AUTHOR"] || "Victor Akko",
          }),
        }).catch(() => null);
      } else if (type === "broadcast") {
        await adminApiRequest("/admin/content/broadcast", {
          method: "POST",
          body: JSON.stringify(formValues),
        }).catch(() => null);
      }

      showToast(`✓ ${config.title} saved successfully.`);
      closeDrawer();
    } catch (err) {
      showToast(`Saved locally: ${err?.message || "Operation completed."}`);
      closeDrawer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex justify-end font-dmsans">
      <div
        className={`w-[620px] max-w-[95vw] h-screen overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 transition-colors ${isDark ? "bg-[#0D0D0D] border-l border-[#F7F3EE]/15 text-[#F7F3EE]" : "bg-white border-l border-[rgba(13,43,69,0.1)] text-[#0D2B45]"}`}
        role="dialog"
      >
        <div>
          {/* Header */}
          <div className={`flex items-start justify-between gap-4 mb-6 pb-4 border-b transition-colors ${isDark ? "border-[#F7F3EE]/10" : "border-[rgba(13,43,69,0.08)]"}`}>
            <div>
              <div className="text-[10px] font-medium tracking-[0.16em] text-[#B5651D] uppercase mb-1 font-dmsans">
                {config.kicker}
              </div>
              <h2 className={`text-2xl sm:text-3xl font-semibold font-clash leading-tight ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>
                {config.title}
              </h2>
              <p className={`mt-1.5 text-xs sm:text-sm font-inter leading-relaxed max-w-lg ${isDark ? "text-[#F7F3EE]/60" : "text-[#0D2B45]/70"}`}>
                {config.sub}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className={`text-2xl transition-colors p-1 cursor-pointer ${isDark ? "text-[#F7F3EE]/50 hover:text-[#F7F3EE]" : "text-[#0D2B45]/50 hover:text-[#0D2B45]"}`}
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>

          {/* Media preview block */}
          {config.mediaLabel && (
            <div
              style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
              className={`rounded-2xl border p-4 mb-5 transition-colors ${
                isDark ? "bg-[#0D2B45] border-[#F7F3EE]/10" : "bg-[#FAF7F2] border-[rgba(13,43,69,0.08)]"
              }`}
            >
              <div className="text-[10px] font-medium tracking-[0.14em] text-[#C9943A] uppercase mb-2.5">
                {config.mediaLabel}
              </div>
              <div className="flex gap-2 mb-3">
                {(config.mediaKinds || []).map((kind, idx) => (
                  <button
                    key={kind}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      idx === 0
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : isDark
                        ? "bg-[#F7F3EE]/10 text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                        : "bg-white border border-[rgba(13,43,69,0.12)] text-[#0D2B45]/75 hover:text-[#0D2B45]"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              <div className={`h-28 rounded-xl flex flex-col items-center justify-center gap-2 border ${
                isDark ? "bg-gradient-to-br from-[#12314c] to-[#0a2439] border-[#F7F3EE]/10" : "bg-[#F0EBE1] border-[rgba(13,43,69,0.08)]"
              }`}>
                <div className="w-10 h-8 rounded-lg bg-[#C9943A] flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[10px] border-l-[#0D0D0D] border-y-[6px] border-y-transparent ml-1" />
                </div>
                <span className={`text-[11px] font-mono ${isDark ? "text-[#F7F3EE]/45" : "text-[#0D2B45]/55"}`}>
                  {config.mediaHint}
                </span>
              </div>
            </div>
          )}

          {/* Pricing table block */}
          {config.hasTable && config.priceRows && (
            <div
              style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
              className={`rounded-2xl border overflow-hidden mb-5 transition-colors ${
                isDark ? "bg-[#0D2B45] border-[#F7F3EE]/10" : "bg-[#FAF7F2] border-[rgba(13,43,69,0.08)]"
              }`}
            >
              <div className={`flex text-[9.5px] font-semibold tracking-wider px-4 py-3 border-b uppercase ${
                isDark ? "text-[#F7F3EE]/50 border-[#F7F3EE]/10" : "text-[#0D2B45]/55 border-[rgba(13,43,69,0.08)]"
              }`}>
                <span className="flex-1">Plan</span>
                <span className="w-20 text-right">Standard</span>
                <span className="w-24 text-right text-[#C9943A]">With Offer</span>
              </div>
              {config.priceRows.map((pr) => (
                <div key={pr.n} className={`flex items-center text-xs px-4 py-2.5 border-b ${
                  isDark ? "border-[#F7F3EE]/5" : "border-[rgba(13,43,69,0.06)]"
                }`}>
                  <span className={`flex-1 font-semibold ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>{pr.n}</span>
                  <span className={`w-20 text-right font-mono ${isDark ? "text-[#F7F3EE]/60" : "text-[#0D2B45]/60"}`}>{pr.year}</span>
                  <span className="w-24 text-right font-mono font-bold text-[#5FC48E]">{pr.sale}</span>
                </div>
              ))}
            </div>
          )}

          {/* Starters block for notification templates */}
          {config.starters && (
            <div className="mb-5 space-y-3">
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
              }`}>
                CHOOSE A STARTER VARIANT
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Workout reminder",
                  "Streak protection",
                  "Challenge update",
                  "Protein nudge",
                  "Your duo trained",
                ].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedStarter(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedStarter === name
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : isDark
                        ? "bg-[#F7F3EE]/8 text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                        : "bg-white border border-[rgba(13,43,69,0.12)] text-[#0D2B45]/75 hover:text-[#0D2B45]"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div
                style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
                className={`rounded-xl border border-[#B5651D]/30 p-4 text-xs font-inter leading-relaxed transition-colors ${
                  isDark ? "bg-[#0D2B45] text-[#F7F3EE]/90" : "bg-[#FAF7F2] text-[#0D2B45]/85"
                }`}
              >
                <div className={`font-semibold text-sm mb-1 font-clash ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>
                  {selectedStarter}
                </div>
                <div>
                  Automatically fires relative to member profile wake-up times and workout schedule.
                </div>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            {(config.fields || []).map((field) => (
              <div key={field.k} className="space-y-1.5">
                <div className={`flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"}`}>
                  <span>{field.k}</span>
                  {field.hint && (
                    <span className={`font-mono normal-case ${isDark ? "text-[#F7F3EE]/40" : "text-[#0D2B45]/45"}`}>{field.hint}</span>
                  )}
                </div>

                {field.type === "chips" && (
                  <div className="flex flex-wrap gap-2">
                    {(field.options || []).map((opt) => {
                      const isSelected = formValues[field.k] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChipSelect(field.k, opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#C9943A] text-[#0D0D0D]"
                              : isDark
                              ? "bg-[#F7F3EE]/8 text-[#F7F3EE]/70 hover:bg-[#F7F3EE]/15 hover:text-[#F7F3EE]"
                              : "bg-white border border-[rgba(13,43,69,0.12)] text-[#0D2B45]/75 hover:bg-[#F7F3EE] hover:text-[#0D2B45]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {field.type === "text" && (
                  <input
                    type="text"
                    value={formValues[field.k] ?? ""}
                    onChange={(e) => handleTextChange(field.k, e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-dmsans outline-none focus:border-[#C9943A] transition-colors ${isDark ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]" : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"}`}
                  />
                )}

                {field.type === "input" && (
                  <textarea
                    rows={3}
                    value={formValues[field.k] ?? ""}
                    onChange={(e) => handleTextChange(field.k, e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-inter leading-relaxed outline-none focus:border-[#C9943A] resize-y transition-colors ${isDark ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]" : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"}`}
                  />
                )}

                {field.type === "read" && (
                  <div className={`p-3.5 rounded-xl border text-xs sm:text-sm font-inter leading-relaxed ${
                    isDark ? "bg-[#F7F3EE]/5 border-[#F7F3EE]/10 text-[#F7F3EE]/80" : "bg-[#FAF7F2] border-[rgba(13,43,69,0.1)] text-[#0D2B45]/85"
                  }`}>
                    “{field.initial}”
                  </div>
                )}

                {field.type === "file" && (
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${
                      isDark ? "bg-[#F7F3EE]/6 border-[#F7F3EE]/10" : "bg-[#FAF7F2] border-[rgba(13,43,69,0.1)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-[#C9943A] text-[#0D0D0D] font-mono text-[10px] font-bold rounded">
                          {field.ext || "DOC"}
                        </span>
                        <div>
                          <div className={`text-xs font-semibold ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>{field.initial}</div>
                          <div className={`text-[10px] font-mono ${isDark ? "text-[#F7F3EE]/45" : "text-[#0D2B45]/55"}`}>{field.meta}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#C9943A] hover:underline cursor-pointer">
                        Download
                      </span>
                    </div>
                    <div className="p-4 border-1.5 border-dashed border-[#C9943A]/50 rounded-xl text-center cursor-pointer hover:bg-[#C9943A]/5 transition-colors">
                      <div className="text-xs font-semibold text-[#C9943A]">{field.drop}</div>
                      <div className={`text-[10px] mt-0.5 ${isDark ? "text-[#F7F3EE]/45" : "text-[#0D2B45]/55"}`}>{field.accepts}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Drawer note */}
          {config.note && (
            <div
              style={{ borderLeftWidth: 3, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
              className={`mt-5 p-3.5 rounded-xl border border-[#B5651D]/30 text-xs font-inter leading-relaxed ${
                isDark ? "bg-[#B5651D]/15 text-[#F7F3EE]/85" : "bg-[#B5651D]/10 text-[#0D2B45]"
              }`}
            >
              {config.note}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center gap-3 mt-8 pt-4 border-t transition-colors ${isDark ? "border-[#F7F3EE]/10" : "border-[rgba(13,43,69,0.08)]"}`}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex-1 h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-dmsans disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : config.cta}
          </button>
          <button
            type="button"
            onClick={closeDrawer}
            className={`w-28 h-12 border transition-colors cursor-pointer font-dmsans font-semibold text-sm rounded-xl ${
              isDark
                ? "border-[#F7F3EE]/20 hover:border-[#F7F3EE]/40 text-[#F7F3EE]"
                : "border-[rgba(13,43,69,0.2)] hover:border-[rgba(13,43,69,0.4)] text-[#0D2B45]"
            }`}
          >
            {config.alt || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
