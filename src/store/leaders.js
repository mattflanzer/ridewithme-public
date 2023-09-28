const LEADERS_LIMIT = 5000;

export default {
  namespaced: true,
  state: () => ({
    categories: [],
    values: {},
  }),
  mutations: {
    clear(state) {
      state.values = {};
    },
    recordCategory(state, category) {
      if (!state.categories.includes(category)) {
        state.categories.push(category);
      }
    },
    record(state, { category, ts, value, id, users }) {
      if (!state.values[category]) {
        state.values[category] = [];
        if (!state.categories.includes(category)) {
          state.categories.push(category);
        }
      }
      const values = state.values[category];
      const index = values.findIndex(({ ts: tsValues }) => ts >= tsValues);
      let timeValue;
      let nextIndex;
      if (index >= 0 && values[index].ts === ts) {
        timeValue = values[index];
        nextIndex = index + 1;
      } else {
        timeValue = { ts, users: {}, winner: null };
        values.splice(index, 0, timeValue);
        nextIndex = index + 2;
      }
      timeValue.users[id] = { value, real: true };
      const { winner } = users.reduce((acc, userId) => {
        let { real: userValueIsReal, value: userValue } = timeValue.users[userId] || { value: -1 };
        if (!userValueIsReal && nextIndex < values.length) {
          const { value: oldValue } = values[nextIndex].users[userId] || {};
          userValue = oldValue || 0;
          if (!timeValue.users[userId]) {
            timeValue.users[userId] = {};
          }
          timeValue.users[userId].value = userValue;
        }
        if ((acc.value < userValue) ||
            (acc.value === userValue && nextIndex < values.length && values[nextIndex].winner === userId)
        ) {
          acc.value = userValue;
          acc.winner = userId;
        }
        return acc;
      }, {
        value: -1,
        winner: null
      });
      timeValue.winner = winner;
      if (values.length > LEADERS_LIMIT * 1.1) {
        values.splice(LEADERS_LIMIT, values.length - LEADERS_LIMIT);
      }
    },
  },
  getters: {
    getWinnerAndNextAt: state => ({ category, ts, index = null }) => {
      const values = state.values[category];
      if (!values) {
        return {};
      }
      if (index === null) {
        index = values.findIndex(({ ts: tsValues }) => ts >= tsValues);
      }
      if (index < 0 || index >= values.length) {
        return {};
      }
      const { winner } = values[index];
      const nextIndex = index + 1;
      const { ts: nextTs } = values[nextIndex] || {};
      return { winner, nextIndex, nextTs };
    },
    isWinner: state => ({ category, id, startIndex, endIndex }) => {
      const values = state.values[category];
      if (!values) {
        return false;
      }
      if (typeof startIndex === 'undefined') {
        return values[0].winner === id;
      }
      for (let index = startIndex; index <= endIndex; index += 1) {
        if (values[index].winner !== id) {
          return false;
        }
      }
      return true;
    },
    isRecording: state => category => state.categories.includes(category),
    currentWinnersByCategory: state => state.categories.reduce((collection, category) => {
      const values = state.values[category];
      if (!values) {
        return collection;
      }
      const [ current ] = values;
      const { winner = null } = current || {};
      if (winner !== null) {
        collection[category] = winner;
      }
      return collection;
    }, {}),
    currentWinnersCount: (state, getters) => {
      const currentWinners = getters.currentWinnersByCategory;
      return Object.values(currentWinners).reduce((acc, winner) => {
        acc[winner] = (acc[winner] || 0) + 1;
        return acc;
      }, {});
    },
    getCategoriesCount: state => Object.keys(state.values).length,
  },
  actions: {
    recordCategory({ commit }, category) {
      commit('recordCategory', category);
    },
    recordAppMessage({ commit, getters }, { fromId: id, data, users }) {
      const { key: category, value, ts = null } = data || {};
      if (getters.isRecording(category)) {
        commit('record', { category, value, ts, id, users });
      }
    },
    clear({ commit }) {
      commit('clear');
    }
  }
};
