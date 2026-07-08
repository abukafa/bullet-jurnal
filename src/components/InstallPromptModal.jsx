import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { Download, X } from 'lucide-react';
import './InstallPromptModal.css';

export default function InstallPromptModal() {
  const { isInstallModalOpen, setInstallModalOpen, deferredPrompt, setDeferredPrompt } = useAppStore();

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt and close modal
    setDeferredPrompt(null);
    setInstallModalOpen(false);
  };

  const handleClose = () => {
    setInstallModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isInstallModalOpen && (
        <>
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div 
            className="install-modal-container"
            initial={{ opacity: 0, y: "-30%", x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: "-50%", x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: "-30%", x: "-50%", scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <button className="install-close-btn" onClick={handleClose}>
              <X size={20} />
            </button>
            
            <div className="install-content">
              <div className="install-icon-wrapper">
                <img src="/icons/icon-192x192.png" alt="App Logo" className="install-app-icon" />
              </div>
              
              <h2 className="install-title">Install Bullet Journal</h2>
              <p className="install-description">
                Add this app to your home screen for quick access, full-screen experience, and offline capabilities.
              </p>
              
              <div className="install-actions">
                <button className="install-btn-primary" onClick={handleInstall}>
                  <Download size={18} />
                  <span>Install App</span>
                </button>
                <button className="install-btn-secondary" onClick={handleClose}>
                  Not Now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
