export default {
  namespaced: true,
  state: () => ({
    snackbars: [],
    counter: 0,
  }),
  mutations: {
    add: (state, snackbar) => {
      state.snackbars.push(snackbar);
      state.counter += 1;
    },
    remove: (state, { index = -1 } = {}) => {
      if (index < 0 || index >= state.snackbars.length) {
        throw new RangeError(`no snackbar at ${index} ${state.snackbars.length}`);
      }
      state.snackbars.splice(index, 1);
    },
    clear: state => {
      state.snackbars = [];
    },
  },
  getters: {
    snackbars: state => state.snackbars,
  },
  actions: {
    addSnackbar({ state, commit, dispatch }, { message, color = 'green', timeout = 5000 } = {}) {
      if (message) {
        const { counter } = state;
        const timeoutId = timeout
          ? setTimeout(() => {
              dispatch('closeSnackbar', { counter });
            }, timeout)
          : null;
        commit('add', { message, color, timeoutId, counter });
      }
    },
    closeSnackbar({ state, commit }, { index, counter }) {
      const foundIndex = typeof counter !== 'undefined'
        ? state.snackbars.findIndex(({ counter: sbCounter }) => counter === sbCounter)
        : index;
      if (foundIndex >= 0) {
        if (typeof counter === 'undefined') {
            (state.snackbars[foundIndex].timeoutId);
        }
        commit('remove', { index: foundIndex });
      }
    },
    clear({ state, commit }) {
      state.snackbars.forEach(({ timeoutId }) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      commit('clear');
    },
  },
};
