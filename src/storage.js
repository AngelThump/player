let localStorage;
let sessionStorage;

try {
  localStorage = window.localStorage;
  sessionStorage = window.sessionStorage;
} catch(e) {}

export function localStorageGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function localStorageRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    return null;
  }
}

export function localStorageSetItem(key, value) {
  try {
    return localStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
}

export function sessionStorageGetItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function sessionStorageRemoveItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    return null;
  }
}

export function sessionStorageSetItem(key, value) {
  try {
    return sessionStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
}