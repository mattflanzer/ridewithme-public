<template>
  <v-container fluid fill-height>
    <v-icon class="device-button" @click="loadDevices(isOpen)" color="white">mdi-cog</v-icon>
    <v-layout column>
      <div xs12 sm8 md4 class="full-width">
        <v-list dense class="device-list elevation-12">
          <v-card-subtitle dark v-if="error" color="alert">{{ error }}</v-card-subtitle>
          <v-list-subheader>
            <span @click="loadDevices()">Devices</span>
             <v-icon v-if="loading" class="spinner">mdi-loading</v-icon>
             <v-icon v-if="mayReload" class="may-reload" @click="loadDevices()">mdi-reload</v-icon>
          </v-list-subheader>
          <v-list-item v-for="device in devices" :key="device.deviceId">
            <v-list-item-avatar @click="toggleDevice(device.deviceId)">
              <v-icon :size="36" :color="deviceIsConnected(device.deviceId) ? 'blue-darken-1' : '' ">{{ deviceIsConnected(device.deviceId) ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off-outline'}}</v-icon>
            </v-list-item-avatar>
            <v-list-item-title v-text="device.deviceName"></v-list-item-title>
            <v-icon v-if="connecting[device.deviceId]" class="spinner">mdi-loading</v-icon>
          </v-list-item>
        </v-list>
      </div>
    </v-layout>
  </v-container>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'UserDevices',
  data: () => ({
    error: null,
    connecting: {},
    loaded: false,
  }),
  props: {
    isOpen: {
      type: Boolean,
      default: () => false,
    },
  },
  computed: {
    ...mapGetters({
      deviceIsConnected: 'BluetoothDevices/deviceIsConnected',
      valueByUuid: 'BluetoothDevices/valueByUuid',
      devices: 'BluetoothDevices/devices',
      loading: 'BluetoothDevices/isLoading',
      weight: 'User/weight',
    }),
    mayReload() {
      return (this.loaded && !this.loading);
    }
  },
  methods: {
    ...mapActions({
      loadBluetoothDevices: 'BluetoothDevices/loadDevices',
      connectDevice: 'BluetoothDevices/connectDevice',
      disconnectDevice: 'BluetoothDevices/disconnectDevice',
      subscribeCharacteristic: 'BluetoothDevices/subscribeCharacteristic',
      recordCharacteristic: 'Leaders/recordCategory',
      addWriteCharacteristic: 'BluetoothDevices/addWriteCharacteristic',
    }),
    async loadDevices(isOpen) {
      this.error = '';
      if (typeof isOpen === 'boolean') {
        this.$emit('toggleOpen');
        if (isOpen) {
          this.loaded = false;
          return;
        }
      }
      try {
        this.loadBluetoothDevices([ 'heart_rate', 'cycling_power', 'fitness_machine' ]);
        this.subscribeCharacteristic({
          uuid: window.BluetoothUUID.getCharacteristic('heart_rate_measurement'),
          method: 'DailyCall/sendAppMessage',
          data: value => ({
            key: 'HR',
            value: value?.getUint8(1),
            ts: Date.now()
          }),
        });
        this.recordCharacteristic('Wkg');
        this.subscribeCharacteristic({
          uuid: window.BluetoothUUID.getCharacteristic('cycling_power_measurement'),
          method: 'DailyCall/sendAppMessage',
          data: value => {
            const data = [];
            const watts = value?.getInt16(2, true);
            if (!Number.isNaN(watts)) {
              const ts = Date.now();
              data.push({
                key: 'PWR',
                value: Math.floor(watts),
                ts
              });
              if (this.weight) {
                const wkg = (watts / this.weight).toFixed(1);
                const wkgValue = Number.parseFloat(wkg);
                if (!Number.isNaN(wkgValue)) {
                  data.push({
                    key: 'Wkg',
                    value: wkgValue,
                    ts
                  });
                }
              }
            }
            return data;
          },
        });
        this.addWriteCharacteristic({
          uuid: window.BluetoothUUID.getCharacteristic('fitness_machine_control_point'),
          key: 'Wkg',
          start: () => {
            const buffer = new ArrayBuffer(1);
            const dataview = new DataView(buffer);
            dataview.setInt8(0, 0x00, true);
            return buffer;
          },
          stop: () => {
            const buffer = new ArrayBuffer(1);
            const dataview = new DataView(buffer);
            dataview.setInt8(0, 0x01, true);
            return buffer;
          },
          data: value => {
            if (!this.weight) {
              throw new Error('no weight');
            }
            const buffer = new ArrayBuffer(3);
            const dataview = new DataView(buffer);
            dataview.setInt8(0, 0x05, true);
            const watts = Math.round(value * this.weight);
            dataview.setInt16(1, watts, true);
            return buffer;
          }
        });
        this.loaded = true;
      } catch (err) {
        console.error(`loadDevices: ${err}`);
        this.error = err.message;
      }
    },
    async toggleDevice(deviceId) {
      this.error = '';
      try {
        if  (this.deviceIsConnected(deviceId)) {
          await this.disconnectDevice(deviceId);
        }
        else {
          this.connecting[deviceId] = true;
          await this.connectDevice(deviceId);
          this.connecting[deviceId] = false;
        }
      } catch (err) {
        console.error(`toggleDevice: ${err}`);
        this.error = err.message;
      }
    }
  },
}
</script>
<style scoped>
.spinner {
  animation: spin 1s infinite linear;
  margin-left: 8px;
}

@keyframes spin {
  0%  {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
}

.device-button {
  font-size: 24px;
  top: 0;
  left: 0;
  cursor: pointer;
  margin-left: -16px;
}

.may-reload {
  cursor: pointer;
  margin-left: 8px;
}
</style>
