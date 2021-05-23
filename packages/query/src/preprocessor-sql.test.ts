import parseSQLQuery from './loader/sql';
import { processSQLQueryAST } from './preprocessor-sql';
import { ParamTransform } from './preprocessor';

test('(SQL) no params', () => {
  const query = `
  /* @name selectSomeUsers */
  SELECT id, name FROM users;`;

  const fileAST = parseSQLQuery(query);
  const parameters = {};
  const paramPgTypes = {};

  const expectedResult = {
    query: 'SELECT id, name FROM users',
    mapping: [],
    bindings: [],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedResult);
  expect(mappingResult).toEqual(expectedResult);
});

test('(SQL) two scalar params', () => {
  const query = `
  /* @name selectSomeUsers */
  SELECT id, name from users where id = :id and age > :age;`;

  const fileAST = parseSQLQuery(query);
  const parameters = {
    id: '123',
    age: 12,
  };

  const paramPgTypes = {
    id: 'uuid',
    age: 'int',
  };

  const expectedInterpolationResult = {
    query: 'SELECT id, name from users where id = $1 and age > $2',
    mapping: [],
    bindings: ['123', 12],
  };

  const expectedMappingResult = {
    query: 'SELECT id, name from users where id = $1 and age > $2',
    mapping: [
      {
        assignedIndex: 1,
        name: 'id',
        type: ParamTransform.Scalar,
      },
      {
        assignedIndex: 2,
        name: 'age',
        type: ParamTransform.Scalar,
      },
    ],
    bindings: [],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) one param used twice', () => {
  const query = `
  /* @name selectUsersAndParents */
  SELECT id, name from users where id = :id or parent_id = :id;`;

  const fileAST = parseSQLQuery(query);
  const parameters = {
    id: '123',
  };

  const paramPgTypes = {
    id: 'uuid',
  };

  const expectedInterpolationResult = {
    query: 'SELECT id, name from users where id = $1 or parent_id = $1',
    mapping: [],
    bindings: ['123'],
  };

  const expectedMappingResult = {
    query: 'SELECT id, name from users where id = $1 or parent_id = $1',
    mapping: [
      {
        assignedIndex: 1,
        name: 'id',
        type: ParamTransform.Scalar,
      },
    ],
    bindings: [],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) json param', () => {
  const query = `
  /* @name selectUsersAndParents */
  SELECT id, name from users where payload = :payload;`;

  const fileAST = parseSQLQuery(query);
  const parameters = {
    payload: [{ foo: 'foo' }],
  };

  const paramPgTypes = {
    payload: 'json',
  };

  const expectedInterpolationResult = {
    query: 'SELECT id, name from users where payload = $1',
    mapping: [],
    bindings: ['[{"foo":"foo"}]'],
  };

  const expectedMappingResult = {
    query: 'SELECT id, name from users where payload = $1',
    mapping: [
      {
        assignedIndex: 1,
        name: 'payload',
        type: ParamTransform.Scalar,
      },
    ],
    bindings: [],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) array param', () => {
  const query = `
  /*
    @name selectSomeUsers
    @param ages -> (...)
  */
  SELECT FROM users WHERE age in :ages;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    ages: [23, 27, 50],
  };

  const paramPgTypes = {
    ages: 'int',
  };

  const expectedInterpolationResult = {
    query: 'SELECT FROM users WHERE age in ($1,$2,$3)',
    bindings: [23, 27, 50],
    mapping: [],
  };

  const expectedMappingResult = {
    query: 'SELECT FROM users WHERE age in ($1)',
    bindings: [],
    mapping: [
      {
        name: 'ages',
        type: ParamTransform.Spread,
        assignedIndex: 1,
      },
    ],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) array param used twice', () => {
  const query = `
  /*
    @name selectSomeUsers
    @param ages -> (...)
  */
  SELECT FROM users WHERE age in :ages or age in :ages;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    ages: [23, 27, 50],
  };

  const paramPgTypes = {
    ages: 'int',
  };

  const expectedInterpolationResult = {
    query: 'SELECT FROM users WHERE age in ($1,$2,$3) or age in ($1,$2,$3)',
    bindings: [23, 27, 50],
    mapping: [],
  };

  const expectedMappingResult = {
    query: 'SELECT FROM users WHERE age in ($1) or age in ($1)',
    bindings: [],
    mapping: [
      {
        name: 'ages',
        type: ParamTransform.Spread,
        assignedIndex: 1,
      },
    ],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) array param of jsonb', () => {
  const query = `
  /*
    @name selectSomeUsers
    @param payloads -> (...)
  */
  SELECT FROM users WHERE payload in :payloads;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    payloads: [1, [], [{ foo: 'foo' }]],
  };

  const paramPgTypes = {
    payloads: 'jsonb',
  };

  const expectedInterpolationResult = {
    query: 'SELECT FROM users WHERE payload in ($1,$2,$3)',
    bindings: ['1', '[]', '[{"foo":"foo"}]'],
    mapping: [],
  };

  const expectedMappingResult = {
    query: 'SELECT FROM users WHERE payload in ($1)',
    bindings: [],
    mapping: [
      {
        name: 'payloads',
        type: ParamTransform.Spread,
        assignedIndex: 1,
      },
    ],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters as any, // TODO: remove as any
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) array and scalar param', () => {
  const query = `
  /*
    @name selectSomeUsers
    @param ages -> (...)
  */
  SELECT FROM users WHERE age in :ages and id = :userId;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    ages: [23, 27, 50],
    userId: 'some-id',
  };

  const paramPgTypes = {
    ages: 'int',
    userId: 'uuid',
  };

  const expectedInterpolationResult = {
    query: 'SELECT FROM users WHERE age in ($1,$2,$3) and id = $4',
    bindings: [23, 27, 50, 'some-id'],
    mapping: [],
  };

  const expectedMappingResult = {
    query: 'SELECT FROM users WHERE age in ($1) and id = $2',
    bindings: [],
    mapping: [
      {
        name: 'ages',
        type: ParamTransform.Spread,
        assignedIndex: 1,
      },
      {
        name: 'userId',
        type: ParamTransform.Scalar,
        assignedIndex: 2,
      },
    ],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) pick param', () => {
  const query = `
  /*
    @name insertUsers
    @param user -> (name, age, payload)
  */
  INSERT INTO users (name, age, payload) VALUES :user RETURNING id;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    user: { name: 'Bob', age: 12, payload: [{ foo: 'foo' }] },
  };

  const paramPgTypes = {
    user: {
      name: 'text',
      age: 'int',
      payload: 'json',
    },
  };

  const expectedInterpolationResult = {
    query:
      'INSERT INTO users (name, age, payload) VALUES ($1,$2,$3) RETURNING id',
    bindings: ['Bob', 12, '[{"foo":"foo"}]'],
    mapping: [],
  };

  const expectedMappingResult = {
    query:
      'INSERT INTO users (name, age, payload) VALUES ($1,$2,$3) RETURNING id',
    bindings: [],
    mapping: [
      {
        name: 'user',
        type: ParamTransform.Pick,
        dict: {
          name: {
            assignedIndex: 1,
            name: 'name',
            type: ParamTransform.Scalar,
          },
          age: {
            assignedIndex: 2,
            name: 'age',
            type: ParamTransform.Scalar,
          },
          payload: {
            assignedIndex: 3,
            name: 'payload',
            type: ParamTransform.Scalar,
          },
        },
      },
    ],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters as any, // TODO: remove as any
    paramPgTypes,
  );
  expect(interpolationResult).toEqual(expectedInterpolationResult);

  const mappingResult = processSQLQueryAST(fileAST.queries[0]);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) pick param used twice', () => {
  const query = `
  /*
    @name insertUsersTwice
    @param user -> (name, age)
  */
  INSERT INTO users (name, age) VALUES :user, :user RETURNING id;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    user: { name: 'Bob', age: 12 },
  };

  const paramPgTypes = {
    user: {
      name: 'text',
      age: 'int',
    },
  };

  const expectedInterpolationResult = {
    query: 'INSERT INTO users (name, age) VALUES ($1,$2), ($1,$2) RETURNING id',
    bindings: ['Bob', 12],
    mapping: [],
  };

  const expectedMappingResult = {
    query: 'INSERT INTO users (name, age) VALUES ($1,$2), ($1,$2) RETURNING id',
    bindings: [],
    mapping: [
      {
        name: 'user',
        type: ParamTransform.Pick,
        dict: {
          name: {
            assignedIndex: 1,
            name: 'name',
            type: ParamTransform.Scalar,
          },
          age: {
            assignedIndex: 2,
            name: 'age',
            type: ParamTransform.Scalar,
          },
        },
      },
    ],
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  expect(interpolationResult).toEqual(expectedInterpolationResult);

  const mappingResult = processSQLQueryAST(fileAST.queries[0]);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) pickSpread param', () => {
  const query = `
  /*
    @name insertUsers
    @param users -> ((name, age, payload)...)
  */
  INSERT INTO users (name, age, payload) VALUES :users RETURNING id;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    users: [
      { name: 'Bob', age: 12, payload: [{ foo: 'foo' }] },
      { name: 'Tom', age: 22, payload: 42 },
    ],
  };

  const paramPgTypes = { users: { name: 'text', age: 'int', payload: 'json' } };

  const expectedInterpolationResult = {
    query:
      'INSERT INTO users (name, age, payload) VALUES ($1,$2,$3),($4,$5,$6) RETURNING id',
    bindings: ['Bob', 12, '[{"foo":"foo"}]', 'Tom', 22, '42'],
    mapping: [],
  };

  const expectedMapping = [
    {
      name: 'users',
      type: ParamTransform.PickSpread,
      dict: {
        name: {
          name: 'name',
          type: ParamTransform.Scalar,
          assignedIndex: 1,
        },
        age: {
          name: 'age',
          type: ParamTransform.Scalar,
          assignedIndex: 2,
        },
        payload: {
          name: 'payload',
          type: ParamTransform.Scalar,
          assignedIndex: 3,
        },
      },
    },
  ];

  const expectedMappingResult = {
    query:
      'INSERT INTO users (name, age, payload) VALUES ($1,$2,$3) RETURNING id',
    bindings: [],
    mapping: expectedMapping,
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters as any, // TODO: remove as any
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});

test('(SQL) pickSpread param used twice', () => {
  const query = `
  /*
    @name insertUsers
    @param users -> ((name, age)...)
  */
  INSERT INTO users (name, age) VALUES :users, :users RETURNING id;`;
  const fileAST = parseSQLQuery(query);

  const parameters = {
    users: [
      { name: 'Bob', age: 12 },
      { name: 'Tom', age: 22 },
    ],
  };

  const paramPgTypes = {
    users: {
      name: 'text',
      age: 'int',
    },
  };

  const expectedInterpolationResult = {
    query:
      'INSERT INTO users (name, age) VALUES ($1,$2),($3,$4), ($1,$2),($3,$4) RETURNING id',
    bindings: ['Bob', 12, 'Tom', 22],
    mapping: [],
  };

  const expectedMapping = [
    {
      name: 'users',
      type: ParamTransform.PickSpread,
      dict: {
        name: {
          name: 'name',
          type: ParamTransform.Scalar,
          assignedIndex: 1,
        },
        age: {
          name: 'age',
          type: ParamTransform.Scalar,
          assignedIndex: 2,
        },
      },
    },
  ];

  const expectedMappingResult = {
    query: 'INSERT INTO users (name, age) VALUES ($1,$2), ($1,$2) RETURNING id',
    bindings: [],
    mapping: expectedMapping,
  };

  const interpolationResult = processSQLQueryAST(
    fileAST.queries[0],
    parameters,
    paramPgTypes,
  );
  const mappingResult = processSQLQueryAST(fileAST.queries[0]);

  expect(interpolationResult).toEqual(expectedInterpolationResult);
  expect(mappingResult).toEqual(expectedMappingResult);
});
