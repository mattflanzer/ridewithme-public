const utils = {
  removeEmptyFields: item =>
    JSON.parse(JSON.stringify(item), (key, value) => {
      // Will eliminate falsy fields ('', null, undefined, NaN). Empty arrays/objects are ok
      if (!(value || value === 0 || value === false)) return undefined;
      return value;
    }),

  arraysEqual: (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  },

  getInitials: name => {
    return name.split(' ').reduce((acc, curr) => acc + curr[0].toUpperCase(), '');
  },

  getAssignmentStatusArray: userAssignments => {
    if (!utils.isObject(userAssignments)) {
      return [];
    }
    return Object.entries(userAssignments).reduce((col, entry) => {
      const [ key, values ] = entry;
      col.push(...new Array(values.length).fill(key));
      return col;
    }, []);
  },

  isObject(val) {
    if (val === null) {
      return false;
    }
    return typeof val === 'object';
  },

  getErrorMessage: error => {
    const { response = {}, request, data: errorData } = error;
    const { data = '', status = '' } = response;
    let message;
    if (data && typeof data === 'object') {
      message = data.error || data.message || data.text || data.status || status || 'unknown';
    } else if (data && typeof data === 'string') {
      message = data;
    } else if (errorData && typeof errorData === 'string') {
      message = errorData;
    } else {
      let networkError;
      if (request && typeof request === 'object') {
        networkError = `Unable to reach ${request.url || request.originalUrl || 'network'}`;
      }
      message = error.statusText || error.message || networkError || error;
    }
    return message;
  },

  convertCamelCaseToCapitalCase: text => {
    return text.replace(/([A-Z])/g, match => `${match}`).replace(/^./, match => match.toUpperCase());
  },

  convertSnakeCaseToPretty(text) {
    if (typeof text !== 'string') {
      return text;
    }
    const lowerCased = text.toLowerCase();
    return lowerCased[0].toUpperCase() + lowerCased.substr(1).replace(/_(\w)/g, match => ` ${match.substr(1).toUpperCase()}`);
  },

  getPrintableFromCamelCase: value => {
    if (!value) {
      return value;
    }
    return value.toString()[0].toUpperCase() + value.toString().slice(1).replace(/[A-Z]/g, ' $&');
  },

  sameUser: (valueA, valueB) => {
    if (!(valueA && valueB)) {
      return false;
    }
    const isObjectA = typeof valueA === 'object';
    const isObjectB = typeof valueB === 'object';
    const { user: userA } = isObjectA ? valueA : {};
    const { user: userB } = isObjectB ? valueB : {};
    if (userA || userB) {
      return utils.sameUser(userA || valueA, userB || valueB);
    }
    const { id: idA, name: nameA, username: usernameA } = isObjectA ? valueA : { id: valueA, name: valueA };
    const { id: idB, name: nameB, username: usernameB } = isObjectB ? valueB : { id: valueB, name: valueB };
    if (idA && idB && idA === idB) {
      return true;
    }
    const resolvedNameA = nameA || usernameA;
    const resolvedNameB = nameB || usernameB;
    return !!(resolvedNameA && resolvedNameB && resolvedNameA === resolvedNameB);
  },

  escapeRegExp(text) {
    return (text || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  },

  deepFreeze: obj => {
    if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(val => utils.deepFreeze(val));
      Object.freeze(obj);
    }
    return obj;
  },

  lookupObjectValue: (item, key, defaultValue = null) => {
    const fields = key ? key.split('.') : [];
    let obj = item;
    while (typeof obj === 'object' && obj && fields.length > 0) {
      obj = obj[fields.shift()];
    }
    return typeof obj === 'undefined' ? defaultValue : obj;
  },

  singularText(text) {
    if (!(text && typeof text === 'string' && text.slice(-1) === 's')) {
      return text;
    }
    const len = text.length;
    const last3 = text.slice(-3);
    if (last3 === 'ies') {
      return text.slice(0, len - 3) + 'y';
    }
    const esses = [ 'ses', 'zes', 'hes', 'xes' ];
    const chop = esses.includes(last3) ? 2 : 1;
    return text.slice(0, len - chop);
  },
};

export default utils;
