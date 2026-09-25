import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { IoChevronBack } from "react-icons/io5";
import { Spin, message } from "antd";
import { adminApiRequest } from "../../../services/auth.service";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";


export default function AboutUs() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [title, setTitle] = useState("About Us");
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAboutUs = async () => {
      setIsLoading(true);
      try {
        const response = await adminApiRequest("/admin/content/about-us");
        if (!cancelled) {
          setTitle(response.title || "About Us");
          setContent(response.html_content || "");
        }
      } catch (err) {
        console.error("Failed to load about us:", err);
        if (!cancelled) {
          message.error("Failed to load About Us");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAboutUs();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await adminApiRequest("/admin/content/about-us", {
        method: "PUT",
        body: {
          title: title.trim() || "About Us",
          html_content: content,
        },
      });
      message.success("About Us updated successfully");
    } catch (err) {
      console.error("Failed to update about us:", err);
      message.error("Failed to update about us");
    } finally {
      setIsUpdating(false);
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
    <RequirementAuditBoundary
      auditId="ADMIN-EXTRA-006"
      status="extra"
      label="NEW FEATURE - ABOUT US EDITOR NOT IN REQUIREMENT"
    >
    <div className="p-5">
      <div className="bg-blue-600 px-5 py-3 rounded-md mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">About Us</h1>
      </div>

      <div className=" bg-white rounded shadow p-5 h-full">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 rounded border border-slate-300 px-4 py-3 text-lg font-semibold outline-none"
          placeholder="About Us"
        />
        <ReactQuill
          style={{ padding: "10px" }}
          theme="snow"
          value={content}
          onChange={setContent}
        />
      </div>
      <div className="text-center py-5 w-full">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="bg-blue-600 text-white font-semibold w-full py-2 rounded transition duration-200 disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
    </RequirementAuditBoundary>
  );
}
