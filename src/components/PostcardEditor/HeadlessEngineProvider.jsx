import CreativeEngine from '@cesdk/engine';
import { createContext, useContext, useEffect, useState } from 'react';

const HeadlessEngineContext = createContext(undefined);

export const HeadlessEngineProvider = ({
  children,
  config,
  configure,
  LoadingComponent = null
}) => {
  const [engine, setEngine] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let localEngine = null;
    let mounted = true;

    const loadEngine = async () => {
      try {
        console.log('Initializing Headless Engine...');
        // Initialize CreativeEngine in headless mode
        localEngine = await CreativeEngine.init({
          license: 'LePTY688e8B3VoxIgNFWBLLbSijS9QJ-WRZQSFFJ9OiVl0z_Jsfu6PEQjMPL-yCX',
          userId: 'postcard-user',
          baseURL: '/cesdk-assets',
          ...config
        });
        console.log('Headless Engine initialized successfully');

        if (!mounted) {
          localEngine.dispose();
          return;
        }

        // Configure engine for postcard editing
        console.log('Configuring engine settings...');
        localEngine.editor.setSettingBool('mouse/enableScroll', false);
        localEngine.editor.setSettingBool('mouse/enableZoom', false);
        localEngine.editor.setSettingBool('page/title/show', false);
        localEngine.editor.setSettingBool('touch/singlePointPanning', false);
        localEngine.editor.setSettingBool('touch/dragStartCanSelect', false);

        // Add asset sources
        console.log('Adding asset sources...');
        await localEngine.addDefaultAssetSources({});
        await localEngine.addDemoAssetSources({
          sceneMode: 'Design',
          withUploadAssetSources: true,
          exclude: ['ly.img.image']
        });
        console.log('Asset sources added');

        // Custom configuration
        if (configure) {
          console.log('Running custom configuration...');
          await configure(localEngine);
          console.log('Custom configuration completed');
        }

        setEngine(localEngine);
        setIsLoaded(true);
        setError(null);
        console.log('Headless Engine fully loaded');
      } catch (err) {
        console.error('Failed to initialize headless engine:', err);
        setError(err.message || 'Failed to initialize engine');
        setIsLoaded(false);
        if (localEngine) {
          localEngine.dispose();
        }
      }
    };

    loadEngine();

    return () => {
      mounted = false;
      if (localEngine) {
        localEngine.dispose();
        localEngine = null;
      }
      setEngine(null);
      setIsLoaded(false);
      setError(null);
    };
  }, []);

  // Show error if initialization failed
  if (error) {
    return (
      <div className="error-overlay professional">
        <div className="error-box">
          <div className="error-icon">⚠️</div>
          <h3>Engine Initialization Error</h3>
          <p>{error}</p>
          <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
            Please refresh the page and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!engine || !isLoaded) {
    return LoadingComponent;
  }

  const value = {
    engine,
    isLoaded
  };

  return (
    <HeadlessEngineContext.Provider value={value}>
      {children}
    </HeadlessEngineContext.Provider>
  );
};

export const useHeadlessEngine = () => {
  const context = useContext(HeadlessEngineContext);
  if (context === undefined) {
    throw new Error('useHeadlessEngine must be used within a HeadlessEngineProvider');
  }
  return context;
};