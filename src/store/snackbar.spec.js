import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import Snackbar from './snackbar';

describe('state: snackbar', () => {
  const mockMessage = 'mock message';
  const mockSnackbar = {
    message: mockMessage,
  };
  let store;
  beforeEach(() => {
    store = new Vuex.Store(cloneDeep(Snackbar));
  });
  test('initial state has default values', () => {
    expect(store.state.snackbars).toEqual([]);
  });
  describe('mutations', () => {
    test('should add snackbar', () => {
      store.commit('add', mockSnackbar);
      expect(store.state.snackbars).toEqual([ mockSnackbar ]);
    });
    test('should remove snackbar by index', () => {
      store.commit('add', mockSnackbar);
      store.commit('remove', { index: 0 });
      expect(store.state.snackbars).toEqual([]);
    });
    test('should clear all snackbars', () => {
      store.commit('add', mockSnackbar);
      store.commit('clear');
      expect(store.state.snackbars).toEqual([]);
    });
  });
  describe('getters', () => {
    test('should get snackbars', () => {
      store.commit('add', mockSnackbar);
      expect(store.getters.snackbars).toEqual([ mockSnackbar ]);
    });
  });
  describe('actions', () => {
    const timeoutMs = 100;
    const mockSnackbarWithTimeout = {
      ...mockSnackbar,
      timeout: timeoutMs,
    };
    const timeoutAsync = ms =>
      new Promise(res => {
        setTimeout(res, ms);
      });
    test('add a snackbar that will timeout', async () => {
      store.dispatch('addSnackbar', mockSnackbarWithTimeout);
      expect(store.state.snackbars.length).toEqual(1);
      await timeoutAsync(timeoutMs + 10);
      expect(store.state.snackbars.length).toEqual(0);
    });
    test('remove a snackbar by index', async () => {
      store.dispatch('addSnackbar', mockSnackbarWithTimeout);
      expect(store.state.snackbars.length).toEqual(1);
      store.dispatch('closeSnackbar', { index: 0 });
      expect(store.state.snackbars.length).toEqual(0);
    });
    test('remove a snackbar by counter', async () => {
      store.dispatch('addSnackbar', mockSnackbarWithTimeout);
      expect(store.state.snackbars.length).toEqual(1);
      const [{ counter }] = store.state.snackbars;
      store.dispatch('closeSnackbar', { counter });
      expect(store.state.snackbars.length).toEqual(0);
    });
    test('clear snackbars', () => {
      store.dispatch('addSnackbar', mockSnackbarWithTimeout);
      expect(store.state.snackbars.length).toEqual(1);
      store.dispatch('clear');
      expect(store.state.snackbars.length).toEqual(0);
    });
  });
});
