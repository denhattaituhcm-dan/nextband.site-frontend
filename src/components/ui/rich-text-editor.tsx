import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  Type,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImagePlus,
  Loader2,
  Highlighter,
  Check,
  RotateCcw,
  Palette,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadsApi } from "@/lib/api";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

type AlignMode = "left" | "center" | "right" | "justify";

const TEXT_COLOR_PRESETS = [
  { name: "Đen", value: "#000000" },
  { name: "Đỏ", value: "#ef4444" },
  { name: "Cam", value: "#f97316" },
  { name: "Vàng", value: "#eab308" },
  { name: "Xanh lá", value: "#16a34a" },
  { name: "Xanh dương", value: "#2563eb" },
  { name: "Tím", value: "#9333ea" },
  { name: "Xám", value: "#6b7280" },
];

const HIGHLIGHT_PRESETS = [
  { name: "Vàng", value: "#fef08a" },
  { name: "Xanh lá", value: "#bbf7d0" },
  { name: "Xanh dương", value: "#bfdbfe" },
  { name: "Hồng", value: "#fbcfe8" },
  { name: "Cam", value: "#fed7aa" },
  { name: "Tím", value: "#e9d5ff" },
  { name: "Xám", value: "#e5e7eb" },
  { name: "Đỏ nhạt", value: "#fecaca" },
];

function normalizeColor(colorStr: string): string {
  if (!colorStr) return "";
  const trimmed = colorStr.trim().toLowerCase();
  if (trimmed === "transparent" || trimmed === "rgba(0, 0, 0, 0)") return "";
  if (trimmed.startsWith("#")) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed;
  }
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return trimmed;
}

/**
 * Whitelist HTML Sanitizer for Pasted Content
 * Preserves semantic tags (bold, italic, underline, color, highlight, links, lists, tables)
 * Strips font-family, font-size, layout/margin/padding, and MS Word/Docs junk.
 */
function sanitizePastedHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
    const body = doc.body;

    const ALLOWED_TAGS = new Set([
      "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "SPAN", "MARK", "A", "UL", "OL", "LI", "IMG",
      "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "CAPTION", "COLGROUP", "COL"
    ]);

    const cleanNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(true);
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      // Convert structural/heading tags to P
      const targetTagName = ALLOWED_TAGS.has(tagName)
        ? tagName
        : ["DIV", "H1", "H2", "H3", "H4", "H5", "H6", "SECTION", "ARTICLE"].includes(tagName)
        ? "P"
        : null;

      // Extract allowed inline styles
      const styleColor = el.style.color ? normalizeColor(el.style.color) : "";
      const styleBg = el.style.backgroundColor ? normalizeColor(el.style.backgroundColor) : "";

      // Process children
      const cleanedChildren: Node[] = [];
      el.childNodes.forEach((child) => {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) cleanedChildren.push(cleanedChild);
      });

      if (!targetTagName) {
        // Unwrap tag: return fragment of children
        const frag = doc.createDocumentFragment();
        cleanedChildren.forEach((child) => frag.appendChild(child));
        return frag;
      }

      const newEl = doc.createElement(targetTagName);
      cleanedChildren.forEach((child) => newEl.appendChild(child));

      // Preserve specific allowed attributes
      if (targetTagName === "A" && el.hasAttribute("href")) {
        newEl.setAttribute("href", el.getAttribute("href") || "#");
        newEl.setAttribute("target", "_blank");
        newEl.setAttribute("rel", "noopener noreferrer");
      }

      if (targetTagName === "IMG" && el.hasAttribute("src")) {
        newEl.setAttribute("src", el.getAttribute("src") || "");
        if (el.hasAttribute("alt")) newEl.setAttribute("alt", el.getAttribute("alt") || "");
        newEl.className = "rounded-md my-2 max-w-full h-auto";
      }

      if (["TH", "TD"].includes(targetTagName)) {
        if (el.hasAttribute("colspan")) newEl.setAttribute("colspan", el.getAttribute("colspan") || "1");
        if (el.hasAttribute("rowspan")) newEl.setAttribute("rowspan", el.getAttribute("rowspan") || "1");
      }

      // Preserve normalized color & background-color only
      if (styleColor && styleColor !== "#000000" && styleColor !== "inherit") {
        newEl.style.color = styleColor;
      }
      if (styleBg && styleBg !== "transparent") {
        newEl.style.backgroundColor = styleBg;
      }

      return newEl;
    };

    const container = doc.createElement("div");
    body.childNodes.forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) container.appendChild(cleaned);
    });

    return container.innerHTML;
  } catch (err) {
    console.error("Paste sanitization error:", err);
    return rawHtml;
  }
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  minHeight = 180,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [alignMode, setAlignMode] = useState<AlignMode>("left");
  
  // Color & Highlight states
  const [textColor, setTextColor] = useState<string>("#000000");
  const [isMixedTextColor, setIsMixedTextColor] = useState<boolean>(false);
  const [highlightColor, setHighlightColor] = useState<string>("");
  const [isMixedHighlightColor, setIsMixedHighlightColor] = useState<boolean>(false);

  const [textColorPopoverOpen, setTextColorPopoverOpen] = useState(false);
  const [highlightPopoverOpen, setHighlightPopoverOpen] = useState(false);
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);
  const [tableRows, setTableRows] = useState(5);
  const [tableCols, setTableCols] = useState(2);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customTextColorInputRef = useRef<HTMLInputElement>(null);
  const customHighlightInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const { toast } = useToast();

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    try {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    } catch (e) {
      // Range might be detached
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !editorRef.current) return;

    try {
      editorRef.current.focus();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    } catch (e) {
      // Ignore range restoration error if DOM was mutated
    }
  }, []);

  const detectEditorState = useCallback(() => {
    // Detect Align Mode safely
    if (typeof document !== "undefined" && typeof document.queryCommandState === "function") {
      if (document.queryCommandState("justifyCenter")) {
        setAlignMode("center");
      } else if (document.queryCommandState("justifyRight")) {
        setAlignMode("right");
      } else if (document.queryCommandState("justifyFull")) {
        setAlignMode("justify");
      } else {
        setAlignMode("left");
      }
    } else {
      setAlignMode("left");
    }

    // Detect Colors at current selection/caret
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    let node: Node | null = selection.anchorNode;
    if (!node || !editorRef.current.contains(node)) return;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    if (node && node instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(node);
      const curColor = normalizeColor(node.style.color || computedStyle.color);
      const curBg = normalizeColor(node.style.backgroundColor || computedStyle.backgroundColor);

      setTextColor(curColor || "#000000");
      setIsMixedTextColor(false);
      setHighlightColor(curBg);
      setIsMixedHighlightColor(false);
    }
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    detectEditorState();
  }, [value, detectEditorState]);

  useEffect(() => {
    const syncEditorState = () => {
      detectEditorState();
      saveSelection();
    };
    document.addEventListener("selectionchange", syncEditorState);
    return () =>
      document.removeEventListener("selectionchange", syncEditorState);
  }, [detectEditorState, saveSelection]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    detectEditorState();
  };

  // --- TEXT COLOR HANDLERS ---
  const applyTextColor = (color: string) => {
    const hex = normalizeColor(color);
    restoreSelection();
    // Use standard foreColor command with normalized hex color
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, hex);
    document.execCommand("styleWithCSS", false, "false");
    
    setTextColor(hex);
    setIsMixedTextColor(false);
    setTextColorPopoverOpen(false);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const clearTextColor = () => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    // Execute foreColor with inherit / remove explicit color attribute
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, "inherit");
    document.execCommand("styleWithCSS", false, "false");

    // Clean up any remaining color styles inside selection
    const selectedSpans = editorRef.current.querySelectorAll("span[style*='color'], font[color]");
    selectedSpans.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.color === "inherit" || htmlEl.style.color === "initial") {
        htmlEl.style.color = "";
      }
      if (htmlEl.hasAttribute("color")) {
        htmlEl.removeAttribute("color");
      }
    });

    setTextColor("#000000");
    setIsMixedTextColor(false);
    setTextColorPopoverOpen(false);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  // --- HIGHLIGHT HANDLERS ---
  const applyHighlight = (color: string) => {
    const hex = normalizeColor(color);
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    // Try hiliteColor first, fallback to backColor
    try {
      document.execCommand("hiliteColor", false, hex);
    } catch (e) {
      document.execCommand("backColor", false, hex);
    }
    document.execCommand("styleWithCSS", false, "false");

    setHighlightColor(hex);
    setIsMixedHighlightColor(false);
    setHighlightPopoverOpen(false);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const clearHighlight = () => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    try {
      document.execCommand("hiliteColor", false, "transparent");
    } catch (e) {
      document.execCommand("backColor", false, "transparent");
    }
    document.execCommand("styleWithCSS", false, "false");

    if (editorRef.current) {
      // Clean up transparent background-color styles & mark tags
      const spans = editorRef.current.querySelectorAll("span[style*='background-color'], mark");
      spans.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (
          htmlEl.style.backgroundColor === "transparent" ||
          htmlEl.style.backgroundColor === "rgba(0, 0, 0, 0)"
        ) {
          htmlEl.style.backgroundColor = "";
        }
      });
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }

    setHighlightColor("");
    setIsMixedHighlightColor(false);
    setHighlightPopoverOpen(false);
  };

  // --- IMAGE UPLOAD HANDLERS ---
  const insertImageAtRange = (
    fullUrl: string,
    savedRange: Range | null,
    selection: Selection | null
  ) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
    }

    try {
      if (savedRange && selection) {
        const img = document.createElement("img");
        img.src = fullUrl;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.className = "rounded-md my-2";

        savedRange.deleteContents();
        savedRange.insertNode(img);

        savedRange.setStartAfter(img);
        savedRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } else {
        document.execCommand("insertImage", false, fullUrl);
      }
    } catch (e) {
      document.execCommand("insertImage", false, fullUrl);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertTable = (rows: number, cols: number) => {
    restoreSelection();
    const cleanRows = Math.max(1, Math.min(30, rows || 5));
    const cleanCols = Math.max(1, Math.min(10, cols || 2));

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 10px 0;"><thead><tr>`;
    for (let c = 0; c < cleanCols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9; font-weight: 600;">Cột ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < cleanRows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < cleanCols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${c === 1 && r === 0 ? "• Ví dụ: Điền [1] vào đây" : "Nội dung..."}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p></p>`;

    document.execCommand("insertHTML", false, tableHtml);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    setTablePopoverOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    } else if (editorRef.current) {
      savedRange = document.createRange();
      savedRange.selectNodeContents(editorRef.current);
      savedRange.collapse(false);
    }

    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file);
      let fullUrl = result.url;
      if (fullUrl.startsWith("/uploads")) {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        const baseUrl = apiUrl.replace("/api/v1", "");
        fullUrl = `${baseUrl}${fullUrl}`;
      }

      insertImageAtRange(fullUrl, savedRange, selection);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tải lên ảnh",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- PASTE SANITIZATION HANDLER ---
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            uploadAndInsertImage(file);
          }
          return;
        }
      }
    }

    const htmlData = e.clipboardData?.getData("text/html");
    if (htmlData) {
      e.preventDefault();
      const sanitized = sanitizePastedHtml(htmlData);
      document.execCommand("insertHTML", false, sanitized);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const uploadAndInsertImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    } else if (editorRef.current) {
      savedRange = document.createRange();
      savedRange.selectNodeContents(editorRef.current);
      savedRange.collapse(false);
    }

    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file);
      let fullUrl = result.url;
      if (fullUrl.startsWith("/uploads")) {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        const baseUrl = apiUrl.replace("/api/v1", "");
        fullUrl = `${baseUrl}${fullUrl}`;
      }

      insertImageAtRange(fullUrl, savedRange, selection);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể tải lên ảnh",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) {
        e.preventDefault();
        uploadAndInsertImage(files[i]);
        return;
      }
    }
  };

  return (
    <div className={cn("border rounded-md bg-background", className)}>
      <div className="flex items-center gap-1 border-b p-2 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("bold")}
          title="In đậm (Bold)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("italic")}
          title="In nghiêng (Italic)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("underline")}
          title="Gạch chân (Underline)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("insertUnorderedList")}
          title="Danh sách"
        >
          <List className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* --- TEXT COLOR POPOVER --- */}
        <Popover
          open={textColorPopoverOpen}
          onOpenChange={(open) => {
            if (open) saveSelection();
            setTextColorPopoverOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              title="Màu chữ"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <span className="relative flex h-4 w-4 items-center justify-center text-[12px] font-extrabold leading-none">
                A
                <span
                  className="absolute -bottom-1 left-0 h-1 w-full rounded-full border border-black/10"
                  style={{
                    backgroundColor: isMixedTextColor
                      ? "#94a3b8"
                      : textColor || "#000000",
                  }}
                />
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start" sideOffset={6}>
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Màu chữ {isMixedTextColor && "(Nhiều màu)"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={clearTextColor}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Bỏ màu
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {TEXT_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => applyTextColor(preset.value)}
                  className={cn(
                    "h-7 w-full rounded-md border border-border flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-ring",
                    textColor === preset.value && !isMixedTextColor && "ring-2 ring-primary border-primary"
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {textColor === preset.value && !isMixedTextColor && (
                    <Check
                      className={cn(
                        "h-3.5 w-3.5",
                        ["#000000", "#ef4444", "#2563eb", "#9333ea"].includes(preset.value)
                          ? "text-white"
                          : "text-black"
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs h-7 flex items-center justify-center gap-1.5"
                onClick={() => customTextColorInputRef.current?.click()}
              >
                <Palette className="h-3.5 w-3.5" />
                Màu tùy chỉnh...
              </Button>
              <input
                ref={customTextColorInputRef}
                type="color"
                value={textColor || "#000000"}
                onChange={(e) => applyTextColor(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* --- HIGHLIGHT POPOVER --- */}
        <Popover
          open={highlightPopoverOpen}
          onOpenChange={(open) => {
            if (open) saveSelection();
            setHighlightPopoverOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              title="Màu nền (Highlight)"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <Highlighter className="h-4 w-4" />
                <span
                  className="absolute -bottom-1 left-0 h-1 w-full rounded-full border border-black/10"
                  style={{
                    backgroundColor: isMixedHighlightColor
                      ? "#94a3b8"
                      : highlightColor || "transparent",
                  }}
                />
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start" sideOffset={6}>
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Tô nền {isMixedHighlightColor && "(Nhiều màu)"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={clearHighlight}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Xóa highlight
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {HIGHLIGHT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => applyHighlight(preset.value)}
                  className={cn(
                    "h-7 w-full rounded-md border border-border flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-ring",
                    highlightColor === preset.value && !isMixedHighlightColor && "ring-2 ring-primary border-primary"
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {highlightColor === preset.value && !isMixedHighlightColor && (
                    <Check className="h-3.5 w-3.5 text-black" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs h-7 flex items-center justify-center gap-1.5"
                onClick={() => customHighlightInputRef.current?.click()}
              >
                <Palette className="h-3.5 w-3.5" />
                Màu tùy chỉnh...
              </Button>
              <input
                ref={customHighlightInputRef}
                type="color"
                value={highlightColor || "#ffff00"}
                onChange={(e) => applyHighlight(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyLeft")}
          className={cn(alignMode === "left" && "bg-muted text-foreground")}
          title="Căn trái"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyCenter")}
          className={cn(alignMode === "center" && "bg-muted text-foreground")}
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyRight")}
          className={cn(alignMode === "right" && "bg-muted text-foreground")}
          title="Căn phải"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec("justifyFull")}
          className={cn(alignMode === "justify" && "bg-muted text-foreground")}
          title="Căn đều 2 lề"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            exec("removeFormat");
            clearTextColor();
            clearHighlight();
          }}
          title="Xóa định dạng (Remove formatting)"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Chèn ảnh"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />

        {/* --- TABLE POPOVER --- */}
        <Popover
          open={tablePopoverOpen}
          onOpenChange={(open) => {
            if (open) saveSelection();
            setTablePopoverOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Chèn bảng (Table)"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start" sideOffset={6}>
            <div className="border-b pb-2 mb-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <TableIcon className="h-3.5 w-3.5 text-primary" />
                Chèn bảng mới
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tạo bảng cho dạng bài Table Completion
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Số cột (Columns)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Số hàng (Rows)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 5)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Button
                type="button"
                size="sm"
                className="w-full text-xs h-8 font-medium"
                onClick={() => insertTable(tableRows, tableCols)}
              >
                Tạo bảng ({tableCols} cột x {tableRows} hàng)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-[11px] h-7 text-muted-foreground"
                onClick={() => insertTable(5, 2)}
              >
                Mẫu IELTS chuẩn (2 cột x 5 hàng)
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-4 w-px bg-border mx-1" />

        <Select
          onValueChange={(val) => {
            document.execCommand("fontSize", false, val);
            if (editorRef.current) {
              onChange(editorRef.current.innerHTML);
            }
          }}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <Type className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Cỡ chữ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Rất nhỏ</SelectItem>
            <SelectItem value="2">Nhỏ</SelectItem>
            <SelectItem value="3">Bình thường</SelectItem>
            <SelectItem value="4">Lớn</SelectItem>
            <SelectItem value="5">Rất lớn</SelectItem>
            <SelectItem value="6">Cực lớn</SelectItem>
            <SelectItem value="7">Khổng lồ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="p-3 text-sm outline-none rich-content-editor w-full"
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onMouseUp={() => {
          detectEditorState();
          saveSelection();
        }}
        onKeyUp={() => {
          detectEditorState();
          saveSelection();
        }}
        onPaste={handlePaste}
        onDrop={handleDrop}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        .rich-content-editor {
          line-height: 1.5;
          word-break: break-word;
          overflow-wrap: break-word;
          width: 100%;
        }
        .rich-content-editor p {
          margin: 0 0 0.75em;
        }
        .rich-content-editor p:last-child {
          margin-bottom: 0;
        }
        .rich-content-editor ul,
        .rich-content-editor ol {
          margin: 0 0 0.75em;
          padding-left: 1.5em;
        }
        .rich-content-editor li {
          margin-bottom: 0.25em;
        }
        .rich-content-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
        .rich-content-editor mark {
          border-radius: 2px;
          padding: 0 2px;
        }
        .rich-content-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        .rich-content-editor th,
        .rich-content-editor td {
          border: 1px solid hsl(var(--border));
          padding: 8px 12px;
          min-width: 60px;
          vertical-align: top;
        }
        .rich-content-editor th {
          background-color: hsl(var(--muted) / 0.6);
          font-weight: 600;
          text-align: left;
        }
      `}</style>
    </div>
  );
}
