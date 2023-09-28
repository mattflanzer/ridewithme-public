import utils from './utils';

describe('Front-End utilities', () => {
  describe('when arraysEqual() is called', () => {
    it('should return true if arrays are strictly equal', () => {
      const a = [ 1, 2 ];
      const b = a;
      expect(utils.arraysEqual(a, b)).toBe(true);
    });

    it('should return false if either input is null', () => {
      const a = null;
      const b = [ 1, 2 ];
      expect(utils.arraysEqual(a, b)).toBe(false);
      expect(utils.arraysEqual(b, a)).toBe(false);
    });

    it('should return false if array lengths are not equal', () => {
      const a = [ 1, 2, 3 ];
      const b = [ 1, 2 ];
      expect(utils.arraysEqual(a, b)).toBe(false);
    });

    it('should return false if array elements at any index are not strictly equal', () => {
      const a = [ 1, 2, 3 ];
      const b = [ 1, 2, 4 ];
      expect(utils.arraysEqual(a, b)).toBe(false);
    });

    it('should return true if array elements at every index are strictly equal', () => {
      const a = [ 1, 2, 3 ];
      const b = [ 1, 2, 3 ];
      expect(utils.arraysEqual(a, b)).toBe(true);
    });
  });

  describe('removeEmptyFields method', () => {
    test('should remove keys if values are empty', () => {
      const item = [{ a: '', b: null, c: undefined, d: NaN, e: 0, f: false, g: [], h: {} }];
      const result = utils.removeEmptyFields(item);
      expect(result[0].a).toBe(undefined);
      expect(result[0].b).toBe(undefined);
      expect(result[0].c).toBe(undefined);
      expect(result[0].d).toBe(undefined);
      expect(result[0].e).toEqual(0);
      expect(result[0].f).toEqual(false);
      expect(result[0].g).toEqual([]);
      expect(result[0].h).toEqual({});
    });
  });
  describe('convertSnakeCaseToPretty method', () => {
    test('should convert snake_case string to pretty printed', () => {
      const text = 'snake_case';
      const result = utils.convertSnakeCaseToPretty(text);
      expect(result).toBe('Snake Case');
    });
    test('should lower case then convert snake_case string to pretty printed', () => {
      const text = 'SNake_CASE';
      const result = utils.convertSnakeCaseToPretty(text);
      expect(result).toBe('Snake Case');
    });
    test('should return input if input is not a string', () => {
      const text1 = null;
      const text2 = undefined;
      const text3 = {};
      const text4 = [];
      const text5 = 1;
      const result1 = utils.convertSnakeCaseToPretty(text1);
      expect(result1).toBe(null);
      const result2 = utils.convertSnakeCaseToPretty(text2);
      expect(result2).toBe(undefined);
      const result3 = utils.convertSnakeCaseToPretty(text3);
      expect(result3).toStrictEqual({});
      const result4 = utils.convertSnakeCaseToPretty(text4);
      expect(result4).toStrictEqual([]);
      const result5 = utils.convertSnakeCaseToPretty(text5);
      expect(result5).toBe(1);
    });
  });
  describe('getAssignmentStatusArray method', () => {
    test("should convert users assignment object into array of user's approval status", () => {
      const users = {
        approved: [{ name: 'fakeUser1' }, { name: 'fakeUser2' }],
        pending: [{ name: 'fakeUser3' }],
        rejected: [{ name: 'fakeUser4' }],
      };
      const result = utils.getAssignmentStatusArray(users);
      expect(result).toEqual([ 'approved', 'approved', 'pending', 'rejected' ]);
    });
    test('should return an empty array if input is not an object', () => {
      const nonObjectTypes = [ 'fakeString', 1, null, undefined ];
      nonObjectTypes.forEach(item => {
        expect(utils.getAssignmentStatusArray(item)).toEqual([]);
      });
    });
  });

  describe('getInitials method', () => {
    test('should convert a name into initials', () => {
      const user = 'Fake User';
      expect(utils.getInitials(user)).toEqual('FU');
    });
  });

  describe('lookupObjectValue', () => {
    const mockObject = {
      value: 1,
      child: {
        value: 2,
      },
    };
    const mockDefault = 69;
    test('should get nested object values from key', () => {
      expect(utils.lookupObjectValue(mockObject, 'value')).toEqual(1);
      expect(utils.lookupObjectValue(mockObject, 'child.value')).toEqual(2);
      expect(utils.lookupObjectValue(mockObject, 'child.missing', mockDefault)).toEqual(69);
    });
    test('should get nested objects from key', () => {
      expect(utils.lookupObjectValue(mockObject)).toBe(mockObject);
      expect(utils.lookupObjectValue(mockObject, 'child')).toBe(mockObject.child);
      expect(utils.lookupObjectValue(mockObject, 'missing')).toBe(null);
    });
  });

  describe('singularText', () => {
    it('should return the singular version of a string', () => {
      expect(utils.singularText('')).toEqual('');
      expect(utils.singularText('fox')).toEqual('fox');
      expect(utils.singularText('foxes')).toEqual('fox');
      expect(utils.singularText('jazzes')).toEqual('jazz');
      expect(utils.singularText('daisies')).toEqual('daisy');
      expect(utils.singularText('ramparts')).toEqual('rampart');
      expect(utils.singularText('churches')).toEqual('church');
    });
  });
});
