import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex";
import { createVuetify } from 'vuetify'

import UserDevices from './UserDevices.vue';

describe('UserDevices', () => {
  let wrapper;
  let store;
  let getters;
  let actions;
  let mockValue;
  const mockDevice = 'mock device';
  const mockId = 'mock id';
  const mockWeight = 60;
  const getCharacteristicSpy = jest.fn().mockImplementation(param => param);
  Object.defineProperty(window, 'BluetoothUUID', {
    value: {
      getCharacteristic: getCharacteristicSpy
    }
  });
  const mockUint8 = 'mock uint8';
  const mockInt16 = 120;
  const mockTimestamp = 'mock timestamp';
  let deviceIsConnectedSpy;
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    deviceIsConnectedSpy = jest.fn().mockReturnValue(() => true);
    mockValue = {
      getUint8: jest.fn().mockReturnValue(mockUint8),
      getInt16: jest.fn().mockReturnValue(mockInt16),
    };
    getters = {
      'BluetoothDevices/deviceIsConnected': deviceIsConnectedSpy,
      'BluetoothDevices/valueByUuid': jest.fn().mockReturnValue(() => mockValue),
      'BluetoothDevices/devices': jest.fn().mockReturnValue([ mockDevice ]),
      'BluetoothDevices/isLoading': jest.fn().mockReturnValue(false),
      'User/weight': jest.fn().mockReturnValue(mockWeight),
    };
    actions = {
      'BluetoothDevices/loadDevices': jest.fn().mockResolvedValue(),
      'BluetoothDevices/connectDevice': jest.fn().mockResolvedValue(),
      'BluetoothDevices/disconnectDevice': jest.fn().mockResolvedValue(),
      'BluetoothDevices/subscribeCharacteristic': jest.fn().mockResolvedValue(),
      'Leaders/recordCategory': jest.fn(),
      'BluetoothDevices/addWriteCharacteristic': jest.fn(),
    };
    store = new Vuex.Store({ getters, actions });
    wrapper = shallowMount(UserDevices, {
      global: {
        plugins: [ store, createVuetify() ],
        stubs: {
          'v-layout': true
        }
      },
    });
  });
  describe('data', () => {
    test('should have default values', () => {
      expect(wrapper.vm.error).toEqual(null);
      expect(wrapper.vm.connecting).toEqual({});
      expect(wrapper.vm.loaded).toEqual(false);
    });
  });
  describe('props', () => {
    test('should have default values', () => {
      expect(wrapper.props().isOpen).toEqual(false);
    });
  });
  describe('computed', () => {
    test('should call through to state getters', () => {
      expect(typeof wrapper.vm.deviceIsConnected).toEqual('function');
      expect(wrapper.vm.deviceIsConnected(mockId)).toEqual(true);
      expect(typeof wrapper.vm.valueByUuid).toEqual('function');
      expect(wrapper.vm.valueByUuid(mockId)).toEqual(mockValue);
      expect(wrapper.vm.devices).toEqual([ mockDevice ]);
      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.weight).toEqual(mockWeight);
    });
    test('should delete reload', async () => {
      expect(wrapper.vm.mayReload).toEqual(false);
      await wrapper.setData({
        loaded: true
      });
      expect(wrapper.vm.mayReload).toEqual(true);
    });
  });
  describe('methods', () => {
    test('should load devices', async () => {
      await wrapper.vm.loadDevices(false);
      expect(wrapper.vm.error).toEqual('');
      expect(wrapper.emitted()).toHaveProperty('toggleOpen');
      expect(actions['BluetoothDevices/loadDevices']).toHaveBeenCalled();
      expect(actions['Leaders/recordCategory']).toHaveBeenCalledTimes(1);
      expect(actions['BluetoothDevices/addWriteCharacteristic']).toHaveBeenCalledTimes(1);
      expect(actions['BluetoothDevices/subscribeCharacteristic']).toHaveBeenCalledTimes(2);
      const [ hrCall, powerCall ] = actions['BluetoothDevices/subscribeCharacteristic'].mock.calls;
      const [ , hrSubscription ] = hrCall;
      const [ , powerSubscription ] = powerCall;
      const { uuid: hrUuid, method: hrMethod, data: hrData } = hrSubscription;
      expect(hrUuid).toEqual('heart_rate_measurement');
      expect(hrMethod).toEqual('DailyCall/sendAppMessage');
      expect(hrData(mockValue)).toEqual({ key: 'HR', value: mockUint8, ts: mockTimestamp });
      const { uuid: powerUuid, method: powerMethod, data: powerData } = powerSubscription;
      expect(powerUuid).toEqual('cycling_power_measurement');
      expect(powerMethod).toEqual('DailyCall/sendAppMessage');
      const [ pwr, wkg ] = powerData(mockValue);
      expect(pwr).toEqual({ key: 'PWR', value: mockInt16, ts: mockTimestamp });
      expect(wkg).toEqual({ key: 'Wkg', value: mockInt16 / mockWeight, ts: mockTimestamp });
    });
    test('should toggle device: disconnect', async () => {
      expect(wrapper.vm.deviceIsConnected(mockId)).toEqual(true);
      await wrapper.vm.toggleDevice(mockId);
      expect(wrapper.vm.error).toEqual('');
      expect(actions['BluetoothDevices/disconnectDevice']).toHaveBeenCalled();
      const [ , disconnectArgs ] = actions['BluetoothDevices/disconnectDevice'].mock.calls[0];
      expect(disconnectArgs).toEqual(mockId);
    });
    test('should toggle device: connect', async () => {
      deviceIsConnectedSpy.mockReturnValue(() => false);
      expect(wrapper.vm.deviceIsConnected(mockId)).toEqual(false);
      await wrapper.vm.toggleDevice(mockId);
      expect(wrapper.vm.error).toEqual('');
      expect(actions['BluetoothDevices/connectDevice']).toHaveBeenCalled();
      const [ , connectArgs ] = actions['BluetoothDevices/connectDevice'].mock.calls[0];
      expect(connectArgs).toEqual(mockId);
      expect(wrapper.vm.connecting[mockId]).toEqual(false);
    });
  });
});
