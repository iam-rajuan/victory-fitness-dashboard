export const LEGAL_DOCUMENT_ACCEPT = ".html,.htm,.txt,.md";

export const readLegalDocumentFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Choose a document to upload."));
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["html", "htm", "txt", "md"].includes(extension || "")) {
      reject(new Error("Upload an HTML, text, or Markdown file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const html = ["html", "htm"].includes(extension)
        ? text
        : text
            .split(/\n{2,}/)
            .map((block) => block.trim())
            .filter(Boolean)
            .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
            .join("");
      resolve({ title: file.name.replace(/\.[^.]+$/, ""), html });
    };
    reader.onerror = () => reject(new Error("Unable to read that document."));
    reader.readAsText(file);
  });
