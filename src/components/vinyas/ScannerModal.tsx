import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal
} from 'react-native';
import { CameraView } from 'expo-camera';
import { THEME } from '../../constants/vinyas-theme';

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarCodeScanned: (event: { data: string }) => void;
  hasPermission: boolean;
}

export default function ScannerModal({ visible, onClose, onBarCodeScanned, hasPermission }: ScannerModalProps) {
  if (!visible || !hasPermission) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.scannerOverlay}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={onBarCodeScanned}
        />

        {/* Scanner HUD Overlay */}
        <View style={styles.scannerHUD}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>Align Vinyas QR code inside the frame</Text>

          <TouchableOpacity
            style={styles.scannerCloseBtn}
            onPress={onClose}
          >
            <Text style={styles.scannerCloseBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scannerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    zIndex: 10,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: THEME.orange,
    borderRadius: 24,
    backgroundColor: 'transparent',
    marginTop: 'auto',
    marginBottom: 40,
    shadowColor: THEME.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  scannerHint: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 'auto',
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  scannerCloseBtn: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scannerCloseBtnText: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
