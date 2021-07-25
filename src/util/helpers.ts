/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export = {
  ifEquals: function (arg1: any, arg2: any, options: any): any {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  },
  ifNotEquals: function (arg1: any, arg2: any, options: any): any {
    return arg1 != arg2 ? options.fn(this) : options.inverse(this);
  }
};
