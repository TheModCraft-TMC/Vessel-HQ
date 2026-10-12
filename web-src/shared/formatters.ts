import moment from 'moment';
import { filesize } from 'filesize';

export function truncateLeftRight(
  text: string,
  max = 50,
  left = 25,
  right = 25
) {
  if (text.length <= max) {
    return text;
  } else {
    return (
      text.substring(0, left) +
      '[...]' +
      text.substring(text.length - right, text.length)
    );
  }
}

export function humanize(
  bytes: number | undefined,
  round = 1,
  base: 2 | 10 = 10
) {
  if (bytes || bytes === 0) {
    return filesize(bytes, { base, round });
  }
  return undefined;
}
export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function isoDateFromTimestamp(timestamp?: number) {
  return moment.unix(timestamp as number).format(TIME_FORMAT);
}

export function isoDate(date: moment.MomentInput, format = TIME_FORMAT) {
  return moment(date).format(format);
}

export function parseIsoDate(date: moment.MomentInput, format = TIME_FORMAT) {
  return moment(date, format).toDate();
}

export function formatDate(
  date: moment.MomentInput,
  strFormat = 'YYYY-MM-DD HH:mm:ss Z',
  outFormat = TIME_FORMAT
) {
  return moment(date, strFormat).format(outFormat);
}

export function getPairKey(pair: string, separator: string) {
  if (!pair.includes(separator)) {
    return pair;
  }

  return pair.slice(0, pair.indexOf(separator));
}

export function getPairValue(pair: string, separator: string) {
  if (!pair.includes(separator)) {
    return '';
  }

  return pair.slice(pair.indexOf(separator) + 1);
}

export function ipAddress(ip: string) {
  return ip.slice(0, ip.indexOf('/'));
}

export function arrayToStr(arr: unknown[] | undefined, separator?: string) {
  if (arr) {
    return arr.join(separator);
  }
  return '';
}

export function labelsToStr(
  arr: Array<{ key: string; value: unknown }> | undefined,
  separator?: string
) {
  if (arr) {
    return arr
      .map((item) => `${item.key}:${String(item.value)}`)
      .join(separator);
  }
  return '';
}

export function endpointTypeName(type: number) {
  if (type === 1) {
    return 'Docker';
  } else if (type === 2 || type === 6) {
    return 'Agent';
  } else if (type === 3) {
    return 'Azure ACI';
  } else if (type === 5) {
    return 'Kubernetes';
  } else if (type === 4 || type === 7) {
    return 'Edge Agent';
  }
  return '';
}

export function truncate(text: string | number, length = 10, end = '...') {
  const value = String(text);
  if (value.length <= length || value.length - end.length <= length) {
    return value;
  } else {
    return value.substring(0, length - end.length) + end;
  }
}
