let localStorage;

try {
  localStorage = window.localStorage;
} catch(e) {
}

export function localStorageGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {}
}

export function localStorageRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

export function localStorageSetItem(key, value) {
  try {
    return localStorage.setItem(key, value);
  } catch (e) {}
}

let sessionStorage;

try {
  sessionStorage = window.sessionStorage;
} catch(e) {
}

export function sessionStorageGetItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {}
}

export function sessionStorageRemoveItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {}
}

export function sessionStorageSetItem(key, value) {
  try {
    return sessionStorage.setItem(key, value);
  } catch (e) {}
}