import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { IoChevronBack } from "react-icons/io5";
import { Spin, message } from "antd";
import { adminApiRequest } from "../../../services/auth.service";
import { LEGAL_DOCUMENT_ACCEPT, readLegalDocumentFile } from "../../utils/legalDocumentImport";


function TermsCondition() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [title, setTitle] = useState("Terms & Conditions");
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadTermsCondition = async () => {
      setIsLoading(true);
      try {
        const response = await adminApiRequest("/admin/content/terms-condition");
        if (!cancelled) {
          setTitle(response.title || "Terms & Conditions");
          setContent(response.html_content || "");
        }
      } catch (err) {
        console.error("Failed to load terms:", err);
        if (!cancelled) {
          message.error("Failed to load Terms & Conditions");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTermsCondition();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await adminApiRequest("/admin/content/terms-condition", {
        method: "PUT",
        body: {
          title: title.trim() || "Terms & Conditions",
          html_content: content,
        },
      });
      message.success("Terms & Conditions updated successfully");
    } catch (err) {
      console.error("Failed to update terms:", err);
      message.error("Failed to update Terms & Conditions");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = await readLegalDocumentFile(file);
      setTitle(imported.title || "Terms & Conditions");
      setContent(imported.html);
      message.success("Terms & Conditions uploaded into editor. Save changes to publish.");
    } catch (err) {
      message.error(err.message || "Failed to upload document");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="px-5 md:px-0 py-5 md:py-10">
      <div className="bg-blue-600 px-5 py-3 rounded-md mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">Terms & Condition</h1>
      </div>

      <div className=" bg-white rounded shadow p-5 h-full">
        <div className="mb-4 flex flex-col gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Upload Terms & Conditions</div>
            <div className="text-xs text-slate-500">Import HTML, text, or Markdown into the editor before publishing.</div>
          </div>
          <label className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Choose file
            <input type="file" accept={LEGAL_DOCUMENT_ACCEPT} onChange={handleDocumentUpload} className="hidden" />
          </label>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 rounded border border-slate-300 px-4 py-3 text-lg font-semibold outline-none"
          placeholder="Terms & Conditions"
        />
        <ReactQuill
          style={{ padding: "10px" }}
          theme="snow"
          value={content}
          onChange={setContent}
        />
      </div>
      <div className="text-center py-5">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="bg-blue-600 text-white font-semibold w-full py-2 rounded transition duration-200 disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export default TermsCondition;
