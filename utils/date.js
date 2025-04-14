// date.js
export function formatDate(date, fmt) {
  // 添加安全检查，防止非日期对象导致错误
  if (!date) {
    return '';
  }
  
  // 如果是字符串格式，尝试转换成日期对象
  if (typeof date === 'string') {
    try {
      date = new Date(date);
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '';
    }
  }
  
  // 确保是有效的日期对象
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('无效的日期对象:', date);
    return '';
  }
  
  if (!fmt) {
    fmt = 'yyyy-MM-dd hh:mm:ss';
  }
  
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  };
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      let str = o[k] + '';
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : padLeftZero(str));
    }
  }
  return fmt;
}

function padLeftZero(str) {
  return ('00' + str).substr(str.length);
}

export function str2Date(dateStr, separator) {
  if (!separator) {
    separator = "-";
  }
  let dateArr = dateStr.split(separator);
  let year = parseInt(dateArr[0]);
  let month;
  //处理月份为04这样的情况
  if (dateArr[1].indexOf("0") == 0) {
    month = parseInt(dateArr[1].substring(1));
  } else {
    month = parseInt(dateArr[1]);
  }
  let day = parseInt(dateArr[2]);
  let date = new Date(year, month - 1, day);
  return date;
}
