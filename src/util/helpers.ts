/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import i18next from 'i18next';

export = {
  ifEquals: function (arg1: any, arg2: any, options: any): any {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  },
  ifNotEquals: function (arg1: any, arg2: any, options: any): any {
    return arg1 != arg2 ? options.fn(this) : options.inverse(this);
  },
  i18next: function (arg1: string) {
    return i18next.t(arg1.trim().toLowerCase());
  }
};
