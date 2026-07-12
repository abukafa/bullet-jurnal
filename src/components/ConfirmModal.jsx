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

  const handleCancel = () => {
    if (confirmDialog.onCancel) {
      confirmDialog.onCancel();
    }
    hideConfirm();
  };

  return (
    <div className="confirm-modal-overlay" style={{ zIndex: 999999 }} onClick={handleCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">!</div>
        <p className="confirm-message">{confirmDialog.message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
          <button className="btn-confirm" onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
