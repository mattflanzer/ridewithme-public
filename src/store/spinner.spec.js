import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import Spinner from './spinner';

describe('state: spinner', () => {
  let store;
  beforeEach(() => {
    store = new Vuex.Store(cloneDeep(Spinner));
  });
  test('initial state has default values', () => {
    expect(store.state.counter).toEqual(0);
  });
  describe('mutations', () => {
    test('should increment spinner', () => {
      store.commit('increment');
      expect(store.state.counter).toEqual(1);
    });
    test('should decrement spinner', () => {
      store.commit('increment');
      expect(store.state.counter).toEqual(1);
      store.commit('decrement');
      expect(store.state.counter).toEqual(0);
    });
  });
  describe('getters', () => {
    test('should get spinner state', () => {
      expect(store.getters.showSpinner).toEqual(false);
      store.commit('increment');
      expect(store.getters.showSpinner).toEqual(true);
    });
  });
  describe('actions', () => {
    test('should enable spinner', () => {
      store.dispatch('showSpinner', { show: true });
      expect(store.state.counter).toEqual(1);
    });
    test('should disable spinner', () => {
      store.dispatch('showSpinner', { show: true });
      expect(store.state.counter).toEqual(1);
      store.dispatch('showSpinner', { show: false });
      expect(store.state.counter).toEqual(0);
    });
  });
});
