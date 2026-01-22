import { useState, useCallback, useEffect, useRef } from 'react';
import { useCameraPermission } from './hooks/useCameraPermission';
import { useCameraDevices } from './hooks/useCameraDevices';
import { useScanHistory } from './hooks/useScanHistory';
import { CameraPermission } from './components/CameraPermission';
import { QRScanner } from './components/QRScanner';
import type { QRScannerRef } from './components/QRScanner';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ScanResultOverlay } from './components/ScanResultOverlay';
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

  // Track modal visibility
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showActionsOverlay, setShowActionsOverlay] = useState(false);
  const [actionsResult, setActionsResult] = useState<QRScanResult | null>(null);

  // Ref to access QRScanner methods
  const scannerRef = useRef<QRScannerRef>(null);

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

    console.log('QR Code scanned:', result.text);
  }, [addScan, selectedDevice?.deviceId, facingMode]);

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

  // Stop the camera permission stream when scanner is shown
  // QRScanner manages its own camera stream, so we need to stop the permission stream
  useEffect(() => {
    if (showScanner && stream) {
      stopStream();
    }
  }, [showScanner, stream, stopStream]);

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

  const handleShowActions = useCallback((result: QRScanResult) => {
    setActionsResult(result);
    setShowActionsOverlay(true);
  }, []);

  const handleDismissActions = useCallback(() => {
    setShowActionsOverlay(false);
    setActionsResult(null);
  }, []);

  const handleNewScanFromActions = useCallback(() => {
    setShowActionsOverlay(false);
    setActionsResult(null);
    setShowHistory(false);
    scannerRef.current?.clearResult();
    void scannerRef.current?.startScanner();
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
          <QRScanner
            ref={scannerRef}
            onScan={handleScan}
            onError={handleScannerError}
            onShowActions={handleShowActions}
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
        onShowActions={handleShowActions}
      />

      {actionsResult && (
        <ScanResultOverlay
          result={actionsResult}
          visible={showActionsOverlay}
          onNewScan={handleNewScanFromActions}
          onDismiss={handleDismissActions}
        />
      )}
    </MainLayout>
  );
}

export default App;
