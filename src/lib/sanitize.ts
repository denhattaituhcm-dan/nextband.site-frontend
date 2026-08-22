import DOMPurify, { Config } from "dompurify";

const ALLOWED_APP_DATA_ATTRS = new Set([
  "data-fill-blank",
  "data-blank-id",
  "data-question-id",
  "data-owner-id",
  "data-focus-id",
]);

/**
 * Strict DOMPurify configuration for IELTS LMS
 * Adheres strictly to security specifications:
 * - Disallows dangerous `style` attribute (inline CSS injection)
 * - Disallows generic `data-*` wildcard (allows only application-specific data attributes)
 * - Restricts URI protocols to https, http, relative URLs, mailto, tel (disallows javascript:, vbscript:, data:text/html)
 * - Strips all script, iframe, object, embed, form, and inline event handlers
 */
const STRICT_CONFIG: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "span",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "sub",
    "sup",
    "blockquote",
    "pre",
    "code",
    "hr",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
    "img",
    "audio",
    "source",
    "a",
  ],
  ALLOWED_ATTR: [
    "class",
    "src",
    "alt",
    "title",
    "width",
    "height",
    "loading",
    "href",
    "target",
    "rel",
    "controls",
    "type",
    "colspan",
    "rowspan",
    "align",
    "valign",
  ],
  ADD_ATTR: ["target", "rel"],
  FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "svg"],
  FORBID_ATTR: ["style"],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false, // Disallow arbitrary data-*
};

// Register Hooks
DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if (data.attrName.startsWith("data-")) {
    if (ALLOWED_APP_DATA_ATTRS.has(data.attrName)) {
      data.forceKeepAttr = true;
    }
  }
});

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Sanitize HTML input before rendering into the DOM
 * @param dirty Dirty HTML string from DB, API, or user input
 * @returns Clean, safe HTML string
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return String(DOMPurify.sanitize(dirty, STRICT_CONFIG));
}

export default sanitizeHtml;
