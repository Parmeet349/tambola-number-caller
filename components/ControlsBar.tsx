// components/ControlsBar.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Mode = 'manual' | 'auto';
type Speed = 'slow' | 'medium' | 'fast';

interface ControlsBarProps {
  mode: Mode;
  onToggleMode: () => void;

  speed: Speed;
  onChangeSpeed: (speed: Speed) => void;

  mute: boolean;
  onToggleMute: () => void;

  languageSelected: 'english' | 'hindi';
  onToggleLanguage: () => void;

  speakStyledNumber: boolean;
  onToggleSpeakStyledNumber: () => void;

  // game actions
  onDraw: () => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  onRestart: () => void;
}

type DropdownKey = 'mode' | 'speed' | 'sound' | 'language' | 'fun' | null;

const ControlsBar: React.FC<ControlsBarProps> = ({
  mode,
  onToggleMode,
  speed,
  onChangeSpeed,
  mute,
  onToggleMute,
  languageSelected,
  onToggleLanguage,
  speakStyledNumber,
  onToggleSpeakStyledNumber,
  onDraw,
  onPlayPause,
  isPlaying,
  onRestart,
}) => {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);

  const toggleDropdown = (key: DropdownKey) => {
    setOpenDropdown(prev => (prev === key ? null : key));
  };

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode !== mode) {
      onToggleMode();
    }
    setOpenDropdown(null);
  };

  const handleSpeedChange = (nextSpeed: Speed) => {
    if (nextSpeed !== speed) {
      onChangeSpeed(nextSpeed);
    }
    setOpenDropdown(null);
  };

  const handleSoundChange = (muted: boolean) => {
    if (muted !== mute) {
      onToggleMute();
    }
    setOpenDropdown(null);
  };

  const handleLanguageChange = (lang: 'english' | 'hindi') => {
    if (lang !== languageSelected) {
      onToggleLanguage();
    }
    setOpenDropdown(null);
  };

  const handleFunChange = (on: boolean) => {
    if (on !== speakStyledNumber) {
      onToggleSpeakStyledNumber();
    }
    setOpenDropdown(null);
  };

  const isManual = mode === 'manual';

  const handleCallPlayPress = () => {
    if (isManual) {
      onDraw(); // manual mode → call next number
    } else {
      onPlayPause(); // auto mode → play / pause auto calling
    }
  };

  const callPlayLabel = isManual
    ? 'Call Number'
    : isPlaying
      ? 'Pause Auto'
      : 'Play Auto';

  return (
    <View style={styles.wrapper}>
      {/* Dropdowns row */}
      <View style={styles.dropdownRow}>
        <Dropdown
          label="Mode"
          value={mode === 'manual' ? 'Manual' : 'Auto'}
          isOpen={openDropdown === 'mode'}
          onPress={() => toggleDropdown('mode')}
        >
          <DropdownItem
            label="Manual"
            selected={mode === 'manual'}
            onPress={() => handleModeChange('manual')}
          />
          <DropdownItem
            label="Auto"
            selected={mode === 'auto'}
            onPress={() => handleModeChange('auto')}
          />
        </Dropdown>

        <Dropdown
          label="Speed"
          value={
            speed === 'slow' ? 'Slow' : speed === 'medium' ? 'Med' : 'Fast'
          }
          isOpen={openDropdown === 'speed'}
          onPress={() => toggleDropdown('speed')}
        >
          <DropdownItem
            label="Slow"
            selected={speed === 'slow'}
            onPress={() => handleSpeedChange('slow')}
          />
          <DropdownItem
            label="Med"
            selected={speed === 'medium'}
            onPress={() => handleSpeedChange('medium')}
          />
          <DropdownItem
            label="Fast"
            selected={speed === 'fast'}
            onPress={() => handleSpeedChange('fast')}
          />
        </Dropdown>
      </View>

      <View style={styles.dropdownRow}>
        <Dropdown
          label="Sound"
          value={mute ? 'Mute' : 'Unmute'}
          isOpen={openDropdown === 'sound'}
          onPress={() => toggleDropdown('sound')}
        >
          <DropdownItem
            label="Mute"
            selected={mute}
            onPress={() => handleSoundChange(true)}
          />
          <DropdownItem
            label="Unmute"
            selected={!mute}
            onPress={() => handleSoundChange(false)}
          />
        </Dropdown>

        <Dropdown
          label="Language"
          value={languageSelected === 'english' ? 'English' : 'Hindi'}
          isOpen={openDropdown === 'language'}
          onPress={() => toggleDropdown('language')}
        >
          <DropdownItem
            label="English"
            selected={languageSelected === 'english'}
            onPress={() => handleLanguageChange('english')}
          />
          <DropdownItem
            label="Hindi"
            selected={languageSelected === 'hindi'}
            onPress={() => handleLanguageChange('hindi')}
          />
        </Dropdown>
      </View>

      <View style={styles.dropdownRow}>
        <Dropdown
          label="Fun Number"
          value={speakStyledNumber ? 'On' : 'Off'}
          isOpen={openDropdown === 'fun'}
          onPress={() => toggleDropdown('fun')}
          fullWidth
        >
          <DropdownItem
            label="On"
            selected={speakStyledNumber}
            onPress={() => handleFunChange(true)}
          />
          <DropdownItem
            label="Off"
            selected={!speakStyledNumber}
            onPress={() => handleFunChange(false)}
          />
        </Dropdown>
      </View>

      {/* Action buttons (kept same: Call/Play + Restart) */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#43a047' }]}
          onPress={handleCallPlayPress}
        >
          <Text style={styles.actionText}>{callPlayLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ef5350' }]}
          onPress={onRestart}
        >
          <Text style={styles.actionText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface DropdownProps {
  label: string;
  value: string;
  children: React.ReactNode;
  isOpen: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  children,
  isOpen,
  onPress,
  fullWidth,
}) => {
  return (
    <View style={[styles.dropdownContainer, fullWidth && { flex: 1 }]}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdownHeader} onPress={onPress}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Text style={styles.dropdownChevron}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.dropdownMenu}>{children}</View>}
    </View>
  );
};

interface DropdownItemProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  label,
  selected,
  onPress,
}) => (
  <TouchableOpacity style={styles.dropdownItem} onPress={onPress}>
    <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownChevron: {
    fontSize: 10,
    color: '#777',
    marginLeft: 4,
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ControlsBar;
