class TempStorage {
  constructor() {
    this.data = {};
  }

  clear() {
    this.data = {};
  }

  getItem(key) {
    return this.data[key];
  }

  key(n) {
    return Object.keys(this.data)[n];
  }

  removeItem(key) {
    this.data[key] = null;
  }

  setItem(key, value) {
    this.data[key] = value;
  }
}

export default window.localStorage || new TempStorage();
