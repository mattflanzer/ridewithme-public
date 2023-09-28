<template>
  <v-container fluid fill-height>
    <v-layout align-center justify-center column>
      <div xs12 sm8 md4 class="full-width">
        <v-card class="elevation-12">
          <v-card-subtitle dark v-if="error" color="alert">{{ error }}</v-card-subtitle>
          <v-card-text>
            <v-form>
              <span @click="toggleCreateNewUser">
                <v-icon :size="36" :color="shouldCreateNewUser ? 'blue-darken-1' : '' ">{{ shouldCreateNewUser ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off-outline'}}</v-icon>
                Create new user (if none found)
              </span>
              <v-text-field
                prepend-icon="mdi-account"
                name="login"
                label="Name"
                type="text"
                v-model="name"
                :rules="[rules.required]"
              ></v-text-field>
              <v-text-field
                id="password"
                prepend-icon="mdi-lock"
                name="password"
                label="Password"
                type="password"
                v-model="password"
                :rules="[rules.required]"
              ></v-text-field>
              <v-text-field
              id="weight"
                prepend-icon="mdi-scale"
                name="weight"
                label="Weight (kg)"
                type="text"
                v-model="weightValue"
                :rules="[rules.isNumber, rules.required]"
              ></v-text-field>
              <v-text-field
                id="friend"
                prepend-icon="mdi-account-outline"
                name="friend"
                label="Friend"
                type="text"
                v-model="friend"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn :disabled="!mayLogin" color="primary" @click="submit">Login</v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-layout>
  </v-container>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import crypto from 'crypto-js';

export default {
  name: 'UserLogin',
  components: {
  },
  data: () => ({
    error: '',
    name: '',
    password: '',
    weightValue: '',
    friend: '',
    shouldCreateNewUser: false,
    rules: {
      required: value => !!value || 'Required.',
      isNumber: value => (value === '') || !Number.isNaN(Number.parseFloat(value)) || 'Must be number.',
    },
  }),
  computed: {
    ...mapGetters({
      username: 'User/name',
      isLoggedIn: 'User/isLoggedIn',
    }),
    mayLogin() {
      return !!(this.name && this.password);
    },
    weight() {
      const weight = Number.parseFloat(this.weightValue);
      return Number.isNaN(weight) ? 0 : weight;
    }
  },
  methods: {
    ...mapActions({
      login: 'User/login',
      connect: 'DailyCall/connect',
      showSpinner: 'Spinner/showSpinner',
      hideSpinner: 'Spinner/hideSpinner',
    }),
    submit() {
      this.showSpinner();
      return this.login({
        username: this.name,
        password: crypto.MD5(this.password).toString(),
        weight: this.weight,
        friend: this.friend,
        shouldCreateNewUser: this.shouldCreateNewUser
      }).then(() => {
        this.hideSpinner();
        this.error = '';
        this.password = '';
        return this.connect();
      }).then(() => {
        console.log(`${this.name} connected`);
      }).catch(err => {
        this.hideSpinner();
        console.error(`user submit: ${err}`);
        this.error = err.toString();
        this.password = '';
      });
    },
    toggleCreateNewUser() {
      this.shouldCreateNewUser = !this.shouldCreateNewUser;
    },
  },
  mounted() {
    this.name = this.username;
  },
};
</script>
<style>
.full-width {
  width: 100%;
}
</style>
