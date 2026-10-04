export const LEGAL_DOCUMENT_ACCEPT = ".html,.htm,.txt,.md";

/**
 * Parses markdown text into semantic HTML.
 */
function markdownToHtml(mdText) {
  if (!mdText) return "";

  const lines = mdText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const output = [];
  let inList = false;
  let listType = "ul"; // "ul" or "ol"
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const pText = paragraphBuffer.join(" ").trim();
      if (pText) {
        output.push(`<p>${formatInline(pText)}</p>`);
      }
      paragraphBuffer = [];
    }
  };

  const closeList = () => {
    if (inList) {
      output.push(listType === "ol" ? "</ol>" : "</ul>");
      inList = false;
    }
  };

  const formatInline = (text) => {
    let result = text;
    // Bold: **text** or __text__
    result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    result = result.replace(/__(.*?)__/g, "<strong>$1</strong>");
    // Italic: *text* or _text_
    result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    result = result.replace(/_([^_]+)_/g, "<em>$1</em>");
    // Strikethrough: ~~text~~
    result = result.replace(/~~(.*?)~~/g, "<s>$1</s>");
    // Links: [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return result;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    // Horizontal rule: --- or ***
    if (/^(\-{3,}|\*{3,})$/.test(line)) {
      flushParagraph();
      closeList();
      output.push("<hr />");
      continue;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      const tag = `h${Math.min(level, 4)}`;
      output.push(`<${tag}>${formatInline(headingMatch[2])}</${tag}>`);
      continue;
    }

    // Blockquote: > text
    if (line.startsWith(">")) {
      flushParagraph();
      closeList();
      const quoteText = line.replace(/^>\s*/, "");
      output.push(`<blockquote><p>${formatInline(quoteText)}</p></blockquote>`);
      continue;
    }

    // Unordered list item: - item or * item
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (!inList || listType !== "ul") {
        closeList();
        output.push("<ul>");
        inList = true;
        listType = "ul";
      }
      output.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list item: 1. item
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (!inList || listType !== "ol") {
        closeList();
        output.push("<ol>");
        inList = true;
        listType = "ol";
      }
      output.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    // Regular line, buffer for paragraph
    closeList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  closeList();

  return output.join("\n");
}

/**
 * Extracts clean body HTML from a full HTML document string.
 */
function extractCleanHtml(rawHtml) {
  if (!rawHtml) return "";

  // Strip script, style, head, and meta/link tags
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // If there is a <body> tag, grab content inside body
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    cleaned = bodyMatch[1];
  } else {
    // Remove DOCTYPE, html, and head tags if present
    cleaned = cleaned
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<html[^>]*>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
  }

  return cleaned.trim();
}

/**
 * Extracts a title from raw HTML (<title> tag) or Markdown (first # Title)
 */
function extractDocumentTitle(text, extension, fallbackTitle) {
  if (["html", "htm"].includes(extension)) {
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1].trim()) {
      return titleMatch[1].trim();
    }
  } else if (extension === "md") {
    const headingMatch = text.match(/^#\s+([^\n\r]+)/m);
    if (headingMatch && headingMatch[1].trim()) {
      return headingMatch[1].trim();
    }
  }
  return fallbackTitle;
}

export const readLegalDocumentFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Choose a document to upload."));
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["html", "htm", "txt", "md"].includes(extension || "")) {
      reject(new Error("Upload an HTML, text, or Markdown file (.html, .txt, .md)."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rawContent = String(reader.result || "");
        const fallbackTitle = file.name.replace(/\.[^.]+$/, "");
        const extractedTitle = extractDocumentTitle(rawContent, extension, fallbackTitle);

        let html = "";
        if (["html", "htm"].includes(extension)) {
          html = extractCleanHtml(rawContent);
        } else if (extension === "md") {
          html = markdownToHtml(rawContent);
        } else {
          // Plain text format
          html = rawContent
            .split(/\n{2,}/)
            .map((block) => block.trim())
            .filter(Boolean)
            .map((block) => {
              // If single line starting with numbered heading (e.g. 1. Introduction)
              if (/^\d+\.\s+[^\n]+$/.test(block)) {
                return `<h3>${block}</h3>`;
              }
              return `<p>${block.replace(/\n/g, "<br />")}</p>`;
            })
            .join("\n");
        }

        resolve({
          title: extractedTitle || fallbackTitle,
          html: html || "<p></p>",
          filename: file.name,
        });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read that document."));
    reader.readAsText(file);
  });
