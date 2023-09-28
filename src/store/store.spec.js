import Vuex from 'vuex';
import Enums from '../enums';
import { cloneDeep } from 'lodash';

import Store from './store';

describe('store', () => {
  let store;
  let http;
  let mockLocalStorage;
  let mockBluetooth;
  beforeEach(() => {
    http = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      put: jest.fn(),
    };
    mockLocalStorage = {
      setItem: jest.fn(),
    };
    mockBluetooth = {
      requestDevice: jest.fn(),
    };
    store = new Vuex.Store(cloneDeep(Store));
  });
  test('initial state has default values', () => {
    expect(store.state.http).toEqual(null);
    expect(store.state.enums).toEqual({});
    expect(store.state.localStorage).toEqual(null);
    expect(store.state.bluetooth).toEqual(null);
  });
  describe('mutations', () => {
    test('should initialize data', () => {
      store.commit('init', { http, enums: Enums, localStorage: mockLocalStorage, bluetooth: mockBluetooth });
      expect(store.state.http).toStrictEqual(http);
      expect(store.state.enums).toStrictEqual(Enums);
      expect(store.state.localStorage).toStrictEqual(mockLocalStorage);
      expect(store.state.bluetooth).toStrictEqual(mockBluetooth);
    });
    test('should bind namespace metadata', () => {
      const mockModule = { state: {} };
      const mockNamespace = 'grandparent/parent/self';
      store.commit('bindNamespace', { module: mockModule, namespace: mockNamespace });
      expect(mockModule.state._name).toEqual('self');
      expect(mockModule.state._namespace).toEqual(mockNamespace);
      expect(mockModule.state._parent).toEqual('grandparent/parent');
    });
    test('should bind namespace metadata with trailing slash', () => {
      const mockModule = { state: {} };
      const mockNamespace = 'grandparent/parent/self/';
      store.commit('bindNamespace', { module: mockModule, namespace: mockNamespace });
      expect(mockModule.state._name).toEqual('self');
      expect(mockModule.state._namespace).toEqual(mockNamespace);
      expect(mockModule.state._parent).toEqual('grandparent/parent');
    });
    test('should bind namespace metadata with leading slash', () => {
      const mockModule = { state: {} };
      const mockNamespace = '/grandparent/parent/self';
      store.commit('bindNamespace', { module: mockModule, namespace: mockNamespace });
      expect(mockModule.state._name).toEqual('self');
      expect(mockModule.state._namespace).toEqual(mockNamespace);
      expect(mockModule.state._parent).toEqual('/grandparent/parent');
    });
  });
  describe('getters', () => {
    const mockEnums = {
      MOCK_ENUM: {
        MOCK_KEY: 'mock value',
      },
    };
    beforeEach(() => {
      store.commit('init', {
        enums: mockEnums,
      });
    });
    test('should get enums', () => {
      expect(store.getters.enums).toEqual(mockEnums);
    });
  });
});
