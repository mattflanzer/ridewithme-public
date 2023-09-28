import Spinner from './spinner';
import Snackbar from './snackbar';
import BluetoothDevices from './bluetooth-devices';
import DailyCall from './daily-call';
import User from './user';
import Leaders from './leaders';
import Mirror from './mirror';

export default {
  modules: {
    Spinner,
    Snackbar,
    BluetoothDevices,
    DailyCall,
    User,
    Leaders,
    Mirror,
  },
  plugins: [
  ],
  state: () => ({
    http: null,
    enums: {},
    localStorage: null,
    bluetooth: null,
  }),
  getters: {
    enums: state => state.enums,
    http: state => state.http,
    localStorage: state => state.localStorage,
    bluetooth: state => state.bluetooth,
    appName: state => {
      const { APP_NAME = '' } = state.enums || {};
      return APP_NAME;
    },
    getLocalStorageKey: (state, getters) => key => `${getters.appName}:${key}`,
    getLocalStorageItem:
      (state, getters) =>
      ({ key, defaultValue = null }) => {
        const value = state.localStorage.getItem(getters.getLocalStorageKey(key));
        return value === null ? defaultValue : value;
      },
  },
  mutations: {
    init(state, { http, enums, localStorage, bluetooth }) {
      state.http = http;
      state.enums = enums;
      state.localStorage = localStorage;
      state.bluetooth = bluetooth;
    },
    bindNamespace(_, { module, namespace }) {
      module.state._namespace = namespace;
      const nsParts = namespace.split('/');
      let name = '';
      while (nsParts.length && !name) {
        name = nsParts.pop();
      }
      const parent = nsParts.join('/');
      module.state._name = name;
      if (parent) {
        module.state._parent = parent;
      }
    },
  },
  actions: {
    bindNamespaces({ commit }, { _modulesNamespaceMap }) {
      Object.entries(_modulesNamespaceMap).forEach(([ namespace, module ]) => {
        commit('bindNamespace', { module, namespace });
      });
    },
    setLocalStorageItem({ getters }, { key, value, root }) {
      getters.localStorage.setItem(root ? key : getters.getLocalStorageKey(key), value);
    },
  },
};
