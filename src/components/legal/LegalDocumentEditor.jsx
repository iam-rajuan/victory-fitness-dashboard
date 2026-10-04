import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  IoChevronBack,
  IoClose,
  IoDownloadOutline,
  IoEyeOutline,
  IoRefreshOutline,
  IoPhonePortraitOutline,
  IoDesktopOutline,
  IoOpenOutline,
  IoCheckmarkCircle,
  IoCalendarOutline,
  IoGlobeOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";
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
  { value: "all", label: "Notify all members", desc: "Sends push and in-app notification to all registered users" },
  { value: "eu", label: "Notify EU only", desc: "Sends GDPR notification to members located in the European Union" },
  { value: "silent", label: "Silent update", desc: "Publishes update without broadcasting notifications" },
];

function formatDate(value) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(date) {
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function sanitizeFilename(title, version, originalFilename) {
  if (originalFilename && originalFilename !== "Editor content" && originalFilename.includes(".")) {
    const ext = originalFilename.split(".").pop();
    const base = originalFilename.replace(/\.[^.]+$/, "");
    return `${base}-${version || "v1"}.${ext}`;
  }
  const cleanTitle = (title || "legal-document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${cleanTitle}-${version || "v1"}.html`;
}

function generateStandaloneHtmlDoc({
  title,
  htmlContent,
  version = "v1",
  publishedAt,
  effectiveAt,
  appliesTo = ["ALL"],
}) {
  const publishedLabel = formatDate(publishedAt);
  const effectiveLabel = formatDate(effectiveAt);
  const marketsLabel = appliesTo.join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Victory Fitness (${version})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0D0D0D;
      --card-bg: #081C2E;
      --navy: #0D2B45;
      --gold: #C9943A;
      --gold-light: #E0B460;
      --ivory: #F7F3EE;
      --muted: rgba(247, 243, 238, 0.65);
      --border: rgba(247, 243, 238, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--ivory);
      font-family: 'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.75;
      font-size: 16px;
      padding: 48px 24px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 840px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 44px 48px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 8px;
    }
    h1.doc-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--ivory);
      line-height: 1.25;
      margin-bottom: 16px;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 24px;
      padding: 16px 20px;
      background: var(--navy);
      border-radius: 10px;
      border: 1px solid var(--border);
      margin-bottom: 32px;
      font-size: 13px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta-val {
      color: var(--ivory);
      font-weight: 600;
    }
    .content-body {
      color: var(--ivory);
      font-size: 15.5px;
    }
    .content-body h1, .content-body h2, .content-body h3, .content-body h4 {
      color: var(--ivory);
      font-weight: 700;
      margin-top: 28px;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .content-body h1 { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .content-body h2 { font-size: 20px; color: var(--gold); }
    .content-body h3 { font-size: 17px; }
    .content-body p { margin-bottom: 16px; color: rgba(247, 243, 238, 0.88); }
    .content-body ul, .content-body ol { margin-left: 24px; margin-bottom: 16px; }
    .content-body li { margin-bottom: 8px; color: rgba(247, 243, 238, 0.88); }
    .content-body blockquote {
      border-left: 3px solid var(--gold);
      padding: 12px 18px;
      margin: 18px 0;
      background: rgba(201, 148, 58, 0.08);
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
    .content-body a { color: var(--gold); text-decoration: underline; }
    .content-body hr { border: 0; height: 1px; background: var(--border); margin: 28px 0; }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: var(--muted);
    }
    @media print {
      body { background: #fff !important; color: #111 !important; padding: 0 !important; font-size: 12pt; }
      .wrapper { max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
      .meta-bar { background: #f4f4f4 !important; border: 1px solid #ddd !important; }
      .meta-val, h1.doc-title, .content-body, .content-body h1, .content-body h2, .content-body h3 { color: #111 !important; }
      .content-body a { color: #000 !important; text-decoration: underline; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="badge">Victory Fitness · Legal Document</div>
    <h1 class="doc-title">${title}</h1>
    <div class="meta-bar">
      <div class="meta-item">
        <span class="meta-label">Version</span>
        <span class="meta-val">${version}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Applies To</span>
        <span class="meta-val">${marketsLabel}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Published</span>
        <span class="meta-val">${publishedLabel}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Effective Date</span>
        <span class="meta-val">${effectiveLabel}</span>
      </div>
    </div>
    <div class="content-body">
      ${htmlContent || "<p>No content provided.</p>"}
    </div>
    <div class="footer-note">
      Official publication by Victory Fitness. Generated on ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.
    </div>
  </div>
</body>
</html>`;
}

function downloadDocumentFile({ filename, title, version, publishedAt, effectiveAt, appliesTo, htmlContent }) {
  const fullHtml = generateStandaloneHtmlDoc({
    title,
    htmlContent,
    version,
    publishedAt,
    effectiveAt,
    appliesTo,
  });

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadName = sanitizeFilename(title, version, filename);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openInNewTabDocument({ title, version, publishedAt, effectiveAt, appliesTo, htmlContent }) {
  const fullHtml = generateStandaloneHtmlDoc({
    title,
    htmlContent,
    version,
    publishedAt,
    effectiveAt,
    appliesTo,
  });

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (win) {
    win.document.open();
    win.document.write(fullHtml);
    win.document.close();
  } else {
    message.warning("Pop-up was blocked. Please allow pop-ups for this site to view in a new tab.");
  }
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

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
  const [notificationBehavior, setNotificationBehavior] = useState("silent");
  const [effectiveMode, setEffectiveMode] = useState("now");
  const [specificDate, setSpecificDate] = useState(toDateInputValue(new Date()));

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: "",
    html: "",
    version: "",
    filename: "",
    publishedAt: null,
    effectiveAt: null,
    appliesTo: ["ALL"],
    deviceMode: "desktop", // "desktop" | "mobile"
  });

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

        // Restore effective date state if available
        if (response.effective_at) {
          const effectiveDate = new Date(response.effective_at);
          const publishedDate = new Date(response.published_at || response.updated_at || Date.now());
          const diffDays = Math.round((effectiveDate.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays >= 8 && diffDays <= 12) {
            setEffectiveMode("ten_days");
          } else if (diffDays > 0) {
            setEffectiveMode("specific");
            setSpecificDate(toDateInputValue(effectiveDate));
          } else {
            setEffectiveMode("now");
          }
        } else {
          setEffectiveMode("now");
        }
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

  const calculateEffectiveAt = () => {
    if (effectiveMode === "ten_days") {
      const date = new Date();
      date.setDate(date.getDate() + 10);
      return date.toISOString();
    }
    if (effectiveMode === "specific") {
      const parsed = new Date(`${specificDate}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      return new Date().toISOString();
    }
    // "now" mode
    return new Date().toISOString();
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = await readLegalDocumentFile(file);
      setTitle(imported.title || defaultTitle);
      setContent(imported.html);
      setFilename(imported.filename || file.name);
      message.success(`Imported "${file.name}" into editor. Review formatting before publishing.`);
    } catch (err) {
      message.error(err.message || "Failed to import document");
    }
  };

  const handlePublish = async () => {
    const strippedContent = content.replace(/<[^>]+>/g, "").trim();
    if (!title.trim() || !strippedContent) {
      message.error("Please add a title and document content before publishing.");
      return;
    }
    setIsPublishing(true);
    try {
      const effectiveTimestamp = calculateEffectiveAt();
      const response = await adminApiRequest(endpoint, {
        method: "PUT",
        body: {
          title: title.trim(),
          html_content: content,
          filename: filename || "Editor content",
          applies_to: markets,
          notification_behavior: enableNotifications ? notificationBehavior : "silent",
          effective_at: effectiveTimestamp,
        },
      });
      setDocumentState(response);
      message.success(`${pageTitle} (${response.version || "new version"}) successfully published!`);
    } catch (err) {
      console.error(`Failed to publish ${pageTitle}:`, err);
      message.error(err.message || `Failed to publish ${pageTitle}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // View Active Document
  const handleOpenCurrentPreview = () => {
    setPreviewModal({
      isOpen: true,
      title: title || documentState?.title || defaultTitle,
      html: content || documentState?.html_content || "",
      version: documentState?.version || "v1",
      filename: filename || documentState?.filename || "Editor content",
      publishedAt: documentState?.published_at || documentState?.updated_at || new Date().toISOString(),
      effectiveAt: calculateEffectiveAt(),
      appliesTo: markets,
      deviceMode: "desktop",
    });
  };

  // View Specific Historical Version
  const handleOpenVersionPreview = (v) => {
    setPreviewModal({
      isOpen: true,
      title: v.title || defaultTitle,
      html: v.html_content || "",
      version: v.version || "v1",
      filename: v.filename || "Editor content",
      publishedAt: v.published_at || v.created_at,
      effectiveAt: v.effective_at || v.published_at,
      appliesTo: Array.isArray(v.applies_to) && v.applies_to.length ? v.applies_to : ["ALL"],
      deviceMode: "desktop",
    });
  };

  // Restore Historical Version into Editor
  const handleRestoreVersion = (v) => {
    setTitle(v.title || defaultTitle);
    setContent(v.html_content || "");
    setFilename(v.filename || "");
    setMarkets(Array.isArray(v.applies_to) && v.applies_to.length ? v.applies_to : ["ALL"]);
    if (v.notification_behavior) {
      setNotificationBehavior(v.notification_behavior);
    }
    if (v.effective_at) {
      setEffectiveMode("specific");
      setSpecificDate(toDateInputValue(v.effective_at));
    } else {
      setEffectiveMode("now");
    }
    message.info(`Loaded ${v.version || "version"} into editor. You can edit and publish as a new version.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Download Active Document
  const handleDownloadCurrent = () => {
    downloadDocumentFile({
      filename: documentState?.filename || filename,
      title: documentState?.title || title || defaultTitle,
      version: documentState?.version || "v1",
      publishedAt: documentState?.published_at || documentState?.updated_at,
      effectiveAt: documentState?.effective_at || calculateEffectiveAt(),
      appliesTo: documentState?.applies_to || markets,
      htmlContent: documentState?.html_content || content,
    });
  };

  // Download Specific Version
  const handleDownloadVersion = (v) => {
    downloadDocumentFile({
      filename: v.filename,
      title: v.title || defaultTitle,
      version: v.version || "v1",
      publishedAt: v.published_at || v.created_at,
      effectiveAt: v.effective_at || v.published_at,
      appliesTo: v.applies_to || ["ALL"],
      htmlContent: v.html_content || "",
    });
  };

  const isScheduledEffective = useMemo(() => {
    if (!documentState?.effective_at) return false;
    const eff = new Date(documentState.effective_at).getTime();
    return eff > Date.now();
  }, [documentState?.effective_at]);

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
          padding: 10px 12px;
        }
        .legal-editor .ql-container {
          min-height: 400px;
          border-color: rgba(247, 243, 238, 0.12);
          background: #081C2E;
          color: #F7F3EE;
          border-radius: 0 0 8px 8px;
          font-size: 15px;
          line-height: 1.7;
        }
        .legal-editor .ql-editor {
          min-height: 400px;
          color: #F7F3EE;
          font-family: inherit;
          padding: 16px 20px;
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
        .legal-editor .ql-picker-item:hover {
          color: #C9943A;
        }
        .legal-preview-content h1 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; border-bottom: 1px solid rgba(247,243,238,0.1); padding-bottom: 6px; }
        .legal-preview-content h2 { font-size: 18px; font-weight: 700; color: #C9943A; margin: 18px 0 8px; }
        .legal-preview-content h3 { font-size: 16px; font-weight: 600; margin: 14px 0 6px; }
        .legal-preview-content p { margin-bottom: 12px; line-height: 1.7; color: rgba(247,243,238,0.85); }
        .legal-preview-content ul, .legal-preview-content ol { margin-left: 20px; margin-bottom: 12px; }
        .legal-preview-content li { margin-bottom: 6px; color: rgba(247,243,238,0.85); }
        .legal-preview-content blockquote { border-left: 3px solid #C9943A; padding-left: 12px; margin: 12px 0; color: rgba(247,243,238,0.7); font-style: italic; }
        .legal-preview-content a { color: #C9943A; text-decoration: underline; }
      `}</style>

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 border-b border-[#F7F3EE]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
            aria-label="Go back"
          >
            <IoChevronBack className="h-6 w-6" />
          </button>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9943A]">Legal Documents</div>
            <h1 className="font-clash text-2xl sm:text-3xl font-semibold leading-tight text-[#F7F3EE]">{pageTitle}</h1>
            <p className="mt-1 text-xs sm:text-sm text-[#F7F3EE]/65">Manage versions, market scope and publication details.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCurrentPreview}
            className="flex items-center gap-1.5 rounded-xl border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 px-4 py-2.5 text-sm font-bold text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
          >
            <IoEyeOutline className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="flex items-center gap-2 rounded-xl bg-[#C9943A] px-5 py-2.5 text-sm font-black text-[#0D0D0D] shadow-[0_10px_28px_rgba(201,148,58,0.18)] transition hover:bg-[#D6A64A] disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Spin size="small" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish New Version</span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Column Controls */}
        <aside className="space-y-4">
          {/* Current Version Card */}
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Current Version</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C9943A]/15 px-2.5 py-0.5 text-xs font-black text-[#C9943A]">
                <IoCheckmarkCircle className="h-3.5 w-3.5" />
                {documentState?.version || "v1"}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-[#F7F3EE]">{documentState?.title || defaultTitle}</h2>
            <div className="mt-4 divide-y divide-[#F7F3EE]/6 text-sm">
              <div className="flex justify-between gap-3 py-2 text-[#F7F3EE]/72">
                <span>Status</span>
                <strong className="text-[#F7F3EE]">{documentState?.status || "Published"}</strong>
              </div>
              <div className="flex justify-between gap-3 py-2 text-[#F7F3EE]/72">
                <span>Version</span>
                <strong className="text-[#F7F3EE]">{documentState?.version || "v1"}</strong>
              </div>
              <div className="flex justify-between gap-3 py-2 text-[#F7F3EE]/72">
                <span>File</span>
                <strong className="max-w-[180px] truncate text-right text-[#F7F3EE]" title={documentState?.filename || "Editor content"}>
                  {documentState?.filename || "Editor content"}
                </strong>
              </div>
              <div className="flex justify-between gap-3 py-2 text-[#F7F3EE]/72">
                <span>Published</span>
                <strong className="text-[#F7F3EE]">{formatDate(documentState?.published_at || documentState?.updated_at)}</strong>
              </div>
              <div className="flex justify-between gap-3 py-2 text-[#F7F3EE]/72">
                <span>Effective</span>
                <span className="text-right">
                  <strong className="text-[#F7F3EE]">{formatDate(documentState?.effective_at)}</strong>
                  {isScheduledEffective && (
                    <span className="ml-1 text-[11px] font-bold text-[#C9943A]">(Scheduled)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-3 py-2 text-[#F7F3EE]/72">
                <span>Applies to</span>
                <strong className="text-right text-[#F7F3EE]">{(documentState?.applies_to || ["ALL"]).join(", ")}</strong>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleDownloadCurrent}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C9943A] px-3 py-2.5 text-sm font-black text-[#0D0D0D] transition hover:bg-[#D6A64A]"
                title="Download this document as HTML"
              >
                <IoDownloadOutline className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                onClick={handleOpenCurrentPreview}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-2.5 text-sm font-bold text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                title="Preview document in desktop and mobile modes"
              >
                <IoEyeOutline className="h-4 w-4" />
                View
              </button>
            </div>
          </section>

          {/* Applies To Market Scope */}
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2">
              <IoGlobeOutline className="h-4 w-4 text-[#C9943A]" />
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Applies To (Market Scope)</div>
            </div>
            <p className="mt-1 text-xs text-[#F7F3EE]/60">Select which regional markets this document applies to.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {MARKET_OPTIONS.map((option) => {
                const isSelected = markets.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleMarket(option.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? "border-[#C9943A] bg-[#C9943A] text-[#0D0D0D] shadow-sm"
                        : "border-[#F7F3EE]/15 bg-[#081C2E]/60 text-[#F7F3EE]/75 hover:border-[#C9943A]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* On Publish Notification Settings */}
          {enableNotifications && (
            <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">On Publish (Notifications)</div>
              <div className="mt-3 space-y-3">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-2 transition hover:bg-[#081C2E]/50"
                  >
                    <input
                      type="radio"
                      name="notificationBehavior"
                      checked={notificationBehavior === option.value}
                      onChange={() => setNotificationBehavior(option.value)}
                      className="mt-0.5 accent-[#C9943A]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-[#F7F3EE]">{option.label}</div>
                      <div className="text-[11px] text-[#F7F3EE]/55">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Effective Date Settings */}
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="h-4 w-4 text-[#C9943A]" />
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Effective Date</div>
            </div>
            <p className="mt-1 text-xs text-[#F7F3EE]/60">When the terms of this version become enforceable.</p>
            <div className="mt-3 space-y-3 text-xs font-semibold text-[#F7F3EE]/85">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  className="accent-[#C9943A]"
                  type="radio"
                  name="effectiveMode"
                  checked={effectiveMode === "now"}
                  onChange={() => setEffectiveMode("now")}
                />
                <span>Effective immediately upon publish</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  className="accent-[#C9943A]"
                  type="radio"
                  name="effectiveMode"
                  checked={effectiveMode === "ten_days"}
                  onChange={() => setEffectiveMode("ten_days")}
                />
                <span>Effective after 10-day notice period</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  className="accent-[#C9943A]"
                  type="radio"
                  name="effectiveMode"
                  checked={effectiveMode === "specific"}
                  onChange={() => setEffectiveMode("specific")}
                />
                <span>Specific future date</span>
              </label>

              {effectiveMode === "specific" && (
                <div className="pt-1">
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(event) => setSpecificDate(event.target.value)}
                    className="w-full rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-2 text-xs text-[#F7F3EE] outline-none focus:border-[#C9943A]"
                  />
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Main Document Editor & Version History */}
        <main className="space-y-6">
          {/* Editor Container */}
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
            {/* Upload Area */}
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-[#F7F3EE]/20 bg-[#F7F3EE]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3EE]">
                  <IoCloudUploadOutline className="h-5 w-5 text-[#C9943A]" />
                  <span>Import Document File</span>
                </div>
                <div className="mt-0.5 text-xs text-[#F7F3EE]/60">
                  Import HTML (.html, .htm), Markdown (.md), or plain text (.txt). Automatically parses headings and formatting.
                </div>
                {filename && (
                  <div className="mt-1 text-xs font-semibold text-[#C9943A]">
                    Source file: {filename}
                  </div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#C9943A] px-4 py-2 text-xs font-black text-[#0D0D0D] transition hover:bg-[#D6A64A]">
                <IoCloudUploadOutline className="h-4 w-4" />
                <span>Choose file</span>
                <input
                  type="file"
                  accept={LEGAL_DOCUMENT_ACCEPT}
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Title Input */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#F7F3EE]/60">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-4 py-3 text-base sm:text-lg font-bold text-[#F7F3EE] outline-none placeholder:text-[#F7F3EE]/35 focus:border-[#C9943A]"
                placeholder={defaultTitle}
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#F7F3EE]/60">
                Document Content
              </label>
              <div className="legal-editor">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={QUILL_MODULES}
                  placeholder={`Draft or edit your ${pageTitle.toLowerCase()} here...`}
                />
              </div>
            </div>
          </section>

          {/* Version History Table */}
          <section className="rounded-2xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">Version History</div>
                <p className="mt-1 text-xs text-[#F7F3EE]/60">
                  All published versions are retained for audit and legal compliance.
                </p>
              </div>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="rounded-xl bg-[#C9943A] px-4 py-2 text-xs font-black text-[#0D0D0D] transition hover:bg-[#D6A64A] disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish New Version"}
              </button>
            </div>

            {versions.length === 0 ? (
              <div className="mt-4 rounded-xl border border-[#F7F3EE]/10 bg-[#081C2E] p-6 text-center text-sm text-[#F7F3EE]/50">
                No versions recorded yet. Publish your first version above.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-[#F7F3EE]/8 overflow-hidden rounded-xl border border-[#F7F3EE]/10">
                {versions.map((version, index) => {
                  const isCurrent = (version.id && version.id === documentState?.published_version_id) || index === 0;
                  return (
                    <div
                      key={version.id || version.version || index}
                      className="flex flex-col gap-3 bg-[#081C2E] p-4 text-xs transition hover:bg-[#081C2E]/80 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F7F3EE]">{version.version || `v${versions.length - index}`}</span>
                          <span className="text-[#F7F3EE]/40">·</span>
                          <span className="font-semibold text-[#F7F3EE]">{version.title || defaultTitle}</span>
                          {isCurrent && (
                            <span className="rounded-md bg-[#C9943A]/20 px-2 py-0.5 text-[10px] font-bold text-[#C9943A]">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[#F7F3EE]/55">
                          <span>{version.filename || "Editor content"}</span>
                          <span>·</span>
                          <span>Scope: {(version.applies_to || ["ALL"]).join(", ")}</span>
                          <span>·</span>
                          <span>Effective: {formatDate(version.effective_at || version.published_at)}</span>
                          {version.notification_behavior && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{version.notification_behavior} notify</span>
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-[#F7F3EE]/40">
                          Published: {formatDateTime(version.published_at || version.created_at)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleOpenVersionPreview(version)}
                          className="flex items-center gap-1 rounded-lg border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 px-2.5 py-1.5 text-xs font-semibold text-[#F7F3EE] hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                          title="Preview this version"
                        >
                          <IoEyeOutline className="h-3.5 w-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestoreVersion(version)}
                          className="flex items-center gap-1 rounded-lg border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 px-2.5 py-1.5 text-xs font-semibold text-[#F7F3EE] hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                          title="Restore content into editor"
                        >
                          <IoRefreshOutline className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadVersion(version)}
                          className="flex items-center gap-1 rounded-lg border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 px-2.5 py-1.5 text-xs font-semibold text-[#F7F3EE] hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                          title="Download this version as HTML"
                        >
                          <IoDownloadOutline className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Luxury In-App Document Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-[#F7F3EE]/15 bg-[#0D2B45] shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F7F3EE]/10 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9943A]">Document Preview</span>
                  <span className="rounded bg-[#C9943A]/15 px-2 py-0.5 text-xs font-bold text-[#C9943A]">
                    {previewModal.version}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-[#F7F3EE]">{previewModal.title}</h3>
              </div>

              {/* View Controls & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Device Mode Switcher */}
                <div className="flex rounded-lg border border-[#F7F3EE]/15 bg-[#081C2E] p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewModal((prev) => ({ ...prev, deviceMode: "desktop" }))}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      previewModal.deviceMode === "desktop"
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : "text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    <IoDesktopOutline className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModal((prev) => ({ ...prev, deviceMode: "mobile" }))}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      previewModal.deviceMode === "mobile"
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : "text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    <IoPhonePortraitOutline className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                {/* Open In New Tab */}
                <button
                  type="button"
                  onClick={() => openInNewTabDocument({
                    title: previewModal.title,
                    version: previewModal.version,
                    publishedAt: previewModal.publishedAt,
                    effectiveAt: previewModal.effectiveAt,
                    appliesTo: previewModal.appliesTo,
                    htmlContent: previewModal.html,
                  })}
                  className="flex items-center gap-1 rounded-lg border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-1.5 text-xs font-semibold text-[#F7F3EE] hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                  title="Open in standalone browser window"
                >
                  <IoOpenOutline className="h-3.5 w-3.5" />
                  <span>Open in Tab</span>
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => downloadDocumentFile({
                    filename: previewModal.filename,
                    title: previewModal.title,
                    version: previewModal.version,
                    publishedAt: previewModal.publishedAt,
                    effectiveAt: previewModal.effectiveAt,
                    appliesTo: previewModal.appliesTo,
                    htmlContent: previewModal.html,
                  })}
                  className="flex items-center gap-1 rounded-lg bg-[#C9943A] px-3 py-1.5 text-xs font-bold text-[#0D0D0D] hover:bg-[#D6A64A]"
                  title="Download HTML file"
                >
                  <IoDownloadOutline className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#F7F3EE]/15 bg-[#081C2E] text-[#F7F3EE] transition hover:bg-[#F7F3EE]/10"
                >
                  <IoClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewModal.deviceMode === "desktop" ? (
                <div className="mx-auto max-w-3xl rounded-xl border border-[#F7F3EE]/10 bg-[#081C2E] p-8 shadow-inner">
                  {/* Meta Bar */}
                  <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-3 text-xs">
                    <div>
                      <span className="text-[#F7F3EE]/50">Version: </span>
                      <strong className="text-[#F7F3EE]">{previewModal.version}</strong>
                    </div>
                    <div>
                      <span className="text-[#F7F3EE]/50">Scope: </span>
                      <strong className="text-[#F7F3EE]">{previewModal.appliesTo.join(", ")}</strong>
                    </div>
                    <div>
                      <span className="text-[#F7F3EE]/50">Published: </span>
                      <strong className="text-[#F7F3EE]">{formatDate(previewModal.publishedAt)}</strong>
                    </div>
                    <div>
                      <span className="text-[#F7F3EE]/50">Effective: </span>
                      <strong className="text-[#F7F3EE]">{formatDate(previewModal.effectiveAt)}</strong>
                    </div>
                  </div>

                  <div
                    className="legal-preview-content"
                    dangerouslySetInnerHTML={{ __html: previewModal.html || "<p class='text-muted'>No content drafted.</p>" }}
                  />
                </div>
              ) : (
                /* Mobile Device Simulation Frame */
                <div className="mx-auto flex justify-center py-4">
                  <div className="w-[375px] rounded-[36px] border-[6px] border-[#2A374A] bg-[#0D0D0D] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                    {/* Simulated Notch / Island */}
                    <div className="mx-auto mb-4 h-4 w-28 rounded-full bg-[#1A2536]" />

                    {/* App Header */}
                    <div className="mb-4 border-b border-[#F7F3EE]/10 pb-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#C9943A]">VICTORY FITNESS</div>
                      <h4 className="text-base font-bold text-[#F7F3EE]">{previewModal.title}</h4>
                      <div className="mt-1 text-[11px] text-[#F7F3EE]/50">
                        {previewModal.version} · Effective: {formatDate(previewModal.effectiveAt)}
                      </div>
                    </div>

                    {/* Mobile Scrollable Content */}
                    <div
                      className="legal-preview-content max-h-[500px] overflow-y-auto text-xs pr-1"
                      dangerouslySetInnerHTML={{ __html: previewModal.html || "<p>No content drafted.</p>" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
