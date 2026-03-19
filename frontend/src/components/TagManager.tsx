import React, { memo, useState, useCallback } from "react";
import { Trade } from "types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, X } from "lucide-react";
import { useUserGuardContext } from "app";
import { useStore } from "utils/store";
import { toast } from "sonner";

interface TagManagerProps {
  trade: Trade;
}

export const TagManager = memo(({ trade }: TagManagerProps) => {
  const { user } = useUserGuardContext();
  const { updateTradeTags } = useStore();
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<{
    index: number;
    text: string;
  } | null>(null);

  // Safety check - don't render if trade.id is missing
  if (!trade.id) {
    console.warn('Trade missing ID, skipping TagManager render:', trade);
    return null;
  }

  const handleAddTag = useCallback(() => {
    if (newTag.trim() === "" || !user || !trade.id) return;
    const updatedTags = [...(trade.tags || []), newTag.trim()];
    updateTradeTags(user.uid, trade.id, updatedTags);
    setNewTag("");
    toast.success(`Tag "${newTag.trim()}" added.`);
  }, [newTag, trade.tags, trade.id, user, updateTradeTags]);

  const handleRemoveTag = useCallback((index: number) => {
    if (!user || !trade.id) return;
    const updatedTags = [...(trade.tags || [])];
    const removedTag = updatedTags.splice(index, 1);
    updateTradeTags(user.uid, trade.id, updatedTags);
    toast.error(`Tag "${removedTag}" removed.`);
  }, [trade.tags, trade.id, user, updateTradeTags]);

  const handleUpdateTag = useCallback(() => {
    if (!editingTag || !user || !trade.id) return;
    const updatedTags = [...(trade.tags || [])];
    updatedTags[editingTag.index] = editingTag.text;
    updateTradeTags(user.uid, trade.id, updatedTags);
    setEditingTag(null);
    toast.success(`Tag updated to "${editingTag.text}".`);
  }, [editingTag, trade.tags, trade.id, user, updateTradeTags]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {trade.tags?.map((tag, index) =>
          editingTag?.index === index ? (
            <Input
              key={index}
              type="text"
              value={editingTag.text}
              onChange={(e) =>
                setEditingTag({ ...editingTag, text: e.target.value })
              }
              onBlur={handleUpdateTag}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateTag();
                if (e.key === "Escape") setEditingTag(null);
              }}
              autoFocus
              className="h-6 text-xs"
            />
          ) : (
            <Badge
              key={index}
              variant="secondary"
              className="group cursor-pointer"
              onClick={() => setEditingTag({ index, text: tag })}
            >
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent onClick for editing
                  handleRemoveTag(index);
                }}
                className="ml-1 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ),
        )}
      </div>
      <div className="flex gap-1">
        <Input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add tag..."
          className="h-8 bg-gray-800 border-gray-700"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTag();
          }}
        />
        <Button size="icon" className="h-8 w-8" onClick={handleAddTag}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

TagManager.displayName = 'TagManager';
