import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import Leaders from './leaders';

describe('state: leaders', () => {
  const mockCategory = 'mock category';
  const mockValues = [
    [ 10, 20, 30, 10, 30, 40 ],
    [ 20, 20, 20, 20, 20, 20 ]
  ];
  const expectedWinners = [
       1,  1,  0,  1,  0,  0
  ];
  const mockUsers = mockValues.map((_, index) => index);
  let store;
  beforeEach(() => {
    store = new Vuex.Store(cloneDeep(Leaders));
  });
  describe('winners', () => {
    const toTimeIndex = index => (expectedWinners.length - index - 1);
    beforeEach(() => {
      store.commit('recordCategory', mockCategory);
      for (let i = 0; i < mockValues.length; i += 1) {
        const userValues = mockValues[i];
        for (let j = 0; j < userValues.length; j += 1) {
          store.dispatch('recordAppMessage', {
            fromId: i,
            data: {
              key: mockCategory,
              value: userValues[j],
              ts: j
            },
            users: mockUsers
          });
        }
      }
    });
    test('should predict winners', () => {
      expectedWinners.forEach((expected, ts) => {
        const { winner } = store.getters.getWinnerAndNextAt({
          category: mockCategory,
          ts,
        });
        expect({ ts, winner }).toEqual({ ts, winner: expected });
      });
    });
    test('should predict winning range', () => {
      const [ id ] = expectedWinners;
      const index = expectedWinners.findIndex(winner => winner !== id);
      const params = { category: mockCategory, id, startIndex: toTimeIndex(index - 1), endIndex: toTimeIndex(0) };
      expect(store.getters.isWinner(params)).toBe(true);
      params.startIndex -= 1;
      expect(store.getters.isWinner(params)).toBe(false);
    });
    test('should know specific winning ranges', () => {
      const params = { category: mockCategory, id: 0 };
      const lastIndex = expectedWinners.length - 1;
      expect(store.getters.isWinner({ ...params, startIndex: 0, endIndex: 1 })).toBe(true);
      expect(store.getters.isWinner({ ...params, startIndex: 0, endIndex: 2 })).toBe(false);
      expect(store.getters.isWinner({ ...params, startIndex: 0, endIndex: 3 })).toBe(false);
      expect(store.getters.isWinner({ ...params, id: 1, startIndex: lastIndex, endIndex: lastIndex })).toBe(true);
      expect(store.getters.isWinner({ ...params, id: 1, startIndex: lastIndex - 1, endIndex: lastIndex })).toBe(true);
      expect(store.getters.isWinner({ ...params, id: 1, startIndex: lastIndex - 1, endIndex: lastIndex - 1 })).toBe(true);
      expect(store.getters.isWinner({ ...params, id: 1, startIndex: lastIndex - 2, endIndex: lastIndex })).toBe(false);
    });
    test('should predict winning range at start', () => {
      const [ id ] = expectedWinners.slice(-1);
      const params = { category: mockCategory, id };
      expect(store.getters.isWinner(params)).toBe(true);
    });
    test('should clear', () => {
      expect(store.state.values).not.toEqual({});
      store.dispatch('clear');
      expect(store.state.values).toEqual({});
    });
    test('should get current categories count', () => {
      expect(store.getters.getCategoriesCount).toEqual(1);
    });
    test('should get current winners by category', () => {
      expect(store.getters.currentWinnersByCategory).toEqual({
        [mockCategory]: 0
      });
    });
    test('should get current winners count', () => {
      expect(store.getters.currentWinnersCount).toEqual({
        0: 1
      });
    });
  });
});
