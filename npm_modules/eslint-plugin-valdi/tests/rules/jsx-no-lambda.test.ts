import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/jsx-no-lambda';

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
});

ruleTester.run('jsx-no-lambda', rule, {
  valid: [
    // Primitive values are fine
    {
      code: `<MyComp count={42} />`,
    },
    {
      code: `<MyComp label="hello" />`,
    },
    {
      code: `<MyComp enabled={true} />`,
    },
    // Variables referencing objects/arrays/functions are fine (stable references)
    {
      code: `const handler = () => {}; const x = <MyComp onPress={handler} />;`,
    },
    {
      code: `const items = [1, 2, 3]; const x = <MyComp items={items} />;`,
    },
    {
      code: `const config = { theme: 'dark' }; const x = <MyComp config={config} />;`,
    },
  ],
  invalid: [
    // Inline arrow function
    {
      code: `<MyComp onPress={() => doSomething()} />`,
      errors: [{ messageId: 'incorrectLambda', data: { attributeName: 'onPress' } }],
    },
    // Inline function expression
    {
      code: `<MyComp onPress={function() { doSomething(); }} />`,
      errors: [{ messageId: 'incorrectLambda', data: { attributeName: 'onPress' } }],
    },
    // Inline array literal
    {
      code: `<MyComp items={[1, 2, 3]} />`,
      errors: [{ messageId: 'incorrectArray', data: { attributeName: 'items' } }],
    },
    // Inline object literal
    {
      code: `<MyComp config={{ theme: 'dark' }} />`,
      errors: [{ messageId: 'incorrectObject', data: { attributeName: 'config' } }],
    },
    // Inline object literal with multiple properties
    {
      code: `<MyComp style={{ flex: 1, color: 'red' }} />`,
      errors: [{ messageId: 'incorrectObject', data: { attributeName: 'style' } }],
    },
    // Empty object literal
    {
      code: `<MyComp options={{}} />`,
      errors: [{ messageId: 'incorrectObject', data: { attributeName: 'options' } }],
    },
  ],
});
