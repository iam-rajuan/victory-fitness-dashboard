import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Workout reminder", b: "Push · WhatsApp · Email", c: "1 / day", d: "214 on · 98 off", e: "Approved", tone: "good", id: "nt1" },
  { a: "Streak protection", b: "Push · WhatsApp · Email", c: "1 / week", d: "281 on · 31 off", e: "Approved", tone: "good", id: "nt2" },
  { a: "Challenge update", b: "Push · WhatsApp · Email", c: "2 / week", d: "196 on · 116 off", e: "Approved", tone: "good", id: "nt3" },
  { a: "Protein nudge", b: "Push · WhatsApp · Email", c: "1 / day", d: "214 on · 0 sent", e: "Unapproved", tone: "bad", id: "nt4" },
  { a: "Your duo trained", b: "Push · WhatsApp · Email", c: "1 / day", d: "168 on · 144 off", e: "Unapproved", tone: "bad", id: "nt5" },
  { a: "Monthly digest", b: "Email", c: "1 / month", d: "68", e: "Approved", tone: "good", id: "nt6" },
  { a: "Payment receipt", b: "Email", c: "Per payment", d: "22", e: "Approved", tone: "good", id: "nt7" },
];

export default function Notifications() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [rows, setRows] = useState(BASE_ROWS);

  return (
    <ClaudeAdminTable
      pageKicker="PUSH, WHATSAPP AND EMAIL"
      pageTitle="Notification templates"
      pageSub="The wording, frequency cap and approval state for every automatic message. The five member-facing ones are exactly what a member sees under Profile → Reminders — they pick the channel and time, you set the wording and the cap ceiling."
      pagePrimary="+ New template"
      pageSecondary="Save all"
      onPrimary={() => openDrawer("newTemplate")}
      onSecondary={() => showToast("Saved all templates")}
      pageStats={[
        { k: "TEMPLATES", v: "7", note: "Five member-facing, two system" },
        { k: "APPROVED", v: "5", note: "Sending normally" },
        { k: "UNAPPROVED", v: "2", note: "Currently silent" },
        { k: "MEMBERS MUTED", v: "14", note: "Of 312 · they can mute in-app" },
      ]}
      pageAdvice="The protein nudge is unapproved and therefore silent, yet 214 members have it switched on in their own settings. They are expecting a message that cannot send."
      pageAdviceDone="Approve the two"
      onAdvice={() => {
        setRows((prev) =>
          prev.map((r) => (r.e === "Unapproved" ? { ...r, e: "Approved", tone: "good" } : r))
        );
        showToast("Approved Protein Nudge & Duo Trained notifications.");
      }}
      filters={["All", "Member-facing", "Approved", "Unapproved", "Push", "WhatsApp", "Email"]}
      cols={["TEMPLATE", "CHANNELS OFFERED", "CAP CEILING", "MEMBER SWITCHES", "STATE"]}
      rows={rows}
      onEditRow={(row) => openDrawer("template", { MESSAGE: row.a })}
      onDeleteRow={(row) => {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showToast(`Template ${row.a} silenced.`);
      }}
      onRowClick={(row) => openDrawer("template", { MESSAGE: row.a })}
    />
  );
}
