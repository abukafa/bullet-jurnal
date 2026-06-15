import React from 'react';
import { useAppStore } from '../store';
import './ConfirmModal.css';

export default function ConfirmModal() {
  const { confirmDialog, hideConfirm } = useAppStore();

  if (!confirmDialog) return null;

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    hideConfirm();
  };

  return (
    <div className="confirm-modal-overlay" style={{ zIndex: 999999 }} onClick={hideConfirm}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">!</div>
        <p className="confirm-message">{confirmDialog.message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={hideConfirm}>Cancel</button>
          <button className="btn-confirm" onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
