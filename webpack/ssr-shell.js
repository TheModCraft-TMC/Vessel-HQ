const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function renderSsrShell() {
  return renderToStaticMarkup(
    React.createElement(
      'div',
      {
        className: 'vessel-ssr-shell',
        role: 'status',
        'aria-live': 'polite',
      },
      React.createElement(
        'div',
        { className: 'vessel-ssr-brand' },
        'Vessel HQ'
      ),
      React.createElement(
        'div',
        { className: 'vessel-ssr-loading' },
        'Loading Vessel HQ…'
      )
    )
  );
}

module.exports = { renderSsrShell };
