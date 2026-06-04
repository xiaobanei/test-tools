'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

let nextId = 1;

export function createPair(key = '', value = '', enabled = true): KeyValuePair {
  return { id: String(nextId++), key, value, enabled };
}

export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const addPair = () => {
    onChange([...pairs, createPair()]);
  };

  const removePair = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id));
  };

  const updatePair = (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    onChange(
      pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={(e) => updatePair(pair.id, 'enabled', e.target.checked)}
            className="size-3.5 shrink-0 rounded border-border accent-primary"
          />
          <Input
            value={pair.key}
            onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="h-8 font-mono text-xs"
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="h-8 font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removePair(pair.id)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={addPair}
        className="self-start text-muted-foreground"
      >
        <Plus className="size-3.5" />
        添加
      </Button>
    </div>
  );
}
