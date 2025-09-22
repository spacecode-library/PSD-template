import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';

const SinglePageModeContext = createContext(undefined);

export const SinglePageModeProvider = ({ cesdk, children }) => {
  const [enabled, setEnabled] = useState(true);
  const [currentPageBlockId, setCurrentPageBlockId] = useState(null);
  const historyIdRef = useRef(0);

  const enterSinglePageMode = useCallback(
    (blockId) => {
      if (!cesdk || !blockId) return;

      const engine = cesdk.engine;
      
      // Hide all other pages
      const pages = engine.scene.getPages();
      pages.forEach((page) => {
        if (page !== blockId) {
          engine.block.setVisible(page, false);
        }
      });

      // Show and zoom to the current page
      engine.block.setVisible(blockId, true);
      
      // Use a timeout to ensure the layout has updated
      setTimeout(() => {
        engine.scene.zoomToBlock(blockId, 0.9);
      }, 100);
    },
    [cesdk]
  );

  useEffect(() => {
    if (!cesdk || !enabled || !currentPageBlockId) return;

    enterSinglePageMode(currentPageBlockId);

    // Reenter single page mode when history changes
    const unsubscribe = cesdk.engine.editor.onHistoryUpdated(() => {
      const currentHistoryId = historyIdRef.current;
      // Prevent infinite loops
      if (currentHistoryId !== historyIdRef.current) {
        historyIdRef.current = currentHistoryId + 1;
        enterSinglePageMode(currentPageBlockId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [cesdk, enabled, currentPageBlockId, enterSinglePageMode]);

  const value = {
    enabled,
    setEnabled,
    currentPageBlockId,
    setCurrentPageBlockId
  };

  return (
    <SinglePageModeContext.Provider value={value}>
      {children}
    </SinglePageModeContext.Provider>
  );
};

export const useSinglePageMode = () => {
  const context = useContext(SinglePageModeContext);
  if (!context) {
    throw new Error('useSinglePageMode must be used within SinglePageModeProvider');
  }
  return context;
};