import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import BluetoothDevices from './bluetooth-devices';

describe('state: bluetooth-devices', () => {
  const mockAction = 'mock action';
  const mockId = 'mock id';
  const mockValue = 'mock value';
  const mockName = 'mock name';
  let mockCharacteristic;
  let mockService;
  let mockServer;
  let mockGatt;
  let store;
  let mockBluetooth;
  let mockBtDevice;
  let mockDevice;
  let mockFullDevice;
  let mockActionSpy;
  let mockDisconnectListenerSpy;
  beforeEach(() => {
    mockCharacteristic = {
      uuid: mockId,
      properties: {
        notify: true,
        read: true,
        write: true,
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      startNotifications: jest.fn().mockResolvedValue({}),
      readValue: jest.fn().mockResolvedValue(mockValue),
      writeValueWithResponse: jest.fn().mockResolvedValue(),
    }
    mockService = {
      getCharacteristics: jest.fn().mockResolvedValue([ mockCharacteristic ])
    }
    mockServer = {
      getPrimaryServices: jest.fn().mockResolvedValue([ mockService ])
    };
    mockGatt = {
      connected: true,
      connect: jest.fn().mockResolvedValue(mockServer),
      disconnect: jest.fn().mockResolvedValue({}),
    };
    mockBtDevice = {
      gatt: mockGatt,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockBluetooth = {
      requestDevice: jest.fn().mockResolvedValue(mockBtDevice)
    };
    mockDevice = {
      deviceId: mockId,
      deviceName: mockName,
    };
    mockFullDevice = {
      ...mockDevice,
      btDevice: mockBtDevice,
    };
    mockDisconnectListenerSpy = jest.fn();
    store = new Vuex.Store(cloneDeep(BluetoothDevices));
    store.getters.bluetooth = mockBluetooth;
    mockActionSpy = jest.fn().mockResolvedValue({});
    store._actions[mockAction] = [ mockActionSpy ];
  });
  describe('mutations', () => {
    test('should set devices', () => {
      expect(store.state.devices).toEqual([]);
      store.commit('setDevices', [ mockDevice ]);
      expect(store.state.devices).toEqual([ mockDevice ]);
    });
    test('should set receiver', () => {
      expect(store.state.receiver).toEqual(false);
      store.commit('setReceiver', true);
      expect(store.state.receiver).toEqual(true);
    });
    test('should set bluetooth device', () => {
      store.commit('setDevices', [ mockDevice ]);
      store.commit('setBluetoothDevice', {
        deviceId: mockId,
        btDevice: mockBtDevice,
        disconnectListener: mockDisconnectListenerSpy
      });
      expect(mockDevice.disconnectListener).toEqual(mockDisconnectListenerSpy);
      expect(mockDevice.btDevice).toEqual(mockBtDevice);
      expect(mockBtDevice.addEventListener).toHaveBeenCalled();
    });
    test('should unset bluetooth device', () => {
      store.commit('setDevices', [ mockDevice ]);
      store.commit('setBluetoothDevice', {
        deviceId: mockId,
        btDevice: mockBtDevice,
        disconnectListener: mockDisconnectListenerSpy
      });
      store.commit('unsetBluetoothDevice', {
        deviceId: mockId
      });
      expect(mockDevice.disconnectListener).toEqual(null);
      expect(mockDevice.btDevice).toEqual(null);
      expect(mockBtDevice.removeEventListener).toHaveBeenCalled();
      expect(store.state.characteristics).toEqual({});
      expect(store.state.writeable).toEqual({});
    });
    test('should set a characteristic', () => {
      store.commit('setCharacteristic', {
        deviceId: mockId,
        uuid: mockId,
        value: mockValue
      });
      expect(store.state.characteristics[mockId]).toEqual({
        deviceId: mockId,
        value: mockValue
      })
    });
    test('should subscribe to a characteristic', () => {
      store.commit('setCharacteristic', {
        deviceId: mockId,
        uuid: mockId,
        value: mockValue
      });
      store.commit('subscribeCharacteristic', {
        uuid: mockId,
        action: mockAction
      });
      expect(store.state.characteristics[mockId]).toEqual({
        deviceId: mockId,
        value: mockValue,
        action: mockAction
      })
    });
    test('should reset the same device count', () => {
      store.commit('resetSameDevicesCount');
      expect(store.state.sameDevicesCount).toEqual(0);
    })
    test('should add a device', () => {
      store.commit('addDevices', [ mockDevice ]);
      expect(store.state.sameDevicesCount).toEqual(0);
      expect(store.state.devices).toContainEqual(mockDevice);
      store.commit('addDevices', [ mockDevice ]);
      expect(store.state.sameDevicesCount).toEqual(1);
    });
    test('should set loading state', () => {
      expect(store.state.loading).toEqual(false);
      store.commit('setLoading', true);
      expect(store.state.loading).toEqual(true);
    });
    test('should add write characteristic to state', () => {
      const params = {
        uuid: mockId,
        characteristic: mockCharacteristic,
      };
      store.commit('addWriteCharacteristic', params);
      expect(store.state.writeable).toEqual({
        [mockId]: {
          characteristic: mockCharacteristic,
        }
      });
    });
  });
  describe('getters', () => {
    const anotherId = 'another id';
    beforeEach(() => {
      store.commit('setCharacteristic', {
        deviceId: mockId,
        uuid: mockId,
        value: mockValue
      });
      store.commit('setDevices', [ mockDevice ]);
      store.commit('setBluetoothDevice', {
        deviceId: mockId,
        btDevice: mockBtDevice,
        disconnectListener: mockDisconnectListenerSpy
      });
    });
    test('should get devices', () => {
      expect(store.getters.devices).toEqual([ mockDevice ]);
    });
    test('should get device by Id', () => {
      expect(store.getters.deviceById(mockId)).toEqual(mockDevice);
    });
    test('should get device connectivity by Id', () => {
      expect(store.getters.deviceIsConnected(mockId)).toEqual(true);
      expect(store.getters.deviceIsConnected(anotherId)).toEqual(false);
    });
    test('should get value by Id', () => {
      expect(store.getters.valueByUuid(mockId)).toEqual(mockValue);
      expect(store.getters.valueByUuid(anotherId)).toEqual(undefined);
    });
    test('should get loading state', () => {
      expect(store.getters.isLoading).toBe(false);
      store.commit('setLoading', true);
      expect(store.getters.isLoading).toBe(true);
    });
    test('should get writeable state', () => {
      expect(store.getters.shouldWrite(mockId)).toBe(false);
      store.commit('addWriteCharacteristic', { uuid: mockId });
      expect(store.getters.shouldWrite(mockId)).toBe(true);
    });
  });
  describe('actions', () => {
    const mockService = 'mock service';
    const waitMs = ms => new Promise(res => setTimeout(res, ms));
    test('should load devices', async () => {
      const warnSpy = jest.spyOn(console, "warn").mockReturnValue();
      const mockError = 'mock error';
      store.commit('setReceiver');
      const requestDeviceSpy = jest.spyOn(mockBluetooth, 'requestDevice').mockImplementation(() => {
        throw new Error(mockError);
      });
      await store.dispatch('loadDevices', [ mockService ]);
      await waitMs(500);
      expect(store.state.sameDevicesCount).toEqual(0);
      expect(store.state.loading).toBe(false);
      expect(requestDeviceSpy).toHaveBeenCalledWith({
        filters: [{
          services: [ mockService ]
        }]
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });
    test('should connect devices', async () => {
      mockGatt.connected = false;
      store.commit('setDevices', [ mockDevice ]);
      await store.dispatch('connectDevice', mockId);
      expect(store.state.devices[0].btDevice).toEqual(mockBtDevice);
      expect(mockCharacteristic.startNotifications).toHaveBeenCalled();
      expect(mockCharacteristic.readValue).toHaveBeenCalled();
      expect(mockCharacteristic.addEventListener).toHaveBeenCalled();
    });
    test('should disconnect device', async () => {
      store.commit('setDevices', [ mockFullDevice ]);
      await store.dispatch('disconnectDevice', mockId);
      expect(mockGatt.disconnect).toHaveBeenCalled();
      expect(mockFullDevice.btDevice).toBe(null);
    });
    test('should update a characteristic', () => {
      store.commit('setDevices', [ mockFullDevice ]);
      store.commit('subscribeCharacteristic', { uuid: mockId, action: mockAction });
      store.dispatch('updateCharacteristic', {
        deviceId: mockId,
        uuid: mockId,
        value: mockValue
      });
      expect(mockActionSpy).toHaveBeenCalledWith(mockValue);
    });
    test('should get write characteristics - by id', async () => {
      store.commit('setDevices', [ mockFullDevice ]);
      const params = {
        uuid: mockId,
        characteristic: mockCharacteristic,
      };
      store.commit('addWriteCharacteristic', params);
      const writeables = await store.dispatch('getWriteables', { uuid: mockId });
      expect(writeables).toEqual([{
        uuid: mockId,
        characteristic: mockCharacteristic,
      }]);
    });
    test('should get write characteristics - by key', async () => {
      store.commit('setDevices', [ mockFullDevice ]);
      const mockKey = 'mock key';
      const params = {
        uuid: mockId,
        characteristic: mockCharacteristic,
        key: mockKey,
      };
      store.commit('addWriteCharacteristic', params);
      const writeables = await store.dispatch('getWriteables', { key: mockKey });
      expect(writeables).toEqual([{
        uuid: mockId,
        characteristic: mockCharacteristic,
        key: mockKey,
      }]);
    });
    test('should get write characteristics - not found', async () => {
      store.commit('setDevices', [ mockFullDevice ]);
      const mockKey = 'mock key';
      const params = {
        uuid: mockId,
        characteristic: mockCharacteristic,
        key: mockKey,
      };
      store.commit('addWriteCharacteristic', params);
      const anotherKey = 'another key';
      const writeables = await store.dispatch('getWriteables', { key: anotherKey });
      expect(writeables).toEqual([]);
    });
    test('should write characteristic', async () => {
      store.commit('setDevices', [ mockFullDevice ]);
      const mockStartValue = 'mock start value';
      const mockStartSpy = jest.fn().mockReturnValue(mockStartValue);
      const params = {
        uuid: mockId,
        characteristic: mockCharacteristic,
        start: mockStartSpy,
      };
      store.commit('addWriteCharacteristic', params);
      await store.dispatch('writeCharacteristic', {
        uuid: mockId,
        value: mockValue,
      });
      expect(mockStartSpy).toHaveBeenCalledTimes(1);
      expect(mockCharacteristic.writeValueWithResponse).toHaveBeenCalledTimes(2);
      const [ args0 ] = mockCharacteristic.writeValueWithResponse.mock.calls[0];
      expect(args0).toEqual(mockStartValue);
      const [ args1 ] = mockCharacteristic.writeValueWithResponse.mock.calls[1];
      expect(args1).toEqual(mockValue);
      expect(store.state.writeable[mockId]?.started).toEqual(true);
    });
    test('should stop a writeable characteristic', async () => {
      store.commit('setDevices', [ mockFullDevice ]);
      const mockStopValue = 'mock stop value';
      const mockStopSpy = jest.fn().mockReturnValue(mockStopValue);
      const params = {
        uuid: mockId,
        characteristic: mockCharacteristic,
        started: true,
        stop: mockStopSpy,
      };
      store.commit('addWriteCharacteristic', params);
      await store.dispatch('stopWriteCharacteristic', {
        uuid: mockId,
      });
      expect(mockStopSpy).toHaveBeenCalledTimes(1);
      expect(mockCharacteristic.writeValueWithResponse).toHaveBeenCalledTimes(1);
      const [ args0 ] = mockCharacteristic.writeValueWithResponse.mock.calls[0];
      expect(args0).toEqual(mockStopValue);
      expect(store.state.writeable[mockId]?.started).toEqual(false);
    });
  });
});
