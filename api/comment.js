import request from '@/utils/requestUtil';

/**
 * 获取商品评价分页列表
 * @param {Number} productId 商品ID
 * @param {Object} params 分页参数 { pageNum, pageSize }
 */
export function fetchCommentList(productId, params) {
  return request({
    url: `/comment/list/${productId}`,
    method: 'get',
    params: params
  });
}

/**
 * 获取商品评价概要信息
 * @param {Number} productId 商品ID
 */
export function fetchCommentSummary(productId) {
  return request({
    url: `/comment/summary/${productId}`,
    method: 'get'
  });
}

/**
 * 获取我的评价列表（分页）
 * @param {Object} params 分页参数 { pageNum, pageSize }
 */
export function fetchMyCommentList(params) {
  return request({
    url: '/comment/myList',
    method: 'get',
    params: params
  });
} 