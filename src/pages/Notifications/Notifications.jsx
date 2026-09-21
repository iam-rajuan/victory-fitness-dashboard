import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Workout reminder", b: "Daily session prompt based on chosen time", c: "Push · WhatsApp · Email", d: "1 / day · 214 on, 98 off", e: "Approved", tone: "good", id: "nt1" },
  { a: "Streak protection", b: "Warning before streak resets at midnight", c: "Push · WhatsApp · Email", d: "1 / week · 281 on, 31 off", e: "Approved", tone: "good", id: "nt2" },
  { a: "Challenge update", b: "Cohort milestone announcements", c: "Push · WhatsApp · Email", d: "2 / week · 196 on, 116 off", e: "Approved", tone: "good", id: "nt3" },
  { a: "Protein nudge", b: "Macro calculation check at 16:00", c: "Push · WhatsApp · Email", d: "1 / day · 214 on, 0 sent", e: "Unapproved", tone: "bad", id: "nt4" },
  { a: "Your duo trained", b: "Immediate notification when partner ticks session", c: "Push · WhatsApp · Email", d: "1 / day · 168 on, 144 off", e: "Unapproved", tone: "bad", id: "nt5" },
  { a: "Monthly digest", b: "4-week habit progress report", c: "Email only", d: "1 / month · 68 recipients", e: "Approved", tone: "good", id: "nt6" },
  { a: "Payment receipt", b: "VAT compliant subscription receipt", c: "Email only", d: "Per payment · 22 recipients", e: "Approved", tone: "good", id: "nt7" },
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
      onSecondary={() => showToast("All notification rules saved and synchronized.")}
      pageStats={[
        { k: "TEMPLATES", v: "7", note: "Five member-facing, two system" },
        { k: "APPROVED", v: "5", note: "Sending normally" },
        { k: "UNAPPROVED", v: "2", note: "Currently silent" },
        { k: "MEMBERS MUTED", v: "14", note: "Muted in-app by choice" },
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
      cols={["TEMPLATE", "CHANNELS OFFERED", "CAP & MEMBER PREFERENCE", "STATE", "ACTIONS"]}
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
