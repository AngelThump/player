class TempStorage {
  constructor() {
    this.data = {};
  }

  clear() {
    this.data = {};
  }

  getItem(key) {
    return data[key];
  }

  key(n) {
    return Object.keys(data)[n];
  }

  removeItem(key) {
    data[key] = null;
  }

  setItem(key, value) {
    data[key] = value;
  }
}

export default window.LocalStorage || new TempStorage();
