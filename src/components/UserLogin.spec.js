import { shallowMount } from '@vue/test-utils'
import Vuex from "vuex";
import crypto from 'crypto-js';
import { createVuetify } from 'vuetify'

import UserLogin from './UserLogin.vue';

console.log = () => {};

describe('UserLogin', () => {
  let wrapper;
  let store;
  let getters;
  let actions;
  const mockName = 'mock name';
  const mockPassword = 'mock password';
  const mockWeight = 60;
  const mockFriend = 'mock friend';
  beforeEach(() => {
    getters = {
      'User/name': jest.fn().mockReturnValue(mockName),
      'User/isLoggedIn': jest.fn().mockReturnValue(true),
    };
    actions = {
      'User/login': jest.fn().mockResolvedValue(),
      'DailyCall/connect': jest.fn().mockResolvedValue(),
      'Spinner/showSpinner': jest.fn().mockResolvedValue(),
      'Spinner/hideSpinner': jest.fn().mockResolvedValue(),
    };
    store = new Vuex.Store({ getters, actions });
    wrapper = shallowMount(UserLogin, {
      global: {
        plugins: [ store, createVuetify() ]
      }
    });
  });
  describe('data', () => {
    test('should have default values', () => {
      expect(wrapper.vm.error).toEqual('');
      expect(wrapper.vm.name).toEqual(mockName);
      expect(wrapper.vm.password).toEqual('');
      expect(wrapper.vm.weightValue).toEqual('');
      expect(wrapper.vm.friend).toEqual('');
      expect(wrapper.vm.rules).not.toBe(null);
      expect(typeof wrapper.vm.rules).toEqual('object');
    });
  });
  describe('computed', () => {
    test('should call through to store getters', () => {
      expect(wrapper.vm.username).toEqual(mockName);
      expect(wrapper.vm.isLoggedIn).toBe(true);
    });
    test('should check for acceptable login', async () => {
      expect(wrapper.vm.mayLogin).toBe(false);
      await wrapper.setData({
        password: mockPassword
      });
      expect(wrapper.vm.mayLogin).toBe(true);
    });
    test('should get numeric weight', async () => {
      expect(wrapper.vm.weight).toEqual(0);
      await wrapper.setData({
        weightValue: `${mockWeight}`
      });
      expect(wrapper.vm.weight).toBe(mockWeight);
    });
  });
  describe('methods', () => {
    test('should call through to store actions', async () => {
      await wrapper.vm.login();
      expect(actions['User/login']).toHaveBeenCalled();
      await wrapper.vm.connect();
      expect(actions['DailyCall/connect']).toHaveBeenCalled();
    });
    test('should go through login sequence', async () => {
      await wrapper.setData({
        password: mockPassword,
        weightValue: `${mockWeight}`,
        friend: mockFriend
      });
      await wrapper.vm.submit();
      expect(actions['User/login']).toHaveBeenCalled();
      const [ , secondArgs ] = actions['User/login'].mock.calls[0];
      expect(secondArgs).toEqual({
        username: mockName,
        password: crypto.MD5(mockPassword).toString(),
        weight: Number.parseInt(mockWeight, 10),
        friend: mockFriend,
        shouldCreateNewUser: false,
      })
      expect(actions['DailyCall/connect']).toHaveBeenCalled();
    });
  });
});
