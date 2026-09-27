import { useState, useEffect, useMemo } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import { adminApiRequest } from "../../../services/auth.service";
import { previewAdminWorkoutSync, syncAdminWorkouts, uploadAdminWorkoutVideo } from "../../../services/admin-workouts.service";
import ClaudeApplicationDrawer from "./ClaudeApplicationDrawer";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";

function readVideoDurationSeconds(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(0);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const seconds = Number.isFinite(video.duration) ? Math.max(0, Math.round(video.duration)) : 0;
      URL.revokeObjectURL(objectUrl);
      resolve(seconds);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    video.src = objectUrl;
  });
}

function formatDurationLabelFromSeconds(seconds) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  if (!total) return "";
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

const PRICE_TABLE = [
  ["Victory Silver", 199, 24, "Silver"],
  ["Victory Gold", 299, 36, "Gold"],
  ["Victory Platinum", 399, 48, "Platinum"],
  ["Victory Inner Circle", 0, 0, "Inner Circle"],
];

const STARTERS = [
  [
    "Today's session",
    "Workout reminder",
    "1 / day",
    "Member's chosen time",
    "{first_name}, today is {workout_name} — {minutes} minutes, {equipment}. Your podcast is waiting.",
    "On a day the member planned to train and has not yet finished a session.",
  ],
  [
    "Yesterday did not happen",
    "Workout reminder",
    "1 / day",
    "Member's time, next morning",
    "{first_name}, yesterday did not happen. Today can. {workout_name} is still there, {minutes} minutes.",
    "Morning after a planned day with no session. Never mentions the streak.",
  ],
  [
    "New workouts added",
    "Workout reminder",
    "1 / day",
    "Member's time, Mondays",
    "{new_count} new workouts in the library this week — {new_example} among them.",
    "Only when something was actually published. Silent in a week with no additions.",
  ],
  [
    "Challenge day due",
    "Challenge update",
    "2 / week",
    "Member's chosen time",
    "{first_name}, day {challenge_day} of {challenge_name}. {cohort_done} of your cohort have already ticked today.",
    "While a challenge is active and that day is unticked. Competes for the same 2 a week as the other challenge variants.",
  ],
  [
    "Challenge starting tomorrow",
    "Challenge update",
    "2 / week",
    "Member's time, day before",
    "{challenge_name} opens tomorrow — {challenge_days} days, {challenge_points} points. {cohort_size} people are in.",
    "Day before a challenge the member joined begins. Takes priority over the day-due variant.",
  ],
  [
    "Challenge nearly done",
    "Challenge update",
    "2 / week",
    "Member's chosen time",
    "{first_name}, {days_left} days left on {challenge_name}. You have come too far to leave it here.",
    "Once, when three days or fewer remain. Highest priority of the challenge variants.",
  ],
  [
    "Cohort milestone",
    "Challenge update",
    "2 / week",
    "Member's chosen time",
    "{cohort_done} people in your cohort finished {challenge_name} today. You are on day {challenge_day}.",
    "Social proof from the member's own cohort. Lowest priority — dropped first when the cap is reached.",
  ],
];

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
      { k: "TITLE", type: "text", initial: "New workout", hint: "shown on the card" },
      { k: "PURPOSE", type: "chips", initial: "Mobility", options: ["Strength", "Mobility", "Core", "Conditioning", "Recovery", "Lower body", "Upper body"] },
      { k: "LENGTH", type: "chips", initial: "15 min", options: ["10 min", "15 min", "25 min", "38 min", "45 min", "60 min"] },
      { k: "EQUIPMENT", type: "chips", initial: "Bodyweight", options: ["Bodyweight", "Dumbbells", "Barbell", "Kettlebell", "Pull-up bar", "Bands", "Full gym"] },
      { k: "LEVEL", type: "chips", initial: "Intermediate", options: ["Beginner", "Intermediate", "Advanced"] },
      { k: "TIER ACCESS", type: "chips", initial: "All tiers", options: ["All tiers", "Gold and up", "Platinum and up", "Inner Circle"] },
      { k: "MOVEMENTS", type: "movements", initial: [], hint: "drives the in-session set list" },
      { k: "COACH NOTE", type: "input", initial: "Keep the shoulders down on the press. Stop two reps short of failure.", hint: "shown before the first set" },
    ],
  },
  masterclass: {
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
      { k: "TITLE", type: "text", initial: "New workout", hint: "shown on the card" },
      { k: "PURPOSE", type: "chips", initial: "Mobility", options: ["Strength", "Mobility", "Core", "Conditioning", "Recovery", "Lower body", "Upper body"] },
      { k: "LENGTH", type: "chips", initial: "15 min", options: ["10 min", "15 min", "25 min", "38 min", "45 min", "60 min"] },
      { k: "EQUIPMENT", type: "chips", initial: "Bodyweight", options: ["Bodyweight", "Dumbbells", "Barbell", "Kettlebell", "Pull-up bar", "Bands", "Full gym"] },
      { k: "LEVEL", type: "chips", initial: "Intermediate", options: ["Beginner", "Intermediate", "Advanced"] },
      { k: "TIER ACCESS", type: "chips", initial: "All tiers", options: ["All tiers", "Gold and up", "Platinum and up", "Inner Circle"] },
      { k: "MOVEMENTS", type: "movements", initial: [], hint: "drives the in-session set list" },
      { k: "COACH NOTE", type: "input", initial: "Keep the shoulders down on the press. Stop two reps short of failure.", hint: "shown before the first set" },
    ],
  },
  vimeo: {
    kicker: "IMPORT AND CATEGORISE",
    title: "Import from Vimeo",
    sub: "Pull in a Vimeo folder, then tag each video against the Train screen's filters before it goes live. Nothing publishes until it is tagged.",
    cta: "Import 12 new and tag",
    alt: "Cancel",
    note: "Checking imported workout filters...",
    fields: [
      { k: "VIMEO FOLDER", type: "text", initial: "Victory Fitness / Workouts 2026", hint: "Checking Vimeo..." },
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
    cta: "Save challenge",
    alt: "Save draft",
    note: "Your 3-day challenges drive four times the invites of the 21-day ones. If you are unsure of the length, make it short.",
    fields: [
      { k: "NAME", type: "text", initial: "", placeholder: "Challenge name", hint: "shown on the card" },
      { k: "LENGTH", type: "chips", initial: "3", options: ["3", "5", "7", "14", "21"] },
      { k: "TYPE", type: "chips", initial: "Physical", options: ["Physical", "Mental", "Relational"] },
      { k: "STATUS", type: "chips", initial: "DRAFT", options: ["DRAFT", "UPCOMING", "ACTIVE", "ARCHIVED"] },
      { k: "FEATURED CARD", type: "chips", initial: "No", options: ["No", "Yes"] },
      { k: "DIFFICULTY", type: "chips", initial: "BEGINNER", options: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
      { k: "POINTS ON COMPLETION", type: "text", initial: "", placeholder: "e.g. 75", hint: "shown as the win" },
      { k: "WHAT TO DO", type: "input", initial: "", placeholder: "The instruction, verbatim...", hint: "the instruction, verbatim" },
      { k: "WHY IT MATTERS", type: "input", initial: "", placeholder: "Why this challenge matters...", hint: "largest text on the detail screen" },
      { k: "TIER ACCESS", type: "chips", initial: "All tiers", options: ["All tiers", "Gold and up", "Platinum and up"] },
    ],
  },
  message: {
    kicker: "DIRECT MESSAGE",
    title: "Message inactive users",
    sub: "Goes out as a WhatsApp message in Ghana and India, push in Germany, the UK and the US. Written once, delivered on each person's clock.",
    audit: {
      auditId: "ADMIN-EXTRA-019",
      status: "extra",
      label: "NEW FEATURE - DIRECT MESSAGING INACTIVE USERS NOT IN REQUIREMENT",
    },
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
  user: {
    kicker: "USER EDITOR",
    title: "Edit user",
    sub: "Account fields shown here come from the backend user record. Keep identity and access clean before changing status.",
    cta: "Save user",
    alt: "Cancel",
    note: "Status controls whether the account is verified. Subscription data is managed from Subscriptions, not this editor.",
    fields: [
      { k: "FULL NAME", type: "text", initial: "", placeholder: "Full name", hint: "shown across admin and app" },
      { k: "EMAIL", type: "text", initial: "", placeholder: "member@example.com", hint: "login email" },
      { k: "ROLE", type: "chips", initial: "user", options: ["user", "trainer", "moderator"] },
      { k: "STATUS", type: "chips", initial: "PENDING", options: ["PENDING", "ACTIVE", "INACTIVE"] },
      { k: "CONTACT NUMBER", type: "text", initial: "", placeholder: "+491234567890", hint: "optional" },
      { k: "COUNTRY", type: "text", initial: "", placeholder: "Germany", hint: "market/country" },
      { k: "PROFILE IMAGE", type: "text", initial: "", placeholder: "https://...", hint: "optional URL" },
    ],
  },
  application: {
    kicker: "INNER CIRCLE APPLICATION · INGRID VOGEL",
    title: "Read, then decide",
    sub: "Her five answers as written, nothing summarised. Waiting four days — the screen promises three.",
    cta: "Book the call",
    alt: "Decline kindly",
    note: "Declining is not a dead end: pick the tier that does fit and she gets that offer instead of silence.",
  },
  support: {
    kicker: "SUPPORT THREAD",
    title: "MoMo payment did not go through",
    sub: "Open 31 hours. Gold trial, day 4 — if this is not answered today his trial ends unpaid and he is gone.",
    mediaLabel: "ATTACH",
    mediaKinds: ["Text only", "Screenshot", "Record a clip"],
    mediaHint: "attach what helps · stays private to this thread",
    cta: "Send reply",
    alt: "Mark resolved",
    note: "His is the third MoMo failure this week. Answer him, then look at the flag — the member should not be the bug report.",
    fields: [
      { k: "WHAT HE WROTE", type: "read", initial: "I tried three times with MTN MoMo and each time it says failed. The money left my wallet the second time and came back an hour later. I do not want to try a fourth time.", hint: "11 Sep, 02:14 GMT" },
      { k: "MEMBER", type: "text", initial: "Kofi Mensah · Accra, Ghana · Gold trial, day 4 of 5 · GH₵ pricing", hint: "no successful payment on record" },
      { k: "RELATED", type: "text", initial: "momo_checkout_v2 flag at 25% in Ghana · 3 failures in 7 days", hint: "he is inside the test group" },
      { k: "CANNED REPLY", type: "chips", initial: "MoMo retry + manual link", options: ["MoMo retry + manual link", "Extend the trial 5 days", "Escalate to dev", "Write from scratch"] },
      { k: "YOUR REPLY", type: "input", initial: "Kofi — that is our fault, not yours, and the hold on your wallet was the failed attempt reversing. Do not try again. I have extended your trial by five days and sent a direct payment link that bypasses the checkout we are testing.", hint: "goes out on WhatsApp, his chosen channel" },
      { k: "ALSO DO", type: "chips", initial: "Extend trial 5 days", options: ["Extend trial 5 days", "Extend and apply 20% off", "No compensation"] },
      { k: "THEN", type: "chips", initial: "Flag to dev", options: ["Flag to dev", "Close the thread", "Keep open until he pays"] },
    ],
  },
  quote: {
    kicker: "DAILY INSPIRATION",
    title: "Edit quote",
    sub: "Whatever is live here is the first thing every member reads on the home screen that day.",
    cta: "Set live",
    alt: "Save to library",
    note: "The current quote has been live eleven days. Daily openers have now read it eleven times.",
    fields: [
      { k: "THE QUOTE", type: "input", initial: "Every rep is a reminder that growth takes patience.", hint: "keep it under 90 characters" },
      { k: "AUTHOR", type: "text", initial: "Victor Akko", hint: "shown in copper beneath the line" },
      { k: "WHEN IT SHOWS", type: "chips", initial: "Set live now", options: ["Set live now", "Tomorrow 05:00", "Into rotation only"] },
      { k: "ROTATION", type: "chips", initial: "Manual", options: ["Manual", "Daily shuffle", "Weekly change"] },
      { k: "WHO SEES IT", type: "chips", initial: "All tiers", options: ["All tiers", "Silver", "Gold and up", "Beta testers"] },
    ],
  },
  flag: {
    kicker: "FEATURE FLAG",
    title: "MoMo checkout v2",
    sub: "Live in Ghana at 25%. Three payment failures in seven days sit inside this test group.",
    cta: "Apply changes",
    alt: "Roll back to 0%",
    note: "Rolling back is instant and needs no release. If the failures are this flag, set it to zero now and read the result afterwards.",
    fields: [
      { k: "ROLLOUT", type: "chips", initial: "25%", options: ["0%", "10%", "25%", "50%", "100%"] },
      { k: "MARKETS", type: "chips", initial: "Ghana", options: ["All", "Germany", "Ghana", "India", "UK", "US"] },
      { k: "WHAT IT CHANGES", type: "read", initial: "Replaces the MoMo checkout with a direct MTN API call instead of the hosted redirect. Meant to cut the drop-off between wallet prompt and confirmation." },
      { k: "RESULT SO FAR", type: "text", initial: "18 attempts · 3 failures · 0 completions", hint: "the old flow has no completions either" },
      { k: "OWNER", type: "text", initial: "Dev · reviewed by Victor Akko", hint: "changed today" },
      { k: "ON ROLLBACK", type: "chips", initial: "Notify affected members", options: ["Notify affected members", "Silent rollback"] },
    ],
  },
  newTemplate: {
    kicker: "NEW NOTIFICATION",
    title: "Start from a template",
    sub: "Variants sit under the five reminders a member can switch on. Pick one and the wording fills in; the cap and the send time are inherited, not set here.",
    cta: "Create as draft",
    alt: "Cancel",
    note: "Timing follows the member's own picker in Profile → Reminders — the times here are relative to it, never a clock you set. Placeholders in braces fill in per member at send time.",
    starters: true,
  },
  template: {
    kicker: "NOTIFICATION TEMPLATE",
    title: "Protein nudge",
    sub: "Unapproved, so it has never sent — while 214 members have it switched on in Profile → Reminders and are expecting it.",
    cta: "Approve and enable",
    alt: "Keep silent",
    note: "Nothing sends from an unapproved template. Approving it does not override anyone — it only lets the 214 who asked for it actually receive it.",
    fields: [
      { k: "CHANNELS", type: "read", initial: "All three — push, WhatsApp and email. Member-facing reminders always offer every channel, because the member picks theirs once in Profile → Reminders and expects it to apply to everything. Restricting a channel here would silently strand whoever chose it." },
      { k: "MESSAGE", type: "input", initial: "{first_name}, you are {grams} g short with the evening to go. One Greek yoghurt closes it.", hint: "{first_name} and {grams} fill in per member" },
      { k: "WHEN IT FIRES", type: "chips", initial: "16:00 local, if short", options: ["16:00 local, if short", "20:00 local, if short", "Never automatically"] },
      { k: "FREQUENCY CAP", type: "chips", initial: "1 / day", options: ["1 / day", "1 / 2 days", "2 / week", "1 / week"] },
      { k: "WHO GETS IT", type: "chips", initial: "Gold and up", options: ["All tiers", "Gold and up", "Platinum and up", "Beta testers"] },
      { k: "MEMBER CONTROL", type: "read", initial: "Members choose their channel and time themselves and can switch this reminder off. Your cap is the ceiling they cannot exceed; it is not a default they can raise. 214 have it on, 0 have received it." },
      { k: "NEVER SEND", type: "read", initial: "On a day the member has not logged any food, or the day after a missed workout. A nudge about a target they have already abandoned reads as a scold." },
      { k: "APPROVAL", type: "chips", initial: "Approve", options: ["Approve", "Approve for beta only", "Leave unapproved"] },
    ],
  },
  faq: {
    kicker: "MEMBER-FACING HELP",
    title: "Write FAQ entry",
    sub: "Three of your last ten support messages asked this and there is no entry. Writing it stops the next ten.",
    cta: "Publish entry",
    alt: "Save draft",
    note: "Publish English first. The German translation can follow — a missing entry costs more than an untranslated one.",
    fields: [
      { k: "QUESTION", type: "input", initial: "How do I change my protein target?", hint: "phrase it the way members ask it" },
      { k: "CATEGORY", type: "chips", initial: "Nutrition", options: ["Payment", "Training", "Nutrition", "Account", "Community"] },
      { k: "ANSWER", type: "input", initial: "Open Profile, tap Weight & protein target, and set your weight. We recalculate at 1.6 g per kilo and update your ring the same day. You can also override the number by hand if your coach gave you a different one.", hint: "plain language, no jargon" },
      { k: "LANGUAGES", type: "chips", initial: "English first", options: ["English first", "English and German", "German only"] },
      { k: "LINK TO", type: "chips", initial: "Nutrition screen", options: ["None", "Nutrition screen", "Profile settings", "Support"] },
      { k: "ORDER", type: "chips", initial: "Top of Nutrition", options: ["Top of Nutrition", "Bottom of Nutrition", "Pinned to search"] },
    ],
  },
  settingDoc: {
    kicker: "LEGAL DOCUMENT",
    title: "Privacy policy",
    sub: "Last updated four months ago, before Ghana and India went live — so it does not mention MoMo, UPI, or data leaving the EU.",
    cta: "Publish new version",
    alt: "Keep current",
    note: "Publishing a new version notifies every member in the EU, as it must. They keep access either way.",
    fields: [
      { k: "CURRENT VERSION", type: "file", initial: "Victory-Fitness-Privacy-v3.pdf", ext: "PDF", meta: "412 KB · published 12 May 2026 · v3", drop: "Drop a Word or PDF file to replace it", accepts: ".docx, .pdf — Word is converted on upload" },
      { k: "EDITABLE SOURCE", type: "file", initial: "Victory-Fitness-Privacy-v4-draft.docx", ext: "DOCX", meta: "68 KB · edited yesterday · not published", drop: "Drop the edited Word file", accepts: ".docx — this is what you edit between versions" },
      { k: "WHAT IS MISSING", type: "read", initial: "MTN MoMo and Telecel as processors · UPI and the RBI e-mandate · sub-processor list for India · wearable health data from Garmin, Apple, Whoop, Oura, Fitbit and Polar.", hint: "flagged by the last review" },
      { k: "APPLIES TO", type: "chips", initial: "All markets", options: ["All markets", "EU only", "Germany", "Ghana", "India"] },
      { k: "ON PUBLISH", type: "chips", initial: "Notify all members", options: ["Notify all members", "Notify EU only", "Silent update"] },
      { k: "EFFECTIVE", type: "chips", initial: "On publish", options: ["On publish", "In 14 days", "1 October"] },
    ],
  },
  settingText: {
    kicker: "MEMBER-FACING PAGE",
    title: "About us",
    sub: "Shown in the app under Settings, and on the invite landing page a non-member sees first.",
    mediaLabel: "ADD AN IMAGE",
    mediaKinds: ["No image", "Portrait of Victor", "Team photo"],
    mediaHint: "drop a JPG or PNG · shown above the text",
    cta: "Publish",
    alt: "Preview as member",
    note: "This is the page a stranger reads after tapping a friend's invite link. Write it for them, not for members.",
    fields: [
      { k: "HEADING", type: "input", initial: "Built by a coach, not a software company.", hint: "one line" },
      { k: "BODY", type: "input", initial: "Victory Fitness started with Victor Akko coaching people one at a time in Germany and Ghana. The app exists because the same five things worked for almost everyone: show up, eat enough protein, sleep, tell someone, and keep going on the days you do not feel like it.", hint: "two or three short paragraphs" },
      { k: "LANGUAGES", type: "chips", initial: "English and German", options: ["English only", "English and German"] },
      { k: "SHOW ON", type: "chips", initial: "App and invite page", options: ["App and invite page", "App only", "Invite page only"] },
    ],
  },
  settingData: {
    kicker: "DATA AND RESIDENCY",
    title: "Data region",
    sub: "Where member data physically sits, and what a member can do with their own copy of it.",
    cta: "Save",
    alt: "Cancel",
    note: "Members in the EU have a right to export and delete. Both are self-serve in the app, which is the only version of this that scales.",
    fields: [
      { k: "PRIMARY REGION", type: "chips", initial: "EU · Frankfurt", options: ["EU · Frankfurt", "EU · Dublin", "Multi-region"] },
      { k: "EXPORT", type: "chips", initial: "Self-serve in app", options: ["Self-serve in app", "On request by email"] },
      { k: "DELETE", type: "chips", initial: "Self-serve, 30-day grace", options: ["Self-serve, 30-day grace", "Self-serve, immediate", "On request by email"] },
      { k: "HEALTH DATA", type: "read", initial: "Wearable data is stored against the member only. It is never shown to a duo partner, a challenge cohort, or another member, and disconnecting a device deletes it." },
      { k: "PROCESSOR LIST", type: "file", initial: "Victory-Fitness-Subprocessors.pdf", ext: "PDF", meta: "96 KB · updated 12 May 2026", drop: "Drop the updated list", accepts: ".pdf — must match the privacy policy" },
      { k: "RETENTION AFTER CANCELLING", type: "chips", initial: "12 months", options: ["3 months", "12 months", "Until deletion requested"] },
    ],
  },
  settingAccess: {
    kicker: "ADMIN ACCESS",
    title: "Admin accounts",
    sub: "One account has taken all 184 logged actions. Anyone else who joins needs their own login before they touch anything.",
    cta: "Send invitation",
    alt: "Cancel",
    note: "A shared login makes the audit log worthless — every entry would read as you, whoever did it.",
    fields: [
      { k: "EXISTING", type: "text", initial: "Victor Akko · office@victoryfitness.de · owner", hint: "184 actions since launch" },
      { k: "INVITE", type: "input", initial: "name@victoryfitness.de", hint: "they set their own password" },
      { k: "ROLE", type: "chips", initial: "Support", options: ["Owner", "Admin", "Support", "Content", "Read-only"] },
      { k: "CAN DO", type: "read", initial: "Support: read and answer support threads, extend trials, issue refunds up to €50. Cannot change pricing, publish content, or broadcast." },
      { k: "TWO-FACTOR", type: "chips", initial: "Required", options: ["Required", "Optional"] },
    ],
  },
  audit: {
    kicker: "AUDIT ENTRY · READ ONLY",
    title: "Tier price changed",
    sub: "9 September, 15:06. Nothing in this log can be edited or deleted, including by you.",
    cta: "Close",
    alt: "Export entry",
    note: "If this change was wrong, correct it forward with a new price change. The record of the old one stays.",
    fields: [
      { k: "WHO", type: "text", initial: "Victor Akko · owner · office@victoryfitness.de", hint: "signed in from Germany, CET" },
      { k: "WHAT", type: "read", initial: "Victory Gold yearly price changed from €279 to €299. Applied immediately to new subscriptions; existing members kept their original price until renewal." },
      { k: "AFFECTED", type: "text", initial: "0 existing members · 18 new subscriptions since", hint: "no member was re-charged" },
      { k: "BEFORE", type: "text", initial: "€279 / year · €34 / month" },
      { k: "AFTER", type: "text", initial: "€299 / year · €36 / month" },
      { k: "RELATED ENTRIES", type: "text", initial: "Price offer created · today 09:12", hint: "same tier" },
    ],
  },
  pricing: {
    kicker: "PRICING AND OFFERS",
    title: "Price offer",
    sub: "Set a percentage off, for a fixed window, on the tiers you choose. The same offer becomes a referral link members can send to friends — the discount applies to both sides.",
    cta: "Start the offer",
    alt: "Preview",
    note: "A referred friend converts at roughly three times the rate of a cold signup, so the referrer's free month usually costs less than the ad spend it replaces.",
    table: true,
    fields: [
      { k: "APPLIES TO", type: "chips", initial: "Gold", options: ["All paid tiers", "Silver", "Gold", "Platinum"] },
      { k: "DISCOUNT", type: "chips", initial: "20%", options: ["10%", "15%", "20%", "25%", "33%"] },
      { k: "BILLING CYCLE", type: "chips", initial: "Yearly only", options: ["Yearly only", "Monthly only", "Both"] },
      { k: "RUNS FROM", type: "chips", initial: "Monday 15 Sep", options: ["Now", "Monday 15 Sep", "1 October"] },
      { k: "RUNS UNTIL", type: "chips", initial: "7 days", options: ["72 hours", "7 days", "14 days", "End of month"] },
      { k: "MARKETS", type: "chips", initial: "All markets", options: ["All markets", "Germany", "Ghana", "India", "UK", "US"] },
      { k: "WHO CAN USE IT", type: "chips", initial: "Anyone with the link", options: ["Anyone with the link", "Existing members only", "Beta testers only", "New signups only"] },
      { k: "REFERRAL REWARD", type: "chips", initial: "Both get the discount", options: ["Both get the discount", "Friend only", "Referrer gets a free month", "Both get the discount and referrer gets a month"] },
      { k: "THE LINK MEMBERS SHARE", type: "text", initial: "victoryfitness.app/invite/VF-GOLD20", hint: "auto-generated, one per member so you can see who referred whom" },
      { k: "WHAT THE FRIEND READS", type: "text", initial: "Michael thinks you would get on with this. 20% off Victory Gold until Sunday — same discount for both of you.", hint: "shown on the invite landing page" },
      { k: "SEND IT OUT AS", type: "chips", initial: "In-app card and WhatsApp", options: ["In-app card and WhatsApp", "Broadcast to feeds", "Email only", "Do not announce"] },
    ],
  },
  broadcast: {
    kicker: "VERIFIED BROADCAST",
    title: "New broadcast",
    sub: "Publishes into the feeds you pick with a verified badge next to your name. One message can go to a single tier or to everyone.",
    mediaLabel: "FORMAT",
    mediaKinds: ["Text", "Photo", "Video", "Voice note"],
    mediaHint: "shown inline in the feed",
    cta: "Publish broadcast",
    alt: "Preview",
    note: "Silver has one post against Gold's thirteen. If you are broadcasting anyway, include Silver — it costs nothing and the room needs the noise.",
    fields: [
      { k: "TARGET FEEDS", type: "chips", initial: "All tiers", options: ["All tiers", "Silver", "Gold", "Platinum", "Inner Circle"] },
      { k: "MARKET", type: "chips", initial: "All markets", options: ["All markets", "Germany", "Ghana", "India", "UK", "US"] },
      { k: "PURPOSE", type: "chips", initial: "Announcement", options: ["Announcement", "Offer", "Challenge launch", "Nutrition tip", "Masterclass"] },
      { k: "MESSAGE", type: "input", initial: "Clean Eating Fortnight opens Monday. Fourteen days, whole foods only. I am doing it with you.", hint: "0 / 600 characters" },
      { k: "OFFER ATTACHED", type: "chips", initial: "None", options: ["None", "20% off Gold, 7 days", "First month free", "Beta price for testers"] },
      { k: "PUBLISH", type: "chips", initial: "Now", options: ["Now", "Tonight 19:00", "Monday 08:00"] },
    ],
  },
};

function DrawerAuditWrapper({ audit, children }) {
  if (!audit) {
    return <div className="flex-1 flex flex-col justify-between">{children}</div>;
  }
  return (
    <RequirementAuditBoundary
      auditId={audit.auditId}
      status={audit.status || "extra"}
      label={audit.label}
      className="flex-1 flex flex-col justify-between"
    >
      <div className="flex-1 flex flex-col justify-between">{children}</div>
    </RequirementAuditBoundary>
  );
}

export default function ClaudeDrawer() {
  const { drawerState, closeDrawer, showToast, openDrawer } = useAdminDrawer();
  const { isDark } = useTheme();
  const { isOpen, type, payload } = drawerState;

  const [formValues, setFormValues] = useState({});
  const [selectedStarterIdx, setSelectedStarterIdx] = useState(0);
  const [activeMediaKind, setActiveMediaKind] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vimeoPreview, setVimeoPreview] = useState(null);

  const config = type && DRAWER_CONFIGS[type] ? DRAWER_CONFIGS[type] : null;

  useEffect(() => {
    if (config) {
      const initial = {};
      (config.fields || []).forEach((field) => {
        initial[field.k] =
          payload && Object.prototype.hasOwnProperty.call(payload, field.k)
            ? payload[field.k]
            : field.initial;
      });
      // also allow payload direct key overrides
      if (payload && typeof payload === "object") {
        Object.keys(payload).forEach((k) => {
          if (initial[k] === undefined && typeof payload[k] === "string") {
            initial[k] = payload[k];
          }
        });
      }
      setFormValues(initial);
      const initialVideoSource = String(initial.videoSource || payload?.videoSource || "VIMEO").toUpperCase();
      setActiveMediaKind(initialVideoSource === "UPLOAD" ? 1 : initialVideoSource === "YOUTUBE" ? 2 : 0);
      setSelectedStarterIdx(0);
      setVimeoPreview(null);
    }
  }, [type, payload, config]);

  const buildVimeoImportPayload = () => ({
    folderName: formValues["VIMEO FOLDER"] || "",
    tag: formValues["APPLY TO ALL"] || "Strength",
    equipment: formValues["DEFAULT EQUIPMENT"] || "Dumbbells",
    level: formValues["DEFAULT LEVEL"] || "Intermediate",
    useVimeoDuration: formValues["LENGTH FROM"] !== "Set manually",
    visibility: formValues["AFTER IMPORT"] === "Publish immediately" ? "Published" : "Draft",
    importLimit: 12,
  });

  useEffect(() => {
    if (!isOpen || type !== "vimeo" || !formValues["VIMEO FOLDER"]) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewAdminWorkoutSync(buildVimeoImportPayload())
        .then((data) => {
          if (!cancelled) setVimeoPreview(data);
        })
        .catch(() => {
          if (!cancelled) setVimeoPreview(null);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isOpen,
    type,
    formValues["VIMEO FOLDER"],
    formValues["APPLY TO ALL"],
    formValues["DEFAULT EQUIPMENT"],
    formValues["DEFAULT LEVEL"],
    formValues["LENGTH FROM"],
    formValues["AFTER IMPORT"],
  ]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, closeDrawer]);

  // Live dynamic calculation for pricing table matching reference lines 1850-1873
  const computedPriceRows = useMemo(() => {
    if (!config?.table) return [];
    const scope = formValues["APPLIES TO"] || "Gold";
    const discountRaw = formValues["DISCOUNT"] || "20%";
    const pct = parseInt(discountRaw, 10) || 20;
    const cycle = formValues["BILLING CYCLE"] || "Yearly only";

    return PRICE_TABLE.map(([name, year, month, tier]) => {
      const inScope = year > 0 && (scope === "All paid tiers" || scope === tier);
      const off = (val) => "€" + Math.round(val * (1 - pct / 100));
      let sale;
      if (year === 0) sale = "not discounted";
      else if (!inScope) sale = "unchanged";
      else if (cycle === "Monthly only") sale = off(month) + " / mo";
      else if (cycle === "Both") sale = off(year) + " · " + off(month) + "/mo";
      else sale = off(year);

      return {
        name,
        year: year > 0 ? "€" + year : "Application",
        month: month > 0 ? "€" + month : "—",
        sale,
        inScope,
      };
    });
  }, [config, formValues]);

  if (!isOpen) return null;

  if (type === "application") {
    return (
      <ClaudeApplicationDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        payload={payload}
      />
    );
  }

  if (!config) return null;

  const vimeoImportableCount =
    type === "vimeo" && vimeoPreview
      ? Math.min(Number(vimeoPreview.remainingToImport || 0), 12)
      : 12;
  const primaryCtaLabel =
    type === "vimeo"
      ? vimeoPreview
        ? vimeoImportableCount > 0
          ? `Import ${vimeoImportableCount} new and tag`
          : "No new videos to import"
        : "Checking Vimeo..."
      : config.cta;
  const isPrimaryDisabled = isSubmitting || (type === "vimeo" && (!vimeoPreview || vimeoImportableCount <= 0));
  const drawerNote =
    type === "vimeo" && vimeoPreview
      ? Number(vimeoPreview.untaggedCount || 0) > 0
        ? `${Number(vimeoPreview.untaggedCount || 0)} of your ${Number(vimeoPreview.libraryTotal || 0)} imported workouts are missing Train filters, so members cannot find them reliably. Tag on import and that number stops growing.`
        : `All ${Number(vimeoPreview.libraryTotal || 0)} imported workouts have Train filters. New Vimeo imports will be tagged before members see them.`
      : config.note;

  const handleChipSelect = (fieldKey, value) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleTextChange = (fieldKey, value) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const normalizePositiveIntegerInput = (value, fallback = "") => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (!digits) return fallback;
    return String(Math.max(1, Number(digits)));
  };

  const handleMovementChange = (index, key, value) => {
    setFormValues((prev) => {
      const movements = Array.isArray(prev.MOVEMENTS) ? [...prev.MOVEMENTS] : [];
      const nextValue = key === "sets" ? normalizePositiveIntegerInput(value) : value;
      movements[index] = { ...(movements[index] || {}), [key]: nextValue };
      return { ...prev, MOVEMENTS: movements };
    });
  };

  const addMovement = () => {
    setFormValues((prev) => {
      const movements = Array.isArray(prev.MOVEMENTS) ? [...prev.MOVEMENTS] : [];
      movements.push({
        id: `movement-${Date.now()}`,
        name: "",
        sets: "1",
        reps: "",
        load: "",
        equipment: prev.EQUIPMENT || "",
        restSeconds: 45,
        notes: "",
        order: movements.length,
      });
      return { ...prev, MOVEMENTS: movements };
    });
  };

  const removeMovement = (index) => {
    setFormValues((prev) => ({
      ...prev,
      MOVEMENTS: (Array.isArray(prev.MOVEMENTS) ? prev.MOVEMENTS : []).filter((_, idx) => idx !== index),
    }));
  };

  const buildWorkoutRequestPayload = (visibility) => {
    const durationMatch = String(formValues.LENGTH || "").match(/\d+/);
    const durationMinutes = durationMatch ? Number(durationMatch[0]) : Number(payload?.durationMinutes || 0);
    const durationSeconds = Number(formValues.durationSeconds || payload?.durationSeconds || 0)
      || (durationMinutes > 0 ? durationMinutes * 60 : 0);
    const videoSource = String(formValues.videoSource || payload?.videoSource || "VIMEO").trim().toUpperCase();
    const isUpload = videoSource === "UPLOAD";
    const movements = (Array.isArray(formValues.MOVEMENTS) ? formValues.MOVEMENTS : [])
      .map((movement, index) => ({
        name: String(movement.name || "").trim(),
        sets: normalizePositiveIntegerInput(movement.sets, "1"),
        reps: String(movement.reps || "").trim(),
        load: String(movement.load || "").trim(),
        equipment: String(movement.equipment || "").trim(),
        restSeconds: Number(movement.restSeconds || 0),
        notes: String(movement.notes || "").trim(),
        order: index,
      }))
      .filter((movement) => movement.name);
    return {
      title: String(formValues.TITLE || payload?.TITLE || "Untitled Workout").trim(),
      vimeoId: isUpload ? "" : String(formValues.vimeoId || payload?.vimeoId || "").trim(),
      videoUrl: isUpload
        ? String(formValues.videoUrl || payload?.videoUrl || "").trim()
        : String(formValues.videoUrl || payload?.videoUrl || "").trim(),
      videoSource,
      tag: String(formValues.PURPOSE || "Strength").trim(),
      equipment: String(formValues.EQUIPMENT || "").trim(),
      level: String(formValues.LEVEL || "").trim(),
      durationMinutes,
      durationSeconds,
      visibility,
      thumbnail: String(formValues.thumbnail || payload?.thumbnail || "").trim(),
      movements,
    };
  };

  const buildFallbackChallengePlanDays = ({ durationDays, title, description, category }) => {
    return Array.from({ length: durationDays }, (_, index) => {
      const dayNumber = index + 1;
      return {
        day_number: dayNumber,
        title: durationDays === 1 ? title : `Day ${dayNumber}: ${title}`,
        focus: category,
        notes: description,
        sections: [
          {
            id: `day-${dayNumber}-section-1`,
            title: "Daily action",
            description,
            estimated_minutes: 10,
            exercises: [
              {
                id: `day-${dayNumber}-exercise-1`,
                name: title,
                details: description,
                notes: "",
                workout_id: "",
                workout_title: "",
                workout_vimeo_id: "",
                workout_video_url: "",
                workout_video_source: "VIMEO",
                workout_thumbnail: "",
              },
            ],
          },
        ],
      };
    });
  };

  const buildChallengeRequestPayload = (statusOverride) => {
    const durationDays = Math.max(1, Number(String(formValues.LENGTH || payload?.LENGTH || "7").match(/\d+/)?.[0] || 7));
    const points = Math.max(0, Number(String(formValues["POINTS ON COMPLETION"] || "0").match(/\d+/)?.[0] || 0));
    const status = String(statusOverride || formValues.STATUS || payload?.STATUS || "DRAFT").trim().toUpperCase();
    const difficulty = String(formValues.DIFFICULTY || payload?.DIFFICULTY || "BEGINNER").trim().toUpperCase();
    const title = String(formValues.NAME || "Untitled challenge").trim();
    const description = String(formValues["WHAT TO DO"] || title).trim();
    const category = String(formValues.TYPE || "Physical").trim();
    const existingPlanDays = Array.isArray(payload?.PLAN_DAYS) ? payload.PLAN_DAYS : [];
    const planDays =
      existingPlanDays.length === durationDays
        ? existingPlanDays
        : buildFallbackChallengePlanDays({ durationDays, title: title || "Daily Action", description: description || "Daily challenge session", category });
    const planText = String(payload?.PLAN_TEXT || "").trim();
    return {
      title,
      description,
      whyItMatters: String(formValues["WHY IT MATTERS"] || "").trim(),
      planText,
      planDays,
      category,
      durationDays,
      points,
      difficulty: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(difficulty) ? difficulty : "BEGINNER",
      status: ["ACTIVE", "UPCOMING", "DRAFT", "ARCHIVED"].includes(status) ? status : "DRAFT",
      thumbnail: String(payload?.THUMBNAIL || "").trim(),
      featured: String(formValues["FEATURED CARD"] || payload?.["FEATURED CARD"] || "").trim().toLowerCase() === "yes",
    };
  };

  const saveChallenge = async (statusOverride) => {
    const title = String(formValues.NAME || "").trim();
    if (!title) {
      showToast("Please enter a challenge name.");
      return;
    }
    const requestPayload = buildChallengeRequestPayload(statusOverride);
    const challengeId = payload?.id;
    const saved = await adminApiRequest(
      challengeId ? `/admin/challenges/${challengeId}` : "/admin/challenges",
      {
        method: challengeId ? "PATCH" : "POST",
        body: requestPayload,
      }
    );
    if (typeof payload?.onSaved === "function") {
      await payload.onSaved(saved);
    }
    showToast(`Challenge "${saved?.title || requestPayload.title}" saved.`);
    closeDrawer();
  };

  const resolveWorkoutPreviewUrl = () => {
    const videoUrl = String(payload?.videoUrl || formValues.videoUrl || "").trim();
    const vimeoId = String(payload?.vimeoId || formValues.vimeoId || "").trim();
    if (videoUrl) {
      if (/vimeo\.com\/\d+/.test(videoUrl) && !/player\.vimeo\.com/.test(videoUrl)) {
        const match = videoUrl.match(/vimeo\.com\/(\d+)/);
        return match
          ? `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0&playsinline=1&dnt=1&color=c9943a&transparent=0`
          : videoUrl;
      }
      if (/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/.test(videoUrl)) {
        const match = videoUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : videoUrl;
      }
      if (/youtu\.be\/([a-zA-Z0-9_-]+)/.test(videoUrl)) {
        const match = videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : videoUrl;
      }
      if (/player\.vimeo\.com\/video\/\d+/.test(videoUrl) && !videoUrl.includes("transparent=0")) {
        return `${videoUrl}&color=c9943a&transparent=0`;
      }
      return videoUrl;
    }
    if (vimeoId) {
      const cleanId = String(vimeoId).replace(/\D/g, "");
      return `https://player.vimeo.com/video/${cleanId || vimeoId}?title=0&byline=0&portrait=0&playsinline=1&dnt=1&color=c9943a&transparent=0`;
    }
    return "";
  };

  const saveWorkout = async (visibility) => {
    const requestPayload = buildWorkoutRequestPayload(visibility);
    if (requestPayload.videoSource === "UPLOAD" && String(requestPayload.videoUrl || "").startsWith("blob:")) {
      throw new Error("Please wait for the video upload to finish before saving.");
    }
    if (requestPayload.videoSource === "UPLOAD" && !requestPayload.videoUrl) {
      throw new Error("Upload a video file before saving.");
    }
    const workoutId = payload?.workoutId;
    const path = workoutId ? `/admin/workouts/${workoutId}` : "/admin/workouts";
    const method = workoutId ? "PATCH" : "POST";
    const saved = await adminApiRequest(path, {
      method,
      body: requestPayload,
    });
    if (typeof payload?.onSaved === "function") {
      await payload.onSaved(saved);
    }
    showToast(`Workout "${saved?.title || requestPayload.title}" saved.`);
    closeDrawer();
  };

  const saveMasterclass = async (statusOverride = "Live") => {
    const title = String(formValues.TITLE || "").trim();
    const source = String(formValues.videoSource || "VIMEO").trim().toUpperCase();
    const typedVideo = String(formValues.videoUrl || "").trim();
    const vimeoId = String(formValues.vimeoId || "").replace(/\D/g, "");
    const videoUrl = typedVideo || (source === "VIMEO" && vimeoId ? `https://vimeo.com/${vimeoId}` : "");
    if (!title) {
      throw new Error("Masterclass title is required.");
    }
    if (!videoUrl) {
      throw new Error("Masterclass video URL is required.");
    }
    const requestPayload = {
      title,
      category: String(formValues.PURPOSE || "Strength").trim(),
      duration: String(formValues.LENGTH || "Not set").trim(),
      description: String(formValues["COACH NOTE"] || title).trim(),
      videoUrl,
      videoSource: ["VIMEO", "YOUTUBE", "UPLOAD"].includes(source) ? source : "VIMEO",
      audioUrl: String(formValues["AUDIO URL"] || "").trim(),
      educationalContent: String(formValues["COACH NOTE"] || "").trim(),
      thumbnailUrl: String(formValues.thumbnail || payload?.rawData?.thumbnailUrl || "").trim(),
      status: statusOverride,
      equipment: String(formValues.EQUIPMENT || "").trim(),
      level: String(formValues.LEVEL || "").trim(),
      tierAccess: String(formValues["TIER ACCESS"] || "Gold and up").trim(),
      coachNote: String(formValues["COACH NOTE"] || "").trim(),
      movements: (Array.isArray(formValues.MOVEMENTS) ? formValues.MOVEMENTS : [])
        .map((movement, index) => ({
          name: String(movement.name || "").trim(),
          sets: normalizePositiveIntegerInput(movement.sets, "1"),
          reps: String(movement.reps || "").trim(),
          load: String(movement.load || "").trim(),
          equipment: String(movement.equipment || "").trim(),
          restSeconds: Number(movement.restSeconds || 0),
          notes: String(movement.notes || "").trim(),
          order: index,
        }))
        .filter((movement) => movement.name),
      watchCount: Math.max(0, Number(String(formValues.WATCHED || "0").match(/\d+/)?.[0] || 0)),
      finishRatePct: Math.max(0, Math.min(Number(String(formValues["FINISH RATE"] || "0").match(/\d+/)?.[0] || 0), 100)),
      retentionLiftPoints: Math.max(
        -100,
        Math.min(Number(String(formValues["RETENTION LIFT"] || "0").match(/-?\d+/)?.[0] || 0), 100)
      ),
    };
    const masterclassId = payload?.id;
    const saved = await adminApiRequest(masterclassId ? `/admin/masterclasses/${masterclassId}` : "/admin/masterclasses", {
      method: masterclassId ? "PATCH" : "POST",
      body: requestPayload,
    });
    if (typeof payload?.onSaved === "function") {
      await payload.onSaved(saved);
    }
    showToast(`Masterclass "${saved?.title || requestPayload.title}" saved.`);
    closeDrawer();
  };

  const saveUser = async () => {
    const fullName = String(formValues["FULL NAME"] || "").trim();
    const email = String(formValues.EMAIL || "").trim().toLowerCase();
    if (!fullName || !email) {
      throw new Error("Full name and email are required.");
    }
    const requestPayload = {
      fullName,
      email,
      role: String(formValues.ROLE || "user").trim().toLowerCase(),
      status: String(formValues.STATUS || "PENDING").trim().toUpperCase(),
      contactNumber: String(formValues["CONTACT NUMBER"] || "").trim(),
      country: String(formValues.COUNTRY || "").trim(),
      profileImage: String(formValues["PROFILE IMAGE"] || "").trim(),
    };
    const userId = payload?.id;
    const saved = await adminApiRequest(userId ? `/admin/users/${userId}` : "/admin/users", {
      method: userId ? "PATCH" : "POST",
      body: requestPayload,
    });
    if (typeof payload?.onSaved === "function") {
      await payload.onSaved(saved);
    }
    showToast(`User "${saved?.fullName || requestPayload.fullName}" saved.`);
    closeDrawer();
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (type === "newTemplate") {
        const starter = STARTERS[selectedStarterIdx];
        openDrawer("template", {
          MESSAGE: starter[4],
          "FREQUENCY CAP": starter[2],
          "WHEN IT FIRES": starter[3],
        });
        showToast(`Started draft from "${starter[0]}"`);
        return;
      }

      if (type === "workout") {
        await saveWorkout("Published");
        return;
      } else if (type === "masterclass") {
        await saveMasterclass("Live");
        return;
      } else if (type === "user") {
        await saveUser();
        return;
      } else if (type === "vimeo") {
        const result = await syncAdminWorkouts(buildVimeoImportPayload());
        if (typeof payload?.onImported === "function") {
          await payload.onImported(result);
        }
        const imported = Number(result?.syncedCount || 0);
        const remaining = Number(result?.remainingToImport || 0);
        showToast(`Imported ${imported} new Vimeo workouts. ${remaining} remaining.`);
        closeDrawer();
        return;
      } else if (type === "challenge") {
        await saveChallenge();
        return;
      } else if (type === "quote") {
        await adminApiRequest("/admin/content/quotes", {
          method: "POST",
          body: {
            quote: formValues["THE QUOTE"],
            author: formValues["AUTHOR"] || "Victor Akko",
          },
        }).catch(() => null);
      } else if (type === "broadcast") {
        await adminApiRequest("/admin/content/broadcast", {
          method: "POST",
          body: formValues,
        }).catch(() => null);
      }

      showToast(`✓ ${config.title} saved successfully.`);
      closeDrawer();
    } catch (err) {
      showToast(`Failed: ${err?.message || "Operation could not be completed."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAltAction = async () => {
    if (type === "challenge") {
      setIsSubmitting(true);
      try {
        await saveChallenge("DRAFT");
      } catch (err) {
        showToast(`Failed: ${err?.message || "Operation could not be completed."}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (type === "masterclass") {
      setIsSubmitting(true);
      try {
        await saveMasterclass("Draft");
      } catch (err) {
        showToast(`Failed: ${err?.message || "Operation could not be completed."}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (type !== "workout") {
      closeDrawer();
      return;
    }
    setIsSubmitting(true);
    try {
      await saveWorkout("Draft");
    } catch (err) {
      showToast(`Failed: ${err?.message || "Operation could not be completed."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStarter = STARTERS[selectedStarterIdx] || STARTERS[0];
  const siblingCount = STARTERS.filter((x) => x[1] === activeStarter[1]).length;
  const drawerAudit = payload?.audit || config?.audit;
  const isVideoEditor = type === "workout" || type === "masterclass";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex justify-end font-dmsans"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          closeDrawer();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-[620px] max-w-[95vw] h-screen overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200 transition-colors ${
          isDark ? "bg-[#0D0D0D] border-l border-[#F7F3EE]/15 text-[#F7F3EE]" : "bg-[#0D0D0D] border-l border-[rgba(247,243,238,0.15)] text-[#F7F3EE]"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <DrawerAuditWrapper audit={drawerAudit}>
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-[#F7F3EE]/10">
            <div>
              <div className="text-[10px] font-medium tracking-[0.16em] text-[#B5651D] uppercase mb-1 font-dmsans">
                {payload?.kicker || config.kicker}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold font-clash leading-tight text-[#F7F3EE]">
                {payload?.title || (payload?.id && type === "challenge" ? "Edit challenge" : config.title)}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm font-inter leading-relaxed max-w-lg text-[#F7F3EE]/60">
                {payload?.sub || config.sub}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="text-2xl transition-colors p-1 cursor-pointer text-[#F7F3EE]/50 hover:text-[#F7F3EE]"
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>

          {/* Media preview block */}
          {config.mediaLabel && (
            <div
              style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
              className="rounded-2xl border p-4 mb-5 bg-[#0D2B45] border-[#F7F3EE]/10 text-[#F7F3EE]"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[10px] font-medium tracking-[0.14em] text-[#C9943A] uppercase">
                  {config.mediaLabel}
                </div>
                {isVideoEditor && resolveWorkoutPreviewUrl() && (
                  <span className="text-[9.5px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#C9943A]/20 text-[#C9943A] border border-[#C9943A]/30">
                    16:9 PREVIEW
                  </span>
                )}
              </div>

              {/* Media source chips */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {(config.mediaKinds || []).map((kind, idx) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      setActiveMediaKind(idx);
                      if (isVideoEditor) {
                        setFormValues((prev) => ({
                          ...prev,
                          videoSource: idx === 1 ? "UPLOAD" : idx === 2 ? "YOUTUBE" : "VIMEO",
                        }));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      idx === activeMediaKind
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : "bg-[#F7F3EE]/10 text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>

              {/* Source inputs for video editors */}
              {isVideoEditor && (
                <div className="mb-3">
                  {activeMediaKind === 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Vimeo ID or URL (e.g. 1052697858 or vimeo.com/1052697858)"
                        value={formValues.vimeoId || formValues.videoUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const match = val.match(/\d{6,}/);
                          setFormValues((prev) => ({
                            ...prev,
                            videoSource: "VIMEO",
                            vimeoId: match ? match[0] : val,
                            videoUrl: val.includes("http") ? val : prev.videoUrl,
                          }));
                        }}
                        className="flex-1 px-3 py-2 text-xs font-mono bg-[#07131E] border border-[#F7F3EE]/15 rounded-lg text-[#F7F3EE] placeholder-[#F7F3EE]/40 focus:outline-none focus:border-[#C9943A] transition-colors"
                      />
                    </div>
                  )}

                  {activeMediaKind === 1 && (
                    <label className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-dashed border-[#C9943A]/50 bg-[#07131E]/60 hover:bg-[#07131E] cursor-pointer transition-colors text-xs text-[#F7F3EE]/80">
                      <span className="font-semibold text-[#C9943A]">Upload Video File</span>
                      <span className="text-[11px] text-[#F7F3EE]/50 font-mono">MP4, MOV, WebM (max 500MB)</span>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const blobUrl = URL.createObjectURL(file);
                            const durationSeconds = await readVideoDurationSeconds(file);
                            const durationMinutes = durationSeconds > 0 ? Math.max(1, Math.ceil(durationSeconds / 60)) : 0;
                            setFormValues((prev) => ({
                              ...prev,
                              videoSource: "UPLOAD",
                              videoUrl: blobUrl,
                              vimeoId: "",
                              durationSeconds,
                              LENGTH: durationMinutes > 0 ? `${durationMinutes} min` : prev.LENGTH,
                            }));
                            const durationLabel = formatDurationLabelFromSeconds(durationSeconds);
                            showToast(`Uploading ${file.name}${durationLabel ? ` (${durationLabel})` : ""}...`);
                            try {
                              const uploadedUrl = await uploadAdminWorkoutVideo(
                                file,
                                type === "masterclass" ? "MASTERCLASS_VIDEO" : "WORKOUT_VIDEO"
                              );
                              setFormValues((prev) => ({
                                ...prev,
                                videoSource: "UPLOAD",
                                videoUrl: uploadedUrl,
                                vimeoId: "",
                                durationSeconds,
                                LENGTH: durationMinutes > 0 ? `${durationMinutes} min` : prev.LENGTH,
                              }));
                              showToast(`Uploaded ${file.name}`);
                            } catch (err) {
                              setFormValues((prev) => ({
                                ...prev,
                                videoSource: "UPLOAD",
                                videoUrl: "",
                                vimeoId: "",
                              }));
                              showToast(`Failed: ${err?.message || "Video upload failed"}`);
                            }
                          }
                        }}
                      />
                    </label>
                  )}

                  {activeMediaKind === 2 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
                        value={formValues.videoUrl || ""}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setFormValues((prev) => ({
                            ...prev,
                            videoSource: "YOUTUBE",
                            videoUrl: val,
                            vimeoId: "",
                          }));
                        }}
                        className="flex-1 px-3 py-2 text-xs font-mono bg-[#07131E] border border-[#F7F3EE]/15 rounded-lg text-[#F7F3EE] placeholder-[#F7F3EE]/40 focus:outline-none focus:border-[#C9943A] transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Video Player / Preview Frame */}
              {isVideoEditor && resolveWorkoutPreviewUrl() ? (
                <div
                  className="w-full aspect-video rounded-xl border border-[#F7F3EE]/15 bg-black overflow-hidden shadow-2xl relative flex items-center justify-center"
                  style={{ backgroundColor: "#000000" }}
                >
                  {/player\.vimeo\.com|youtube\.com\/embed/.test(resolveWorkoutPreviewUrl()) ? (
                    <iframe
                      src={resolveWorkoutPreviewUrl()}
                      title={`${formValues.TITLE || (type === "masterclass" ? "Masterclass" : "Workout")} preview`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{
                        border: 0,
                        display: "block",
                        backgroundColor: "#000000",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <video
                      src={resolveWorkoutPreviewUrl()}
                      controls
                      playsInline
                      className="w-full h-full object-contain bg-black"
                      style={{ backgroundColor: "#000000" }}
                      onLoadedMetadata={(event) => {
                        const duration = Number(event.currentTarget.duration || 0);
                        if (!Number.isFinite(duration) || duration <= 0) return;
                        const durationSeconds = Math.round(duration);
                        const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
                        setFormValues((prev) => {
                          if (Number(prev.durationSeconds || 0) > 0) return prev;
                          return {
                            ...prev,
                            durationSeconds,
                            LENGTH: `${durationMinutes} min`,
                          };
                        });
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="h-32 rounded-xl flex flex-col items-center justify-center gap-2 border bg-gradient-to-br from-[#12314c] to-[#0a2439] border-[#F7F3EE]/10">
                  <div className="w-10 h-8 rounded-lg bg-[#C9943A] flex items-center justify-center shadow-md">
                    <div className="w-0 h-0 border-l-[10px] border-l-[#0D0D0D] border-y-[6px] border-y-transparent ml-1" />
                  </div>
                  <span className="text-[11px] font-mono text-[#F7F3EE]/45">
                    {isVideoEditor ? "No video connected yet" : config.mediaHint}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Live Pricing table block */}
          {config.table && (
            <div
              style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
              className="rounded-2xl border overflow-hidden mb-5 bg-[#0D2B45] border-[#F7F3EE]/10 text-[#F7F3EE]"
            >
              <div className="flex text-[9.5px] font-semibold tracking-wider px-4 py-3 border-b uppercase text-[#F7F3EE]/50 border-[#F7F3EE]/10">
                <span className="flex-1">Plan</span>
                <span className="w-20 text-right">Standard</span>
                <span className="w-28 text-right text-[#C9943A]">With Offer</span>
              </div>
              {computedPriceRows.map((pr) => (
                <div
                  key={pr.name}
                  className={`flex items-center text-xs px-4 py-2.5 border-b border-[#F7F3EE]/5 ${
                    pr.inScope ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <span className="flex-1 font-semibold text-[#F7F3EE]">{pr.name}</span>
                  <span className="w-20 text-right font-mono text-[#F7F3EE]/60">{pr.year}</span>
                  <span
                    className={`w-28 text-right font-mono font-bold ${
                      pr.inScope ? "text-[#5FC48E]" : "text-[#F7F3EE]/40"
                    }`}
                  >
                    {pr.sale}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Starters block for notification templates */}
          {config.starters && (
            <div className="mb-5 space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#F7F3EE]/50 font-dmsans">
                CHOOSE A STARTER ARCHETYPE
              </div>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map(([name], idx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedStarterIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedStarterIdx === idx
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : "bg-[#F7F3EE]/8 text-[#F7F3EE]/70 hover:text-[#F7F3EE] border border-[#F7F3EE]/15"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Starter detail card */}
              <div
                style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
                className="rounded-xl border border-[#B5651D]/30 p-4 bg-[#0D2B45] text-[#F7F3EE]/90 space-y-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold text-base font-clash text-[#F7F3EE]">
                    {activeStarter[0]}
                  </div>
                  <span className="text-[11px] font-mono text-[#C9943A] font-bold">
                    {activeStarter[2]}
                  </span>
                </div>
                <div className="text-[11.5px] font-mono text-[#F7F3EE]/60">
                  Category: {activeStarter[1]} · Timing: {activeStarter[3]}
                </div>
                <div className="p-3 rounded-lg bg-[#0A0A0A]/50 border border-[#F7F3EE]/10 text-xs font-inter leading-relaxed text-[#F7F3EE]">
                  “{activeStarter[4]}”
                </div>
                <div className="text-[11.5px] font-inter text-[#F7F3EE]/75 pt-1">
                  Rule: {activeStarter[5]}
                </div>
                <div className="text-[10.5px] font-inter text-[#F7F3EE]/50 border-t border-[#F7F3EE]/10 pt-2">
                  This is a variant of the “{activeStarter[1]}” reminder. All {siblingCount} variants share that one cap of {activeStarter[2]} — adding this cannot increase how often anyone hears from you.
                </div>
              </div>
            </div>
          )}

          {/* Form fields (Obsidian #0D2B45 cards with DM Sans & JetBrains Mono) */}
          <div className="space-y-2.5">
            {(config.fields || []).map((field) => (
              <div
                key={field.k}
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
                    {field.k}
                  </span>
                  {(field.hint || (type === "vimeo" && field.k === "VIMEO FOLDER")) && (
                    <span
                      style={{
                        font: "400 10.5px 'JetBrains Mono', monospace",
                        color: "rgba(247, 243, 238, 0.4)",
                      }}
                    >
                      {type === "vimeo" && field.k === "VIMEO FOLDER"
                        ? vimeoPreview
                          ? `${vimeoPreview.videosAvailable} videos · ${vimeoPreview.alreadyImportedCount} imported · ${vimeoPreview.remainingToImport} new`
                          : "Checking Vimeo..."
                        : field.hint}
                    </span>
                  )}
                </div>

                {field.type === "chips" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "7px",
                      flexWrap: "wrap",
                    }}
                  >
                    {(field.options || []).map((opt) => {
                      const isSelected = formValues[field.k] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChipSelect(field.k, opt)}
                          style={{
                            padding: "9px 14px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            font: `${isSelected ? "700" : "500"} 12.5px 'DM Sans', sans-serif`,
                            backgroundColor: isSelected ? "#C9943A" : "transparent",
                            color: isSelected ? "#0D0D0D" : "rgba(247, 243, 238, 0.65)",
                            border: isSelected
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
                )}

                {field.type === "text" && (
                  <input
                    type="text"
                    value={formValues[field.k] ?? ""}
                    onChange={(e) => handleTextChange(field.k, e.target.value)}
                    placeholder={field.placeholder || ""}
                    className="placeholder:text-[#F7F3EE]/35"
                    style={{
                      boxSizing: "border-box",
                      border: "1.5px solid rgba(247, 243, 238, 0.2)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      font: "500 14px/1.4 'DM Sans', sans-serif",
                      color: "#F7F3EE",
                      backgroundColor: "transparent",
                      outline: "none",
                      width: "100%",
                      display: "block",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#C9943A")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(247, 243, 238, 0.2)")}
                  />
                )}

                {field.type === "input" && (
                  <textarea
                    rows={3}
                    value={formValues[field.k] ?? ""}
                    onChange={(e) => handleTextChange(field.k, e.target.value)}
                    placeholder={field.placeholder || ""}
                    className="placeholder:text-[#F7F3EE]/35"
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
                )}

                {field.type === "read" && (
                  <p
                    style={{
                      margin: 0,
                      font: "400 14.5px/1.65 'Inter', sans-serif",
                      color: "rgba(247, 243, 238, 0.85)",
                      textWrap: "pretty",
                      overflowWrap: "break-word",
                    }}
                  >
                    {formValues[field.k] ?? field.initial}
                  </p>
                )}

                {field.type === "movements" && (
                  <div className="space-y-3">
                    {(Array.isArray(formValues.MOVEMENTS) ? formValues.MOVEMENTS : []).map((movement, idx) => (
                      <div
                        key={movement.id || idx}
                        className="rounded-xl border border-[#F7F3EE]/10 bg-[#071E31]/60 p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-lg bg-[#C9943A] text-[#0D0D0D] font-mono font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={movement.name || ""}
                            onChange={(e) => handleMovementChange(idx, "name", e.target.value)}
                            placeholder="Movement name"
                            className="flex-1 min-w-0 rounded-lg border border-[#F7F3EE]/20 bg-transparent px-3 py-2 text-sm font-semibold text-[#F7F3EE] outline-none focus:border-[#C9943A]"
                          />
                          <button
                            type="button"
                            onClick={() => removeMovement(idx)}
                            className="w-8 h-8 rounded-lg border border-[#D98A3E]/50 text-[#D98A3E] font-bold"
                            aria-label={`Remove movement ${idx + 1}`}
                          >
                            ×
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {[
                            ["sets", "Sets"],
                            ["reps", "Reps"],
                            ["load", "Load"],
                            ["equipment", "Equipment"],
                            ["restSeconds", "Rest sec"],
                          ].map(([key, label]) => (
                            <label key={key} className="block">
                              <span className="block mb-1 text-[9px] tracking-[0.12em] uppercase text-[#F7F3EE]/40">{label}</span>
                              <input
                                type={key === "sets" || key === "restSeconds" ? "number" : "text"}
                                min={key === "sets" ? "1" : key === "restSeconds" ? "0" : undefined}
                                step={key === "sets" || key === "restSeconds" ? "1" : undefined}
                                value={movement[key] ?? ""}
                                onChange={(e) => handleMovementChange(idx, key, e.target.value)}
                                className="w-full rounded-lg border border-[#F7F3EE]/20 bg-transparent px-2 py-2 text-xs text-[#F7F3EE] outline-none focus:border-[#C9943A]"
                              />
                            </label>
                          ))}
                        </div>
                        <textarea
                          rows={2}
                          value={movement.notes || ""}
                          onChange={(e) => handleMovementChange(idx, "notes", e.target.value)}
                          placeholder="Coach cue or notes"
                          className="mt-2 w-full resize-vertical rounded-lg border border-[#F7F3EE]/20 bg-transparent px-3 py-2 text-xs text-[#F7F3EE] outline-none focus:border-[#C9943A]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMovement}
                      className="h-10 px-4 rounded-xl border border-[#C9943A]/60 text-[#C9943A] font-bold text-sm"
                    >
                      + Add movement
                    </button>
                  </div>
                )}

                {field.type === "file" && (
                  <div className="space-y-2">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "13px",
                        backgroundColor: "rgba(247,243,238,.06)",
                        borderRadius: "12px",
                        padding: "14px 15px",
                        marginBottom: "9px",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "42px",
                          borderRadius: "5px",
                          boxSizing: "border-box",
                          border: "1.5px solid rgba(201,148,58,.6)",
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          paddingBottom: "5px",
                          flex: "none",
                        }}
                      >
                        <span style={{ font: "700 8.5px 'JetBrains Mono', monospace", color: "#C9943A" }}>
                          {field.ext || "DOC"}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: "600 14px 'DM Sans', sans-serif", color: "#F7F3EE", overflowWrap: "break-word" }}>
                          {field.initial}
                        </div>
                        <div style={{ font: "400 11.5px 'JetBrains Mono', monospace", color: "rgba(247,243,238,.5)", marginTop: "3px" }}>
                          {field.meta}
                        </div>
                      </div>
                      <span
                        onClick={() => showToast(`Downloading ${field.initial}`)}
                        style={{ font: "700 12px 'DM Sans', sans-serif", color: "#C9943A", cursor: "pointer", flex: "none" }}
                      >
                        Download
                      </span>
                    </div>
                    <div
                      onClick={() => showToast("File replacement picker opened.")}
                      style={{
                        boxSizing: "border-box",
                        border: "1.5px dashed rgba(201,148,58,.5)",
                        borderRadius: "12px",
                        padding: "18px",
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ font: "600 13.5px 'DM Sans', sans-serif", color: "#C9943A" }}>{field.drop}</div>
                      <div style={{ font: "400 11.5px 'Inter', sans-serif", color: "rgba(247,243,238,.5)", marginTop: "4px" }}>
                        {field.accepts}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Drawer note */}
          {drawerNote && (
            <div
              style={{ borderLeftWidth: 3, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
              className="mt-5 p-3.5 rounded-xl border border-[#B5651D]/30 text-xs font-inter leading-relaxed bg-[#B5651D]/15 text-[#F7F3EE]/85"
            >
              {drawerNote}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 mt-8 pt-4 border-t border-[#F7F3EE]/10">
          <button
            type="button"
            disabled={isPrimaryDisabled}
            onClick={handleSave}
            className="flex-1 h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-dmsans disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : primaryCtaLabel}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleAltAction}
            className="w-28 h-12 border transition-colors cursor-pointer font-dmsans font-semibold text-sm rounded-xl border-[#F7F3EE]/20 hover:border-[#F7F3EE]/40 text-[#F7F3EE]"
          >
            {config.alt || "Close"}
          </button>
        </div>
        </DrawerAuditWrapper>
      </div>
    </div>
  );
}
