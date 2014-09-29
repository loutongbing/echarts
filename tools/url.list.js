/***************************************************************************
 * 
 * Copyright (c) 2011 Baidu.com, Inc. All Rights Reserved
 * $Id: url.list.js 10965 2012-08-07 05:40:21Z jiangxing $ 
 * 
 **************************************************************************/
 
 
 
/**
 * url.list.js ~ 2011/10/21 12:08:15
 * @author leeight(liyubei@baidu.com)
 * @version $Revision: 10965 $ 
 * @description 
 * 用来统计锦囊系统的url列表，在firebug的console里面执行即可.
 **/

baidu.ajax.request = function(url){ console.log(url); }
for(var key in window) {
  try {
    if (window[key] && typeof window[key] == 'object' && (window[key]['data'])) {
      var data = window[key]['data'];
      for(var p in data) {
        data[p]();
      }
    }
  } catch(e){}
}




















/* vim: set ts=4 sw=4 sts=4 tw=100 noet: */
