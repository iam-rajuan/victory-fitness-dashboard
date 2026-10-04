import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { IoChevronBack } from "react-icons/io5";
import { Spin, message } from "antd";
import { adminApiRequest } from "../../../services/auth.service";
import { LEGAL_DOCUMENT_ACCEPT, readLegalDocumentFile } from "../../utils/legalDocumentImport";

const MARKET_OPTIONS = [
  { value: "ALL", label: "All Markets" },
  { value: "EU", label: "EU Only" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "IN", label: "India" },
];

const NOTIFICATION_OPTIONS = [
  { value: "all", label: "Notify all members" },
  { value: "eu", label: "Notify EU only" },
  { value: "silent", label: "Silent update" },
];

function formatDate(value) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function downloadHtml(filename, title, html) {
  const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${title.replace(/\s+/g, "-").toLowerCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function LegalDocumentEditor({
  pageTitle,
  defaultTitle,
  endpoint,
  enableNotifications = true,
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [documentState, setDocumentState] = useState(null);
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [markets, setMarkets] = useState(["ALL"]);
  const [notificationBehavior, setNotificationBehavior] = useState(enableNotifications ? "silent" : "silent");
  const [effectiveMode, setEffectiveMode] = useState("now");
  const [specificDate, setSpecificDate] = useState(toDateInputValue(new Date()));

  const versions = useMemo(() => {
    return Array.isArray(documentState?.versions) ? documentState.versions.slice().reverse() : [];
  }, [documentState?.versions]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await adminApiRequest(endpoint);
        if (cancelled) return;
        setDocumentState(response);
        setTitle(response.title || defaultTitle);
        setContent(response.html_content || "");
        setFilename(response.filename || "");
        setMarkets(Array.isArray(response.applies_to) && response.applies_to.length ? response.applies_to : ["ALL"]);
        setNotificationBehavior(response.notification_behavior || "silent");
      } catch (err) {
        console.error(`Failed to load ${pageTitle}:`, err);
        if (!cancelled) message.error(`Failed to load ${pageTitle}`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [defaultTitle, endpoint, pageTitle]);

  const toggleMarket = (value) => {
    setMarkets((current) => {
      if (value === "ALL") return ["ALL"];
      const withoutAll = current.filter((item) => item !== "ALL");
      const next = withoutAll.includes(value)
        ? withoutAll.filter((item) => item !== value)
        : [...withoutAll, value];
      return next.length ? next : ["ALL"];
    });
  };

  const effectiveAt = () => {
    if (effectiveMode === "ten_days") {
      const date = new Date();
      date.setDate(date.getDate() + 10);
      return date.toISOString();
    }
    if (effectiveMode === "specific") {
      return new Date(`${specificDate}T00:00:00`).toISOString();
    }
    return null;
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = await readLegalDocumentFile(file);
      setTitle(imported.title || defaultTitle);
      setContent(imported.html);
      setFilename(file.name);
      message.success("Document imported into editor. Review it before publishing.");
    } catch (err) {
      message.error(err.message || "Failed to import document");
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.replace(/<[^>]+>/g, "").trim()) {
      message.error("Add a title and document content before publishing.");
      return;
    }
    setIsPublishing(true);
    try {
      const response = await adminApiRequest(endpoint, {
        method: "PUT",
        body: {
          title: title.trim(),
          html_content: content,
          filename,
          applies_to: markets,
          notification_behavior: enableNotifications ? notificationBehavior : "silent",
          effective_at: effectiveAt(),
        },
      });
      setDocumentState(response);
      message.success(`${pageTitle} version published`);
    } catch (err) {
      console.error(`Failed to publish ${pageTitle}:`, err);
      message.error(err.message || `Failed to publish ${pageTitle}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6 text-[#F7F3EE] md:px-8">
      <style>{`
        .legal-editor .ql-toolbar {
          border-color: rgba(247, 243, 238, 0.12);
          background: rgba(247, 243, 238, 0.04);
          border-radius: 8px 8px 0 0;
        }
        .legal-editor .ql-container {
          min-height: 360px;
          border-color: rgba(247, 243, 238, 0.12);
          background: #081C2E;
          color: #F7F3EE;
          border-radius: 0 0 8px 8px;
          font-size: 15px;
          line-height: 1.7;
        }
        .legal-editor .ql-editor {
          min-height: 360px;
          color: #F7F3EE;
        }
        .legal-editor .ql-editor.ql-blank::before {
          color: rgba(247, 243, 238, 0.42);
          font-style: normal;
        }
        .legal-editor .ql-picker,
        .legal-editor .ql-stroke {
          color: #F7F3EE;
          stroke: #F7F3EE;
        }
        .legal-editor .ql-fill {
          fill: #F7F3EE;
        }
        .legal-editor .ql-picker-options {
          background: #0D2B45;
          border-color: rgba(247, 243, 238, 0.12);
        }
      `}</style>

      <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#F7F3EE]/10 pb-5">
        <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
          aria-label="Go back"
        >
          <IoChevronBack className="h-6 w-6" />
        </button>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9943A]">Legal Documents</div>
          <h1 className="font-clash text-3xl font-semibold leading-tight text-[#F7F3EE]">{pageTitle}</h1>
          <p className="mt-1 text-sm text-[#F7F3EE]/65">Manage versions, market scope and publication details.</p>
        </div>
        </div>
        <button
          type="button"
          disabled={isPublishing}
          onClick={handlePublish}
          className="hidden h-11 rounded-xl bg-[#C9943A] px-5 text-sm font-black text-[#0D0D0D] shadow-[0_10px_28px_rgba(201,148,58,0.18)] transition hover:bg-[#D6A64A] disabled:opacity-50 sm:block"
        >
          {isPublishing ? "Publishing..." : "Publish New Version"}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Current Version</div>
            <h2 className="mt-3 text-xl font-bold text-[#F7F3EE]">{documentState?.title || defaultTitle}</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#F7F3EE]/72">
              <p className="flex justify-between gap-3"><span>Status</span><strong className="text-[#F7F3EE]">{documentState?.status || "Published"}</strong></p>
              <p className="flex justify-between gap-3"><span>Version</span><strong className="text-[#F7F3EE]">{documentState?.version || "v1"}</strong></p>
              <p className="flex justify-between gap-3"><span>File</span><strong className="text-right text-[#F7F3EE]">{documentState?.filename || "Editor content"}</strong></p>
              <p className="flex justify-between gap-3"><span>Published</span><strong className="text-[#F7F3EE]">{formatDate(documentState?.published_at || documentState?.updated_at)}</strong></p>
              <p className="flex justify-between gap-3"><span>Effective</span><strong className="text-[#F7F3EE]">{formatDate(documentState?.effective_at)}</strong></p>
              <p className="flex justify-between gap-3"><span>Applies to</span><strong className="text-[#F7F3EE]">{(documentState?.applies_to || ["ALL"]).join(", ")}</strong></p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => downloadHtml(documentState?.filename, documentState?.title || defaultTitle, documentState?.html_content || "")}
                className="flex-1 rounded-xl bg-[#C9943A] px-3 py-2 text-sm font-black text-[#0D0D0D]"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => {
                  const win = window.open("", "_blank", "noopener,noreferrer");
                  if (win) win.document.write(documentState?.html_content || "");
                }}
                className="flex-1 rounded-xl border border-[#F7F3EE]/15 px-3 py-2 text-sm font-bold text-[#F7F3EE] hover:border-[#C9943A]/70"
              >
                View
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Applies To</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {MARKET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleMarket(option.value)}
                  className={`rounded-full border px-3 py-2 text-sm font-bold transition ${markets.includes(option.value) ? "border-[#C9943A] bg-[#C9943A] text-[#0D0D0D]" : "border-[#F7F3EE]/15 text-[#F7F3EE]/75 hover:border-[#C9943A]/70 hover:text-[#F7F3EE]"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {enableNotifications ? (
            <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">On Publish</div>
              <div className="mt-3 space-y-3">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 text-sm font-semibold text-[#F7F3EE]/78">
                    <input
                      type="radio"
                      checked={notificationBehavior === option.value}
                      onChange={() => setNotificationBehavior(option.value)}
                      className="accent-[#C9943A]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Effective Date</div>
            <div className="mt-3 space-y-3 text-sm font-semibold text-[#F7F3EE]/78">
              <label className="flex items-center gap-3"><input className="accent-[#C9943A]" type="radio" checked={effectiveMode === "now"} onChange={() => setEffectiveMode("now")} />Effective on publish</label>
              <label className="flex items-center gap-3"><input className="accent-[#C9943A]" type="radio" checked={effectiveMode === "ten_days"} onChange={() => setEffectiveMode("ten_days")} />Effective after 10 days</label>
              <label className="flex items-center gap-3"><input className="accent-[#C9943A]" type="radio" checked={effectiveMode === "specific"} onChange={() => setEffectiveMode("specific")} />Specific date</label>
              {effectiveMode === "specific" ? (
                <input type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} className="w-full rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-2 text-[#F7F3EE] outline-none focus:border-[#C9943A]" />
              ) : null}
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-dashed border-[#F7F3EE]/16 bg-[#F7F3EE]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-[#F7F3EE]">Editable Source / Upload</div>
                <div className="mt-1 text-xs text-[#F7F3EE]/55">Import HTML, text, or Markdown. DOCX/PDF conversion is not enabled in this backend.</div>
              </div>
              <label className="cursor-pointer rounded-xl bg-[#C9943A] px-4 py-2 text-sm font-black text-[#0D0D0D] transition hover:bg-[#D6A64A]">
                Choose file
                <input type="file" accept={LEGAL_DOCUMENT_ACCEPT} onChange={handleDocumentUpload} className="hidden" />
              </label>
            </div>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mb-4 w-full rounded-xl border border-[#F7F3EE]/12 bg-[#081C2E] px-4 py-3 text-lg font-bold text-[#F7F3EE] outline-none placeholder:text-[#F7F3EE]/35 focus:border-[#C9943A]"
              placeholder={defaultTitle}
            />
            <div className="legal-editor">
              <ReactQuill theme="snow" value={content} onChange={setContent} />
            </div>
          </section>

          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Version History</div>
                <p className="mt-1 text-sm text-[#F7F3EE]/60">Publishing creates a new version and preserves previous versions.</p>
              </div>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="h-11 rounded-xl bg-[#C9943A] px-5 text-sm font-black text-[#0D0D0D] transition hover:bg-[#D6A64A] disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish New Version"}
              </button>
            </div>
            <div className="mt-4 divide-y divide-[#F7F3EE]/8 overflow-hidden rounded-xl border border-[#F7F3EE]/10">
              {versions.map((version) => (
                <div key={version.id || version.version} className="grid gap-2 bg-[#081C2E] p-3 text-sm sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="font-bold text-[#F7F3EE]">{version.version || "v1"} · {version.title || defaultTitle}</div>
                    <div className="mt-1 text-[#F7F3EE]/55">{version.filename || "Editor content"} · {(version.applies_to || ["ALL"]).join(", ")}</div>
                  </div>
                  <div className="text-[#F7F3EE]/55">{formatDate(version.published_at)}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
