import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import './PromptModal.css';

export default function PromptModal() {
  const { promptDialog, hidePrompt } = useAppStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (promptDialog) {
      setInputValue(promptDialog.defaultValue || '');
    }
  }, [promptDialog]);

  if (!promptDialog) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (promptDialog.onSubmit) {
      promptDialog.onSubmit(inputValue);
    }
    hidePrompt();
  };

  return (
    <div className="prompt-modal-overlay" style={{ zIndex: 999999 }} onClick={hidePrompt}>
      <div className="prompt-modal" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="prompt-icon">?</div>
          <p className="prompt-message">{promptDialog.message}</p>
          <input 
            type="text" 
            className="prompt-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
          <div className="prompt-actions">
            <button type="button" className="btn-cancel" onClick={hidePrompt}>Cancel</button>
            <button type="submit" className="btn-submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
