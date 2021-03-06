import {
  Entity,
  MappedRelationship,
  Relationship,
  RelationshipDirection,
} from '../../types';
import {
  createIntegrationRelationship,
  generateRelationshipType,
  createDirectRelationship,
  createMappedRelationship,
} from '../createIntegrationRelationship';

describe('createIntegrationRelationship', () => {
  const entityA: Entity = {
    _type: 'a_entity',
    _class: 'A',
    _key: 'a',
  };

  const entityB: Entity = {
    _type: 'b_entity',
    _class: 'B',
    _key: 'b',
  };

  test('creates direct relationships', () => {
    const expected: Relationship = {
      _type: 'a_entity_has_b_entity',
      _class: 'HAS',
      _key: 'a|has|b',
      _fromEntityKey: 'a',
      _toEntityKey: 'b',
      displayName: 'HAS',
    };

    expect(
      createIntegrationRelationship({
        _class: 'HAS',
        from: entityA,
        to: entityB,
      }),
    ).toEqual(expected);
  });

  test('creates mapped relationships', () => {
    const expected: MappedRelationship = {
      _key: 'a|has|b',
      _type: 'a_entity_has_b_entity',
      _class: 'HAS',
      _mapping: {
        relationshipDirection: RelationshipDirection.FORWARD,
        sourceEntityKey: 'a',
        sourceEntityType: 'a_entity',
        targetFilterKeys: [['_type', '_key']],
        targetEntity: {
          _key: 'b',
          _class: 'B',
          _type: 'b_entity',
        },
      },
      displayName: 'HAS',
    };

    expect(
      createMappedRelationship({
        _class: 'HAS',
        source: entityA,
        target: entityB,
      }),
    ).toEqual(expected);
  })
});

describe('DirectRelationshipOptions', () => {
  const entityA: Entity = {
    _type: 'a_entity',
    _class: 'A',
    _key: 'a',
  };

  const entityB: Entity = {
    _type: 'b_entity',
    _class: 'B',
    _key: 'b',
  };

  const expected: Relationship = {
    _type: 'a_entity_has_b_entity',
    _class: 'HAS',
    _key: 'a|has|b',
    _fromEntityKey: 'a',
    _toEntityKey: 'b',
    displayName: 'HAS',
  };

  test('defaults', () => {
    expect(
      createDirectRelationship({
        _class: 'HAS',
        from: entityA,
        to: entityB,
      }),
    ).toEqual(expected);
  });

  test('_class is upcased', () => {
    expect(
      createDirectRelationship({
        _class: 'has',
        from: entityA,
        to: entityB,
      }),
    ).toEqual(expected);
  });

  test('transfers additional properties', () => {
    expect(
      createDirectRelationship({
        _class: 'HAS',
        from: entityA,
        to: entityB,
        properties: {
          region: 'useast',
        },
      }),
    ).toEqual({ ...expected, region: 'useast' });
  });
});

describe('DirectRelationshipLiteralOptions', () => {
  const expected: Relationship = {
    _type: 'a_entity_has_b_entity',
    _class: 'HAS',
    _key: 'a|has|b',
    _fromEntityKey: 'a',
    _toEntityKey: 'b',
    displayName: 'HAS',
  };

  test('defaults', () => {
    expect(
      createDirectRelationship({
        _class: 'HAS',
        fromKey: 'a',
        fromType: 'a_entity',
        toKey: 'b',
        toType: 'b_entity',
      }),
    ).toEqual(expected);
  });

  test('_class is upcased', () => {
    expect(
      createDirectRelationship({
        _class: 'has',
        fromKey: 'a',
        fromType: 'a_entity',
        toKey: 'b',
        toType: 'b_entity',
      }),
    ).toEqual(expected);
  });
});

describe('MappedRelationshipOptions', () => {
  const entityA: Entity = {
    _type: 'a_entity',
    _class: 'A',
    _key: 'a',
  };

  const entityB: Entity = {
    _type: 'b_entity',
    _class: 'B',
    _key: 'b',
  };

  const expected: MappedRelationship = {
    _key: 'a|has|b',
    _type: 'a_entity_has_b_entity',
    _class: 'HAS',
    _mapping: {
      relationshipDirection: RelationshipDirection.FORWARD,
      sourceEntityKey: 'a',
      sourceEntityType: 'a_entity',
      targetFilterKeys: [['_type', '_key']],
      targetEntity: {
        _key: 'b',
        _class: 'B',
        _type: 'b_entity',
      },
    },
    displayName: 'HAS',
  };

  test('defaults', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        source: entityA,
        target: entityB,
      }),
    ).toEqual(expected);
  });

  test('_class is upcased', () => {
    expect(
      createMappedRelationship({
        _class: 'has',
        source: entityA,
        target: entityB,
      }),
    ).toEqual(expected);
  });

  test('additional properties', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        source: entityA,
        target: entityB,
        properties: {
          region: 'useast',
        },
      }),
    ).toEqual({ ...expected, region: 'useast' });
  });

  test('_type provided explicitly', () => {
    expect(
      createMappedRelationship({
        _class: 'has',
        _type: 'use_my_type',
        source: entityA,
        target: entityB,
      }),
    ).toEqual({
      ...expected,
      _type: 'use_my_type',
    });
  });

  test('_key provided explicitly', () => {
    expect(
      createMappedRelationship({
        _class: 'has',
        _key: 'use_my_key',
        source: entityA,
        target: entityB,
      }),
    ).toEqual({
      ...expected,
      _key: 'use_my_key',
    });
  });

  test('override defaults with properties option', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        source: entityA,
        target: entityB,
        properties: {
          _key: 'use-my-key-yo',
          _type: 'a_entity_has_b_entity',
          displayName: 'ISHASING',
        },
      }),
    ).toEqual({
      ...expected,
      _key: 'use-my-key-yo',
      _type: 'a_entity_has_b_entity',
      displayName: 'ISHASING',
    });
  });
});

describe('MappedRelationshipLiteralOptions', () => {
  const expected: MappedRelationship = {
    _key: 'a|has|b',
    _type: 'mapping_source_has_b_entity',
    _class: 'HAS',
    _mapping: {
      relationshipDirection: RelationshipDirection.REVERSE,
      sourceEntityKey: 'a',
      targetFilterKeys: [['something']],
      targetEntity: {
        _key: 'b',
        _type: 'b_entity',
      },
    },
    displayName: 'HAS',
  };

  test('defaults', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        _mapping: {
          relationshipDirection: RelationshipDirection.REVERSE,
          targetEntity: {
            _key: 'b',
            _type: 'b_entity',
          },
          targetFilterKeys: [['something']],
          sourceEntityKey: 'a',
        },
      }),
    ).toEqual(expected);
  });

  test('missing _type in targetEntity', () => {
    expect(() => {
      createMappedRelationship({
        _class: 'HAS',
        _mapping: {
          relationshipDirection: RelationshipDirection.REVERSE,
          targetEntity: {
            something: 'missing',
            _key: 'b',
          },
          targetFilterKeys: [['something']],
          sourceEntityKey: 'a',
        },
      });
    }).toThrowError(/_type/);
  });

  test('_key provided explicitly', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        _key: 'my-key-please',
        _mapping: {
          relationshipDirection: RelationshipDirection.REVERSE,
          targetEntity: {
            _key: 'b',
            _type: 'b_entity',
          },
          targetFilterKeys: [['something']],
          sourceEntityKey: 'a',
        },
      }),
    ).toEqual({
      ...expected,
      _key: 'my-key-please',
    });
  });

  test('_type provided explicitly', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        _type: 'my_type_please',
        _mapping: {
          relationshipDirection: RelationshipDirection.REVERSE,
          targetEntity: {
            _key: 'b',
            _type: 'b_entity',
          },
          targetFilterKeys: [['something']],
          sourceEntityKey: 'a',
        },
      }),
    ).toEqual({
      ...expected,
      _type: 'my_type_please',
    });
  });

  test('sourceEntityType provided explicitly', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        _mapping: {
          relationshipDirection: RelationshipDirection.REVERSE,
          targetEntity: {
            _key: 'b',
            _type: 'b_entity',
          },
          targetFilterKeys: [['something']],
          sourceEntityKey: 'a',
          sourceEntityType: 'a_entity',
        },
      }),
    ).toEqual({
      ...expected,
      _type: 'a_entity_has_b_entity',
      _mapping: {
        ...expected._mapping,
        sourceEntityType: 'a_entity',
      }
    });
  });

  test('override defaults with properties option', () => {
    expect(
      createMappedRelationship({
        _class: 'HAS',
        _mapping: {
          relationshipDirection: RelationshipDirection.REVERSE,
          targetEntity: {
            something: 'missing',
          },
          targetFilterKeys: [['something']],
          sourceEntityKey: 'a',
        },
        properties: {
          _key: 'a-has-b',
          _type: 'a_special_type',
        },
      }),
    ).toEqual({
      ...expected,
      _key: 'a-has-b',
      _type: 'a_special_type',
      _mapping: {
        ...expected._mapping,
        targetEntity: {
          something: 'missing',
        },
      },
    });
  });

  test('generate key from mapping when no key on targetEntity', () => {
    const mapping = {
      relationshipDirection: RelationshipDirection.REVERSE,
      targetEntity: {
        _type: 'b_entity',
        something: 'more',
        another: 'thing',
        whatever: 'stuff',
      },
      targetFilterKeys: ['another', ['something', 'whatever']],
      sourceEntityKey: 'a',
    };

    expect(
      createMappedRelationship({
        _class: 'HAS',
        _mapping: mapping,
      }),
    ).toEqual({
      ...expected,
      _key: 'a|has|REVERSE:another=thing:something=more:whatever=stuff',
      _mapping: {
        ...expected._mapping,
        ...mapping,
      },
    });
  });
});

describe('generateRelationshipType', () => {
  const entityA: Entity = {
    _type: 'a_entity',
    _class: 'A',
    _key: 'a',
  };

  const entityB: Entity = {
    _type: 'b_entity',
    _class: 'B',
    _key: 'b',
  };

  test('entities', () => {
    expect(generateRelationshipType('HAS', entityA, entityB)).toEqual(
      'a_entity_has_b_entity',
    );
  });

  test('strings', () => {
    expect(generateRelationshipType('HAS', 'a_entity', 'b_entity')).toEqual(
      'a_entity_has_b_entity',
    );
  });

  test('from entity to string', () => {
    expect(generateRelationshipType('HAS', entityA, 'b_entity')).toEqual(
      'a_entity_has_b_entity',
    );
  });

  test('from string to entity', () => {
    expect(generateRelationshipType('HAS', 'a_entity', entityB)).toEqual(
      'a_entity_has_b_entity',
    );
  });

  test('from and to entities of the same type', () => {
    expect(
      generateRelationshipType('HAS', 'aws_instance', 'aws_instance'),
    ).toEqual('aws_instance_has_instance');
  });

  test('from and to entities within the same provider but different service scope', () => {
    expect(
      generateRelationshipType('HAS', 'aws_vpc', 'aws_lambda_function'),
    ).toEqual('aws_vpc_has_lambda_function');
  });

  test('from and to entities within the same provider and service scope', () => {
    expect(
      generateRelationshipType('HAS', 'azure_sql_server', 'azure_sql_database'),
    ).toEqual('azure_sql_server_has_database');
  });

  test('entity type has no underscore', () => {
    expect(
      generateRelationshipType('HAS', 'employee', 'user_endpoint'),
    ).toEqual('employee_has_user_endpoint');
  });
});
