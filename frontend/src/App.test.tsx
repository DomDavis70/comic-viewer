import { render, screen } from '@testing-library/react';
import Main from './Main';

test('dummy test', () => {
  render(<Main />);
  const linkElement = screen.getByText(/Volumes/i);
  expect(linkElement).toBeInTheDocument();
});