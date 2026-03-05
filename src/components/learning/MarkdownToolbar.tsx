import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Code, Heading2, Link2, Quote } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefObject } from "react";

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

type FormatAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const actions: FormatAction[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "_", suffix: "_" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: Heading2, label: "Heading", prefix: "## ", suffix: "", block: true },
  { icon: Quote, label: "Quote", prefix: "> ", suffix: "", block: true },
  { icon: List, label: "Bullet list", prefix: "- ", suffix: "", block: true },
  { icon: ListOrdered, label: "Numbered list", prefix: "1. ", suffix: "", block: true },
  { icon: Link2, label: "Link", prefix: "[", suffix: "](url)" },
];

const MarkdownToolbar = ({ textareaRef, value, onChange }: MarkdownToolbarProps) => {
  const applyFormat = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    let newText: string;
    let cursorPos: number;

    if (action.block) {
      // For block-level formatting, add prefix at line start
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const before = value.substring(0, lineStart);
      const after = value.substring(lineStart);
      
      if (selected) {
        const lines = selected.split("\n").map((line, i) => {
          if (action.prefix === "1. ") return `${i + 1}. ${line}`;
          return `${action.prefix}${line}`;
        });
        newText = value.substring(0, start) + lines.join("\n") + value.substring(end);
        cursorPos = start + lines.join("\n").length;
      } else {
        newText = before + action.prefix + after;
        cursorPos = lineStart + action.prefix.length;
      }
    } else {
      const wrapped = `${action.prefix}${selected || "text"}${action.suffix}`;
      newText = value.substring(0, start) + wrapped + value.substring(end);
      cursorPos = selected
        ? start + wrapped.length
        : start + action.prefix.length + 4; // "text" length
    }

    onChange(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      if (!selected && !action.block) {
        textarea.setSelectionRange(start + action.prefix.length, start + action.prefix.length + 4);
      } else {
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-0.5 border border-input rounded-md p-0.5 bg-muted/50">
        {actions.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => applyFormat(action)}
              >
                <action.icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default MarkdownToolbar;
