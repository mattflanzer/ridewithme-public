export default {
  namespaced: true,
  state: () => ({
    counter: 0,
  }),
  mutations: {
    increment: state => {
      state.counter += 1;
    },
    decrement: state => {
      state.counter -= 1;
      if (state.counter < 0) {
        state.counter = 0;
      }
    },
  },
  getters: {
    showSpinner: state => state.counter > 0,
  },
  actions: {
    showSpinner({ commit }, { show = true } = {}) {
      commit(show ? 'increment' : 'decrement');
    },
    hideSpinner({ dispatch }) {
      dispatch('showSpinner', { show: false });
    }
  },
};
