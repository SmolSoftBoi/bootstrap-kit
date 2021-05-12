/**
 * --------------------------------------------------------------------------
 * Public Util Api
 * --------------------------------------------------------------------------
 */

const getRootCss = propertyName => {
  return document.documentElement.style[propertyName];
};

const getBreakpointCss = breakpoint => {
  return getRootCss(`--breakpoint-${breakpoint}`);
};

const getBreakpointWidth = breakpoint => {
  return Number.parseInt(getBreakpointCss(breakpoint), 10);
};

export {
  getRootCss,
  getBreakpointCss,
  getBreakpointWidth
};
