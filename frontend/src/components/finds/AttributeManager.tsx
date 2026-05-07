import React, { useState } from 'react';
import type { FindAttribute } from '../../types';
import { attributesService } from '../../services/attributesService';
import { ApiRequestError } from '../../services/api';
import { Button, Input } from '../../components/ui';

const KEY_SUGGESTIONS = ['material', 'era', 'condition', 'dimensions', 'weight', 'origin', 'denomination'];

interface AttributeManagerProps {
  findId: string;
  attributes: FindAttribute[];
  onAttributesChange: (attributes: FindAttribute[]) => void;
}

export const AttributeManager: React.FC<AttributeManagerProps> = ({ findId, attributes, onAttributesChange }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setAddError(null);
    if (!newKey.trim()) { setKeyError('Key is required.'); return; }
    setIsAdding(true);
    try {
      const created = await attributesService.create(findId, { key: newKey.trim(), value: newValue.trim() });
      onAttributesChange([...attributes, created]);
      setNewKey('');
      setNewValue('');
    } catch (err) {
      setAddError(err instanceof ApiRequestError ? err.message : 'Failed to add attribute.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (attrId: string) => {
    setDeletingId(attrId);
    try {
      await attributesService.delete(findId, attrId);
      onAttributesChange(attributes.filter((a) => a.id !== attrId));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {attributes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {attributes.map((attr) => (
            <div key={attr.id} className="flex items-start justify-between bg-explorer-bg border border-explorer-border rounded-lg px-3 py-2.5">
              <div className="min-w-0">
                <dt className="text-xs font-medium text-explorer-muted uppercase tracking-wide">{attr.key}</dt>
                <dd className="text-sm text-explorer-text mt-0.5 break-words">{attr.value}</dd>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete attribute ${attr.key}`}
                onClick={() => handleDelete(attr.id)}
                isLoading={deletingId === attr.id}
                disabled={deletingId !== null}
                className="ml-2 shrink-0 text-explorer-muted hover:text-explorer-danger"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-explorer-muted mb-4">No attributes yet. Add some below.</p>
      )}

      <form onSubmit={handleAdd} noValidate aria-label="Add attribute" className="flex flex-col sm:flex-row gap-2 items-start">
        <div className="flex-1 min-w-0">
          <Input
            id="attr-key"
            placeholder="Key (e.g. material)"
            value={newKey}
            onChange={(e) => { setNewKey(e.target.value); if (keyError) setKeyError(null); }}
            error={keyError ?? undefined}
            list="attr-key-suggestions"
            disabled={isAdding}
            required
          />
          <datalist id="attr-key-suggestions">
            {KEY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="flex-1 min-w-0">
          <Input id="attr-value" placeholder="Value (e.g. silver)" value={newValue} onChange={(e) => setNewValue(e.target.value)} disabled={isAdding} />
        </div>
        <div className="sm:mt-0 shrink-0">
          <Button type="submit" variant="outline" size="md" isLoading={isAdding} disabled={isAdding}>
            Add
          </Button>
        </div>
      </form>

      {addError && (
        <p className="mt-2 text-xs text-explorer-danger" role="alert">{addError}</p>
      )}
    </div>
  );
};
