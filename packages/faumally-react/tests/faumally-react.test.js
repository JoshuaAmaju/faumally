import React from 'react';
import {render, screen} from '@testing-library/react';

const TestForm = () => {
  return <div />;
};

test ('initialize component', () => {
  render (<TestForm />);
});
