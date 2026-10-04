import { object, string } from 'yup';

import { isValidUrl } from '@/ui/components/forms/validate-url';

export function noDuplicateURLsSchema(urls: string[]) {
  return string()
    .required('URL is required')
    .test('not existing name', 'URL is already added', (newName) =>
      urls.every((name) => name !== newName)
    );
}

export function validationSchema(urls: string[]) {
  return object().shape({
    URL: noDuplicateURLsSchema(urls)
      .test('valid-url', 'Invalid URL', (value) => !value || isValidUrl(value))
      .required('URL is required'),
  });
}
