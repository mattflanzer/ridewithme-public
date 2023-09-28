const LOAD_DEVICE_INTERVAL_MS = 350;
const LOAD_DEVICE_INTERVAL_MAX = 8;
const UNSUPPORTED_DEVICE_NAME = 'Unknown or Unsupported Device';

export default {
  namespaced: true,
  state: () => ({
    devices: [],
    receiver: false,
    characteristics: {},
    sameDevicesCount: 0,
    loading: false,
    writeable: {},
  }),
  mutations: {
    setDevices(state, devices) {
      state.devices = devices;
      state.sameDevicesCount = 0;
    },
    setReceiver(state, hasReceiver = true) {
      state.receiver = hasReceiver;
    },
    setBluetoothDevice(state, { deviceId, btDevice, disconnectListener }) {
      const device = state.devices.find(stateDevice => stateDevice.deviceId === deviceId);
      if (!device) {
        throw new Error(`device not found ${deviceId}`);
      }
      device.btDevice = btDevice;
      btDevice.addEventListener('gattserverdisconnected', disconnectListener);
      device.disconnectListener = disconnectListener;
    },
    unsetBluetoothDevice(state, { deviceId }) {
      const device = state.devices.find(({ deviceId: id }) => id === deviceId);
      if (!device) {
        throw new Error(`device not found ${deviceId}`);
      }
      if (device.btDevice) {
        device.btDevice.removeEventListener('gattserverdisconnected', device.disconnectListener);
        device.btDevice = null;
      }
      device.disconnectListener = null;
      state.characteristics = Object.entries(state.characteristics).reduce((acc, [ id, characteristic ]) => {
        if (characteristic.deviceId !== deviceId) {
          acc[id] = characteristic;
        }
        return acc;
      }, {});
      state.writeable = Object.entries(state.writeable).reduce((acc, [ id, characteristic ]) => {
        if (characteristic.deviceId !== deviceId) {
          acc[id] = characteristic;
        }
        return acc;
      }, {});
    },
    setCharacteristic(state, { deviceId, uuid, value }) {
      const { action } = state.characteristics[uuid] || {};
      state.characteristics[uuid] = { deviceId, value, action };
    },
    subscribeCharacteristic(state, { uuid, action }) {
      const orig = state.characteristics[uuid] || {};
      state.characteristics[uuid] = {
        ...orig,
        action,
      };
    },
    resetSameDevicesCount(state) {
      state.sameDevicesCount = 0;
    },
    addDevices(state, devices = []) {
      const newDevices = devices.filter(({ deviceId: id, deviceName }) => !(
        deviceName.startsWith(UNSUPPORTED_DEVICE_NAME)  || state.devices.some(({ deviceId }) => deviceId === id))
      );
      if (newDevices.length > 0) {
        state.devices.push(...newDevices);
      } else {
        state.sameDevicesCount += 1;
      }
    },
    setLoading(state, loading = true) {
      state.loading = loading;
    },
    addWriteCharacteristic(state, params) {
      const { uuid, ...data } = params;
      const existing = state.writeable[uuid] || {};
      state.writeable[uuid] = {
        ...existing,
        ...data,
      };
    },
  },
  getters: {
    devices: state => state.devices,
    deviceById: state => id => state.devices.find(({ deviceId }) => deviceId === id),
    deviceIsConnected: state => id => !!((state.devices.find(({ deviceId }) => deviceId === id) || {}).btDevice),
    valueByUuid: state => uuid => (state.characteristics[uuid] || {}).value,
    isLoading: state => state.loading,
    shouldWrite: state => uuid => !!state.writeable[uuid],
  },
  actions: {
    async loadDevices({ state, commit, rootGetters }, services ) {
      commit('setLoading');
      let deviceListHandled = true;
      if (!state.receiver) {
        window.electronAPI.receive("bluetooth-device-list", (devices) => {
          console.log(devices);
          commit('addDevices', devices.flat());
          deviceListHandled = true;
        });
        commit('setReceiver');
      }
      const filters = services.map(service => ({
        services: [ service ]
      }));
      const timerId = setInterval(async () => {
        if (deviceListHandled) {
          deviceListHandled = false;
          try {
            await rootGetters.bluetooth.requestDevice({ filters });
            if (state.sameDevicesCount >= LOAD_DEVICE_INTERVAL_MAX) {
              throw new RangeError('maximum device checks');
            }
          } catch (err) {
            if (!(err instanceof RangeError)) {
              console.warn(`bluetooth.requestDevice: ${err}`);
            }
            commit('resetSameDevicesCount');
            clearInterval(timerId);
            commit('setLoading', false);
          }
        }
      }, LOAD_DEVICE_INTERVAL_MS);
    },
    async connectDevice({ commit, getters, dispatch, rootGetters }, deviceId) {
      const device = getters.deviceById(deviceId);
      if ((!device) || device.btDevice) {
        return;
      }
      const btDevice = await rootGetters.bluetooth.requestDevice({
        filters: [{
          name: device.deviceName,
        }]
      });
      const disconnectListener = () => {
        commit('unsetBluetoothDevice', { deviceId });
      };
      commit('setBluetoothDevice', { deviceId, btDevice, disconnectListener });
      if (!btDevice.gatt.connected) {
        const server = await btDevice.gatt.connect();
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const characteristics = await service.getCharacteristics();
          for (const characteristic of characteristics) {
            if(
              characteristic.properties.read ||
              characteristic.properties.notify ||
              characteristic.properties.indicate
            ) {
              characteristic.addEventListener('characteristicvaluechanged', event => {
                dispatch('updateCharacteristic', {
                  deviceId,
                  uuid: characteristic.uuid,
                  value: event.target.value,
                });
              });
              if (characteristic.properties.notify || characteristic.properties.indicate) {
                await characteristic.startNotifications();
              }
              const value = await (characteristic.properties.read ? characteristic.readValue() : Promise.resolve());
              dispatch('updateCharacteristic', {
                deviceId,
                uuid: characteristic.uuid,
                value,
              });
            }
            if (characteristic.properties.write && getters.shouldWrite(characteristic.uuid)) {
              commit('addWriteCharacteristic', {
                deviceId,
                service: service.uuid,
                uuid: characteristic.uuid,
                characteristic,
              });
            }
          }
        }
      }
    },
    async disconnectDevice({ commit, getters }, deviceId) {
      const device = getters.deviceById(deviceId);
      if (!(device && device.btDevice)) {
        return;
      }
      if (device.btDevice.gatt.connected) {
        await device.btDevice.gatt.disconnect();
      }
      commit('unsetBluetoothDevice', { deviceId });
    },
    updateCharacteristic({ state, commit, dispatch }, { deviceId, uuid, value }) {
      commit('setCharacteristic', { deviceId, uuid, value });
      const { action } = state.characteristics[uuid] || {};
      if (action) {
        let method;
        let data;
        if (typeof action === 'object') {
          method = action.method;
          data = typeof action.data === 'function' ? action.data(value) : action.data || value;
      } else {
          method = action;
          data = value;
        }
        dispatch(method, data, { root: true });
      }
    },
    subscribeCharacteristic({ commit }, { uuid, action, method, data }) {
      commit('subscribeCharacteristic', {
        uuid,
        action: action || { method, data },
      });
    },
    addWriteCharacteristic({ commit }, param ) {
      commit('addWriteCharacteristic', param);
    },
    async getWriteables({ state, getters }, { uuid, key } = {}) {
      let writeables = {};
      if (uuid) {
        if (state.writeable[uuid]) {
          writeables[uuid] = state.writeable[uuid];
        }
      } else if (key) {
        const [ chUuid, writeableObj ] = Object.entries(state.writeable).find(([ , { key: writeableKey }]) => (writeableKey === key)) || [];
        if (writeableObj) {
          writeables[chUuid] = writeableObj;
        }
      } else {
        writeables = state.writeable;
      }
      const resolvedWriteables = await Promise.all(Object.entries(writeables).map(async ([ id, writeable ]) => {
        if (!writeable.characteristic) {
          const device = getters.deviceById(writeable.deviceId);
          if (device && device.btDevice && device.btDevice.gatt && device.btDevice.gatt.connected) {
            const service = await device.btDevice.gatt.getPrimaryService(writeable.service);
            if (service) {
              writeable.characteristic = await service.getCharacteristic(id);
            }
          }
        }
        if (writeable.characteristic) {
          writeable.uuid = id;
          return writeable;
        }
        return null;
      }));
      return resolvedWriteables.filter(obj => obj);
    },
    async writeCharacteristic({ commit, dispatch }, param) {
      const { value } = param;
      const writeables = await dispatch('getWriteables', param);
      return Promise.all(writeables.map(async ({
          uuid,
          characteristic,
          started,
          start,
          data,
        }) => {
        const response = [];
        if (characteristic) {
          if (!started) {
            if (start) {
              const startResponse = await characteristic.writeValueWithResponse(start());
              response.push(startResponse);
            }
            commit('addWriteCharacteristic', { uuid, started: true });
          } else if (!value) {
            return dispatch('stopWriteCharacteristic', param);
          }
          try {
            const dataResponse = await characteristic.writeValueWithResponse(data ? data(value) : value);
            response.push(dataResponse);
          } catch (err) {
            console.error(`unable to write characteristic ${uuid} ${err}`);
          }
          return response;
        }
      }));
    },
    async stopWriteCharacteristic({ dispatch, commit }, param) {
      const writeables = await dispatch('getWriteables', param);
      return Promise.all(writeables.map(({
        uuid,
        characteristic,
        started,
        stop,
      }) => {
        if (started && characteristic) {
          const stopPromise = stop ? characteristic.writeValueWithResponse(stop()) : Promise.resolve(null);
          return stopPromise.then(() => {
            commit('addWriteCharacteristic', { uuid, started: false });
          });
        }
      }));
    },
  },
};
