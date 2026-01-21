import { useState, useCallback } from 'react';
import { useCameraPermission } from './hooks/useCameraPermission';
import { useCameraDevices } from './hooks/useCameraDevices';
import { useScanHistory } from './hooks/useScanHistory';
import { CameraPermission } from './components/CameraPermission';
import { QRScanner } from './components/QRScanner';
import { ScanResultOverlay } from './components/ScanResultOverlay';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { MainLayout, HeaderNavigation } from './components/layout';
import type { QRScanResult } from './types/scanner';
import './App.css';

function App() {
  const {
    status,
    stream,
    isRequesting,
    error,
    requestPermission,
    stopStream,
  } = useCameraPermission();

  const {
    devices,
    selectedDevice,
    facingMode,
    hasMultipleCameras,
    toggleCamera,
    selectDevice,
  } = useCameraDevices();

  // Scan history management
  const { addScan } = useScanHistory();

  // Track the latest scan result and overlay visibility
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleRequestPermission = async () => {
    // Request with back camera preferred for QR scanning
    await requestPermission({ facingMode: 'environment' });
  };

  const handleScan = useCallback((result: QRScanResult) => {
    // Add scan to history with metadata
    addScan(result, {
      deviceId: selectedDevice?.deviceId,
      facingMode: facingMode,
    });

    setScanResult(result);
    setShowResultOverlay(true);
    console.log('QR Code scanned:', result.text);
  }, [addScan, selectedDevice?.deviceId, facingMode]);

  // Handle new scan request from overlay
  const handleNewScan = useCallback(() => {
    setShowResultOverlay(false);
    setScanResult(null);
  }, []);

  // Handle overlay dismiss
  const handleDismissOverlay = useCallback(() => {
    setShowResultOverlay(false);
  }, []);

  const handleScannerError = useCallback((errorMessage: string) => {
    console.error('Scanner error:', errorMessage);
  }, []);

  // Handle camera switch
  const handleSwitchCamera = useCallback(() => {
    // Toggle the camera in the devices hook (this updates state and localStorage)
    toggleCamera();

    // The QRScanner component will re-render with new config props
    // which will trigger the camera switch in the scanner
  }, [toggleCamera]);

  // Determine if camera permission is granted and we can show the scanner
  const showScanner = status?.state === 'granted';

  // Handle settings modal
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleCameraChange = useCallback((deviceId: string) => {
    selectDevice(deviceId);
  }, [selectDevice]);

  // Handle history modal
  const handleOpenHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  // Header right action with HeaderNavigation component
  const headerRightAction = (
    <HeaderNavigation
      onHistoryClick={handleOpenHistory}
      onSettingsClick={handleOpenSettings}
    />
  );

  return (
    <MainLayout
      title="QR Code Reader"
      showHeader={true}
      showFooter={true}
      headerRightAction={headerRightAction}
    >
      {!showScanner ? (
        <CameraPermission
          status={status}
          stream={stream}
          isRequesting={isRequesting}
          error={error}
          onRequestPermission={handleRequestPermission}
          onStopStream={stopStream}
        />
      ) : (
        <>
          {/* Stop the camera permission stream since QRScanner will manage its own */}
          {stream && stopStream()}
          <QRScanner
            onScan={handleScan}
            onError={handleScannerError}
            config={{
              facingMode: facingMode,
              deviceId: selectedDevice?.deviceId,
              fps: 10,
              qrboxWidth: 250,
              qrboxHeight: 250,
            }}
            autoStart={true}
            hasMultipleCameras={hasMultipleCameras}
            facingMode={facingMode}
            onSwitchCamera={handleSwitchCamera}
          />

          {/* Scan result overlay - appears after successful scan */}
          {scanResult && (
            <ScanResultOverlay
              result={scanResult}
              visible={showResultOverlay}
              onNewScan={handleNewScan}
              onDismiss={handleDismissOverlay}
            />
          )}
        </>
      )}

      {/* Settings modal */}
      <SettingsModal
        visible={showSettings}
        onClose={handleCloseSettings}
        cameraDevices={devices}
        selectedCameraId={selectedDevice?.deviceId}
        onCameraChange={handleCameraChange}
        facingMode={facingMode}
        hasMultipleCameras={hasMultipleCameras}
      />

      {/* History modal */}
      <HistoryModal
        visible={showHistory}
        onClose={handleCloseHistory}
      />
    </MainLayout>
  );
}

export default App;
